import React, { useState, useEffect } from 'react';
import { Layout, Card, Row, Col, Button, Typography, Tag } from 'antd';
import { RocketOutlined, PauseOutlined } from '@ant-design/icons';
import api from '../services/api';
import { LexStatus } from '../types';
import { TokenBudgetChart } from '../components/TokenBudgetChart';
import { AppHeader } from '../components/AppHeader';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function DashboardPage(): React.ReactElement {
  const [status, setStatus] = useState<LexStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchStatus() {
    try {
      const response = await api.get('/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  }

  async function changeMode(mode: string) {
    setLoading(true);
    try {
      await api.post('/status/mode', { mode });
      await fetchStatus();
    } catch (error) {
      console.error('Failed to change mode:', error);
    } finally {
      setLoading(false);
    }
  }

  const modeColors: Record<string, string> = {
    IDLE: 'default',
    AUTONOMOUS: 'processing',
    DIRECTED: 'success',
    COLLABORATIVE: 'warning',
  };

  return (
    <Layout>
      <AppHeader />
      <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="Operational Status">
              {status ? (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Mode: </Text>
                    <Tag color={modeColors[status.mode]}>{status.mode}</Tag>
                    <Text strong style={{ marginLeft: 24 }}>Current Project: </Text>
                    <Text>{status.currentProject || 'None'}</Text>
                  </div>
                  <div>
                    <Button
                      type="primary"
                      icon={<RocketOutlined />}
                      onClick={() => changeMode('AUTONOMOUS')}
                      loading={loading}
                      disabled={status.mode === 'AUTONOMOUS'}
                      style={{ marginRight: 8 }}
                    >
                      Start Autonomous
                    </Button>
                    <Button
                      icon={<PauseOutlined />}
                      onClick={() => changeMode('IDLE')}
                      loading={loading}
                      disabled={status.mode === 'IDLE'}
                    >
                      Stop
                    </Button>
                  </div>
                </>
              ) : (
                <Text>Loading...</Text>
              )}
            </Card>
          </Col>
        </Row>

        <Title level={4} style={{ marginTop: 24, marginBottom: 16 }}>
          Token Budget Monitoring
        </Title>
        {status && status.tokenBudget && (
          <TokenBudgetChart
            dailyLimit={status.tokenBudget.dailyLimit}
            todayUsage={status.tokenBudget.used}
            weekUsage={status.tokenBudget.weekUsage || status.tokenBudget.used}
            monthUsage={status.tokenBudget.monthUsage || status.tokenBudget.used}
            reservedForCommander={status.tokenBudget.reserved}
          />
        )}
      </Content>
    </Layout>
  );
}
