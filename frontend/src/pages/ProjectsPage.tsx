import React, { useState, useEffect } from 'react';
import { Layout, Card, Table, Button } from 'antd';
import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import api from '../services/api';
import { Project } from '../types';

const { Content } = Layout;

export default function ProjectsPage(): React.ReactElement {
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
      <AppHeader />
      <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ marginBottom: 16 }}>
          <Link to="/projects/graph">
            <Button type="primary">View Project Graph</Button>
          </Link>
        </div>
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
