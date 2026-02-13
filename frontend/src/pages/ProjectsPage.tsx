import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout, Table, Button, Space, Typography,
  Modal, Form, Input, Alert, Tag,
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { projectApi } from '../services/stratavore.service';
import { AppHeader } from '../components/AppHeader';
import type { Project, CreateProjectRequest } from '../types/stratavore';

const { Content } = Layout;
const { Title } = Typography;

export default function ProjectsPage(): React.ReactElement {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createVisible, setCreateVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm<CreateProjectRequest>();

  const fetchProjects = useCallback(async () => {
    try {
      const data = await projectApi.listProjects();
      setProjects(data);
      setError(null);
    } catch {
      setError('Failed to load projects from Stratavore daemon.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function handleCreate(values: CreateProjectRequest) {
    setCreating(true);
    try {
      await projectApi.createProject(values);
      setCreateVisible(false);
      form.resetFields();
      await fetchProjects();
    } catch (err: any) {
      setError(err.message ?? 'Failed to create project.');
    } finally {
      setCreating(false);
    }
  }

  const columns: ColumnsType<Project> = [
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : status === 'archived' ? 'default' : 'processing'}>
          {status?.toUpperCase() ?? 'UNKNOWN'}
        </Tag>
      ),
    },
    {
      title: 'Active Runners',
      dataIndex: 'activeRunners',
      sorter: (a, b) => a.activeRunners - b.activeRunners,
    },
    {
      title: 'Total Sessions',
      dataIndex: 'totalSessions',
      sorter: (a, b) => a.totalSessions - b.totalSessions,
    },
    {
      title: 'Total Tokens',
      dataIndex: 'totalTokens',
      render: (n: number) => n?.toLocaleString() ?? '0',
      sorter: (a, b) => a.totalTokens - b.totalTokens,
    },
    {
      title: 'Last Accessed',
      dataIndex: 'lastAccessedAt',
      render: (ts: string) => ts ? new Date(ts).toLocaleString() : '—',
      sorter: (a, b) =>
        new Date(a.lastAccessedAt || 0).getTime() - new Date(b.lastAccessedAt || 0).getTime(),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      ellipsis: true,
    },
  ];

  return (
    <Layout>
      <AppHeader />
      <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
        {error && (
          <Alert
            message={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Space style={{ marginBottom: 16 }} align="center">
          <Title level={4} style={{ margin: 0 }}>Projects</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateVisible(true)}
          >
            New Project
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchProjects} />
        </Space>

        <Table<Project>
          dataSource={projects}
          columns={columns}
          rowKey="name"
          loading={loading}
          pagination={{ pageSize: 20 }}
          size="small"
        />

        <Modal
          title="Create Project"
          open={createVisible}
          onCancel={() => { setCreateVisible(false); form.resetFields(); }}
          onOk={() => form.submit()}
          confirmLoading={creating}
          okText="Create"
        >
          <Form form={form} layout="vertical" onFinish={handleCreate}>
            <Form.Item
              name="name"
              label="Project Name"
              rules={[
                { required: true, message: 'Name is required' },
                { pattern: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers, hyphens only' },
              ]}
            >
              <Input placeholder="my-project" />
            </Form.Item>
            <Form.Item
              name="path"
              label="Project Path"
              rules={[{ required: true, message: 'Path is required' }]}
            >
              <Input placeholder="/home/meridian/meridian-home/projects/my-project" />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}
