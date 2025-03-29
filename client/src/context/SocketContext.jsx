import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useAuth();

  const connect = useCallback(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Create socket connection
    const newSocket = io('/', {
      auth: { token },
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Listen for online users (if your backend emits this event)
    newSocket.on('users:online', (users) => {
      setOnlineUsers(users);
    });

    // Listen for incoming messages
    newSocket.on('receive_message', (message) => {
      setMessages(prev => {
        const roomId = message.roomId;
        const roomMessages = prev[roomId] || [];

        // Prevent duplicate messages
        if (roomMessages.some(msg => msg._id === message._id)) return prev;

        return {
          ...prev,
          [roomId]: [...roomMessages, message]
        };
      });
    });

    setSocket(newSocket);

    // Cleanup function when the connection is no longer needed
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user]);

  useEffect(() => {
    if (user && !socket) {
      const cleanup = connect();
      return cleanup;
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user, socket, connect]);

  // Function to send a message (uses 'send_message' event)
  const sendMessage = useCallback((roomId, text, translatedText = null) => {
    if (!socket || !connected) return false;

    socket.emit('send_message', {
      roomId,
      text,
      translatedText
    });

    return true;
  }, [socket, connected]);

  // Function to join a chat room (uses 'join_chat' event)
  const joinRoom = useCallback((roomId) => {
    if (!socket || !connected) return false;

    socket.emit('join_chat', roomId);
    return true;
  }, [socket, connected]);

  // Function to leave a room (if your backend supports it)
  // Here we emit 'room:leave' but you might need to adjust this if your backend doesn't handle it
  const leaveRoom = useCallback((roomId) => {
    if (!socket || !connected) return false;

    socket.emit('room:leave', { roomId });
    return true;
  }, [socket, connected]);

  // Retrieve messages for a specific room
  const getRoomMessages = useCallback((roomId) => {
    return messages[roomId] || [];
  }, [messages]);

  // Add a message to a room locally
  const addMessage = useCallback((roomId, message) => {
    setMessages(prev => {
      const roomMessages = prev[roomId] || [];
      return {
        ...prev,
        [roomId]: [...roomMessages, message]
      };
    });
  }, []);

  // Load messages from the API for a given room
  const loadMessages = useCallback(async (roomId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/messages/${roomId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();

      setMessages(prev => ({
        ...prev,
        [roomId]: data
      }));

      return data;
    } catch (error) {
      console.error('Failed to load messages:', error);
      return [];
    }
  }, []);

  const value = {
    socket,
    connected,
    onlineUsers,
    connect,
    sendMessage,
    joinRoom,
    leaveRoom,
    getRoomMessages,
    addMessage,
    loadMessages
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
