import React from 'react';
import styled from 'styled-components';

const Card = ({ children, padding = 'normal', shadow = 'normal', hoverable = false, ...rest }) => {
  return (
    <CardContainer padding={padding} shadow={shadow} hoverable={hoverable} {...rest}>
      {children}
    </CardContainer>
  );
};

const getPaddingSize = (size) => {
  switch (size) {
    case 'small':
      return '0.75rem';
    case 'normal':
      return '1.25rem';
    case 'large':
      return '2rem';
    case 'none':
      return '0';
    default:
      return '1.25rem';
  }
};

const getShadowSize = (size) => {
  switch (size) {
    case 'none':
      return 'none';
    case 'small':
      return '0 2px 4px rgba(0, 0, 0, 0.05)';
    case 'normal':
      return '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)';
    case 'large':
      return '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)';
    default:
      return '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)';
  }
};

const CardContainer = styled.div`
  background-color: #fff;
  border-radius: 0.5rem;
  padding: ${({ padding }) => getPaddingSize(padding)};
  box-shadow: ${({ shadow }) => getShadowSize(shadow)};
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  ${({ hoverable }) => hoverable && `
    &:hover {
      transform: translateY(-4px);
      box-shadow: ${getShadowSize('large')};
    }
  `}
`;

export default Card;
