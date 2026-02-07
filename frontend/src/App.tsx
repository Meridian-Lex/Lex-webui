import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import LogsPage from './pages/LogsPage';
import { useAuth } from './hooks/useAuth';

const { Content } = Layout;

function App(): React.ReactElement {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Layout style={{ minHeight: '100vh' }}>
        <Content>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
            <Route path="/" element={user ? <DashboardPage /> : <Navigate to="/login" />} />
            <Route path="/projects" element={user ? <ProjectsPage /> : <Navigate to="/login" />} />
            <Route path="/logs" element={user ? <LogsPage /> : <Navigate to="/login" />} />
          </Routes>
        </Content>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
