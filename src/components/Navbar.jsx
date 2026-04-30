import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      width: '100%',
      padding: '15px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 50,
      backgroundColor: '#007367',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#fff'
    }}>
      <h2 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
        <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: '15px' }}>
          <img src="/CXR.png" alt="CXR" style={{ height: '56px', objectFit: 'contain' }} />
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem', fontWeight: 300, userSelect: 'none' }}>X</span>
          <img src="/image.png" alt="GITAM" style={{ height: '48px', objectFit: 'contain' }} />
        </Link>
      </h2>

      <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
        <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={linkStyle}>Home</Link>
        <a href="/#mission-section" style={linkStyle}>Mission & Vision</a>
        <a href="/#work-section" style={linkStyle}>Field of Work</a>
        <a href="/#projects-section" style={linkStyle}>Projects</a>
        <a href="/#announcements-section" style={linkStyle}>Announcements</a>
        <Link to="/tutorials" style={linkStyle}>🎬 Tutorials</Link>
        <Link to="/quizzes" style={linkStyle}>📝 Quizzes</Link>
        <Link to="/contact" style={linkStyle}>Contact Us</Link>

        <div
          style={{ position: 'relative' }}
          onMouseEnter={() => setDropdownOpen(true)}
          onMouseLeave={() => setDropdownOpen(false)}
        >
          <button style={{ ...linkStyle, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            More <ChevronDown size={16} />
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: '10px 0',
              borderRadius: '8px',
              minWidth: '200px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}>
              <Link to="/request" style={dropdownLinkStyle}>Request Form</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const linkStyle = {
  color: '#fff',
  textDecoration: 'none',
  fontWeight: '500',
  fontSize: '1rem',
  transition: 'opacity 0.2s',
  opacity: 0.9
};

const dropdownLinkStyle = {
  color: '#fff',
  textDecoration: 'none',
  padding: '10px 20px',
  transition: 'background-color 0.2s',
  display: 'block'
};

export default Navbar;
