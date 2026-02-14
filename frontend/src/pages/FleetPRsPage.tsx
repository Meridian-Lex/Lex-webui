import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout, Table, Tag, Button, Space, Typography, Alert, Tooltip,
} from 'antd';
import { ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { fleetApi } from '../services/fleetService';
import { AppHeader } from '../components/AppHeader';
import type { FleetPR } from '../types/fleet';

const { Content } = Layout;
const { Title, Text } = Typography;

// Repos that are expected to have @LunarLaurus assigned on every PR
const REQUIRED_ASSIGNEE = 'LunarLaurus';

// Auto-refresh interval matching backend cache TTL
const REFRESH_INTERVAL_MS = 120_000;

function formatAge(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(ms / 60_000);
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(ms / 86_400_000);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

export default function FleetPRsPage(): React.ReactElement {
  const [prs, setPRs] = useState<FleetPR[]>([]);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPRs = useCallback(async (forceRefresh = false) => {
    try {
      const data = await fleetApi.listOpenPRs(forceRefresh);
      setPRs(data.prs ?? []);
      setCachedAt(data.cached_at);
      setError(null);
    } catch {
      setError('Failed to load fleet PRs from Stratavore. Is the daemon running?');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPRs();
    const interval = setInterval(() => fetchPRs(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchPRs]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchPRs(true);
  }

  const columns: ColumnsType<FleetPR> = [
    {
      title: 'Repo',
      dataIndex: 'repo',
      render: (repo: string, record: FleetPR) => {
        const hasRequired = record.assignees.includes(REQUIRED_ASSIGNEE);
        return (
          <Space size={4}>
            <Text code style={{ fontSize: 12 }}>{repo.replace('Meridian-Lex/', '')}</Text>
            {!hasRequired && (
              <Tooltip title={`@${REQUIRED_ASSIGNEE} not assigned`}>
                <Tag icon={<WarningOutlined />} color="warning" style={{ margin: 0 }}>
                  unassigned
                </Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
      sorter: (a, b) => a.repo.localeCompare(b.repo),
    },
    {
      title: '#',
      dataIndex: 'number',
      width: 70,
      render: (num: number, record: FleetPR) => (
        <a href={record.url} target="_blank" rel="noopener noreferrer">
          #{num}
        </a>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      render: (title: string, record: FleetPR) => (
        <Space size={4}>
          {record.draft && <Tag color="default">draft</Tag>}
          <a href={record.url} target="_blank" rel="noopener noreferrer">
            {title}
          </a>
        </Space>
      ),
    },
    {
      title: 'Author',
      dataIndex: 'author',
      width: 130,
    },
    {
      title: 'Age',
      dataIndex: 'created_at',
      width: 80,
      render: (d: string) => formatAge(d),
      sorter: (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
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
          <Title level={4} style={{ margin: 0 }}>Fleet PRs</Title>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={refreshing}
          >
            Refresh
          </Button>
        </Space>

        <Table<FleetPR>
          dataSource={prs}
          columns={columns}
          rowKey={(r) => `${r.repo}#${r.number}`}
          loading={loading}
          pagination={false}
          size="small"
          locale={{ emptyText: 'No open PRs across fleet.' }}
          rowClassName={(r) => (r.draft ? 'draft-row' : '')}
        />

        {cachedAt && (
          <Text type="secondary" style={{ marginTop: 8, display: 'block', fontSize: 12 }}>
            Last updated: {new Date(cachedAt).toLocaleString()} — auto-refreshes every 2 minutes
          </Text>
        )}
      </Content>
    </Layout>
  );
}
