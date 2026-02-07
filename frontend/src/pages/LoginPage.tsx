import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import LoginForm from '../components/auth/LoginForm';
import FirstRunSetup from '../components/auth/FirstRunSetup';
import { authService } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage(): React.ReactElement {
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkFirstRun();
  }, []);

  async function checkFirstRun() {
    try {
      const { setupNeeded } = await authService.checkSetupNeeded();
      setIsFirstRun(setupNeeded);
    } catch (error) {
      // On error, assume not first run (safer default)
      console.error('Failed to check setup status:', error);
      setIsFirstRun(false);
    }
  }

  async function handleLogin(username: string, password: string) {
    await login(username, password);
    navigate('/');
  }

  function handleSetupComplete() {
    setIsFirstRun(false);
  }

  if (isFirstRun === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#001529' }}>
      <div style={{ background: '#141414', padding: 40, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
        {isFirstRun ? (
          <FirstRunSetup onComplete={handleSetupComplete} />
        ) : (
          <LoginForm onLogin={handleLogin} />
        )}
      </div>
    </div>
  );
}
