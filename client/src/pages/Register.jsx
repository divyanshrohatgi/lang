import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';

// Components
import FormField from '../components/ui/FormField';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      bio: ''
    },
    validationSchema: Yup.object({
      username: Yup.string()
        .required('Username is required')
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username must be 20 characters or less'),
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Confirm password is required'),
      bio: Yup.string()
        .max(250, 'Bio must be 250 characters or less')
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);

      try {
        // Create user data object without confirmPassword
        const userData = {
          username: values.username,
          email: values.email,
          password: values.password,
          bio: values.bio
        };

        const result = await register(userData);

        if (result.success) {
          navigate('/languages'); // Redirect to language settings after registration
        } else {
          setError(result.error || 'Registration failed. Please try again.');
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <RegisterContainer>
      <RegisterWrapper>
        <RegisterHeader>
          <RegisterLogo>LangExchange</RegisterLogo>
          <RegisterSubtitle>Create your account</RegisterSubtitle>
        </RegisterHeader>

        <Card shadow="large">
          <RegisterForm onSubmit={formik.handleSubmit}>
            {error && <ErrorMessage>{error}</ErrorMessage>}

            <FormField
              label="Username"
              type="text"
              id="username"
              name="username"
              placeholder="Choose a username"
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.username && formik.errors.username}
              required
              disabled={loading}
            />

            <FormField
              label="Email"
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && formik.errors.email}
              required
              disabled={loading}
            />

            <FormField
              label="Password"
              type="password"
              id="password"
              name="password"
              placeholder="Create a password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && formik.errors.password}
              required
              disabled={loading}
            />

            <FormField
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.confirmPassword && formik.errors.confirmPassword}
              required
              disabled={loading}
            />

            <FormField
              label="Bio (optional)"
              type="textarea"
              id="bio"
              name="bio"
              placeholder="Tell us a bit about yourself"
              value={formik.values.bio}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.bio && formik.errors.bio}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </RegisterForm>
        </Card>

        <LoginLink>
          Already have an account? <Link to="/login">Sign in</Link>
        </LoginLink>
      </RegisterWrapper>
    </RegisterContainer>
  );
};

// Styled Components
const RegisterContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #F3F4F6;
`;

const RegisterWrapper = styled.div`
  width: 100%;
  max-width: 420px;
`;

const RegisterHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const RegisterLogo = styled.h1`
  color: var(--primary-color);
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const RegisterSubtitle = styled.p`
  color: var(--gray-600);
  font-size: 1rem;
`;

const RegisterForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const LoginLink = styled.p`
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--gray-600);

  a {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const ErrorMessage = styled.div`
  background-color: #FEE2E2;
  color: #DC2626;
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
`;

export default Register;
