import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Row,
  Col,
  Button,
  Typography,
  Tag,
  Alert,
  Skeleton,
  Space,
  Divider,
  Statistic,
} from 'antd';
import {
  RocketOutlined,
  PauseOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import { LexStatus } from '../types';
import { TokenBudgetChart } from '../components/TokenBudgetChart';
import { AppHeader } from '../components/AppHeader';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function DashboardPage(): React.ReactElement {
  const [status, setStatus] = useState<LexStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modeChanging, setModeChanging] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchStatus() {
    try {
      const response = await api.get('/status');
      setStatus(response.data);
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setError('Failed to load status. Check connection to backend.');
    } finally {
      setLoading(false);
    }
  }

  async function changeMode(mode: string) {
    setModeChanging(true);
    try {
      await api.post('/status/mode', { mode });
      await fetchStatus();
    } catch (err) {
      console.error('Failed to change mode:', err);
      setError(`Failed to change mode to ${mode}. Check backend connection.`);
    } finally {
      setModeChanging(false);
    }
  }

  const modeColors: Record<string, string> = {
    IDLE: 'default',
    AUTONOMOUS: 'processing',
    DIRECTED: 'success',
    COLLABORATIVE: 'warning',
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'AUTONOMOUS':
        return <SyncOutlined spin />;
      case 'IDLE':
        return <PauseOutlined />;
      default:
        return <CheckCircleOutlined />;
    }
  };

  return (
    <Layout>
      <AppHeader />
      <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
        {error && (
          <Alert
            message="Status Error"
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title="Operational Status"
              extra={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <ClockCircleOutlined /> Updated {lastUpdate.toLocaleTimeString()}
                </Text>
              }
            >
              {loading && !status ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : status ? (
                <>
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div>
                      <Text type="secondary">Current Mode</Text>
                      <div style={{ marginTop: 8 }}>
                        <Tag
                          color={modeColors[status.mode]}
                          icon={getModeIcon(status.mode)}
                          style={{ fontSize: 16, padding: '4px 12px' }}
                        >
                          {status.mode}
                        </Tag>
                      </div>
                    </div>

                    <Divider style={{ margin: 0 }} />

                    <div>
                      <Text type="secondary">Active Project</Text>
                      <div style={{ marginTop: 8 }}>
                        <Text strong style={{ fontSize: 16 }}>
                          {status.currentProject || 'None'}
                        </Text>
                      </div>
                    </div>

                    <Divider style={{ margin: 0 }} />

                    <div>
                      <Text type="secondary">Mode Controls</Text>
                      <div style={{ marginTop: 12 }}>
                        <Space>
                          <Button
                            type="primary"
                            icon={<RocketOutlined />}
                            onClick={() => changeMode('AUTONOMOUS')}
                            loading={modeChanging}
                            disabled={status.mode === 'AUTONOMOUS'}
                          >
                            Start Autonomous
                          </Button>
                          <Button
                            icon={<PauseOutlined />}
                            onClick={() => changeMode('IDLE')}
                            loading={modeChanging}
                            disabled={status.mode === 'IDLE'}
                          >
                            Stop
                          </Button>
                        </Space>
                      </div>
                    </div>
                  </Space>
                </>
              ) : (
                <Alert
                  message="No Status Data"
                  description="Unable to load system status"
                  type="warning"
                />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Quick Stats">
              {loading && !status ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : status?.tokenBudget ? (
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="Tokens Used Today"
                      value={status.tokenBudget.used}
                      suffix={`/ ${status.tokenBudget.dailyLimit}`}
                      valueStyle={{
                        color:
                          status.tokenBudget.used / status.tokenBudget.dailyLimit > 0.9
                            ? '#ff4d4f'
                            : '#3f8600',
                      }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Remaining Budget"
                      value={status.tokenBudget.dailyLimit - status.tokenBudget.used}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                </Row>
              ) : (
                <Alert message="Token budget data unavailable" type="info" />
              )}
            </Card>
          </Col>
        </Row>

        <Title level={4} style={{ marginTop: 24, marginBottom: 16 }}>
          Token Budget Monitoring
        </Title>
        {status && status.tokenBudget ? (
          <TokenBudgetChart
            dailyLimit={status.tokenBudget.dailyLimit}
            todayUsage={status.tokenBudget.used}
            weekUsage={status.tokenBudget.weekUsage || status.tokenBudget.used}
            monthUsage={status.tokenBudget.monthUsage || status.tokenBudget.used}
            reservedForCommander={status.tokenBudget.reserved}
          />
        ) : (
          <Card>
            <Alert
              message="Token Budget Data Unavailable"
              description="Unable to load token budget charts. Check backend connection."
              type="warning"
            />
          </Card>
        )}
      </Content>
    </Layout>
  );
}
