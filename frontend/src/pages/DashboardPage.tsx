import React, { useState, useEffect } from 'react';
import { Layout, Card, Row, Col, Button, Typography, Progress, Tag } from 'antd';
import { RocketOutlined, PauseOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { LexStatus } from '../types';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function DashboardPage(): React.ReactElement {
  const { user, logout } = useAuth();
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
      <Header style={{ background: '#001529', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ color: 'white', margin: 0 }}>Lex Fleet Command</Title>
        <div>
          <Link to="/projects" style={{ color: 'white', marginRight: 24 }}>Projects</Link>
          <Link to="/logs" style={{ color: 'white', marginRight: 24 }}>Logs</Link>
          <Link to="/config" style={{ color: 'white', marginRight: 24 }}>Configuration</Link>
          <Text style={{ color: 'white', marginRight: 16 }}>{user?.username}</Text>
          <Button onClick={logout} size="small">Logout</Button>
        </div>
      </Header>
      <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="Operational Status">
              {status ? (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Mode: </Text>
                    <Tag color={modeColors[status.mode]}>{status.mode}</Tag>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Current Project: </Text>
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
          <Col span={12}>
            <Card title="Token Budget">
              {status ? (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <Progress
                      percent={Math.round((status.tokenBudget.used / status.tokenBudget.dailyLimit) * 100)}
                      status="active"
                    />
                  </div>
                  <Row>
                    <Col span={12}>
                      <Text>Used: {status.tokenBudget.used.toLocaleString()}</Text>
                    </Col>
                    <Col span={12}>
                      <Text>Remaining: {status.tokenBudget.remaining.toLocaleString()}</Text>
                    </Col>
                  </Row>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">Daily Limit: {status.tokenBudget.dailyLimit.toLocaleString()}</Text>
                  </div>
                </>
              ) : (
                <Text>Loading...</Text>
              )}
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
