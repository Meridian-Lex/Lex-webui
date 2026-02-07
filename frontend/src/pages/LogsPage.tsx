import React, { useState, useEffect } from 'react';
import { Layout, Card, List, Typography, Button, Select, Tag } from 'antd';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { LogEntry } from '../types';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function LogsPage(): React.ReactElement {
  const { user, logout } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<string>('');

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [level]);

  async function fetchLogs() {
    try {
      const params: any = { lines: 100 };
      if (level) params.level = level;

      const response = await api.get('/logs', { params });
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  }

  const levelColors: Record<string, string> = {
    info: 'blue',
    warning: 'orange',
    error: 'red',
  };

  return (
    <Layout>
      <Header style={{ background: '#001529', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ color: 'white', margin: 0 }}>Lex Fleet Command</Title>
        <div>
          <Link to="/" style={{ color: 'white', marginRight: 24 }}>Dashboard</Link>
          <Link to="/projects" style={{ color: 'white', marginRight: 24 }}>Projects</Link>
          <Link to="/config" style={{ color: 'white', marginRight: 24 }}>Configuration</Link>
          <Text style={{ color: 'white', marginRight: 16 }}>{user?.username}</Text>
          <Button onClick={logout} size="small">Logout</Button>
        </div>
      </Header>
      <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
        <Card
          title="Logs"
          extra={
            <Select
              style={{ width: 120 }}
              placeholder="Filter level"
              allowClear
              onChange={setLevel}
              value={level || undefined}
            >
              <Select.Option value="info">Info</Select.Option>
              <Select.Option value="warning">Warning</Select.Option>
              <Select.Option value="error">Error</Select.Option>
            </Select>
          }
        >
          <List
            dataSource={logs}
            loading={loading}
            renderItem={(log) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <div>
                      <Tag color={levelColors[log.level]}>{log.level.toUpperCase()}</Tag>
                      <Text type="secondary">{new Date(log.timestamp).toLocaleString()}</Text>
                    </div>
                  }
                  description={log.message}
                />
              </List.Item>
            )}
          />
        </Card>
      </Content>
    </Layout>
  );
}
