import React from 'react';
import { Layout, Typography, Button } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';

const { Header } = Layout;
const { Title, Text } = Typography;

export const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/projects', label: 'Projects' },
    { path: '/tasks', label: 'Tasks' },
    { path: '/logs', label: 'Logs' },
    { path: '/config', label: 'Configuration' },
  ];

  return (
    <Header
      style={{
        background: '#001529',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Title level={3} style={{ color: 'white', margin: 0 }}>
        Lex Fleet Command
      </Title>
      <div>
        {navItems.map((item) => {
          // Don't show link to current page
          if (location.pathname === item.path ||
              (item.path === '/projects' && location.pathname.startsWith('/projects'))) {
            return null;
          }
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{ color: 'white', marginRight: 24 }}
            >
              {item.label}
            </Link>
          );
        })}
        <ThemeToggle />
        <Text style={{ color: 'white', marginRight: 16 }}>{user?.username}</Text>
        <Button onClick={logout} size="small">
          Logout
        </Button>
      </div>
    </Header>
  );
};
