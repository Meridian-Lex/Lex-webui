import React, { useEffect, useState } from 'react';
import { Card, Tabs, Typography, Spin, Alert, Descriptions, Tag, Layout, Button } from 'antd';
import { SettingOutlined, FileTextOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { configApi } from '../services/config.service';
import ReactMarkdown from 'react-markdown';

const { Header, Content: AntContent } = Layout;

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

interface ConfigData {
  lexConfig: Record<string, any>;
  state: string;
  readme: string;
  paths: {
    meridianHome: string;
    projects: string;
    logs: string;
  };
}

export const Configuration: React.FC = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<ConfigData | null>(null);

  useEffect(() => {
    loadConfig();
    // Refresh every 30 seconds
    const interval = setInterval(loadConfig, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadConfig = async () => {
    try {
      setError(null);
      const data = await configApi.getOverview();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading configuration..." />
      </div>
    );
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }

  if (!config) {
    return <Alert message="No configuration data available" type="warning" showIcon />;
  }

  const renderConfigSection = (obj: Record<string, any>, depth = 0): React.ReactNode => {
    return Object.entries(obj).map(([key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return (
          <div key={key} style={{ marginLeft: depth * 20, marginBottom: 16 }}>
            <Text strong style={{ fontSize: 14 + (3 - depth) * 2 }}>
              {key}
            </Text>
            {renderConfigSection(value, depth + 1)}
          </div>
        );
      }

      return (
        <div key={key} style={{ marginLeft: depth * 20, marginBottom: 8 }}>
          <Text type="secondary">{key}: </Text>
          <Text code>
            {Array.isArray(value)
              ? JSON.stringify(value)
              : typeof value === 'boolean'
              ? value.toString()
              : value}
          </Text>
        </div>
      );
    });
  };

  return (
    <Layout>
      <Header
        style={{
          background: '#001529',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={3} style={{ color: 'white', margin: 0 }}>
          Lex Fleet Command
        </Title>
        <div>
          <Link to="/" style={{ color: 'white', marginRight: 24 }}>
            Dashboard
          </Link>
          <Link to="/projects" style={{ color: 'white', marginRight: 24 }}>
            Projects
          </Link>
          <Link to="/tasks" style={{ color: 'white', marginRight: 24 }}>
            Tasks
          </Link>
          <Link to="/logs" style={{ color: 'white', marginRight: 24 }}>
            Logs
          </Link>
          <Text style={{ color: 'white', marginRight: 16 }}>{user?.username}</Text>
          <Button onClick={logout} size="small">
            Logout
          </Button>
        </div>
      </Header>

      <AntContent style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
        <Title level={2}>
          <SettingOutlined /> Configuration
        </Title>
        <Paragraph>System configuration and operational parameters</Paragraph>

      <Tabs defaultActiveKey="1" size="large">
        <TabPane
          tab={
            <span>
              <SettingOutlined />
              LEX Configuration
            </span>
          }
          key="1"
        >
          <Card>
            <Title level={4}>Operational Configuration</Title>
            <Paragraph type="secondary">
              Configuration from <Text code>LEX-CONFIG.yaml</Text>
            </Paragraph>

            {config.lexConfig.vessel_info && (
              <Card style={{ marginBottom: 16 }} size="small">
                <Descriptions title="Vessel Information" column={2} bordered>
                  <Descriptions.Item label="Name">
                    {config.lexConfig.vessel_info.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Version">
                    <Tag color="blue">{config.lexConfig.vessel_info.version}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Designation">
                    {config.lexConfig.vessel_info.designation}
                  </Descriptions.Item>
                  <Descriptions.Item label="Operator">
                    {config.lexConfig.vessel_info.operator}
                  </Descriptions.Item>
                  <Descriptions.Item label="Deployment Date">
                    {config.lexConfig.vessel_info.deployment_date}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            <Card style={{ marginBottom: 16 }} size="small">
              <Title level={5}>Full Configuration</Title>
              <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                {renderConfigSection(config.lexConfig)}
              </div>
            </Card>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <InfoCircleOutlined />
              Current State
            </span>
          }
          key="2"
        >
          <Card>
            <Title level={4}>Operational State</Title>
            <Paragraph type="secondary">
              Current state from <Text code>STATE.md</Text>
            </Paragraph>

            {config.state ? (
              <div
                style={{
                  background: '#f5f5f5',
                  padding: 16,
                  borderRadius: 4,
                  maxHeight: '600px',
                  overflow: 'auto',
                  color: '#000000',
                }}
              >
                <ReactMarkdown>{config.state}</ReactMarkdown>
              </div>
            ) : (
              <Alert
                message="No state file found"
                description="STATE.md does not exist yet"
                type="info"
                showIcon
              />
            )}
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <FileTextOutlined />
              README
            </span>
          }
          key="3"
        >
          <Card>
            <Title level={4}>Meridian Home README</Title>
            <Paragraph type="secondary">
              Documentation from <Text code>README.md</Text>
            </Paragraph>

            {config.readme ? (
              <div
                style={{
                  background: '#f5f5f5',
                  padding: 16,
                  borderRadius: 4,
                  maxHeight: '600px',
                  overflow: 'auto',
                  color: '#000000',
                }}
              >
                <ReactMarkdown>{config.readme}</ReactMarkdown>
              </div>
            ) : (
              <Alert
                message="No README found"
                description="README.md does not exist yet"
                type="info"
                showIcon
              />
            )}
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <FileTextOutlined />
              File Paths
            </span>
          }
          key="4"
        >
          <Card>
            <Title level={4}>System Paths</Title>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Meridian Home">
                <Text code>{config.paths.meridianHome}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Projects Directory">
                <Text code>{config.paths.projects}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Logs Directory">
                <Text code>{config.paths.logs}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </TabPane>
      </Tabs>
      </AntContent>
    </Layout>
  );
};
