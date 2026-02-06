import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import LoginForm from '../components/auth/LoginForm';
import FirstRunSetup from '../components/auth/FirstRunSetup';
import { authService } from '../services/auth.service';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage(): React.ReactElement {
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkFirstRun();
  }, []);

  async function checkFirstRun() {
    try {
      // Try to get current user - if it works, not first run
      await authService.me();
      setIsFirstRun(false);
    } catch (error: any) {
      // If we get 401, try setup endpoint to see if it's available
      if (error.response?.status === 401) {
        // Assume first run if no users exist
        // The setup endpoint will return 403 if users already exist
        setIsFirstRun(true);
      }
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
