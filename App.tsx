import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AccountInfo } from '@azure/msal-browser';
import HomePage from './components/HomePage';
import TeamLogin from './components/TeamLogin';
import TeamApp from './TeamApp';
import RequestApp from './RequestApp';
import RequesterRegister from './components/RequesterRegister';
import { User, TeamMember } from './types';
import { getMicrosoftAccount, loginWithMicrosoft, logoutFromMicrosoft, msalInstancePromise } from './services/authService';

export type RequesterProfile = User | AccountInfo;

type AppView = 'home' | 'teamLogin' | 'requesterRegister' | 'teamApp' | 'requesterApp';

const App: React.FC = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [view, setView] = useState<AppView>('home');
  const [currentUser, setCurrentUser] = useState<TeamMember | RequesterProfile | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Check for user session from localStorage for persistence
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        const user = JSON.parse(savedUser);

        // More robust check to differentiate user types
        // 1. Check if it's a TeamMember (they have an `avatar` property)
        if ('avatar' in user && 'name' in user && !('firstNameTh' in user)) {
            handleTeamLoginSuccess(user);
        } 
        // 2. Check if it's a Requester (MSAL accounts have `homeAccountId`, custom have `firstNameTh`)
        else if ('homeAccountId' in user || 'firstNameTh' in user) {
            handleRequesterLogin(user);
        }
    } else {
         // Fallback check for an active MSAL session if localStorage is empty
        msalInstancePromise.then(() => {
            const account = getMicrosoftAccount();
            if (account) {
                handleRequesterLogin(account);
            }
        });
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleTeamLoginSuccess = (user: TeamMember) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
    setView('teamApp');
  };
  
  const handleRequesterLogin = (user: RequesterProfile) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
    setView('requesterApp');
  };

  const handleMicrosoftLogin = async () => {
      const account = await loginWithMicrosoft();
      if(account) {
          handleRequesterLogin(account);
      }
  };

  const handleLogout = async () => {
    if (currentUser && 'homeAccountId' in currentUser) { // It's an MSAL account
        await logoutFromMicrosoft();
    }
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setView('home');
  };

  const handleProfileUpdate = (updatedProfile: RequesterProfile) => {
      setCurrentUser(updatedProfile);
      localStorage.setItem('currentUser', JSON.stringify(updatedProfile));
  };


  const renderContent = () => {
    switch (view) {
      case 'teamLogin':
        return <TeamLogin onLoginSuccess={handleTeamLoginSuccess} onBack={() => setView('home')} theme={theme} toggleTheme={toggleTheme} />;
      case 'teamApp':
        return <TeamApp currentUser={currentUser as TeamMember} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}/>;
      case 'requesterRegister':
        return <RequesterRegister onRegisterSuccess={handleRequesterLogin} onNavigateToLogin={() => setView('home')} theme={theme} toggleTheme={toggleTheme} />;
      case 'requesterApp':
        return <RequestApp currentUser={currentUser as RequesterProfile} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} onProfileUpdate={handleProfileUpdate} />;
      case 'home':
      default:
        return (
          <HomePage
            onTeamLogin={() => setView('teamLogin')}
            onCustomLoginSuccess={handleRequesterLogin}
            onMicrosoftLogin={handleMicrosoftLogin}
            onNavigateToRegister={() => setView('requesterRegister')}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        );
    }
  };

  return (
    <div className={`app-container ${theme}`}>
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f3f4f6; /* bg-gray-100 */
          background-image:
            radial-gradient(at 47% 33%, hsl(203.00, 0%, 100%) 0, transparent 59%),
            radial-gradient(at 82% 65%, hsl(218.00, 79%, 95%) 0, transparent 55%);
        }
        .dark .login-container {
          background-color: #111827; /* dark:bg-gray-900 */
           background-image:
            radial-gradient(at 47% 33%, hsl(220, 15%, 20%) 0, transparent 59%),
            radial-gradient(at 82% 65%, hsl(218.00, 29%, 15%) 0, transparent 55%);
        }
        .icon-interactive {
            transition: transform 0.2s ease-in-out, color 0.2s ease-in-out;
        }
        .icon-interactive:hover {
            transform: scale(1.1);
        }
        :root {
            --brand-primary: #2563eb;
            --brand-secondary: #f97316;
        }
      `}</style>
    </div>
  );
};

export default App;