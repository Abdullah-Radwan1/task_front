import React from 'react';
import { LogOut, Share2 } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  if (!user) return null;

  // Get initials for the avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="navbar">
      <div className="nav-brand">
        <Share2 size={24} style={{ color: '#3b82f6' }} />
        <span>SocialCircle</span>
      </div>
      
      <div className="nav-user-panel">
        <div className="user-avatar" title={user.email}>
          {getInitials(user.name)}
        </div>
        <span className="user-name">{user.name}</span>
        
        <button 
          onClick={onLogout}
          className="btn-icon" 
          title="Sign Out"
          aria-label="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
