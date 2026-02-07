import React, { useState, useEffect, useRef } from 'react';
import {
  Layout,
  Card,
  List,
  Typography,
  Select,
  Tag,
  Alert,
  Space,
  Input,
  Switch,
  InputNumber,
  Skeleton,
  Empty,
} from 'antd';
import {
  InfoCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { AppHeader } from '../components/AppHeader';
import api from '../services/api';
import { LogEntry } from '../types';

const { Content } = Layout;
const { Text } = Typography;

export default function LogsPage(): React.ReactElement {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(false);
  const [lineLimit, setLineLimit] = useState<number>(100);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [level, lineLimit]);

  useEffect(() => {
    if (autoScroll && listEndRef.current) {
      listEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  async function fetchLogs() {
    try {
      const params: any = { lines: lineLimit };
      if (level) params.level = level;

      const response = await api.get('/logs', { params });
      setLogs(response.data.logs);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setError('Failed to load logs. Check connection to backend.');
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(
    (log) =>
      searchQuery === '' ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return <CloseCircleOutlined />;
      case 'warning':
        return <WarningOutlined />;
      default:
        return <InfoCircleOutlined />;
    }
  };

  const levelColors: Record<string, string> = {
    info: 'blue',
    warning: 'orange',
    error: 'red',
  };

  return (
    <Layout>
      <AppHeader />
      <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
        {error && (
          <Alert
            message="Error Loading Logs"
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Card style={{ marginBottom: 16 }}>
          <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space wrap>
              <Input
                placeholder="Search logs..."
                prefix={<SearchOutlined />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
                style={{ width: 300 }}
              />
              <Select
                style={{ width: 120 }}
                placeholder="Level"
                allowClear
                onChange={setLevel}
                value={level || undefined}
              >
                <Select.Option value="info">Info</Select.Option>
                <Select.Option value="warning">Warning</Select.Option>
                <Select.Option value="error">Error</Select.Option>
              </Select>
              <InputNumber
                min={10}
                max={1000}
                step={50}
                value={lineLimit}
                onChange={(val) => val && setLineLimit(val)}
                addonBefore="Lines"
                style={{ width: 150 }}
              />
            </Space>
            <Space>
              <Text type="secondary">Auto-scroll:</Text>
              <Switch
                checked={autoScroll}
                onChange={setAutoScroll}
                checkedChildren={<DownOutlined />}
              />
            </Space>
          </Space>
        </Card>

        <Card title={`Logs (${filteredLogs.length})`}>
          {loading ? (
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : filteredLogs.length === 0 ? (
            <Empty description="No logs found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <>
              <List
                dataSource={filteredLogs}
                renderItem={(log) => (
                  <List.Item style={{ alignItems: 'flex-start' }}>
                    <List.Item.Meta
                      avatar={
                        <div style={{ fontSize: 20, marginTop: 4 }}>{getLevelIcon(log.level)}</div>
                      }
                      title={
                        <Space>
                          <Tag color={levelColors[log.level]} icon={getLevelIcon(log.level)}>
                            {log.level.toUpperCase()}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </Text>
                        </Space>
                      }
                      description={
                        <Text
                          style={{
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'monospace',
                            fontSize: 12,
                          }}
                        >
                          {log.message}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} log entries`,
                }}
              />
              <div ref={listEndRef} />
            </>
          )}
        </Card>
      </Content>
    </Layout>
  );
}
