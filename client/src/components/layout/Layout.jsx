import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaHome, FaComments, FaUser, FaLanguage, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import styled from 'styled-components';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <LayoutContainer>
      {/* Mobile Menu Toggle */}
      <MobileMenuToggle onClick={toggleMobileMenu}>
        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
      </MobileMenuToggle>

      {/* Sidebar Navigation */}
      <Sidebar className={mobileMenuOpen ? 'active' : ''}>
        <SidebarHeader>
          <Logo>LangExchange</Logo>
        </SidebarHeader>

        <UserInfo>
          <UserAvatar
            src={user?.avatar || 'https://via.placeholder.com/50'}
            alt={`${user?.name}'s avatar`}
          />
          <UserName>{user?.name}</UserName>
        </UserInfo>

        <NavItems>
          <NavItem>
            <StyledNavLink to="/" onClick={closeMobileMenu}>
              <FaHome />
              <span>Home</span>
            </StyledNavLink>
          </NavItem>
          <NavItem>
            <StyledNavLink to="/chat" onClick={closeMobileMenu}>
              <FaComments />
              <span>Messages</span>
            </StyledNavLink>
          </NavItem>
          <NavItem>
            <StyledNavLink to="/profile" onClick={closeMobileMenu}>
              <FaUser />
              <span>Profile</span>
            </StyledNavLink>
          </NavItem>
          <NavItem>
            <StyledNavLink to="/languages" onClick={closeMobileMenu}>
              <FaLanguage />
              <span>Languages</span>
            </StyledNavLink>
          </NavItem>
        </NavItems>

        <LogoutButton onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </LogoutButton>
      </Sidebar>

      {/* Main Content */}
      <MainContent>
        <Outlet />
      </MainContent>

      {/* Overlay for mobile */}
      {mobileMenuOpen && <Overlay onClick={closeMobileMenu} />}
    </LayoutContainer>
  );
};

// Styled Components
const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  position: relative;
`;

const Sidebar = styled.nav`
  width: 250px;
  background-color: #fff;
  height: 100vh;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--gray-200);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  transition: transform 0.3s ease;

  @media (max-width: 768px) {
    position: fixed;
    transform: translateX(-100%);

    &.active {
      transform: translateX(0);
    }
  }
`;

const SidebarHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid var(--gray-200);
`;

const Logo = styled.h1`
  color: var(--primary-color);
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--gray-200);
`;

const UserAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 10px;
`;

const UserName = styled.h3`
  font-size: 0.9rem;
  margin: 0;
  color: var(--gray-800);
`;

const NavItems = styled.ul`
  list-style: none;
  padding: 20px 0;
  flex: 1;
`;

const NavItem = styled.li`
  margin-bottom: 5px;
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: var(--gray-700);
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background-color: var(--gray-100);
    color: var(--primary-color);
    text-decoration: none;
  }

  &.active {
    background-color: var(--gray-100);
    color: var(--primary-color);
    border-left: 3px solid var(--primary-color);
  }

  svg {
    margin-right: 10px;
    font-size: 1.2rem;
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: none;
  border: none;
  color: var(--gray-700);
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-size: 1rem;
  margin-bottom: 20px;

  &:hover {
    background-color: var(--gray-100);
    color: var(--danger-color);
  }

  svg {
    margin-right: 10px;
    font-size: 1.2rem;
  }
`;

const MainContent = styled.main`
  flex: 1;
  overflow-y: auto;
  background-color: #FAFAFA;
  display: flex;
  flex-direction: column;
`;

const MobileMenuToggle = styled.button`
  position: fixed;
  top: 15px;
  left: 15px;
  z-index: 1001;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  display: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    display: flex;
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

export default Layout;
