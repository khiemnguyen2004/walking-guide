import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

const languages = [
  { code: 'en', icon: 'en' },
  { code: 'vi', icon: '🇻🇳' },
  // Add more languages here
];

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  const switchLanguage = (code) => {
    setLanguage(code);
  };

  return (
    <LanguageContext.Provider value={{ language, switchLanguage, languages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
