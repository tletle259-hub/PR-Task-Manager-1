import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TeamApp from './TeamApp';
import RequestApp from './RequestApp';

const App: React.FC = () => {
  const [app, setApp] = useState<'team' | 'request'>('request');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  const goToTeamApp = () => setApp('team');
  const goToRequestApp = () => setApp('request');

  return (
    <AnimatePresence mode="wait">
      {app === 'team' && <TeamApp onBackToHome={goToRequestApp} theme={theme} toggleTheme={toggleTheme} />}
      {app === 'request' && <RequestApp onBackToHome={goToTeamApp} theme={theme} toggleTheme={toggleTheme} />}
    </AnimatePresence>
  );
};

export default App;