require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const languageRoutes = require('./routes/languages');
// const translationRoutes = require('./routes/translations');
const voiceRoomRoutes = require('./routes/voiceRooms');

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/language-exchange';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.io connection for real-time chat and voice rooms
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join a chat room
  socket.on('join_chat', (roomId) => {
    socket.join(roomId);
    console.log(`User joined chat room: ${roomId}`);
  });

  // Send message in chat
  socket.on('send_message', (data) => {
    io.to(data.roomId).emit('receive_message', data);
  });

  // Join a voice room
  socket.on('join_voice_room', (roomId) => {
    socket.join(`voice_${roomId}`);
    const usersInRoom = io.sockets.adapter.rooms.get(`voice_${roomId}`);
    const users = usersInRoom ? [...usersInRoom] : [];

    // Broadcast to all users in room that a new user joined
    socket.to(`voice_${roomId}`).emit('user_joined', { userId: socket.id });

    // Send list of users to the newly joined user
    io.to(socket.id).emit('room_users', users.filter(id => id !== socket.id));

    console.log(`User joined voice room: ${roomId}`);
  });

  // Handle peer signal for WebRTC connection
  socket.on('signal', (data) => {
    io.to(data.to).emit('signal', {
      from: socket.id,
      signal: data.signal
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    io.emit('user_disconnected', socket.id);
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/languages', languageRoutes);
// app.use('/api/translations', translationRoutes);
app.use('/api/voice-rooms', voiceRoomRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get('/', (req, res) => {
  res.send('Server is running');
});

module.exports = { app, server, io };
