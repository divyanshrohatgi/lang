import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { FaPlus, FaLock, FaUser } from 'react-icons/fa';

const VoiceRooms = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [voiceRooms, setVoiceRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For creating a new voice room
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    const fetchVoiceRooms = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/voice-rooms');
        setVoiceRooms(res.data.data); // If you're using advancedResults, data might be in data.data
      } catch (err) {
        setError('Failed to load voice rooms. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchVoiceRooms();
    }
  }, [user]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const newRoomData = {
        name: roomName,
        description,
        maxParticipants,
        isPrivate,
      };

      // Only include password if the room is private
      if (isPrivate && password.trim()) {
        newRoomData.password = password.trim();
      }

      const res = await axios.post('/api/voice-rooms', newRoomData);
      setVoiceRooms((prev) => [...prev, res.data.data]);
      setShowCreateForm(false);
      // Clear form
      setRoomName('');
      setDescription('');
      setMaxParticipants(10);
      setIsPrivate(false);
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room.');
    }
  };

  const handleViewRoom = (roomId) => {
    navigate(`/voice-rooms/${roomId}`);
  };

  if (!user) {
    return (
      <VoiceRoomsContainer>
        <h1>You must be logged in to view voice rooms.</h1>
      </VoiceRoomsContainer>
    );
  }

  if (loading) {
    return (
      <VoiceRoomsContainer>
        <LoadingMessage>Loading voice rooms...</LoadingMessage>
      </VoiceRoomsContainer>
    );
  }

  return (
    <VoiceRoomsContainer>
      <Header>
        <h1>Voice Rooms</h1>
        <p>Join a public room or create your own to practice speaking with others!</p>
        <Button variant="primary" onClick={() => setShowCreateForm(!showCreateForm)}>
          <FaPlus /> Create Room
        </Button>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {showCreateForm && (
        <CreateRoomForm onSubmit={handleCreateRoom}>
          <FormField>
            <label htmlFor="roomName">Room Name</label>
            <input
              id="roomName"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
            />
          </FormField>

          <FormField>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="2"
            />
          </FormField>

          <FormField>
            <label htmlFor="maxParticipants">Max Participants</label>
            <input
              id="maxParticipants"
              type="number"
              min="2"
              max="99"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
            />
          </FormField>

          <CheckboxField>
            <input
              id="isPrivate"
              type="checkbox"
              checked={isPrivate}
              onChange={() => setIsPrivate(!isPrivate)}
            />
            <label htmlFor="isPrivate">Private Room</label>
          </CheckboxField>

          {isPrivate && (
            <FormField>
              <label htmlFor="password">Room Password</label>
              <input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={isPrivate}
              />
            </FormField>
          )}

          <Button variant="primary" type="submit">
            Create
          </Button>
        </CreateRoomForm>
      )}

      {voiceRooms.length === 0 ? (
        <NoRoomsMessage>No voice rooms available. Create one above!</NoRoomsMessage>
      ) : (
        <RoomsGrid>
          {voiceRooms.map((room) => (
            <RoomCard key={room._id}>
              <RoomHeader>
                <RoomTitle>
                  {room.name}{' '}
                  {room.isPrivate && (
                    <PrivateIcon title="Private Room">
                      <FaLock />
                    </PrivateIcon>
                  )}
                </RoomTitle>
                <HostInfo>
                  Host: <strong>{room.host?.username || 'Unknown'}</strong>
                </HostInfo>
              </RoomHeader>
              <RoomDescription>{room.description || 'No description provided.'}</RoomDescription>
              <RoomDetails>
                <ParticipantCount>
                  <FaUser />
                  {room.participants?.length || 0} / {room.maxParticipants}
                </ParticipantCount>
              </RoomDetails>
              <Button variant="secondary" onClick={() => handleViewRoom(room._id)}>
                View Room
              </Button>
            </RoomCard>
          ))}
        </RoomsGrid>
      )}
    </VoiceRoomsContainer>
  );
};

export default VoiceRooms;

// Styled Components
const VoiceRoomsContainer = styled.div`
  padding: 2rem;
  min-height: 100%;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;

  h1 {
    margin-bottom: 0.5rem;
    font-size: 1.875rem;
    color: var(--gray-900);
  }

  p {
    color: var(--gray-600);
    margin-bottom: 1rem;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  font-size: 1.125rem;
  color: var(--gray-600);
`;

const ErrorMessage = styled.div`
  background-color: #fee2e2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
`;

const CreateRoomForm = styled.form`
  margin: 2rem auto;
  max-width: 500px;
  background-color: var(--gray-100);
  padding: 1.5rem;
  border-radius: 0.375rem;
`;

const FormField = styled.div`
  margin-bottom: 1rem;

  label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.25rem;
    color: var(--gray-700);
  }

  input,
  textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--gray-300);
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }
`;

const CheckboxField = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;

  input {
    margin-right: 0.5rem;
  }

  label {
    font-weight: 600;
    color: var(--gray-700);
  }
`;

const NoRoomsMessage = styled.div`
  text-align: center;
  color: var(--gray-600);
  margin-top: 2rem;
`;

const RoomsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const RoomCard = styled(Card)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const RoomHeader = styled.div`
  margin-bottom: 1rem;
`;

const RoomTitle = styled.h3`
  font-size: 1.125rem;
  color: var(--gray-900);
  margin: 0 0 0.25rem 0;
  display: flex;
  align-items: center;
`;

const PrivateIcon = styled.span`
  margin-left: 0.5rem;
  color: var(--gray-500);
  font-size: 0.875rem;
`;

const HostInfo = styled.div`
  font-size: 0.875rem;
  color: var(--gray-600);
`;

const RoomDescription = styled.p`
  font-size: 0.875rem;
  color: var(--gray-700);
  margin-bottom: 1rem;
`;

const RoomDetails = styled.div`
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
`;

const ParticipantCount = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--gray-700);
`;

