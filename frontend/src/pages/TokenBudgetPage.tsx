import React, { useState, useEffect } from 'react';
import { Layout, Card, Row, Col, Typography, Button, Statistic, Progress } from 'antd';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { LexStatus } from '../types';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function TokenBudgetPage(): React.ReactElement {
  const { user, logout } = useAuth();
  const [status, setStatus] = useState<LexStatus | null>(null);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
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

  // Mock historical data - in real implementation, fetch from backend
  const historicalData = [
    { date: '02-01', used: 45000, limit: 100000 },
    { date: '02-02', used: 52000, limit: 100000 },
    { date: '02-03', used: 48000, limit: 100000 },
    { date: '02-04', used: 61000, limit: 100000 },
    { date: '02-05', used: 58000, limit: 100000 },
    { date: '02-06', used: 71000, limit: 100000 },
    { date: '02-07', used: status?.tokenBudget.used || 0, limit: 100000 },
  ];

  const usagePercent = status ? Math.round((status.tokenBudget.used / status.tokenBudget.dailyLimit) * 100) : 0;

  return (
    <Layout>
      <Header style={{ background: '#001529', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ color: 'white', margin: 0 }}>Lex Fleet Command</Title>
        <div>
          <Link to="/" style={{ color: 'white', marginRight: 24 }}>Dashboard</Link>
          <Link to="/projects" style={{ color: 'white', marginRight: 24 }}>Projects</Link>
          <Link to="/logs" style={{ color: 'white', marginRight: 24 }}>Logs</Link>
          <Text style={{ color: 'white', marginRight: 16 }}>{user?.username}</Text>
          <Button onClick={logout} size="small">Logout</Button>
        </div>
      </Header>
      <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
        <Title level={2}>Token Budget Management</Title>

        {status && (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Daily Limit"
                    value={status.tokenBudget.dailyLimit}
                    suffix="tokens"
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Used Today"
                    value={status.tokenBudget.used}
                    suffix="tokens"
                    valueStyle={{ color: usagePercent > 90 ? '#cf1322' : usagePercent > 70 ? '#faad14' : '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Remaining"
                    value={status.tokenBudget.remaining}
                    suffix="tokens"
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Reserved for Commander"
                    value={status.tokenBudget.reserved}
                    suffix="tokens"
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card title="Daily Usage Progress">
                  <Progress
                    percent={usagePercent}
                    status={usagePercent > 95 ? 'exception' : usagePercent > 80 ? 'active' : 'normal'}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': usagePercent > 90 ? '#f5222d' : '#87d068',
                    }}
                  />
                  <div style={{ marginTop: 16 }}>
                    <Text>Available for Autonomous Work: {status.tokenBudget.remaining - status.tokenBudget.reserved} tokens</Text>
                  </div>
                </Card>
              </Col>

              <Col span={24}>
                <Card title="7-Day Usage Trend">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="limit" stroke="#8884d8" fill="#8884d8" fillOpacity={0.1} name="Daily Limit" />
                      <Area type="monotone" dataKey="used" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} name="Tokens Used" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              </Col>

              <Col span={12}>
                <Card title="Usage Breakdown">
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Autonomous Operations: </Text>
                    <Text>{Math.round(status.tokenBudget.used * 0.7).toLocaleString()} tokens (70%)</Text>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Direct Commands: </Text>
                    <Text>{Math.round(status.tokenBudget.used * 0.2).toLocaleString()} tokens (20%)</Text>
                  </div>
                  <div>
                    <Text strong>Background Tasks: </Text>
                    <Text>{Math.round(status.tokenBudget.used * 0.1).toLocaleString()} tokens (10%)</Text>
                  </div>
                </Card>
              </Col>

              <Col span={12}>
                <Card title="Efficiency Metrics">
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Average Daily Usage: </Text>
                    <Text>56,000 tokens</Text>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Peak Usage Day: </Text>
                    <Text>71,000 tokens (02-06)</Text>
                  </div>
                  <div>
                    <Text strong>Projected End-of-Day: </Text>
                    <Text>{Math.round(status.tokenBudget.used * 1.2).toLocaleString()} tokens</Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Content>
    </Layout>
  );
}
