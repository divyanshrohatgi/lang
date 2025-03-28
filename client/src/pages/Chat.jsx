import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

// Components
import Button from '../components/ui/Button';
import { FaPaperPlane, FaExchangeAlt, FaUserCircle, FaTimes, FaClock } from 'react-icons/fa';

const Chat = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const {
    connected,
    joinRoom,
    leaveRoom,
    sendMessage,
    getRoomMessages,
    loadMessages
  } = useSocket();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [translating, setTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [correctingMessage, setCorrectingMessage] = useState(null);
  const [correction, setCorrection] = useState('');
  const [showCorrection, setShowCorrection] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Fetch room data and join the room
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setLoading(true);

        if (!roomId) {
          // If no roomId, load user's rooms
          await axios.get('/api/voiceRooms');
          setRoom(null);
          setPartner(null);
          setMessages([]);
          setLoading(false);
          return;
        }

        // Get room details
        const response = await axios.get(`/api/voiceRooms/${roomId}`);
        setRoom(response.data);

        // Find the partner (other user in the room)
        const otherUser = response.data.participants.find(p => p._id !== user._id);
        setPartner(otherUser);

        // Join socket room
        if (connected) {
          joinRoom(roomId);
        }

        // Load messages
        const messageData = await loadMessages(roomId);
        setMessages(messageData);

      } catch (err) {
        console.error('Error fetching room:', err);
        setError('Failed to load chat. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();

    // Cleanup - leave room when component unmounts
    return () => {
      if (roomId && connected) {
        leaveRoom(roomId);
      }
    };
  }, [roomId, user, connected, joinRoom, leaveRoom, loadMessages]);

  // Get messages from socket context
  useEffect(() => {
    if (roomId) {
      const roomMessages = getRoomMessages(roomId);
      if (roomMessages && roomMessages.length > 0) {
        setMessages(roomMessages);
      }
    }
  }, [roomId, getRoomMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle message translation
  const translateMessage = async (text, sourceLang, targetLang) => {
    try {
      setTranslating(true);

      const response = await axios.post('/api/translations/translate', {
        text,
        sourceLang,
        targetLang
      });

      setTranslatedText(response.data.translatedText);
      setTranslating(false);
      return response.data.translatedText;
    } catch (err) {
      console.error('Translation error:', err);
      setTranslating(false);
      return '';
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim() || !roomId) return;

    try {
      let translatedMessageText = '';

      // Auto translate if enabled
      if (autoTranslate && partner) {
        // Find user's active language
        const userLang = user.knownLanguages[0];
        // Find partner's preferred language
        const partnerLang = partner.knownLanguages[0];

        // Translate if languages are different
        if (userLang._id !== partnerLang._id) {
          translatedMessageText = await translateMessage(
            message,
            userLang._id,
            partnerLang._id
          );
        }
      }

      // Send the message. Note: Ensure your sendMessage function maps "message" to the backend field "content"
      const success = sendMessage(roomId, message, translatedMessageText || null);

      if (success) {
        setMessage('');
        setTranslatedText('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Handle message correction
  const startCorrection = (msg) => {
    setCorrectingMessage(msg);
    setCorrection(msg.content);
    setShowCorrection(true);
  };

  const cancelCorrection = () => {
    setCorrectingMessage(null);
    setCorrection('');
    setShowCorrection(false);
  };

  const submitCorrection = async () => {
    if (!correction.trim() || !correctingMessage) return;

    try {
      await axios.post('/api/translations/correct', {
        messageId: correctingMessage._id,
        correctedText: correction
      });

      // Update the message in the UI
      setMessages(messages.map(msg =>
        msg._id === correctingMessage._id
          ? { ...msg, corrected: true, correctedText: correction }
          : msg
      ));

      // Reset correction form
      cancelCorrection();
    } catch (err) {
      console.error('Error submitting correction:', err);
    }
  };

  // Format message timestamp
  const formatMessageTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (err) {
      return '';
    }
  };

  if (loading) {
    return (
      <ChatContainer>
        <LoadingMessage>Loading chat...</LoadingMessage>
      </ChatContainer>
    );
  }

  if (!roomId) {
    return (
      <ChatContainer>
        <NoChatSelected>
          <h2>Select a conversation to start chatting</h2>
          <p>Choose from your existing conversations or start a new one</p>
          <Button
            onClick={() => navigate('/')}
            variant="primary"
          >
            Find Language Partners
          </Button>
        </NoChatSelected>
      </ChatContainer>
    );
  }

  return (
    <ChatContainer>
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {partner && (
        <ChatHeader>
          <ChatPartnerInfo>
            <PartnerAvatar
              src={partner.avatar || 'https://via.placeholder.com/40'}
              alt={partner.name}
            />
            <PartnerDetails>
              <PartnerName>{partner.name}</PartnerName>
              <PartnerLanguages>
                {partner.knownLanguages.map(lang => (
                  <LanguageTag key={lang._id}>
                    {lang.flag} {lang.name}
                  </LanguageTag>
                ))}
              </PartnerLanguages>
            </PartnerDetails>
          </ChatPartnerInfo>

          <ChatControls>
            <TranslateToggle
              active={autoTranslate}
              onClick={() => setAutoTranslate(!autoTranslate)}
              title={autoTranslate ? "Turn off auto-translation" : "Turn on auto-translation"}
            >
              <FaExchangeAlt />
              <span>Auto-Translate</span>
            </TranslateToggle>
          </ChatControls>
        </ChatHeader>
      )}

      <MessagesContainer ref={chatContainerRef}>
        {messages.length === 0 ? (
          <EmptyChat>
            <EmptyStateIcon>
              <FaUserCircle />
            </EmptyStateIcon>
            <EmptyStateText>
              <h3>Start your conversation</h3>
              <p>Send a message to begin your language exchange</p>
            </EmptyStateText>
          </EmptyChat>
        ) : (
          <>
            {messages.map((msg) => {
              // Extract the first translation if available
              const translation = (msg.translations && msg.translations.length > 0)
                ? msg.translations[0]
                : null;
              return (
                <MessageWrapper
                  key={msg._id}
                  isCurrentUser={msg.sender._id === user._id}
                >
                  <MessageBubble isCurrentUser={msg.sender._id === user._id}>
                    <MessageText>{msg.content}</MessageText>

                    {translation && translation.content && (
                      <TranslatedText>
                        <TranslationLabel>Translation:</TranslationLabel>
                        {translation.content}
                      </TranslatedText>
                    )}

                    {translation && translation.corrected && translation.correctedContent && (
                      <CorrectedText>
                        <CorrectionLabel>Correction:</CorrectionLabel>
                        {translation.correctedContent}
                      </CorrectedText>
                    )}

                    <MessageMeta>
                      <MessageTime>
                        {formatMessageTime(msg.createdAt)}
                      </MessageTime>

                      {/* Show correction button for partner's messages (only if not already corrected) */}
                      {msg.sender._id !== user._id && !(translation && translation.corrected) && (
                        <CorrectionButton
                          onClick={() => startCorrection(msg)}
                          title="Correct this message"
                        >
                          Correct
                        </CorrectionButton>
                      )}
                    </MessageMeta>
                  </MessageBubble>

                  <MessageAvatar
                    src={msg.sender.avatar || 'https://via.placeholder.com/30'}
                    alt={msg.sender.name}
                    isCurrentUser={msg.sender._id === user._id}
                  />
                </MessageWrapper>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </MessagesContainer>

      {showCorrection && correctingMessage && (
        <CorrectionContainer>
          <CorrectionHeader>
            <CorrectionTitle>Correct this message</CorrectionTitle>
            <CloseButton onClick={cancelCorrection}>
              <FaTimes />
            </CloseButton>
          </CorrectionHeader>

          <OriginalMessage>{correctingMessage.content}</OriginalMessage>

          <CorrectionTextarea
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            placeholder="Enter the corrected version"
          />

          <CorrectionActions>
            <Button
              variant="secondary"
              size="small"
              onClick={cancelCorrection}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={submitCorrection}
              disabled={!correction.trim() || correction === correctingMessage.content}
            >
              Submit Correction
            </Button>
          </CorrectionActions>
        </CorrectionContainer>
      )}

      <MessageInputContainer>
        <MessageTextarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />

        {translating && (
          <TranslatingIndicator>
            <FaClock /> Translating...
          </TranslatingIndicator>
        )}

        {translatedText && (
          <TranslationPreview>
            <TranslationPreviewLabel>Translation:</TranslationPreviewLabel>
            {translatedText}
          </TranslationPreview>
        )}

        <SendButton
          onClick={handleSendMessage}
          disabled={!message.trim() || translating}
        >
          <FaPaperPlane />
        </SendButton>
      </MessageInputContainer>
    </ChatContainer>
  );
};

// Styled Components

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #F9FAFB;
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: white;
  border-bottom: 1px solid var(--gray-200);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const ChatPartnerInfo = styled.div`
  display: flex;
  align-items: center;
`;

const PartnerAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 0.75rem;
  border: 1px solid var(--gray-200);
`;

const PartnerDetails = styled.div``;

const PartnerName = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--gray-900);
`;

const PartnerLanguages = styled.div`
  display: flex;
  gap: 0.375rem;
  margin-top: 0.25rem;
`;

const LanguageTag = styled.span`
  font-size: 0.75rem;
  color: var(--gray-600);
`;

const ChatControls = styled.div`
  display: flex;
  align-items: center;
`;

const TranslateToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${props => props.active ? 'var(--primary-color)' : 'var(--gray-100)'};
  color: ${props => props.active ? 'white' : 'var(--gray-700)'};
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.active ? 'var(--primary-dark)' : 'var(--gray-200)'};
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
`;

const MessageWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
  flex-direction: ${props => props.isCurrentUser ? 'row-reverse' : 'row'};
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  background-color: ${props => props.isCurrentUser ? 'var(--primary-color)' : 'white'};
  color: ${props => props.isCurrentUser ? 'white' : 'var(--gray-800)'};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  margin: 0 0.5rem;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0.75rem;
    width: 0.75rem;
    height: 0.75rem;
    background-color: ${props => props.isCurrentUser ? 'var(--primary-color)' : 'white'};
    transform: rotate(45deg);
    ${props => props.isCurrentUser ? 'right: -0.325rem;' : 'left: -0.325rem;'}
  }
`;

const MessageText = styled.p`
  margin: 0 0 0.5rem 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

const TranslatedText = styled.div`
  font-size: 0.75rem;
  padding: 0.5rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 0.25rem;
  margin-top: 0.5rem;
  opacity: 0.9;
`;

const TranslationLabel = styled.span`
  font-weight: 600;
  display: block;
  margin-bottom: 0.25rem;
`;

const CorrectedText = styled.div`
  font-size: 0.75rem;
  padding: 0.5rem;
  background-color: rgba(16, 185, 129, 0.1);
  border-radius: 0.25rem;
  margin-top: 0.5rem;
  color: var(--success-color);
`;

const CorrectionLabel = styled.span`
  font-weight: 600;
  display: block;
  margin-bottom: 0.25rem;
`;

const MessageMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.75rem;
`;

const MessageTime = styled.span`
  opacity: 0.7;
`;

const CorrectionButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  font-size: 0.75rem;
  padding: 0;
  cursor: pointer;
  opacity: 0.7;
  text-decoration: underline;

  &:hover {
    opacity: 1;
  }
`;

const MessageAvatar = styled.img`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  margin-top: 0.5rem;
`;

const MessageInputContainer = styled.div`
  display: flex;
  padding: 1rem;
  background-color: white;
  border-top: 1px solid var(--gray-200);
  position: relative;
`;

const MessageTextarea = styled.textarea`
  flex: 1;
  border: 1px solid var(--gray-300);
  border-radius: 1.5rem;
  padding: 0.75rem 1rem;
  resize: none;
  height: 2.75rem;
  max-height: 6rem;
  font-family: inherit;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const SendButton = styled.button`
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  background-color: var(--primary-color);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: 0.75rem;
  flex-shrink: 0;

  &:hover {
    background-color: var(--primary-dark);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TranslatingIndicator = styled.div`
  position: absolute;
  right: 4rem;
  top: 0.25rem;
  font-size: 0.75rem;
  color: var(--gray-500);
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const TranslationPreview = styled.div`
  position: absolute;
  left: 1rem;
  right: 4rem;
  top: -3.5rem;
  background-color: white;
  border: 1px solid var(--gray-300);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  color: var(--gray-700);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const TranslationPreviewLabel = styled.span`
  font-weight: 600;
  margin-right: 0.25rem;
`;

const CorrectionContainer = styled.div`
  background-color: white;
  border-top: 1px solid var(--gray-200);
  padding: 1rem;
`;

const CorrectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const CorrectionTitle = styled.h4`
  margin: 0;
  font-size: 0.875rem;
  color: var(--gray-900);
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--gray-500);
  cursor: pointer;

  &:hover {
    color: var(--gray-700);
  }
`;

const OriginalMessage = styled.div`
  background-color: var(--gray-100);
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
  color: var(--gray-800);
`;

const CorrectionTextarea = styled.textarea`
  width: 100%;
  border: 1px solid var(--gray-300);
  border-radius: 0.375rem;
  padding: 0.75rem;
  resize: vertical;
  height: 5rem;
  font-family: inherit;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const CorrectionActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const LoadingMessage = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: var(--gray-600);
`;

const ErrorMessage = styled.div`
  background-color: #FEE2E2;
  color: #DC2626;
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin: 1rem;
  font-size: 0.875rem;
`;

const NoChatSelected = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;

  h2 {
    font-size: 1.5rem;
    color: var(--gray-800);
    margin-bottom: 0.5rem;
  }

  p {
    color: var(--gray-600);
    margin-bottom: 1.5rem;
  }
`;

const EmptyChat = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const EmptyStateIcon = styled.div`
  font-size: 4rem;
  color: var(--gray-300);
  margin-bottom: 1rem;
`;

const EmptyStateText = styled.div`
  text-align: center;

  h3 {
    font-size: 1.25rem;
    color: var(--gray-800);
    margin-bottom: 0.5rem;
  }

  p {
    color: var(--gray-600);
  }
`;

export default Chat;
