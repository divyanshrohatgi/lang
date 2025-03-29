import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { FaMicrophoneSlash, FaHeadphonesAlt, FaSignOutAlt, FaMicrophone, FaHeadphones } from 'react-icons/fa';

const VoiceRoomPage = () => {
  const { user } = useAuth();
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [voiceRoom, setVoiceRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For joining a private room
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');

  useEffect(() => {
    const fetchVoiceRoom = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/voice-rooms/${roomId}`);
        setVoiceRoom(res.data.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load the voice room.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchVoiceRoom();
    }
  }, [user, roomId]);

  const handleJoinRoom = async () => {
    if (voiceRoom.isPrivate) {
      // Prompt for password if not already
      if (!showPasswordPrompt) {
        setShowPasswordPrompt(true);
        return;
      }
    }

    try {
      const payload = voiceRoom.isPrivate
        ? { password: roomPassword }
        : {};

      const res = await axios.post(`/api/voice-rooms/${roomId}/join`, payload);
      setVoiceRoom(res.data.data);
      setShowPasswordPrompt(false);
      setRoomPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join the room.');
    }
  };

  const handleLeaveRoom = async () => {
    try {
      const res = await axios.post(`/api/voice-rooms/${roomId}/leave`);
      // If the room was closed or we just left, navigate away
      navigate('/voice-rooms');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to leave the room.');
    }
  };

  const handleToggleMute = async () => {
    try {
      const res = await axios.post(`/api/voice-rooms/${roomId}/toggle-mute`);
      // We only need to update the local state for the current user
      const updatedMutedStatus = res.data.data.isMuted;

      setVoiceRoom((prev) => {
        if (!prev) return prev;
        const updatedParticipants = prev.participants.map((p) => {
          if (p.user._id === user._id) {
            return { ...p, isMuted: updatedMutedStatus };
          }
          return p;
        });
        return { ...prev, participants: updatedParticipants };
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to toggle mute.');
    }
  };

  const handleToggleDeafen = async () => {
    try {
      const res = await axios.post(`/api/voice-rooms/${roomId}/toggle-deafen`);
      // We only need to update the local state for the current user
      const { isDeafened, isMuted } = res.data.data;

      setVoiceRoom((prev) => {
        if (!prev) return prev;
        const updatedParticipants = prev.participants.map((p) => {
          if (p.user._id === user._id) {
            return { ...p, isDeafened, isMuted };
          }
          return p;
        });
        return { ...prev, participants: updatedParticipants };
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to toggle deafen.');
    }
  };

  if (!user) {
    return (
      <RoomContainer>
        <h1>You must be logged in to view this room.</h1>
      </RoomContainer>
    );
  }

  if (loading) {
    return (
      <RoomContainer>
        <LoadingMessage>Loading voice room...</LoadingMessage>
      </RoomContainer>
    );
  }

  if (error) {
    return (
      <RoomContainer>
        <ErrorMessage>{error}</ErrorMessage>
      </RoomContainer>
    );
  }

  if (!voiceRoom) {
    return (
      <RoomContainer>
        <ErrorMessage>Voice room not found.</ErrorMessage>
      </RoomContainer>
    );
  }

  // Check if the user is in the room
  const isUserParticipant = voiceRoom.participants.some(
    (participant) => participant.user._id === user._id
  );

  return (
    <RoomContainer>
      <RoomHeader>
        <h1>{voiceRoom.name}</h1>
        <p>{voiceRoom.description || 'No description provided.'}</p>
      </RoomHeader>

      <HostInfo>
        Host: <strong>{voiceRoom.host?.username || 'Unknown'}</strong>
      </HostInfo>

      {voiceRoom.isPrivate && <PrivateRoomLabel>Private Room</PrivateRoomLabel>}

      <ParticipantsContainer>
        <h2>Participants</h2>
        {voiceRoom.participants.length === 0 ? (
          <p>No participants yet.</p>
        ) : (
          <ParticipantList>
            {voiceRoom.participants.map((p) => (
              <ParticipantItem key={p.user._id}>
                <ParticipantName>
                  {p.user.username} {p.user._id === voiceRoom.host?._id && '(Host)'}
                </ParticipantName>
                <ParticipantStatus>
                  {p.isDeafened ? (
                    <>
                      <FaHeadphonesAlt style={{ color: '#DC2626' }} title="Deafened" />
                      <span>Deafened</span>
                    </>
                  ) : p.isMuted ? (
                    <>
                      <FaMicrophoneSlash style={{ color: '#F59E0B' }} title="Muted" />
                      <span>Muted</span>
                    </>
                  ) : (
                    <>
                      <FaMicrophone style={{ color: '#10B981' }} title="Unmuted" />
                      <span>Talking</span>
                    </>
                  )}
                </ParticipantStatus>
              </ParticipantItem>
            ))}
          </ParticipantList>
        )}
      </ParticipantsContainer>

      {/* Join / Leave / Mute / Deafen controls */}
      <ControlsContainer>
        {!isUserParticipant ? (
          <>
            {showPasswordPrompt && voiceRoom.isPrivate && (
              <PasswordPrompt>
                <label htmlFor="roomPassword">Enter Room Password:</label>
                <input
                  id="roomPassword"
                  type="text"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                />
              </PasswordPrompt>
            )}
            <Button variant="primary" onClick={handleJoinRoom}>
              Join Room
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={handleToggleMute}>
              {voiceRoom.participants.find((p) => p.user._id === user._id)?.isMuted ? (
                <><FaMicrophone /> Unmute</>
              ) : (
                <><FaMicrophoneSlash /> Mute</>
              )}
            </Button>

            <Button variant="secondary" onClick={handleToggleDeafen}>
              {voiceRoom.participants.find((p) => p.user._id === user._id)?.isDeafened ? (
                <><FaHeadphones /> Undeafen</>
              ) : (
                <><FaHeadphonesAlt /> Deafen</>
              )}
            </Button>

            <Button variant="danger" onClick={handleLeaveRoom}>
              <FaSignOutAlt /> Leave Room
            </Button>
          </>
        )}
      </ControlsContainer>
    </RoomContainer>
  );
};

export default VoiceRoomPage;

// Styled Components
const RoomContainer = styled.div`
  padding: 2rem;
  min-height: 100%;
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
  text-align: center;
`;

const RoomHeader = styled.div`
  margin-bottom: 1rem;
  text-align: center;

  h1 {
    font-size: 1.875rem;
    color: var(--gray-900);
    margin-bottom: 0.5rem;
  }

  p {
    color: var(--gray-600);
  }
`;

const HostInfo = styled.div`
  text-align: center;
  color: var(--gray-700);
  margin-bottom: 1rem;
`;

const PrivateRoomLabel = styled.div`
  text-align: center;
  background-color: var(--gray-200);
  color: var(--gray-700);
  padding: 0.5rem;
  border-radius: 0.375rem;
  margin: 0 auto 1rem auto;
  max-width: 200px;
`;

const ParticipantsContainer = styled.div`
  margin: 2rem 0;
`;

const ParticipantList = styled.ul`
  list-style: none;
  padding: 0;
`;

const ParticipantItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--gray-200);
`;

const ParticipantName = styled.span`
  font-weight: 600;
  color: var(--gray-800);
`;

const ParticipantStatus = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--gray-600);
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const PasswordPrompt = styled.div`
  margin-bottom: 1rem;
  text-align: center;

  label {
    display: block;
    margin-bottom: 0.25rem;
    font-weight: 600;
  }

  input {
    padding: 0.5rem;
    border: 1px solid var(--gray-300);
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }
`;
