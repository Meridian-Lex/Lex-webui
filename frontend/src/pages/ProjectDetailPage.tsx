import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout, Typography, Alert, Descriptions, Tag, Button, Space,
  Skeleton, Popconfirm, Table,
} from 'antd';
import { DeleteOutlined, ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { projectApi, sessionApi } from '../services/stratavore.service';
import { AppHeader } from '../components/AppHeader';
import type { Project, Session } from '../types/stratavore';

const { Content } = Layout;
const { Title } = Typography;

export default function ProjectDetailPage(): React.ReactElement {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProject = useCallback(async () => {
    if (!name) return;
    setLoadingProject(true);
    try {
      const data = await projectApi.getProject(name);
      setProject(data);
      setError(null);
    } catch {
      setError(`Failed to load project "${name}".`);
    } finally {
      setLoadingProject(false);
    }
  }, [name]);

  const fetchSessions = useCallback(async () => {
    if (!name) return;
    setLoadingSessions(true);
    try {
      const data = await sessionApi.listSessions(name);
      setSessions(data);
    } catch {
      // Sessions may not exist yet — soft failure
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, [name]);

  useEffect(() => {
    fetchProject();
    fetchSessions();
  }, [fetchProject, fetchSessions]);

  async function handleDelete() {
    if (!name) return;
    setDeleting(true);
    try {
      await projectApi.deleteProject(name);
      navigate('/projects');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete project.';
      setError(message);
      setDeleting(false);
    }
  }

  const sessionColumns: ColumnsType<Session> = [
    {
      title: 'Session ID',
      dataIndex: 'id',
      render: (id: string) => (
        <span title={id} style={{ fontFamily: 'monospace', fontSize: 13 }}>
          {id.slice(0, 8)}
        </span>
      ),
    },
    {
      title: 'Started At',
      dataIndex: 'started_at',
      render: (ts: string) => ts ? new Date(ts).toLocaleString() : '—',
      sorter: (a, b) =>
        new Date(a.started_at || 0).getTime() - new Date(b.started_at || 0).getTime(),
    },
    {
      title: 'Ended At',
      dataIndex: 'ended_at',
      render: (ts?: string) =>
        ts ? new Date(ts).toLocaleString() : <Tag color="processing">Active</Tag>,
    },
    {
      title: 'Messages',
      dataIndex: 'message_count',
      sorter: (a, b) => a.message_count - b.message_count,
    },
    {
      title: 'Tokens Used',
      dataIndex: 'tokens_used',
      render: (n: number) => n?.toLocaleString() ?? '0',
      sorter: (a, b) => a.tokens_used - b.tokens_used,
    },
    {
      title: 'Resumable',
      dataIndex: 'resumable',
      render: (v: boolean) => (
        <Tag color={v ? 'success' : 'default'}>{v ? 'YES' : 'NO'}</Tag>
      ),
    },
    {
      title: 'Summary',
      dataIndex: 'summary',
      ellipsis: true,
      render: (text?: string) => text ?? '—',
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
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/projects')}
            size="small"
          >
            Projects
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            {name ?? ''}
          </Title>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchProject(); fetchSessions(); }} size="small" />
          <Popconfirm
            title="Delete project"
            description={`Permanently delete "${name}"? This cannot be undone.`}
            onConfirm={handleDelete}
            okText="Delete"
            okType="danger"
            cancelText="Cancel"
          >
            <Button
              icon={<DeleteOutlined />}
              danger
              loading={deleting}
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>

        {loadingProject ? (
          <Skeleton active />
        ) : project ? (
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, sm: 2, md: 2 }}
            style={{ marginBottom: 24 }}
          >
            <Descriptions.Item label="Name">{project.name}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag
                color={
                  project.status === 'active'
                    ? 'success'
                    : project.status === 'archived'
                    ? 'default'
                    : 'processing'
                }
              >
                {project.status?.toUpperCase() ?? 'UNKNOWN'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Path" span={2}>
              <span style={{ fontFamily: 'monospace' }}>{project.path}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {project.description || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Tags">
              {project.tags?.length
                ? project.tags.map((t) => <Tag key={t}>{t}</Tag>)
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Active Runners">
              {project.activeRunners} / {project.totalRunners}
            </Descriptions.Item>
            <Descriptions.Item label="Total Sessions">
              {project.totalSessions}
            </Descriptions.Item>
            <Descriptions.Item label="Total Tokens">
              {project.totalTokens?.toLocaleString() ?? '0'}
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {project.createdAt ? new Date(project.createdAt).toLocaleString() : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Last Accessed">
              {project.lastAccessedAt
                ? new Date(project.lastAccessedAt).toLocaleString()
                : '—'}
            </Descriptions.Item>
          </Descriptions>
        ) : null}

        <Title level={5} style={{ marginBottom: 12 }}>Sessions</Title>
        <Table<Session>
          dataSource={sessions}
          columns={sessionColumns}
          rowKey="id"
          loading={loadingSessions}
          pagination={{ pageSize: 20 }}
          size="small"
        />
      </Content>
    </Layout>
  );
}
