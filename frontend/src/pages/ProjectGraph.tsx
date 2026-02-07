import React, { useEffect, useState, useRef } from 'react';
import { Layout, Card, Typography, Button, Tag, Spin, Alert } from 'antd';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ForceGraph2D from 'react-force-graph-2d';
import api from '../services/api';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

interface GraphNode {
  id: string;
  name: string;
  status: string;
  description?: string;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export const ProjectGraph: React.FC = () => {
  const { user, logout } = useAuth();
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const graphRef = useRef<any>();

  useEffect(() => {
    loadGraphData();
  }, []);

  const loadGraphData = async () => {
    try {
      setError(null);
      const response = await api.get('/projects/graph/data');
      setGraphData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph data');
    } finally {
      setLoading(false);
    }
  };

  const getNodeColor = (node: GraphNode) => {
    const statusColors: Record<string, string> = {
      active: '#52c41a',
      completed: '#1890ff',
      archived: '#8c8c8c',
      planned: '#faad14',
    };
    return statusColors[node.status] || '#d9d9d9';
  };

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
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
          <Link to="/config" style={{ color: 'white', marginRight: 24 }}>
            Configuration
          </Link>
          <Text style={{ color: 'white', marginRight: 16 }}>{user?.username}</Text>
          <Button onClick={logout} size="small">
            Logout
          </Button>
        </div>
      </Header>

      <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Title level={2}>Project Relationship Graph</Title>
          <Button onClick={loadGraphData}>Refresh</Button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 50 }}>
            <Spin size="large" tip="Loading project graph..." />
          </div>
        ) : error ? (
          <Alert message="Error" description={error} type="error" showIcon />
        ) : graphData ? (
          <div style={{ display: 'flex', gap: 16 }}>
            <Card style={{ flex: 1, height: 'calc(100vh - 200px)' }}>
              <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                nodeLabel={(node: any) => `${node.name}\nStatus: ${node.status}`}
                nodeColor={getNodeColor}
                nodeRelSize={8}
                nodeVal={() => 10}
                linkColor={() => '#999'}
                linkWidth={2}
                linkDirectionalParticles={2}
                linkDirectionalParticleWidth={2}
                onNodeClick={handleNodeClick}
                nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                  const label = node.name;
                  const fontSize = 12 / globalScale;
                  ctx.font = `${fontSize}px Sans-Serif`;
                  const textWidth = ctx.measureText(label).width;
                  const bckgDimensions = [textWidth, fontSize].map((n) => n + fontSize * 0.4);

                  // Draw node circle
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
                  ctx.fillStyle = getNodeColor(node);
                  ctx.fill();

                  // Draw label background
                  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                  ctx.fillRect(
                    node.x - bckgDimensions[0] / 2,
                    node.y + 8,
                    bckgDimensions[0],
                    bckgDimensions[1]
                  );

                  // Draw label text
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = '#333';
                  ctx.fillText(label, node.x, node.y + 8 + fontSize / 2);
                }}
              />
            </Card>

            {selectedNode && (
              <Card
                title="Project Details"
                style={{ width: 300, height: 'calc(100vh - 200px)', overflow: 'auto' }}
              >
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ fontSize: 16 }}>
                    {selectedNode.name}
                  </Text>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary">Status:</Text>
                  <br />
                  <Tag color={getNodeColor(selectedNode).replace('#', '')} style={{ marginTop: 4 }}>
                    {selectedNode.status.toUpperCase()}
                  </Tag>
                </div>

                {selectedNode.description && (
                  <div style={{ marginBottom: 16 }}>
                    <Text type="secondary">Description:</Text>
                    <Paragraph style={{ marginTop: 4 }}>{selectedNode.description}</Paragraph>
                  </div>
                )}

                <div style={{ marginTop: 24 }}>
                  <Link to="/projects">
                    <Button type="primary" block>
                      View Projects List
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>
        ) : (
          <Alert message="No project data available" type="info" showIcon />
        )}

        <Card style={{ marginTop: 16 }} size="small">
          <Text strong>Legend:</Text>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#52c41a',
                }}
              />
              <Text type="secondary">Active</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#1890ff',
                }}
              />
              <Text type="secondary">Completed</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#8c8c8c',
                }}
              />
              <Text type="secondary">Archived</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#faad14',
                }}
              />
              <Text type="secondary">Planned</Text>
            </div>
          </div>
        </Card>

        <Card style={{ marginTop: 16 }} size="small">
          <Text type="secondary">
            Interactive graph showing project relationships. Click and drag nodes to reorganize.
            Click a node to view details. Arrows indicate directional relationships.
          </Text>
        </Card>
      </Content>
    </Layout>
  );
};
