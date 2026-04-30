import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

const LinkedInIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Footer = () => {
  return (
    <footer style={{ padding: '40px 10%', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '30px', backgroundColor: 'var(--bg-color)', position: 'relative', zIndex: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '30px' }}>

        <div style={{ flex: 1, minWidth: '250px' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Centre for Extended Reality</h3>
          <p style={{ color: 'var(--text-muted)' }}>Shaping the future of immersive computing through AR, VR, and mixed environments.</p>
        </div>

        <div style={{ flex: 1, minWidth: '200px' }}>
          <h4 style={{ marginBottom: '15px' }}>Contact Details</h4>
          <a href="mailto:kmandava@gitam.edu"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', marginBottom: '8px', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-color)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <Mail size={18} /> kmandava@gitam.edu
          </a>
          <a href="mailto:nmeesala@gitam.edu"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', marginBottom: '10px', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-color)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <Mail size={18} /> nmeesala@gitam.edu
          </a>
          <a href="https://www.linkedin.com/company/cxr-gitam/posts/?feedView=all"
            target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', marginBottom: '15px', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-color)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <LinkedInIcon size={18} /> CXR GITAM on LinkedIn
          </a>
          <Link to="/contact" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn-primary" style={{ display: 'inline-block', fontWeight: '600', textDecoration: 'none', padding: '10px 20px', marginTop: '5px' }}>
            Go to Contact Form &rarr;
          </Link>
        </div>

        <div style={{ flex: 1, minWidth: '200px' }}>
          <h4 style={{ marginBottom: '15px' }}>Socials</h4>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="https://www.instagram.com/cxr_gitam/?hl=en" target="_blank" rel="noreferrer" style={{ color: '#009988', transition: 'color 0.3s' }} title="Instagram">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="https://www.linkedin.com/company/cxr-gitam/posts/?feedView=all" target="_blank" rel="noreferrer" style={{ color: '#009988', transition: 'color 0.3s' }} title="LinkedIn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </a>
            <a href="https://www.whatsapp.com/channel/0029Va4ST5X6WaKkW7QDrI0v" target="_blank" rel="noreferrer" style={{ color: '#009988', transition: 'color 0.3s' }} title="Whatsapp">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            </a>
          </div>
        </div>

      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        © 2026 Centre for Extended Reality. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
