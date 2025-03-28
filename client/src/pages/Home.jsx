import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Components
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { FaComment, FaUserPlus, FaSearch, FaLanguage, FaStar } from 'react-icons/fa';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [languages, setLanguages] = useState([]);

  // Fetch recommended users and available languages
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch language exchange recommendations
        const recommendationsResponse = await axios.get('/api/users/recommendations');
        setRecommendations(recommendationsResponse.data);
        setFilteredUsers(recommendationsResponse.data);

        // Fetch available languages for filtering
        const languagesResponse = await axios.get('/api/languages');
        setLanguages(languagesResponse.data);
      } catch (err) {
        setError('Failed to load recommendations. Please try again.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  // Handle filtering of users based on search query and language filter
  useEffect(() => {
    if (!recommendations.length) return;

    let filtered = [...recommendations];

    // Filter by search query (name or bio)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(query) ||
        (user.bio && user.bio.toLowerCase().includes(query))
      );
    }

    // Filter by selected language
    if (filterLanguage) {
      filtered = filtered.filter(user =>
        user.knownLanguages.some(lang => lang._id === filterLanguage) ||
        user.targetLanguages.some(lang => lang._id === filterLanguage)
      );
    }

    setFilteredUsers(filtered);
  }, [searchQuery, filterLanguage, recommendations]);

  const handleStartChat = (userId) => {
    navigate(`/chat/${userId}`);
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <HomeContainer>
        <LoadingMessage>Loading recommendations...</LoadingMessage>
      </HomeContainer>
    );
  }

  return (
    <HomeContainer>
      <HomeHeader>
        <h1>Find Language Exchange Partners</h1>
        <p>Connect with native speakers and language learners around the world</p>
      </HomeHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <FiltersContainer>
        <SearchBox>
          <SearchIcon>
            <FaSearch />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search by name or bio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchBox>

        <LanguageFilter>
          <FilterIcon>
            <FaLanguage />
          </FilterIcon>
          <FilterSelect
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
          >
            <option value="">All Languages</option>
            {languages.map(language => (
              <option key={language._id} value={language._id}>
                {language.flag} {language.name}
              </option>
            ))}
          </FilterSelect>
        </LanguageFilter>
      </FiltersContainer>

      {filteredUsers.length === 0 ? (
        <NoResultsMessage>
          <p>No users found matching your criteria.</p>
          <Button
            variant="secondary"
            onClick={() => {
              setSearchQuery('');
              setFilterLanguage('');
            }}
          >
            Clear Filters
          </Button>
        </NoResultsMessage>
      ) : (
        <UsersGrid>
          {filteredUsers.map(partner => (
            <UserCard key={partner._id} hoverable>
              <UserHeader>
                <UserAvatar
                  src={partner.avatar || 'https://via.placeholder.com/80'}
                  alt={partner.name}
                />
                <UserInfo>
                  <UserName>{partner.name}</UserName>
                  <UserMatch>
                    <MatchIcon>
                      <FaStar />
                    </MatchIcon>
                    {partner.matchPercentage}% Match
                  </UserMatch>
                </UserInfo>
              </UserHeader>

              <UserBio>{partner.bio || 'No bio provided'}</UserBio>

              <LanguagesContainer>
                <LanguageSection>
                  <SectionTitle>Speaks:</SectionTitle>
                  <LanguagesList>
                    {partner.knownLanguages.map(lang => (
                      <LanguageTag key={lang._id}>
                        <span>{lang.flag}</span> {lang.name}
                      </LanguageTag>
                    ))}
                  </LanguagesList>
                </LanguageSection>

                <LanguageSection>
                  <SectionTitle>Learning:</SectionTitle>
                  <LanguagesList>
                    {partner.targetLanguages.map(lang => (
                      <LanguageTag key={lang._id}>
                        <span>{lang.flag}</span> {lang.name}
                      </LanguageTag>
                    ))}
                  </LanguagesList>
                </LanguageSection>
              </LanguagesContainer>

              <ActionButtons>
                <Button
                  onClick={() => handleStartChat(partner._id)}
                  variant="primary"
                >
                  <FaComment /> Chat
                </Button>
                <Button
                  onClick={() => handleViewProfile(partner._id)}
                  variant="secondary"
                >
                  <FaUserPlus /> Profile
                </Button>
              </ActionButtons>
            </UserCard>
          ))}
        </UsersGrid>
      )}
    </HomeContainer>
  );
};

// Styled Components
const HomeContainer = styled.div`
  padding: 2rem;
  min-height: 100%;
  width: 100%;
`;

const HomeHeader = styled.div`
  margin-bottom: 2rem;
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

const FiltersContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SearchBox = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  position: relative;
  min-width: 250px;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  color: var(--gray-500);
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid var(--gray-300);
  border-radius: 0.375rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px var(--primary-light);
  }
`;

const LanguageFilter = styled.div`
  min-width: 200px;
  position: relative;
  display: flex;
  align-items: center;
`;

const FilterIcon = styled.div`
  position: absolute;
  left: 1rem;
  color: var(--gray-500);
  z-index: 1;
`;

const FilterSelect = styled.select`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid var(--gray-300);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background-color: white;
  cursor: pointer;
  appearance: none;
  background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%236B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>');
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1em;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px var(--primary-light);
  }
`;

const UsersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const UserCard = styled(Card)`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const UserHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const UserAvatar = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 1rem;
  border: 2px solid var(--primary-light);
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.h3`
  font-size: 1.125rem;
  margin: 0 0 0.25rem 0;
  color: var(--gray-900);
`;

const UserMatch = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: var(--primary-color);
  font-weight: 500;
`;

const MatchIcon = styled.span`
  display: inline-flex;
  margin-right: 0.25rem;
  color: #F59E0B;
`;

const UserBio = styled.p`
  font-size: 0.875rem;
  color: var(--gray-700);
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LanguagesContainer = styled.div`
  margin-bottom: 1.5rem;
  flex: 1;
`;

const LanguageSection = styled.div`
  margin-bottom: 0.75rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--gray-500);
  margin: 0 0 0.5rem 0;
  letter-spacing: 0.05em;
`;

const LanguagesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const LanguageTag = styled.span`
  display: inline-flex;
  align-items: center;
  background-color: var(--gray-100);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: var(--gray-800);

  span {
    margin-right: 0.25rem;
  }
`;

const ActionButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: auto;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  font-size: 1.125rem;
  color: var(--gray-600);
`;

const ErrorMessage = styled.div`
  background-color: #FEE2E2;
  color: #DC2626;
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
`;

const NoResultsMessage = styled.div`
  text-align: center;
  padding: 3rem 0;

  p {
    margin-bottom: 1rem;
    color: var(--gray-600);
  }
`;

export default Home;
