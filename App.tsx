import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AccountInfo } from '@azure/msal-browser';
import HomePage from './components/HomePage';
import TeamLogin from './components/TeamLogin';
import TeamApp from './TeamApp';
import RequestApp from './RequestApp';
import RequesterRegister from './components/RequesterRegister';
import MicrosoftOnboarding from './components/MicrosoftOnboarding';
import { User, TeamMember } from './types';
import { getMicrosoftAccount, loginWithMicrosoft, logoutFromMicrosoft, msalInstancePromise } from './services/authService';
import { getUserByMsalAccountId, createUser } from './services/userService';

export type RequesterProfile = User | AccountInfo;

type AppView = 'home' | 'teamLogin' | 'requesterRegister' | 'teamApp' | 'requesterApp';

const App: React.FC = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [view, setView] = useState<AppView>('home');
  const [currentUser, setCurrentUser] = useState<TeamMember | RequesterProfile | null>(null);
  const [onboardingMsalAccount, setOnboardingMsalAccount] = useState<AccountInfo | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        if ('avatar' in user && 'name' in user && !('firstNameTh' in user)) {
            handleTeamLoginSuccess(user);
        } 
        else if ('homeAccountId' in user || 'firstNameTh' in user) {
             handleRequesterLogin(user);
        }
    } else {
        msalInstancePromise.then(async () => {
            const account = getMicrosoftAccount();
            if (account) {
                const userProfile = await getUserByMsalAccountId(account.homeAccountId);
                if (userProfile) {
                    handleRequesterLogin(userProfile);
                } else {
                    setOnboardingMsalAccount(account);
                }
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
          const existingUser = await getUserByMsalAccountId(account.homeAccountId);
          if (existingUser) {
              handleRequesterLogin(existingUser);
          } else {
              setOnboardingMsalAccount(account);
          }
      }
  };
  
  const handleOnboardingComplete = async (profileData: Omit<User, 'id' | 'password' | 'msalAccountId' | 'username' | 'email'>) => {
    if (!onboardingMsalAccount) return;

    try {
        const fullUserData: Omit<User, 'id'> = {
            ...profileData,
            msalAccountId: onboardingMsalAccount.homeAccountId,
            username: onboardingMsalAccount.username,
            email: onboardingMsalAccount.username,
        };
        const newUserId = await createUser(fullUserData); 
        const newUser: User = { id: newUserId, ...fullUserData };
        setOnboardingMsalAccount(null);
        handleRequesterLogin(newUser);
    } catch (error) {
        console.error("Failed to complete onboarding:", error);
    }
  };

  const handleLogout = async () => {
    const isMsal = currentUser && (('msalAccountId' in currentUser && currentUser.msalAccountId) || ('homeAccountId' in currentUser));
    if (isMsal) {
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
      <AnimatePresence>
        {onboardingMsalAccount && (
            <MicrosoftOnboarding 
                msalAccount={onboardingMsalAccount}
                onComplete={handleOnboardingComplete}
                onCancel={() => setOnboardingMsalAccount(null)}
            />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;