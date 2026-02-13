import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout, Table, Tag, Button, Space, Typography,
  Modal, Form, Input, Select, Alert, Tooltip, Badge,
} from 'antd';
import {
  PlusOutlined, StopOutlined, ReloadOutlined, WarningOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { runnerApi } from '../services/stratavore.service';
import { AppHeader } from '../components/AppHeader';
import type { Runner, LaunchRunnerRequest } from '../types/stratavore';

const { Content } = Layout;
const { Title } = Typography;

const STATUS_COLOR: Record<string, string> = {
  running: 'success',
  paused: 'warning',
  terminated: 'default',
  failed: 'error',
  pending: 'processing',
};

export default function RunnersPage(): React.ReactElement {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [launchVisible, setLaunchVisible] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [stoppingId, setStoppingId] = useState<string | null>(null);
  const [form] = Form.useForm<LaunchRunnerRequest>();

  const fetchRunners = useCallback(async () => {
    try {
      const data = await runnerApi.listRunners();
      setRunners(data.runners ?? []);
      setError(null);
    } catch {
      setError('Failed to load runners from Stratavore daemon.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRunners();
    const interval = setInterval(fetchRunners, 5000);
    return () => clearInterval(interval);
  }, [fetchRunners]);

  async function handleStop(runnerId: string, force = false) {
    setStoppingId(runnerId);
    try {
      await runnerApi.stopRunner({ runnerId, force });
      await fetchRunners();
    } catch {
      setError(`Failed to stop runner ${runnerId}.`);
    } finally {
      setStoppingId(null);
    }
  }

  async function handleLaunch(values: LaunchRunnerRequest) {
    setLaunching(true);
    try {
      await runnerApi.launchRunner(values);
      setLaunchVisible(false);
      form.resetFields();
      await fetchRunners();
    } catch (err: any) {
      setError(err.message ?? 'Failed to launch runner.');
    } finally {
      setLaunching(false);
    }
  }

  const columns: ColumnsType<Runner> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 120,
      render: (id: string) => (
        <Tooltip title={id}>
          <code style={{ fontSize: 11 }}>{id.slice(0, 12)}...</code>
        </Tooltip>
      ),
    },
    {
      title: 'Project',
      dataIndex: 'projectName',
      sorter: (a, b) => a.projectName.localeCompare(b.projectName),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: string) => (
        <Badge
          status={status === 'running' ? 'processing' : status === 'failed' ? 'error' : 'default'}
          text={<Tag color={STATUS_COLOR[status] ?? 'default'}>{status.toUpperCase()}</Tag>}
        />
      ),
      filters: ['running', 'paused', 'terminated', 'failed'].map((s) => ({ text: s, value: s })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Mode',
      dataIndex: 'conversationMode',
      width: 100,
    },
    {
      title: 'Tokens',
      dataIndex: 'tokensUsed',
      render: (n: number) => n?.toLocaleString() ?? '—',
      sorter: (a, b) => a.tokensUsed - b.tokensUsed,
    },
    {
      title: 'CPU',
      dataIndex: 'cpuPercent',
      render: (n: number) => n ? `${n.toFixed(1)}%` : '—',
      width: 80,
    },
    {
      title: 'Memory',
      dataIndex: 'memoryMb',
      render: (n: number) => n ? `${n}M` : '—',
      width: 90,
    },
    {
      title: 'Restarts',
      dataIndex: 'restartAttempts',
      width: 80,
      render: (n: number) =>
        n > 0 ? (
          <Tag icon={<WarningOutlined />} color="warning">{n}</Tag>
        ) : (
          <span>0</span>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: Runner) => (
        <Space size="small">
          {(record.status === 'running' || record.status === 'paused') ? (
            <>
              <Button
                size="small"
                icon={<StopOutlined />}
                loading={stoppingId === record.id}
                onClick={() => handleStop(record.id)}
              >
                Stop
              </Button>
              <Tooltip title="Force kill (SIGKILL)">
                <Button
                  size="small"
                  danger
                  onClick={() => handleStop(record.id, true)}
                  loading={stoppingId === record.id}
                >
                  Kill
                </Button>
              </Tooltip>
            </>
          ) : null}
        </Space>
      ),
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
          <Title level={4} style={{ margin: 0 }}>Runners</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setLaunchVisible(true)}
          >
            Launch Runner
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchRunners} />
        </Space>

        <Table<Runner>
          dataSource={runners}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          size="small"
        />

        <Modal
          title="Launch Runner"
          open={launchVisible}
          onCancel={() => { setLaunchVisible(false); form.resetFields(); }}
          onOk={() => form.submit()}
          confirmLoading={launching}
          okText="Launch"
        >
          <Form form={form} layout="vertical" onFinish={handleLaunch}>
            <Form.Item
              name="projectName"
              label="Project Name"
              rules={[{ required: true, message: 'Project name is required' }]}
            >
              <Input placeholder="my-project" />
            </Form.Item>
            <Form.Item
              name="projectPath"
              label="Project Path"
              rules={[{ required: true, message: 'Project path is required' }]}
            >
              <Input placeholder="/home/meridian/meridian-home/projects/my-project" />
            </Form.Item>
            <Form.Item name="conversationMode" label="Conversation Mode" initialValue="new">
              <Select>
                <Select.Option value="new">New</Select.Option>
                <Select.Option value="continue">Continue</Select.Option>
                <Select.Option value="resume">Resume</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}
