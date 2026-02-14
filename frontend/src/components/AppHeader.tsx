import React from 'react';
import { Layout, Typography } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

const { Header } = Layout;
const { Title } = Typography;

export const AppHeader: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/runners', label: 'Runners' },
    { path: '/projects', label: 'Projects' },
    { path: '/sessions', label: 'Sessions' },
    { path: '/metrics', label: 'Metrics' },
    { path: '/fleet-prs', label: 'Fleet PRs' },
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
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                color: 'white',
                marginRight: 24,
                fontWeight: isActive ? 'bold' : 'normal',
                textDecoration: isActive ? 'underline' : 'none',
              }}
            >
              {item.label}
            </Link>
          );
        })}
        <ThemeToggle />
      </div>
    </Header>
  );
};
