import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Table,
  Button,
  Tag,
  Alert,
  Space,
  Typography,
  Descriptions,
  Input,
} from 'antd';
import {
  FolderOutlined,
  SearchOutlined,
  ShareAltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import api from '../services/api';
import { Project } from '../types';

const { Content } = Layout;
const { Text } = Typography;

export default function ProjectsPage(): React.ReactElement {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchProjects() {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.projects);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to load projects. Check connection to backend.');
    } finally {
      setLoading(false);
    }
  }

  const filteredProjects = projects.filter(
    (project) =>
      searchQuery === '' ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircleOutlined />;
      case 'in progress':
        return <ClockCircleOutlined />;
      case 'paused':
        return <PauseCircleOutlined />;
      default:
        return <FolderOutlined />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'in progress':
        return 'processing';
      case 'paused':
        return 'warning';
      case 'complete':
        return 'default';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <FolderOutlined />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Path',
      dataIndex: 'path',
      key: 'path',
      render: (path: string) => (
        <Text code style={{ fontSize: 12 }}>
          {path}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
      filters: Array.from(new Set(projects.map((p) => p.status))).map((status) => ({
        text: status,
        value: status,
      })),
      onFilter: (value: string | number | boolean, record: Project) =>
        record.status === value,
    },
    {
      title: 'Relationships',
      dataIndex: 'relationships',
      key: 'relationships',
      render: (relationships: string[]) =>
        relationships && relationships.length > 0 ? (
          <Space size="small" wrap>
            {relationships.map((rel, idx) => (
              <Tag key={idx} icon={<ShareAltOutlined />}>
                {rel}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">None</Text>
        ),
    },
  ];

  const expandedRowRender = (project: Project) => (
    <Descriptions column={2} size="small" bordered>
      <Descriptions.Item label="Full Path">{project.path}</Descriptions.Item>
      <Descriptions.Item label="Status">{project.status}</Descriptions.Item>
      {project.description && (
        <Descriptions.Item label="Description" span={2}>
          {project.description}
        </Descriptions.Item>
      )}
      {project.technologies && project.technologies.length > 0 && (
        <Descriptions.Item label="Technologies" span={2}>
          <Space size="small" wrap>
            {project.technologies.map((tech, idx) => (
              <Tag key={idx}>{tech}</Tag>
            ))}
          </Space>
        </Descriptions.Item>
      )}
      {project.relationships && project.relationships.length > 0 && (
        <Descriptions.Item label="Related Projects" span={2}>
          {project.relationships.join(', ')}
        </Descriptions.Item>
      )}
    </Descriptions>
  );

  return (
    <Layout>
      <AppHeader />
      <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
        {error && (
          <Alert
            message="Error Loading Projects"
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Card
          title="Projects"
          extra={
            <Space>
              <Input
                placeholder="Search projects..."
                prefix={<SearchOutlined />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
                style={{ width: 250 }}
              />
              <Link to="/projects/graph">
                <Button type="primary" icon={<ShareAltOutlined />}>
                  View Graph
                </Button>
              </Link>
            </Space>
          }
        >
          <Table
            dataSource={filteredProjects}
            columns={columns}
            loading={loading}
            rowKey="name"
            expandable={{
              expandedRowRender,
              rowExpandable: (record) =>
                Boolean(
                  record.description ||
                    (record.technologies && record.technologies.length > 0) ||
                    (record.relationships && record.relationships.length > 0)
                ),
            }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} projects`,
            }}
          />
        </Card>
      </Content>
    </Layout>
  );
}
