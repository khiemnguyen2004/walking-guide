import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import '../css/LanguageSwitcher.css';
import usFlag from '../assets/flag-us.svg';
import vnFlag from '../assets/flag-vn.svg';

const flagMap = {
  en: usFlag,
  vi: vnFlag,
};
const labelMap = {
  en: 'English',
  vi: 'Tiếng Việt',
};

const LanguageSwitcher = () => {
  const { language, switchLanguage, languages } = useLanguage();
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = languages.find(l => l.code === language);

  return (
    <div className="language-switcher-dropdown" ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="lang-dropdown-btn"
        style={{
          background: 'none',
          border: 'none',
          borderRadius: 0,
          padding: 0,
          width: 38,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setOpen(o => !o)}
        aria-label={labelMap[language]}
      >
        <img
          src={flagMap[language]}
          alt={labelMap[language]}
          style={{ width: 28, height: 20, borderRadius: 3, objectFit: 'cover' }}
          onError={e => { e.target.onerror = null; e.target.src = 'https://upload.wikimedia.org/wikipedia/en/a/a4/Flag_of_the_United_States.svg'; }}
        />
      </button>
      {open && (
        <div
          className="lang-dropdown-menu"
          style={{
            position: 'absolute',
            top: 34,
            left: 0,
            background: '#fff',
            border: 'none',
            borderRadius: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            zIndex: 100,
            width: 35,
            padding: 0,
          }}
        >
          {languages.filter(l => l.code !== language).map(lang => (
            <button
              key={lang.code}
              className="lang-dropdown-item"
              style={{
                background: 'none',
                border: 'none',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: 4,
                cursor: 'pointer',
                borderRadius: 4,
                transition: 'background 0.2s',
              }}
              onClick={() => { switchLanguage(lang.code); setOpen(false); }}
              aria-label={labelMap[lang.code]}
            >
              <img
                src={flagMap[lang.code]}
                alt={labelMap[lang.code]}
                style={{ width: 28, height: 20, borderRadius: 3, objectFit: 'cover' }}
                onError={e => { e.target.onerror = null; e.target.src = 'https://upload.wikimedia.org/wikipedia/en/a/a4/Flag_of_the_United_States.svg'; }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
