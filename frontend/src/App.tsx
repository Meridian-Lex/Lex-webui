import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import DashboardPage from './pages/DashboardPage';
import RunnersPage from './pages/RunnersPage';
import ProjectsPage from './pages/ProjectsPage';
import SessionsPage from './pages/SessionsPage';
import MetricsPage from './pages/MetricsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import FleetPRsPage from './pages/FleetPRsPage';

const { Content } = Layout;

function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <Layout style={{ minHeight: '100vh' }}>
        <Content>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/runners" element={<RunnersPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:name" element={<ProjectDetailPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/metrics" element={<MetricsPage />} />
            <Route path="/fleet-prs" element={<FleetPRsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
