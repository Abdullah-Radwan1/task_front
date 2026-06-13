import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import Feed from './components/Feed';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function App() {
  const [user, setUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Restore session from cookie on startup by calling /auth/me
  useEffect(() => {
    fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'include', // send the httpOnly cookie
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data?.user) {
          setUser(data.data.user);
        }
      })
      .catch(() => {
        // No valid session — remain logged out
      })
      .finally(() => {
        setInitialLoading(false);
      });
  }, []);

  // Called after a successful login/register (cookie is already set by backend)
  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // send cookie so backend can clear it
      });
    } catch (e) {
      console.warn('Backend logout failed', e);
    }
    setUser(null);
  };

  if (initialLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0b0f19',
        color: 'white'
      }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderTopColor: '#3b82f6' }}></div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {user ? (
        <>
          <Navbar user={user} onLogout={handleLogout} />
          <main className="main-content">
            <Feed user={user} apiBaseUrl={API_BASE_URL} />
          </main>
        </>
      ) : (
        <Auth onAuthSuccess={handleAuthSuccess} apiBaseUrl={API_BASE_URL} />
      )}
    </div>
  );
}
