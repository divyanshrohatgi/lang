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

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required')
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);

      try {
        const result = await login(values.email, values.password);

        if (result.success) {
          navigate('/');
        } else {
          setError(result.error || 'Login failed. Please try again.');
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <LoginContainer>
      <LoginWrapper>
        <LoginHeader>
          <LoginLogo>LangExchange</LoginLogo>
          <LoginSubtitle>Sign in to your account</LoginSubtitle>
        </LoginHeader>

        <Card shadow="large">
          <LoginForm onSubmit={formik.handleSubmit}>
            {error && <ErrorMessage>{error}</ErrorMessage>}

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
              placeholder="Enter your password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && formik.errors.password}
              required
              disabled={loading}
            />

            <ForgotPassword>
              <Link to="/forgot-password">Forgot password?</Link>
            </ForgotPassword>

            <Button
              type="submit"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </LoginForm>
        </Card>

        <RegisterLink>
          Don't have an account? <Link to="/register">Sign up</Link>
        </RegisterLink>
      </LoginWrapper>
    </LoginContainer>
  );
};

// Styled Components
const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #F3F4F6;
`;

const LoginWrapper = styled.div`
  width: 100%;
  max-width: 420px;
`;

const LoginHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const LoginLogo = styled.h1`
  color: var(--primary-color);
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const LoginSubtitle = styled.p`
  color: var(--gray-600);
  font-size: 1rem;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ForgotPassword = styled.div`
  text-align: right;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;

  a {
    color: var(--primary-color);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const RegisterLink = styled.p`
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

export default Login;
