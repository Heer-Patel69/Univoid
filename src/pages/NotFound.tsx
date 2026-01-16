import { useEffect } from "react";

// CRITICAL: Minimal 404 page with no router dependencies
// Uses hard navigation for reliability on mobile
const NotFound = () => {
  useEffect(() => {
    // Safe logging that never throws
    try {
      console.error("404 Error: User attempted to access non-existent route:", window.location.pathname);
    } catch {
      // Silently fail
    }
  }, []);

  // Hard navigation function - works even if React Router is broken
  const handleGoHome = () => {
    try {
      window.location.href = '/';
    } catch {
      window.location.replace('/');
    }
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: '#fafafa',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <h1 
          style={{
            fontSize: '72px',
            fontWeight: '800',
            color: '#1f2937',
            marginBottom: '16px',
            lineHeight: '1',
          }}
        >
          404
        </h1>
        <p 
          style={{
            fontSize: '18px',
            color: '#6b7280',
            marginBottom: '24px',
          }}
        >
          Oops! Page not found
        </p>
        {/* Use anchor tag as fallback, with JS enhancement */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            handleGoHome();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '500',
            color: 'white',
            backgroundColor: '#3b82f6',
            borderRadius: '8px',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            pointerEvents: 'auto',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
