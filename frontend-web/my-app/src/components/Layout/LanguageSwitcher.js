// src/components/Layout/LanguageSwitcher.js
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const isHebrew = currentLang === 'he';
  const newLang = isHebrew ? 'en' : 'he';

  const changeLanguage = () => {
    i18n.changeLanguage(newLang);
  };

  return (
    // הוספת קלאס ייעודי לעיצוב
    <button onClick={changeLanguage} className="language-toggle-btn">
      <span className={isHebrew ? '' : 'active-lang'}>EN</span>
      <span className="separator">|</span>
      <span className={isHebrew ? 'active-lang' : ''}>עב</span>
    </button>
  );
}
export default LanguageSwitcher;