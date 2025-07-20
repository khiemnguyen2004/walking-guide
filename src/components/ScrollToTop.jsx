import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  // Show button when scrolled down
  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {visible && (
        <button
          onClick={handleClick}
          aria-label="Scroll to top"
          style={{
            position: 'fixed',
            right: 22,
            bottom: 80,
            zIndex: 9999,
            background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: 48,
            height: 48,
            boxShadow: '0 4px 16px rgba(52,152,219,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
        >
          <i className="bi bi-arrow-up" />
        </button>
      )}
    </>
  );
}

export default ScrollToTop; 