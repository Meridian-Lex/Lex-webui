import React, { useState, useEffect } from 'react';
import { Layout, Card, Table, Typography, Button } from 'antd';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Project } from '../types';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function ProjectsPage(): React.ReactElement {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchProjects() {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.projects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Path',
      dataIndex: 'path',
      key: 'path',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Relationships',
      dataIndex: 'relationships',
      key: 'relationships',
      render: (relationships: string[]) => relationships.join(', ') || 'None',
    },
  ];

  return (
    <Layout>
      <Header style={{ background: '#001529', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ color: 'white', margin: 0 }}>Lex Fleet Command</Title>
        <div>
          <Link to="/" style={{ color: 'white', marginRight: 24 }}>Dashboard</Link>
          <Link to="/tasks" style={{ color: 'white', marginRight: 24 }}>Tasks</Link>
          <Link to="/logs" style={{ color: 'white', marginRight: 24 }}>Logs</Link>
          <Link to="/config" style={{ color: 'white', marginRight: 24 }}>Configuration</Link>
          <Text style={{ color: 'white', marginRight: 16 }}>{user?.username}</Text>
          <Button onClick={logout} size="small">Logout</Button>
        </div>
      </Header>
      <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
        <Card title="Projects">
          <Table
            dataSource={projects}
            columns={columns}
            loading={loading}
            rowKey="name"
          />
        </Card>
      </Content>
    </Layout>
  );
}
