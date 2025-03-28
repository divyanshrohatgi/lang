import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';

// Components
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FormField from '../components/ui/FormField';
import { FaEdit, FaLanguage, FaComments, FaSave, FaTimes, FaCamera, FaMapMarkerAlt } from 'react-icons/fa';

const Profile = () => {
  const { userId } = useParams();
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [languages, setLanguages] = useState([]);

  // Determine if viewing own profile and load profile data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Determine if viewing own profile
        const targetUserId = userId || user?._id;
        const isOwn = !userId || userId === user?._id;
        setIsOwnProfile(isOwn);

        if (!targetUserId) {
          setError('User not found');
          setLoading(false);
          return;
        }

        // Get user profile
        const profileResponse = await axios.get(`/api/users/${targetUserId}`);
        setProfileUser(profileResponse.data.data);

        // Get languages for the form
        const languagesResponse = await axios.get('/api/languages');
        setLanguages(languagesResponse.data.data);
      } catch (err) {
        setError('Failed to load profile. Please try again.');
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, user]);

  // Form for editing profile
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      username: profileUser?.username || '',
      bio: profileUser?.bio || '',
      email: profileUser?.email || '',
      countryLocation: profileUser?.location?.country || '',
      cityLocation: profileUser?.location?.city || '',
      interests: profileUser?.interests?.join(', ') || '',
      nativeLanguageIds: profileUser?.nativeLanguages?.map(lang => lang._id) || [],
      learningLanguageIds: profileUser?.learningLanguages?.map(lang => lang.language._id) || [],
      profilePicture: null
    },
    validationSchema: Yup.object({
      username: Yup.string()
        .required('Username is required')
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username cannot be more than 20 characters'),
      email: Yup.string()
        .email('Invalid email').required('Email is required'),
      bio: Yup.string()
        .max(250, 'Bio must be 250 characters or less'),
      countryLocation: Yup.string(),
      cityLocation: Yup.string(),
      interests: Yup.string(),
      nativeLanguageIds: Yup.array().min(1, 'Select at least one native language'),
      learningLanguageIds: Yup.array().min(1, 'Select at least one language you want to learn')
    }),
    onSubmit: async (values) => {
      if (!isOwnProfile) return;

      try {
        setSaving(true);
        setError(null);
        setSuccess(null);

        // Parse interests string into array
        const interestsArray = values.interests
          ? values.interests.split(',').map(interest => interest.trim()).filter(Boolean)
          : [];

        // Create form data for file upload
        const formData = new FormData();
        formData.append('username', values.username);
        formData.append('bio', values.bio);
        formData.append('email', values.email);
        formData.append('location[country]', values.countryLocation);
        formData.append('location[city]', values.cityLocation);
        formData.append('nativeLanguages', JSON.stringify(values.nativeLanguageIds));
        formData.append('learningLanguages', JSON.stringify(values.learningLanguageIds.map(id => ({
          language: id,
          proficiency: 'beginner' // Default value, can be updated later
        }))));
        formData.append('interests', JSON.stringify(interestsArray));

        if (values.profilePicture) {
          formData.append('profilePicture', values.profilePicture);
        }

        // Update profile
        const response = await axios.put('/api/users', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        setProfileUser(response.data.data);
        setSuccess('Profile updated successfully');
        setEditing(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to update profile');
        console.error('Error updating profile:', err);
      } finally {
        setSaving(false);
      }
    }
  });

  const handleStartChat = () => {
    if (!profileUser) return;

    navigate(`/chat/${profileUser._id}`);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    formik.setFieldValue('profilePicture', file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleLanguage = (languageId, type) => {
    const fieldName = type === 'native' ? 'nativeLanguageIds' : 'learningLanguageIds';
    const currentIds = [...formik.values[fieldName]];

    if (currentIds.includes(languageId)) {
      // Remove if already selected
      formik.setFieldValue(
        fieldName,
        currentIds.filter(id => id !== languageId)
      );
    } else {
      // Add if not selected
      formik.setFieldValue(fieldName, [...currentIds, languageId]);
    }
  };

  if (loading) {
    return (
      <ProfileContainer>
        <LoadingMessage>Loading profile...</LoadingMessage>
      </ProfileContainer>
    );
  }

  if (!profileUser) {
    return (
      <ProfileContainer>
        <ErrorCard>
          <h2>User Not Found</h2>
          <p>The profile you are looking for does not exist or is not accessible.</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </ErrorCard>
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <Card>
        <ProfileHeader>
          {editing ? (
            <ProfileHeaderEditing>
              <AvatarUploadContainer>
                <AvatarPreviewImage
                  src={avatarPreview || profileUser.profilePicture || 'https://via.placeholder.com/150'}
                  alt="Avatar preview"
                />
                <AvatarUploadButton>
                  <FaCamera />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="avatar-upload"
                  />
                  <label htmlFor="avatar-upload">Change Photo</label>
                </AvatarUploadButton>
              </AvatarUploadContainer>

              <HeaderInfoEditing>
                <FormField
                  label="Username"
                  type="text"
                  id="username"
                  name="username"
                  value={formik.values.username}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.username && formik.errors.username}
                  required
                />

                <FormField
                  label="Email"
                  type="email"
                  id="email"
                  name="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && formik.errors.email}
                  required
                />
              </HeaderInfoEditing>
            </ProfileHeaderEditing>
          ) : (
            <ProfileHeaderView>
              <ProfileAvatar
                src={profileUser.profilePicture || 'https://via.placeholder.com/150'}
                alt={profileUser.username}
              />
              <ProfileInfo>
                <ProfileName>{profileUser.username}</ProfileName>
                <ProfileLocation>
                  {(profileUser.location && (profileUser.location.city || profileUser.location.country)) && (
                    <LocationInfo>
                      <FaMapMarkerAlt />
                      <span>
                        {[profileUser.location.city, profileUser.location.country].filter(Boolean).join(', ')}
                      </span>
                    </LocationInfo>
                  )}
                </ProfileLocation>
                {isOwnProfile && (
                  <EditButton onClick={() => setEditing(true)}>
                    <FaEdit /> Edit Profile
                  </EditButton>
                )}
              </ProfileInfo>

              {!isOwnProfile && (
                <ActionButtons>
                  <Button onClick={handleStartChat}>
                    <FaComments /> Message
                  </Button>
                </ActionButtons>
              )}
            </ProfileHeaderView>
          )}
        </ProfileHeader>

        <ProfileBody>
          {editing ? (
            <form onSubmit={formik.handleSubmit}>
              <SectionTitle>About Me</SectionTitle>
              <FormField
                label="Bio"
                type="textarea"
                id="bio"
                name="bio"
                value={formik.values.bio}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.bio && formik.errors.bio}
                placeholder="Write something about yourself..."
              />

              <SectionTitle>Location</SectionTitle>
              <LocationFields>
                <FormField
                  label="Country"
                  type="text"
                  id="countryLocation"
                  name="countryLocation"
                  value={formik.values.countryLocation}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.countryLocation && formik.errors.countryLocation}
                  placeholder="Your country"
                />

                <FormField
                  label="City"
                  type="text"
                  id="cityLocation"
                  name="cityLocation"
                  value={formik.values.cityLocation}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.cityLocation && formik.errors.cityLocation}
                  placeholder="Your city"
                />
              </LocationFields>

              <SectionTitle>Interests</SectionTitle>
              <FormField
                label="Interests (comma-separated)"
                type="text"
                id="interests"
                name="interests"
                value={formik.values.interests}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.interests && formik.errors.interests}
                placeholder="reading, music, traveling, etc."
              />

              <SectionTitle>Languages</SectionTitle>
              {formik.touched.nativeLanguageIds && formik.errors.nativeLanguageIds && (
                <FormError>{formik.errors.nativeLanguageIds}</FormError>
              )}
              {formik.touched.learningLanguageIds && formik.errors.learningLanguageIds && (
                <FormError>{formik.errors.learningLanguageIds}</FormError>
              )}

              <LanguagesGrid>
                <LanguageColumn>
                  <LanguageColumnTitle>Native Languages</LanguageColumnTitle>
                  <LanguageList>
                    {languages.map(language => (
                      <LanguageItem
                        key={language._id}
                        selected={formik.values.nativeLanguageIds.includes(language._id)}
                        onClick={() => toggleLanguage(language._id, 'native')}
                      >
                        <LanguageFlag>{language.flag || '🌐'}</LanguageFlag>
                        <LanguageName>{language.name}</LanguageName>
                      </LanguageItem>
                    ))}
                  </LanguageList>
                </LanguageColumn>

                <LanguageColumn>
                  <LanguageColumnTitle>Languages I'm Learning</LanguageColumnTitle>
                  <LanguageList>
                    {languages.map(language => (
                      <LanguageItem
                        key={language._id}
                        selected={formik.values.learningLanguageIds.includes(language._id)}
                        onClick={() => toggleLanguage(language._id, 'learning')}
                      >
                        <LanguageFlag>{language.flag || '🌐'}</LanguageFlag>
                        <LanguageName>{language.name}</LanguageName>
                      </LanguageItem>
                    ))}
                  </LanguageList>
                </LanguageColumn>
              </LanguagesGrid>

              <ButtonGroup>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  <FaTimes /> Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!formik.isValid || !formik.dirty || saving}
                >
                  {saving ? 'Saving...' : (
                    <>
                      <FaSave /> Save Changes
                    </>
                  )}
                </Button>
              </ButtonGroup>
            </form>
          ) : (
            <>
              <Section>
                <SectionTitle>About Me</SectionTitle>
                <SectionContent>
                  {profileUser.bio ? (
                    <BioText>{profileUser.bio}</BioText>
                  ) : (
                    <EmptyState>No bio provided</EmptyState>
                  )}
                </SectionContent>
              </Section>

              {profileUser.interests && profileUser.interests.length > 0 && (
                <Section>
                  <SectionTitle>Interests</SectionTitle>
                  <SectionContent>
                    <InterestsList>
                      {profileUser.interests.map((interest, index) => (
                        <InterestTag key={index}>{interest}</InterestTag>
                      ))}
                    </InterestsList>
                  </SectionContent>
                </Section>
              )}

              <Section>
                <SectionTitle>Languages</SectionTitle>
                <SectionContent>
                  <LanguageSection>
                    <LanguageSectionTitle>
                      <FaLanguage /> Native Languages
                    </LanguageSectionTitle>
                    <LanguageTags>
                      {profileUser.nativeLanguages && profileUser.nativeLanguages.length > 0 ? (
                        profileUser.nativeLanguages.map(language => (
                          <LanguageTag key={language._id}>
                            <span>{language.flag || '🌐'}</span> {language.name}
                          </LanguageTag>
                        ))
                      ) : (
                        <EmptyState>No languages listed</EmptyState>
                      )}
                    </LanguageTags>
                  </LanguageSection>

                  <LanguageSection>
                    <LanguageSectionTitle>
                      <FaLanguage /> Learning
                    </LanguageSectionTitle>
                    <LanguageTags>
                      {profileUser.learningLanguages && profileUser.learningLanguages.length > 0 ? (
                        profileUser.learningLanguages.map(item => (
                          <LanguageTag key={item.language._id}>
                            <span>{item.language.flag || '🌐'}</span> {item.language.name}
                            <ProficiencyLevel>({item.proficiency})</ProficiencyLevel>
                          </LanguageTag>
                        ))
                      ) : (
                        <EmptyState>No languages listed</EmptyState>
                      )}
                    </LanguageTags>
                  </LanguageSection>
                </SectionContent>
              </Section>
            </>
          )}
        </ProfileBody>
      </Card>
    </ProfileContainer>
  );
};

// Styled Components
const ProfileContainer = styled.div`
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem;
  font-size: 1.125rem;
  color: var(--gray-600);
`;

const ErrorMessage = styled.div`
  background-color: #FEE2E2;
  color: #DC2626;
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
`;

const SuccessMessage = styled.div`
  background-color: #D1FAE5;
  color: #047857;
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
`;

const ErrorCard = styled(Card)`
  text-align: center;
  padding: 3rem;

  h2 {
    margin-bottom: 0.5rem;
    color: var(--gray-800);
  }

  p {
    margin-bottom: 1.5rem;
    color: var(--gray-600);
  }
`;

const ProfileHeader = styled.div`
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--gray-200);
  padding-bottom: 2rem;
`;

const ProfileHeaderView = styled.div`
  display: flex;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const ProfileHeaderEditing = styled.div`
  display: flex;
  gap: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ProfileAvatar = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 2rem;
  border: 3px solid var(--primary-light);

  @media (max-width: 768px) {
    margin-right: 0;
    margin-bottom: 1rem;
  }
`;

const AvatarUploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const AvatarPreviewImage = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 0.75rem;
  border: 3px solid var(--primary-light);
`;

const AvatarUploadButton = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: var(--primary-color);

  label {
    cursor: pointer;
    font-size: 0.875rem;
  }

  &:hover {
    text-decoration: underline;
  }
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const HeaderInfoEditing = styled.div`
  flex: 1;
`;

const ProfileName = styled.h1`
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  color: var(--gray-900);
`;

const ProfileLocation = styled.div`
  margin-bottom: 0.75rem;
`;

const LocationInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--gray-600);
  font-size: 0.875rem;

  svg {
    color: var(--gray-500);
  }
`;

const EditButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: 1px solid var(--gray-300);
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: var(--gray-700);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: var(--gray-100);
    border-color: var(--gray-400);
  }

  svg {
    font-size: 0.875rem;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;

  @media (max-width: 768px) {
    margin-top: 1rem;
  }
`;

const ProfileBody = styled.div``;

const Section = styled.div`
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.125rem;
  color: var(--gray-800);
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--gray-200);
`;

const SectionContent = styled.div``;

const BioText = styled.p`
  white-space: pre-line;
  color: var(--gray-700);
  line-height: 1.5;
`;

const EmptyState = styled.p`
  color: var(--gray-500);
  font-style: italic;
`;

const LanguageSection = styled.div`
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const LanguageSectionTitle = styled.h3`
  font-size: 1rem;
  color: var(--gray-700);
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LanguageTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const LanguageTag = styled.span`
  display: inline-flex;
  align-items: center;
  background-color: var(--gray-100);
  padding: 0.375rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.875rem;
  color: var(--gray-800);

  span {
    margin-right: 0.375rem;
  }
`;

const ProficiencyLevel = styled.span`
  margin-left: 0.375rem;
  font-size: 0.75rem;
  color: var(--gray-600);
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 2rem;
`;

const FormError = styled.div`
  color: var(--danger-color);
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
`;

const LanguagesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const LanguageColumn = styled.div``;

const LanguageColumnTitle = styled.h3`
  font-size: 0.875rem;
  color: var(--gray-700);
  margin: 0 0 0.75rem 0;
`;

const LanguageList = styled.div`
  border: 1px solid var(--gray-300);
  border-radius: 0.375rem;
  max-height: 300px;
  overflow-y: auto;
`;

const LanguageItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--gray-200);
  cursor: pointer;
  background-color: ${props => props.selected ? 'rgba(99, 102, 241, 0.1)' : 'transparent'};
  color: ${props => props.selected ? 'var(--primary-color)' : 'var(--gray-800)'};
  font-weight: ${props => props.selected ? '500' : 'normal'};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${props => props.selected ? 'rgba(99, 102, 241, 0.15)' : 'var(--gray-100)'};
  }
`;

const LanguageFlag = styled.span`
  margin-right: 0.75rem;
  font-size: 1.125rem;
`;

const LanguageName = styled.span`
  font-size: 0.875rem;
`;

const LocationFields = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const InterestsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const InterestTag = styled.span`
  display: inline-flex;
  align-items: center;
  background-color: var(--gray-100);
  padding: 0.375rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.875rem;
  color: var(--gray-800);
`;

export default Profile;
