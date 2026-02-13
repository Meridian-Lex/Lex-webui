import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout, Card, Row, Col, Typography, Alert, Skeleton, Button, Space, Tooltip,
  Statistic,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { metricsApi } from '../services/stratavore.service';
import { AppHeader } from '../components/AppHeader';
import type { GlobalMetrics } from '../types/stratavore';

const { Content } = Layout;
const { Title } = Typography;

const REFRESH_INTERVAL_MS = 10000;

export default function MetricsPage(): React.ReactElement {
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await metricsApi.getMetrics();
      setMetrics(data);
      setError(null);
      setLastUpdated(new Date());
    } catch {
      setError('Failed to load fleet metrics from Stratavore daemon.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return (
    <Layout>
      <AppHeader />
      <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
        {error && (
          <Alert
            message="Metrics Unavailable"
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>Fleet Metrics</Title>
          </Col>
          <Col flex="auto" />
          <Col>
            <Space>
              <Tooltip title={`Last updated: ${lastUpdated.toLocaleTimeString()}`}>
                <Button icon={<ReloadOutlined />} onClick={fetchMetrics} size="small" />
              </Tooltip>
            </Space>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card>
              {loading && !metrics ? (
                <Skeleton active paragraph={false} />
              ) : (
                <Statistic
                  title="Active Runners"
                  value={metrics?.activeRunners ?? 0}
                />
              )}
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card>
              {loading && !metrics ? (
                <Skeleton active paragraph={false} />
              ) : (
                <Statistic
                  title="Active Projects"
                  value={metrics?.activeProjects ?? 0}
                />
              )}
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card>
              {loading && !metrics ? (
                <Skeleton active paragraph={false} />
              ) : (
                <Statistic
                  title="Total Sessions"
                  value={metrics?.totalSessions ?? 0}
                />
              )}
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={6}>
            <Card>
              {loading && !metrics ? (
                <Skeleton active paragraph={false} />
              ) : (
                <Statistic
                  title="Tokens Used"
                  value={metrics?.tokensUsed ?? 0}
                  formatter={(v) => Number(v).toLocaleString()}
                />
              )}
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={6}>
            <Card>
              {loading && !metrics ? (
                <Skeleton active paragraph={false} />
              ) : (
                <Statistic
                  title="Token Limit"
                  value={
                    metrics?.tokenLimit === 0 || metrics?.tokenLimit == null
                      ? 'Unlimited'
                      : metrics.tokenLimit
                  }
                  formatter={(v) =>
                    v === 'Unlimited' ? 'Unlimited' : Number(v).toLocaleString()
                  }
                />
              )}
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
