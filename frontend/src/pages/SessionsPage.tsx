import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout, Table, Typography, Alert, Tag, Select, Space, Button, Empty,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { sessionApi, projectApi } from '../services/stratavore.service';
import { AppHeader } from '../components/AppHeader';
import type { Session, Project } from '../types/stratavore';

const { Content } = Layout;
const { Title } = Typography;

export default function SessionsPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectParam = searchParams.get('project') ?? '';

  const [sessions, setSessions] = useState<Session[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await projectApi.listProjects();
      setProjects(data);
    } catch {
      setError('Failed to load project list.');
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const fetchSessions = useCallback(async (project: string) => {
    if (!project) return;
    setLoadingSessions(true);
    try {
      const data = await sessionApi.listSessions(project);
      setSessions(data);
      setError(null);
    } catch {
      setError(`Failed to load sessions for project "${project}".`);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (projectParam) {
      fetchSessions(projectParam);
    } else {
      setSessions([]);
    }
  }, [projectParam, fetchSessions]);

  function handleProjectChange(value: string) {
    setSearchParams(value ? { project: value } : {});
  }

  const columns: ColumnsType<Session> = [
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
      title: 'Project',
      dataIndex: 'project_name',
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
          <Title level={4} style={{ margin: 0 }}>Sessions</Title>
          <Select
            showSearch
            placeholder="Select a project"
            style={{ width: 260 }}
            loading={loadingProjects}
            value={projectParam || undefined}
            onChange={handleProjectChange}
            allowClear
            filterOption={(input, option) =>
              String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {projects.map((p) => (
              <Select.Option key={p.name} value={p.name}>
                {p.name}
              </Select.Option>
            ))}
          </Select>
          {projectParam && (
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchSessions(projectParam)}
              disabled={loadingSessions}
            />
          )}
        </Space>

        {!projectParam ? (
          <Empty description="Select a project to view its sessions." />
        ) : (
          <Table<Session>
            dataSource={sessions}
            columns={columns}
            rowKey="id"
            loading={loadingSessions}
            pagination={{ pageSize: 25 }}
            size="small"
          />
        )}
      </Content>
    </Layout>
  );
}
