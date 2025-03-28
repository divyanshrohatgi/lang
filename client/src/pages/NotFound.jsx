import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaHome, FaSearch } from 'react-icons/fa';

// Components
import Button from '../components/ui/Button';

const NotFound = () => {
  return (
    <NotFoundContainer>
      <NotFoundContent>
        <NotFoundCode>404</NotFoundCode>
        <NotFoundTitle>Page Not Found</NotFoundTitle>
        <NotFoundMessage>
          The page you are looking for might have been removed, had its name changed,
          or is temporarily unavailable.
        </NotFoundMessage>

        <ButtonsContainer>
          <Button as={Link} to="/" variant="primary">
            <FaHome /> Go Home
          </Button>
          <Button as={Link} to="/chat" variant="secondary">
            <FaSearch /> Browse Conversations
          </Button>
        </ButtonsContainer>
      </NotFoundContent>
    </NotFoundContainer>
  );
};

// Styled Components
const NotFoundContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #F9FAFB;
`;

const NotFoundContent = styled.div`
  text-align: center;
  max-width: 500px;
`;

const NotFoundCode = styled.h1`
  font-size: 6rem;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0;
  line-height: 1;
`;

const NotFoundTitle = styled.h2`
  font-size: 1.5rem;
  color: var(--gray-900);
  margin-bottom: 1rem;
`;

const NotFoundMessage = styled.p`
  color: var(--gray-600);
  margin-bottom: 2rem;
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

export default NotFound;
