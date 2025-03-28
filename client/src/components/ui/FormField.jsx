import React from 'react';
import styled from 'styled-components';

const FormField = ({
  label,
  type = 'text',
  id,
  name,
  value,
  placeholder,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  ...rest
}) => {
  return (
    <FormFieldContainer>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <RequiredMark>*</RequiredMark>}
        </Label>
      )}

      {type === 'textarea' ? (
        <TextArea
          id={id}
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          hasError={!!error}
          {...rest}
        />
      ) : (
        <Input
          type={type}
          id={id}
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          hasError={!!error}
          {...rest}
        />
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}
    </FormFieldContainer>
  );
};

const FormFieldContainer = styled.div`
  margin-bottom: 1.25rem;
  width: 100%;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-700);
`;

const RequiredMark = styled.span`
  color: var(--danger-color);
  margin-left: 2px;
`;

const inputStyles = `
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--gray-300);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: var(--gray-900);
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px var(--primary-light);
  }

  &:disabled {
    background-color: var(--gray-100);
    cursor: not-allowed;
  }

  &::placeholder {
    color: var(--gray-400);
  }
`;

const Input = styled.input`
  ${inputStyles}
  height: 2.5rem;

  ${({ hasError }) => hasError && `
    border-color: var(--danger-color);

    &:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
    }
  `}
`;

const TextArea = styled.textarea`
  ${inputStyles}
  min-height: 6rem;
  resize: vertical;

  ${({ hasError }) => hasError && `
    border-color: var(--danger-color);

    &:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
    }
  `}
`;

const ErrorMessage = styled.div`
  color: var(--danger-color);
  font-size: 0.75rem;
  margin-top: 0.25rem;
`;

export default FormField;
