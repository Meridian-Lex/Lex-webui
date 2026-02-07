import React, { useEffect, useState } from 'react';
import {
  Layout,
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Modal,
  Statistic,
  Space,
  Alert,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { AppHeader } from '../components/AppHeader';
import { taskApi, Task, TaskStats } from '../services/task.service';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export const TaskBoard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    loadTasks();
    loadStats();
    // Refresh every 10 seconds
    const interval = setInterval(() => {
      loadTasks();
      loadStats();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadTasks = async () => {
    try {
      const data = await taskApi.getAllTasks();
      setTasks(data.tasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await taskApi.getTaskStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const showTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setDetailModalVisible(true);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  const renderTaskCard = (task: Task) => {
    const statusColors: Record<string, string> = {
      pending: 'default',
      in_progress: 'processing',
      completed: 'success',
      deleted: 'error',
    };

    const priorityColors: Record<string, string> = {
      CRITICAL: 'red',
      HIGH: 'orange',
      MEDIUM: 'gold',
      LOW: 'green',
    };

    return (
      <Card
        key={task.id}
        size="small"
        style={{ marginBottom: 8, cursor: 'pointer' }}
        onClick={() => showTaskDetails(task)}
        hoverable
      >
        <div style={{ marginBottom: 8 }}>
          <Text strong>Task {task.id}: {task.subject}</Text>
        </div>
        <Paragraph
          ellipsis={{ rows: 2 }}
          style={{ marginBottom: 8, fontSize: 12 }}
          type="secondary"
        >
          {task.description}
        </Paragraph>
        <Space size="small" wrap>
          <Tag color={statusColors[task.status]}>{task.status.replace('_', ' ').toUpperCase()}</Tag>
          {task.priority && (
            <Tag color={priorityColors[task.priority.toUpperCase().split(' ')[0]]}>
              {task.priority}
            </Tag>
          )}
          {task.complexity && (
            <Tag>{task.complexity.split(' ')[0]}</Tag>
          )}
        </Space>
      </Card>
    );
  };

  return (
    <Layout>
      <AppHeader />
      <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>Task Board</Title>
          <Alert
            message="Read-Only View"
            description="Tasks are managed in TASK-QUEUE.md and cannot be edited through the webui. This view displays your current lex infrastructure tasks."
            type="info"
            icon={<InfoCircleOutlined />}
            style={{ marginTop: 16 }}
          />
        </div>

        {stats && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Tasks"
                  value={stats.total}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Pending"
                  value={stats.pending}
                  valueStyle={{ color: '#8c8c8c' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="In Progress"
                  value={stats.inProgress}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<PlayCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Completed"
                  value={stats.completed}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>
        )}

        <Row gutter={16}>
          <Col span={8}>
            <Card
              title={
                <Space>
                  <ClockCircleOutlined />
                  <span>Pending ({getTasksByStatus('pending').length})</span>
                </Space>
              }
              bodyStyle={{ minHeight: 400, maxHeight: 600, overflow: 'auto' }}
            >
              {loading ? (
                <Text type="secondary">Loading...</Text>
              ) : getTasksByStatus('pending').length === 0 ? (
                <Text type="secondary">No pending tasks</Text>
              ) : (
                getTasksByStatus('pending').map(renderTaskCard)
              )}
            </Card>
          </Col>

          <Col span={8}>
            <Card
              title={
                <Space>
                  <PlayCircleOutlined />
                  <span>In Progress ({getTasksByStatus('in_progress').length})</span>
                </Space>
              }
              bodyStyle={{ minHeight: 400, maxHeight: 600, overflow: 'auto' }}
            >
              {loading ? (
                <Text type="secondary">Loading...</Text>
              ) : getTasksByStatus('in_progress').length === 0 ? (
                <Text type="secondary">No tasks in progress</Text>
              ) : (
                getTasksByStatus('in_progress').map(renderTaskCard)
              )}
            </Card>
          </Col>

          <Col span={8}>
            <Card
              title={
                <Space>
                  <CheckCircleOutlined />
                  <span>Completed ({getTasksByStatus('completed').length})</span>
                </Space>
              }
              bodyStyle={{ minHeight: 400, maxHeight: 600, overflow: 'auto' }}
            >
              {loading ? (
                <Text type="secondary">Loading...</Text>
              ) : getTasksByStatus('completed').length === 0 ? (
                <Text type="secondary">No completed tasks</Text>
              ) : (
                getTasksByStatus('completed').map(renderTaskCard)
              )}
            </Card>
          </Col>
        </Row>

        {/* Task Details Modal */}
        {selectedTask && (
          <Modal
            title={`Task ${selectedTask.id} Details`}
            open={detailModalVisible}
            onCancel={() => {
              setDetailModalVisible(false);
              setSelectedTask(null);
            }}
            footer={null}
            width={700}
          >
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 18 }}>{selectedTask.subject}</Text>
              <div style={{ marginTop: 8 }}>
                <Space wrap>
                  <Tag color={selectedTask.status === 'completed' ? 'success' : selectedTask.status === 'in_progress' ? 'processing' : 'default'}>
                    {selectedTask.status.replace('_', ' ').toUpperCase()}
                  </Tag>
                  {selectedTask.priority && (
                    <>
                      <Text type="secondary">Priority:</Text>
                      <Tag color={selectedTask.priority.includes('CRITICAL') ? 'red' : selectedTask.priority.includes('HIGH') ? 'orange' : 'default'}>
                        {selectedTask.priority}
                      </Tag>
                    </>
                  )}
                </Space>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Description:</Text>
              <Paragraph style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{selectedTask.description}</Paragraph>
            </div>

            {selectedTask.complexity && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Complexity:</Text>
                <Paragraph style={{ marginTop: 8 }}>{selectedTask.complexity}</Paragraph>
              </div>
            )}

            {selectedTask.assigned && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Assigned:</Text>
                <Paragraph style={{ marginTop: 8 }}>{selectedTask.assigned}</Paragraph>
              </div>
            )}

            {selectedTask.metadata && 'blocked' in selectedTask.metadata && Boolean(selectedTask.metadata.blocked) && (
              <Alert
                message="Task Blocked"
                description="This task is waiting on dependencies or decisions before work can proceed."
                type="warning"
                style={{ marginTop: 16 }}
              />
            )}
          </Modal>
        )}
      </Content>
    </Layout>
  );
};
