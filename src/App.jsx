import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
const socket = io(SOCKET_URL);

// --- Contexts ---
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', jwtToken);
    showToast(`Welcome back, ${userData.username}!`);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    showToast('Logged out successfully.', 'info');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, showToast }}>
      {children}
      {toast && (
        <div className={`toast toast-${toast.type} animate-slide-up`}>
          {toast.message}
        </div>
      )}
    </AuthContext.Provider>
  );
};

// --- Icons ---
const Icons = {
  Home: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="26" fill="currentColor"><g><path d="M12 1.696L.622 8.807l1.06 1.696L3 9.679V19.5C3 20.881 4.119 22 5.5 22h13c1.381 0 2.5-1.119 2.5-2.5V9.679l1.318.824 1.06-1.696L12 1.696zM12 16.5c-1.933 0-3.5-1.567-3.5-3.5s1.567-3.5 3.5-3.5 3.5 1.567 3.5 3.5-1.567 3.5-3.5 3.5z"></path></g></svg>,
  Explore: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="26" fill="currentColor"><g><path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"></path></g></svg>,
  Notifications: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="26" fill="currentColor"><g><path d="M21.697 16.468c-.02-.016-2.14-1.64-2.103-6.03.02-2.532-.812-4.782-2.347-6.335C15.872 2.707 14.028 2 12 2s-3.872.707-5.247 2.103c-1.535 1.553-2.367 3.803-2.346 6.335.037 4.39-2.083 6.015-2.103 6.03-.133.107-.21.267-.21.432v2.585c0 .553.448 1.015 1 1.015h17.812c.552 0 1-.462 1-1.015v-2.585c0-.165-.077-.325-.21-.432zm-18.01 2.016v-1.1c1.558-1.503 2.92-3.834 2.894-6.852-.016-2.085.645-3.882 1.865-5.117C9.367 4.473 10.638 3.5 12 3.5s2.633.973 3.554 1.916c1.22 1.235 1.88 3.032 1.865 5.117-.026 3.018 1.336 5.349 2.894 6.852v1.1H3.687zM15 21.5c0 1.657-1.343 3-3 3s-3-1.343-3-3h6z"></path></g></svg>,
  Messages: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="26" fill="currentColor"><g><path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 3.638 8-3.636V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-8 3.636-8-3.638V18.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-8.037z"></path></g></svg>,
  Lists: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="26" fill="currentColor"><g><path d="M3 4.5h10.5v2H3v-2zm0 6h18.5v2H3v-2zm0 6h18.5v2H3v-2z"></path></g></svg>,
  Bookmarks: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="26" fill="currentColor"><g><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z"></path></g></svg>,
  Communities: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="26" fill="currentColor"><g><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-2.5-11.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0zm6.5 2.5h-8c-1.103 0-2 .897-2 2v2h12v-2c0-1.103-.897-2-2-2z"></path></g></svg>,
  Premium: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="26" fill="currentColor"><g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g></svg>,
  Profile: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="26" fill="currentColor"><g><path d="M12 11.816c1.355 0 2.872-.15 3.84-1.256.814-.93 1.078-2.368.805-4.392-.38-2.825-2.117-4.512-4.645-4.512S7.735 3.343 7.355 6.168c-.273 2.024-.01 3.462.805 4.392.968 1.106 2.485 1.256 3.84 1.256zm-3.16-5.46c.216-1.613 1.196-2.7 3.16-2.7s2.944 1.087 3.16 2.7c.18 1.332-.016 2.222-.43 2.697-.482.55-1.42.72-2.73.72s-2.248-.17-2.73-.72c-.414-.475-.61-1.365-.43-2.697zM20.25 21.5c0-.986-.547-1.854-1.36-2.378-1.536-.983-3.52-1.492-6.89-1.492s-5.354.51-6.89 1.492c-.813.524-1.36 1.392-1.36 2.378H2.25c0-1.686 1.084-3.174 2.65-4.175 1.832-1.173 4.103-1.745 7.1-1.745s5.268.572 7.1 1.745c1.566 1.001 2.65 2.489 2.65 4.175h-1.5z"></path></g></svg>,
  More: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="26" fill="currentColor"><g><path d="M12 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm7 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM5 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"></path></g></svg>,
  Comment: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="18" fill="currentColor"><g><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path></g></svg>,
  Repost: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="18" fill="currentColor"><g><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path></g></svg>,
  Heart: ({ filled }) => <svg viewBox="0 0 24 24" aria-hidden="true" width="18" fill={filled ? "#f91880" : "currentColor"}><g><path d={filled ? "M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" : "M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"}></path></g></svg>,
  Share: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="18" fill="currentColor"><g><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"></path></g></svg>,
  Analytics: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="18" fill="currentColor"><g><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"></path></g></svg>,
  ActionBookmark: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="18" fill="currentColor"><g><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z"></path></g></svg>,
  Image: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="20" fill="var(--brand-blue)"><g><path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"></path></g></svg>,
  Gif: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="20" fill="var(--brand-blue)"><g><path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v13c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-13c0-.276-.224-.5-.5-.5h-13zM7 14.5c0-.828.672-1.5 1.5-1.5H10v-2H8.5V9.5h3V11h-1.5v2H11v1.5H8.5c-1.657 0-3-1.343-3-3V9.5c0-1.657 1.343-3 3-3h3V8H8.5c-.828 0-1.5.672-1.5 1.5v3c0 .828.672 1.5 1.5 1.5H11v2H8.5c-1.657 0-3-1.343-3-3zm4.5-5h1.5v5H11.5v-5zm3.5 0h3V11h-1.5v3h-1.5V9.5z"></path></g></svg>,
  Poll: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="20" fill="var(--brand-blue)"><g><path d="M19 4H5C3.343 4 2 5.343 2 7v10c0 1.657 1.343 3 3 3h14c1.657 0 3-1.343 3-3V7c0-1.657-1.343-3-3-3zm1 10c0 .552-.448 1-1 1H5c-.552 0-1-.448-1-1V7c0-.552.448-1 1-1h14c.552 0 1 .448 1 1v10zm-3-5h-3c-.552 0-1 .448-1 1v4c0 .552.448 1 1 1h3c.552 0 1-.448 1-1v-4c0-.552-.448-1-1-1zm-1 4h-1v-2h1v2zm-6-2H7c-.552 0-1 .448-1 1v2c0 .552.448 1 1 1h3c.552 0 1-.448 1-1v-2c0-.552-.448-1-1-1zm-1 2H8v-2h1v2z"></path></g></svg>,
  Emoji: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="20" fill="var(--brand-blue)"><g><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm3.5-10.5c0 .828-.672 1.5-1.5 1.5s-1.5-.672-1.5-1.5S13.172 8 14 8s1.5.672 1.5 1.5zm-5 0c0 .828-.672 1.5-1.5 1.5S6 11.328 6 10.5 6.672 9 7.5 9s1.5.672 1.5 1.5zm1.25 4.542c-1.362 0-2.617.584-3.513 1.564-.325.356-.299.907.057 1.232.355.324.907.299 1.231-.057.564-.617 1.353-1 2.225-1s1.662.383 2.226 1c.325.355.875.381 1.231.057.356-.325.382-.876.057-1.232-.897-.98-2.152-1.564-3.514-1.564z"></path></g></svg>,
  Schedule: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="20" fill="var(--brand-blue)"><g><path d="M14 6V3h2v3h4c1.1 0 2 .9 2 2v13c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h4V3h2v3h4zm6 4H4v11h16V10zm-9 3v4c0 .55-.45 1-1 1s-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1zm5 0v4c0 .55-.45 1-1 1s-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1z"></path></g></svg>,
  Location: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="20" fill="var(--brand-blue)"><g><path d="M12 2C7.589 2 4 5.589 4 9.995 3.971 16.44 11.696 21.784 12 22c0 0 8.029-5.56 8-12.005C20 5.589 16.411 2 12 2zm0 17.582C9.516 17.387 6 12.87 6 9.995 6 6.69 8.691 4 12 4s6 2.691 6 5.995c0 2.875-3.516 7.392-6 9.587zM12 7.5c-1.378 0-2.5 1.121-2.5 2.5s1.122 2.5 2.5 2.5 2.5-1.121 2.5-2.5-1.122-2.5-2.5-2.5zm0 3.5c-.552 0-1-.449-1-1s.448-1 1-1 1 .449 1 1-.448 1-1 1z"></path></g></svg>
};

// --- Left Sidebar ---
const LeftSidebar = ({ onShowAuth }) => {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="sidebar-left">
      <div className="sidebar-left-inner">
        <Link to="/" className="sidebar-logo">
          Linked<span className="logo-accent">Out</span>
        </Link>
        
        <nav className="sidebar-nav">
          <Link to="/" className="nav-item">
            <Icons.Home />
            <span>Home</span>
          </Link>
          <Link to="/" className="nav-item">
            <Icons.Explore />
            <span>Explore</span>
          </Link>
          <Link to="/" className="nav-item">
            <Icons.Notifications />
            <span>Notifications</span>
          </Link>
          <Link to="/" className="nav-item">
            <Icons.Messages />
            <span>Messages</span>
          </Link>
          <Link to="/" className="nav-item">
            <Icons.Lists />
            <span>Lists</span>
          </Link>
          <Link to="/" className="nav-item">
            <Icons.Bookmarks />
            <span>Bookmarks</span>
          </Link>
          <Link to="/" className="nav-item">
            <Icons.Communities />
            <span>Communities</span>
          </Link>
          <Link to="/" className="nav-item">
            <Icons.Premium />
            <span>Premium</span>
          </Link>
          <Link to="/" className="nav-item">
            <Icons.Profile />
            <span>Profile</span>
          </Link>
          <Link to="/" className="nav-item">
            <Icons.More />
            <span>More</span>
          </Link>
          
          <button className="btn btn-primary btn-post" onClick={() => {
            const form = document.getElementById('submit-form');
            if (form) {
               form.scrollIntoView({ behavior: 'smooth' });
               document.getElementById('post-textarea').focus();
            } else {
               onShowAuth('login');
            }
          }}>
            Expose
          </button>
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <div className="user-menu" onClick={() => {
              if (window.confirm("Logout of LinkedOut?")) logout();
            }}>
              <div className="avatar">{user.username.charAt(0).toUpperCase()}</div>
              <div className="user-details-nav">
                <span className="fullname">{user.username}</span>
                <span className="handle">@{user.username}</span>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <button className="btn btn-outline" onClick={() => onShowAuth('login')}>Log In</button>
              <button className="btn btn-primary" onClick={() => onShowAuth('register')}>Sign Up</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// --- Modals & Auth ---
const AuthModal = ({ type: initialType, onClose }) => {
  const [type, setType] = useState(initialType);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = type === 'login' ? '/auth/login' : '/auth/register';
    
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
        onClose();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="logo" style={{ justifyContent: 'center', marginBottom: '1rem', fontSize: '2rem' }}>
            Linked<span className="logo-accent">Out</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{type === 'login' ? 'Welcome Back' : 'Join the Resistance'}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {type === 'login' ? 'Sign in to amplify stories and post your own.' : 'Your identity remains protected. Always.'}
          </p>
        </div>
        
        {error && <div className="error-msg animate-fade-in">{error}</div>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <button 
            type="button"
            className="btn btn-outline" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }} 
            onClick={() => {
              // Mock Google Login for demo purposes
              const randomNum = Math.floor(Math.random() * 9000) + 1000;
              login({ id: 9999, username: `GoogleUser_${randomNum}` }, 'mock-google-token-123');
              onClose();
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
          
          <div className="divider">
            <span>or use email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input className="form-control" type="text" placeholder="Choose an alias..." value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginBottom: '1.5rem', padding: '1rem' }} type="submit">
            {type === 'login' ? 'Login to LinkedOut' : 'Create Secure Account'}
          </button>
          
          <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {type === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              onClick={() => { setType(type === 'login' ? 'register' : 'login'); setError(''); }} 
              style={{ background: 'none', color: 'var(--brand-blue)', textDecoration: 'underline', fontWeight: 'bold' }}
            >
              {type === 'login' ? 'Sign Up' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Feed & Posts ---
const SubmitForm = () => {
  const { user, token, showToast } = useContext(AuthContext);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company || !content || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ company, role, content, is_anonymous: isAnonymous })
      });
      showToast("Story published securely!");
      setCompany('');
      setRole('');
      setContent('');
    } catch (error) {
      console.error("Error submitting post:", error);
      showToast("Failed to publish story.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="submit-form" className="submit-tweet-box">
      <div className="submit-avatar">
        {user ? user.username.charAt(0).toUpperCase() : 'A'}
      </div>
      <form onSubmit={handleSubmit} className="submit-form-inner">
        <textarea 
          id="post-textarea"
          className="composer-input" 
          placeholder="What's toxic at work?" 
          value={content}
          onChange={e => setContent(e.target.value)}
          required
        ></textarea>
        
        <div className="composer-metadata">
          <input type="text" className="composer-meta-input" placeholder="Company Name (Required)" value={company} onChange={e => setCompany(e.target.value)} required />
          <input type="text" className="composer-meta-input" placeholder="Your Role (Optional)" value={role} onChange={e => setRole(e.target.value)} />
        </div>
        
        <div className="composer-footer">
          <div className="composer-toolbar" style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}>
            <div title="Media"><Icons.Image /></div>
            <div title="GIF"><Icons.Gif /></div>
            <div title="Poll"><Icons.Poll /></div>
            <div title="Emoji"><Icons.Emoji /></div>
            <div title="Schedule"><Icons.Schedule /></div>
            <div title="Location"><Icons.Location /></div>
          </div>
          
          <div className="composer-options" style={{ marginLeft: 'auto', marginRight: '16px' }}>
            <label className="anon-toggle">
              <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
              <span>Post Anonymously</span>
            </label>
          </div>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || !content || !company} style={{ padding: '0.4rem 1rem' }}>
            {isSubmitting ? 'Posting...' : 'Expose'}
          </button>
        </div>
      </form>
    </div>
  );
};

const FeedItem = ({ post }) => {
  const { user, token, showToast } = useContext(AuthContext);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);

  const isRepost = !!post.repost_id;
  const displayName = post.is_anonymous ? post.author : (post.real_username || post.author);
  const handle = `@${displayName.toLowerCase().replace(/\s/g, '')}`;

  const handleLike = async (e) => {
    e.stopPropagation();
    if (liked) return;
    setLiked(true);
    setLikesCount(prev => prev + 1);
    try {
      await fetch(`${API_URL}/posts/${post.id}/like`, { method: 'POST' });
    } catch (error) {
      setLiked(false);
      setLikesCount(prev => prev - 1);
    }
  };

  const handleRepost = async (e) => {
    e.stopPropagation();
    if (!user) {
      showToast("You must be logged in to amplify stories!", "error");
      return;
    }
    if (window.confirm(`Amplify this story about ${post.company}?`)) {
      try {
        await fetch(`${API_URL}/posts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            repost_id: isRepost ? post.repost_id : post.id,
            is_anonymous: false
          })
        });
        showToast("Story amplified!");
      } catch (err) {
        console.error("Failed to repost", err);
        showToast("Failed to amplify.", "error");
      }
    }
  };

  return (
    <article className="tweet-card animate-fade-in">
      {isRepost && (
        <div className="tweet-context">
          <Icons.Repost />
          <span>{displayName} amplified this</span>
        </div>
      )}
      
      <div className="tweet-body">
        <div className="tweet-avatar">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="tweet-content-area">
          <div className="tweet-header">
            <span className="tweet-display-name">{displayName}</span>
            <span className="tweet-handle">{handle}</span>
            <span className="tweet-dot">·</span>
            <Link to={`/company/${encodeURIComponent(post.company)}`} className="tweet-company-tag">
              #{post.company.replace(/\s/g, '')}
            </Link>
          </div>
          
          {post.role && <div className="tweet-role">{post.role}</div>}
          
          <div className="tweet-text">
            {isRepost ? (
               <div className="quoted-tweet">
                  <div className="tweet-header">
                    <span className="tweet-company-tag">#{post.company.replace(/\s/g, '')}</span>
                  </div>
                  <div className="tweet-text" style={{ fontStyle: 'italic', marginTop: '0.5rem' }}>
                    "See original exposé..."
                  </div>
               </div>
            ) : (
               post.content
            )}
          </div>
          
          <div className="tweet-actions">
            <button className="tweet-action-btn action-reply" title="Reply">
              <div className="icon-bg"><Icons.Comment /></div>
            </button>
            <button className="tweet-action-btn action-repost" onClick={handleRepost} title="Amplify">
              <div className="icon-bg"><Icons.Repost /></div>
            </button>
            <button className={`tweet-action-btn action-like ${liked ? 'liked' : ''}`} onClick={handleLike} disabled={liked} title="Like">
              <div className="icon-bg"><Icons.Heart filled={liked} /></div>
              {likesCount > 0 && <span className="action-count">{likesCount}</span>}
            </button>
            <button className="tweet-action-btn action-share" title="View Analytics">
              <div className="icon-bg"><Icons.Analytics /></div>
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="tweet-action-btn action-share" title="Bookmark">
                <div className="icon-bg"><Icons.ActionBookmark /></div>
              </button>
              <button className="tweet-action-btn action-share" title="Share">
                <div className="icon-bg"><Icons.Share /></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

// --- Right Sidebar ---
const RightSidebar = ({ posts }) => {
  const leaderboard = useMemo(() => {
    const counts = {};
    posts.forEach(post => {
      if (post.company) {
        counts[post.company] = (counts[post.company] || 0) + 1;
      }
    });
    
    return Object.entries(counts)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [posts]);

  return (
    <aside className="sidebar-right">
      <div className="sidebar-right-inner">
        <div className="search-box">
          <svg viewBox="0 0 24 24" aria-hidden="true" width="18" fill="currentColor" style={{ marginLeft: '12px' }}><g><path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z"></path></g></svg>
          <input type="text" placeholder="Search companies..." />
        </div>

        {leaderboard.length > 0 && (
          <div className="trends-card animate-fade-in">
            <h2 className="trends-title">Trending Toxic</h2>
            <ul className="trends-list">
              {leaderboard.map((company, index) => (
                <li key={company.name} className="trend-item">
                  <div className="trend-meta">{index + 1} · Technology</div>
                  <Link to={`/company/${encodeURIComponent(company.name)}`} className="trend-name">
                    {company.name}
                  </Link>
                  <div className="trend-count">{company.score} exposés</div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="trends-card animate-fade-in">
          <h2 className="trends-title">Who to follow</h2>
          <ul className="trends-list">
            <li className="trend-item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div className="avatar">W</div>
                <div className="user-details-nav">
                  <span className="fullname">Whistleblower</span>
                  <span className="handle">@anon_truth</span>
                </div>
              </div>
              <button className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>Follow</button>
            </li>
            <li className="trend-item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div className="avatar">J</div>
                <div className="user-details-nav">
                  <span className="fullname">Journalist</span>
                  <span className="handle">@expose_news</span>
                </div>
              </div>
              <button className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>Follow</button>
            </li>
          </ul>
        </div>

        <div className="trends-footer">
          <span>Terms of Service</span>
          <span>Privacy Policy</span>
          <span>Cookie Policy</span>
          <span>© 2026 LinkedOut</span>
        </div>
      </div>
    </aside>
  );
};

// --- Pages ---

const Home = ({ posts }) => (
  <main className="feed-column">
    <div className="feed-header-sticky">
      <h2>For you</h2>
    </div>
    
    <SubmitForm />
    
    <div className="feed-list">
      {posts.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No exposés yet.</div>
      ) : (
        posts.map(post => <FeedItem key={post.id} post={post} />)
      )}
    </div>
  </main>
);

const CompanyPage = () => {
  const { companyName } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/posts/company/${encodeURIComponent(companyName)}`)
      .then(res => res.json())
      .then(data => setPosts(data));
  }, [companyName]);

  return (
    <main className="feed-column animate-fade-in">
      <div className="feed-header-sticky" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button onClick={() => navigate(-1)} className="back-btn">
          <svg viewBox="0 0 24 24" aria-hidden="true" width="20" fill="currentColor"><g><path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"></path></g></svg>
        </button>
        <div>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{companyName}</h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{posts.length} exposés</div>
        </div>
      </div>
      
      <div className="feed-list">
        {posts.map(post => <FeedItem key={post.id} post={post} />)}
      </div>
    </main>
  );
};

// --- App Container ---

function AppContent() {
  const [authModal, setAuthModal] = useState(null); // 'login' or 'register'
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/posts`)
      .then(res => res.json())
      .then(data => setPosts(data));

    socket.on('new_post', (newPost) => {
      setPosts(prev => [newPost, ...prev]);
    });

    return () => socket.off('new_post');
  }, []);

  return (
    <Router>
      <div className="twitter-layout">
        <LeftSidebar onShowAuth={setAuthModal} />
        
        {authModal && <AuthModal type={authModal} onClose={() => setAuthModal(null)} />}
        
        <Routes>
          <Route path="/" element={<Home posts={posts} />} />
          <Route path="/company/:companyName" element={<CompanyPage />} />
        </Routes>

        <RightSidebar posts={posts} />
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
