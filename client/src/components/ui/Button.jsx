import React from 'react';
import styled, { css } from 'styled-components';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  ...rest
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      type={type}
      onClick={onClick}
      {...rest}
    >
      {children}
    </StyledButton>
  );
};

const getVariantStyles = (variant) => {
  switch (variant) {
    case 'primary':
      return css`
        background-color: var(--primary-color);
        color: white;
        border: none;

        &:hover:not(:disabled) {
          background-color: var(--primary-dark);
        }
      `;
    case 'secondary':
      return css`
        background-color: white;
        color: var(--primary-color);
        border: 1px solid var(--primary-color);

        &:hover:not(:disabled) {
          background-color: var(--gray-100);
        }
      `;
    case 'danger':
      return css`
        background-color: var(--danger-color);
        color: white;
        border: none;

        &:hover:not(:disabled) {
          background-color: #DC2626;
        }
      `;
    case 'success':
      return css`
        background-color: var(--success-color);
        color: white;
        border: none;

        &:hover:not(:disabled) {
          background-color: #059669;
        }
      `;
    default:
      return css`
        background-color: var(--primary-color);
        color: white;
        border: none;

        &:hover:not(:disabled) {
          background-color: var(--primary-dark);
        }
      `;
  }
};

const getSizeStyles = (size) => {
  switch (size) {
    case 'small':
      return css`
        padding: 6px 12px;
        font-size: 0.875rem;
      `;
    case 'medium':
      return css`
        padding: 8px 16px;
        font-size: 1rem;
      `;
    case 'large':
      return css`
        padding: 12px 24px;
        font-size: 1.125rem;
      `;
    default:
      return css`
        padding: 8px 16px;
        font-size: 1rem;
      `;
  }
};

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--font-sans);

  ${({ variant }) => getVariantStyles(variant)}
  ${({ size }) => getSizeStyles(size)}
  ${({ fullWidth }) => fullWidth && css`
    width: 100%;
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:focus {
    outline: 2px solid var(--primary-light);
    outline-offset: 2px;
  }
`;

export default Button;
