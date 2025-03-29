import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Components
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { FaPlus, FaTrash, FaCheck } from 'react-icons/fa';

const LanguageSettings = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [languages, setLanguages] = useState([]);
  const [nativeLanguages, setNativeLanguages] = useState([]); // languages user knows
  const [learningLanguages, setLearningLanguages] = useState([]); // languages user wants to learn
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available languages and user's language settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all available languages
        const response = await axios.get('/api/languages');
        setLanguages(response.data);

        // Set user's existing language preferences if they exist
        if (user?.nativeLanguages) {
          setNativeLanguages(user.nativeLanguages);
        }
        if (user?.learningLanguages) {
          // Assuming learningLanguages is stored as an array of objects with a "language" field
          setLearningLanguages(user.learningLanguages.map(item => item.language));
        }
      } catch (err) {
        setError('Failed to load languages. Please try again.');
        console.error('Error fetching languages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleAddNativeLanguage = (language) => {
    if (!nativeLanguages.some(lang => lang._id === language._id)) {
      // Remove from learningLanguages if it's there
      setLearningLanguages(learningLanguages.filter(lang => lang._id !== language._id));
      setNativeLanguages([...nativeLanguages, language]);
    }
  };

  const handleRemoveNativeLanguage = (languageId) => {
    setNativeLanguages(nativeLanguages.filter(lang => lang._id !== languageId));
  };

  const handleAddLearningLanguage = (language) => {
    if (!learningLanguages.some(lang => lang._id === language._id)) {
      // Remove from nativeLanguages if it's there
      setNativeLanguages(nativeLanguages.filter(lang => lang._id !== language._id));
      setLearningLanguages([...learningLanguages, language]);
    }
  };

  const handleRemoveLearningLanguage = (languageId) => {
    setLearningLanguages(learningLanguages.filter(lang => lang._id !== languageId));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (nativeLanguages.length === 0) {
        setError('Please select at least one language that you know.');
        setSaving(false);
        return;
      }

      if (learningLanguages.length === 0) {
        setError('Please select at least one language that you want to learn.');
        setSaving(false);
        return;
      }

      // Update user profile with updated language settings
      const result = await updateProfile({
        nativeLanguages: nativeLanguages.map(lang => lang._id),
        learningLanguages: learningLanguages.map(lang => lang._id)
      });

      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Failed to save language preferences.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Error saving language preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LanguageContainer>
        <LanguageContent>
          <h1>Loading...</h1>
          <p>Loading your language preferences...</p>
        </LanguageContent>
      </LanguageContainer>
    );
  }

  return (
    <LanguageContainer>
      <LanguageContent>
        <LanguageHeader>
          <h1>Language Settings</h1>
          <p>Select the languages you know and the ones you want to learn</p>
        </LanguageHeader>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <LanguageSection>
          <Card>
            <SectionHeader>
              <h2>Languages I Know</h2>
              <p>Select languages that you're fluent in or can teach others</p>
            </SectionHeader>

            <LanguageList>
              {nativeLanguages.map(language => (
                <LanguageItem key={language._id} selected>
                  <LanguageName>
                    <LanguageFlag>{language.flag}</LanguageFlag>
                    {language.name}
                  </LanguageName>
                  <RemoveButton onClick={() => handleRemoveNativeLanguage(language._id)}>
                    <FaTrash />
                  </RemoveButton>
                </LanguageItem>
              ))}
            </LanguageList>
          </Card>
        </LanguageSection>

        <LanguageSection>
          <Card>
            <SectionHeader>
              <h2>Languages I Want to Learn</h2>
              <p>Select languages that you want to practice and improve</p>
            </SectionHeader>

            <LanguageList>
              {learningLanguages.map(language => (
                <LanguageItem key={language._id} selected>
                  <LanguageName>
                    <LanguageFlag>{language.flag}</LanguageFlag>
                    {language.name}
                  </LanguageName>
                  <RemoveButton onClick={() => handleRemoveLearningLanguage(language._id)}>
                    <FaTrash />
                  </RemoveButton>
                </LanguageItem>
              ))}
            </LanguageList>
          </Card>
        </LanguageSection>

        <LanguageSection>
          <Card>
            <SectionHeader>
              <h2>Available Languages</h2>
              <p>Add to either "Languages I Know" or "Languages I Want to Learn"</p>
            </SectionHeader>

            <LanguageList>
              {languages
                .filter(language =>
                  !nativeLanguages.some(lang => lang._id === language._id) &&
                  !learningLanguages.some(lang => lang._id === language._id)
                )
                .map(language => (
                  <LanguageItem key={language._id}>
                    <LanguageName>
                      <LanguageFlag>{language.flag}</LanguageFlag>
                      {language.name}
                    </LanguageName>
                    <ActionButtons>
                      <AddKnownButton
                        title="Add to languages I know"
                        onClick={() => handleAddNativeLanguage(language)}
                      >
                        <FaCheck />
                      </AddKnownButton>
                      <AddTargetButton
                        title="Add to languages I want to learn"
                        onClick={() => handleAddLearningLanguage(language)}
                      >
                        <FaPlus />
                      </AddTargetButton>
                    </ActionButtons>
                  </LanguageItem>
                ))}
            </LanguageList>
          </Card>
        </LanguageSection>

        <ButtonsContainer>
          <Button
            onClick={handleSave}
            disabled={saving || nativeLanguages.length === 0 || learningLanguages.length === 0}
            size="large"
          >
            {saving ? 'Saving...' : 'Save Language Preferences'}
          </Button>
        </ButtonsContainer>
      </LanguageContent>
    </LanguageContainer>
  );
};

// Styled Components

const LanguageContainer = styled.div`
  padding: 2rem;
  min-height: 100%;
  width: 100%;
`;

const LanguageContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const LanguageHeader = styled.div`
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

const ErrorMessage = styled.div`
  background-color: #FEE2E2;
  color: #DC2626;
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
`;

const LanguageSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionHeader = styled.div`
  margin-bottom: 1rem;

  h2 {
    font-size: 1.25rem;
    color: var(--gray-900);
    margin-bottom: 0.25rem;
  }

  p {
    font-size: 0.875rem;
    color: var(--gray-600);
  }
`;

const LanguageList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const LanguageItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border-bottom: 1px solid var(--gray-200);
  background-color: ${props => props.selected ? 'var(--gray-100)' : 'transparent'};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--gray-100);
  }
`;

const LanguageName = styled.div`
  display: flex;
  align-items: center;
  font-weight: 500;
`;

const LanguageFlag = styled.span`
  font-size: 1.5rem;
  margin-right: 0.75rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const AddKnownButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 9999px;
  background-color: var(--success-color);
  color: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #059669;
  }
`;

const AddTargetButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 9999px;
  background-color: var(--primary-color);
  color: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: var(--primary-dark);
  }
`;

const RemoveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 9999px;
  background-color: var(--gray-200);
  color: var(--gray-700);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: var(--danger-color);
    color: white;
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 2rem;
`;

export default LanguageSettings;
