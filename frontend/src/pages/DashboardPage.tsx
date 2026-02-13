import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout, Card, Row, Col, Typography, Tag, Alert,
  Skeleton, Statistic, Button, Space, Tooltip,
} from 'antd';
import {
  CheckCircleOutlined, WarningOutlined, SyncOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { statusApi } from '../services/stratavore.service';
import { AppHeader } from '../components/AppHeader';
import type { StatusResponse } from '../types/stratavore';

const { Content } = Layout;
const { Title, Text } = Typography;

const POLL_INTERVAL_MS = 5000;

export default function DashboardPage(): React.ReactElement {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStatus = useCallback(async () => {
    try {
      const data = await statusApi.getStatus();
      setStatus(data);
      setError(null);
      setLastUpdated(new Date());
    } catch {
      setError('Cannot reach Stratavore daemon. Check that stratavored is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  async function handleReconcile() {
    setReconciling(true);
    try {
      const result = await statusApi.triggerReconcile();
      await fetchStatus();
      if (result.failedRunnerIds?.length) {
        setError(`Reconciliation found ${result.failedRunnerIds.length} failed runner(s).`);
      }
    } catch {
      setError('Reconciliation failed.');
    } finally {
      setReconciling(false);
    }
  }

  const tokenPct = status && status.metrics.tokenLimit > 0
    ? (status.metrics.tokensUsed / status.metrics.tokenLimit) * 100
    : 0;
  const tokenColor = tokenPct > 90 ? '#ff4d4f' : tokenPct > 70 ? '#faad14' : '#52c41a';

  return (
    <Layout>
      <AppHeader />
      <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
        {error && (
          <Alert
            message="Connection Error"
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>Stratavore Control Plane</Title>
          </Col>
          <Col>
            {loading && !status ? (
              <Skeleton.Button active size="small" />
            ) : (
              <Tag
                icon={status?.daemon.healthy ? <CheckCircleOutlined /> : <WarningOutlined />}
                color={status?.daemon.healthy ? 'success' : 'error'}
              >
                {status?.daemon.healthy ? 'HEALTHY' : 'UNHEALTHY'}
              </Tag>
            )}
          </Col>
          <Col>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {status ? `v${status.daemon.version} — ${status.daemon.hostname}` : ''}
            </Text>
          </Col>
          <Col flex="auto" />
          <Col>
            <Space>
              <Tooltip title="Trigger reconciliation — cleans up stale runners">
                <Button
                  icon={<SyncOutlined spin={reconciling} />}
                  onClick={handleReconcile}
                  loading={reconciling}
                  size="small"
                >
                  Reconcile
                </Button>
              </Tooltip>
              <Tooltip title={`Last updated: ${lastUpdated.toLocaleTimeString()}`}>
                <Button icon={<ReloadOutlined />} onClick={fetchStatus} size="small" />
              </Tooltip>
            </Space>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card>
              {loading && !status ? (
                <Skeleton active paragraph={false} />
              ) : (
                <Statistic title="Active Runners" value={status?.metrics.activeRunners ?? 0} />
              )}
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              {loading && !status ? (
                <Skeleton active paragraph={false} />
              ) : (
                <Statistic title="Active Projects" value={status?.metrics.activeProjects ?? 0} />
              )}
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              {loading && !status ? (
                <Skeleton active paragraph={false} />
              ) : (
                <Statistic title="Total Sessions" value={status?.metrics.totalSessions ?? 0} />
              )}
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              {loading && !status ? (
                <Skeleton active paragraph={false} />
              ) : (
                <Statistic
                  title="Tokens Used"
                  value={status?.metrics.tokensUsed ?? 0}
                  suffix={status?.metrics.tokenLimit ? `/ ${status.metrics.tokenLimit.toLocaleString()}` : ''}
                  valueStyle={{ color: tokenColor }}
                />
              )}
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
