import React, { useEffect, useState } from 'react';
import {
  Layout,
  Card,
  Row,
  Col,
  Typography,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Statistic,
  Space,
  message,
} from 'antd';
import {
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { taskApi, Task, TaskStats } from '../services/task.service';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export const TaskBoard: React.FC = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [form] = Form.useForm();

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

  const handleCreateTask = async (values: any) => {
    try {
      await taskApi.createTask(values);
      message.success('Task created successfully');
      setCreateModalVisible(false);
      form.resetFields();
      await loadTasks();
      await loadStats();
    } catch (error) {
      message.error('Failed to create task');
      console.error('Create task error:', error);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: 'in_progress' | 'completed') => {
    try {
      await taskApi.updateTask(taskId, { status });
      message.success(`Task marked as ${status.replace('_', ' ')}`);
      await loadTasks();
      await loadStats();
    } catch (error) {
      message.error('Failed to update task');
      console.error('Update task error:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskApi.deleteTask(taskId);
      message.success('Task deleted');
      setDetailModalVisible(false);
      await loadTasks();
      await loadStats();
    } catch (error) {
      message.error('Failed to delete task');
      console.error('Delete task error:', error);
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

    return (
      <Card
        key={task.id}
        size="small"
        style={{ marginBottom: 8, cursor: 'pointer' }}
        onClick={() => showTaskDetails(task)}
        hoverable
      >
        <div style={{ marginBottom: 8 }}>
          <Text strong>{task.subject}</Text>
        </div>
        <Paragraph
          ellipsis={{ rows: 2 }}
          style={{ marginBottom: 8, fontSize: 12 }}
          type="secondary"
        >
          {task.description}
        </Paragraph>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tag color={statusColors[task.status]}>{task.status.replace('_', ' ').toUpperCase()}</Tag>
          {task.status === 'pending' && (
            <Button
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStatus(task.id, 'in_progress');
              }}
            >
              Start
            </Button>
          )}
          {task.status === 'in_progress' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStatus(task.id, 'completed');
              }}
            >
              Complete
            </Button>
          )}
        </div>
      </Card>
    );
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={2}>Task Board</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            New Task
          </Button>
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

        {/* Create Task Modal */}
        <Modal
          title="Create New Task"
          open={createModalVisible}
          onCancel={() => {
            setCreateModalVisible(false);
            form.resetFields();
          }}
          onOk={() => form.submit()}
          okText="Create"
        >
          <Form form={form} layout="vertical" onFinish={handleCreateTask}>
            <Form.Item
              name="subject"
              label="Subject"
              rules={[{ required: true, message: 'Please enter task subject' }]}
            >
              <Input placeholder="Brief task title" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please enter task description' }]}
            >
              <TextArea rows={4} placeholder="Detailed task description" />
            </Form.Item>

            <Form.Item name="activeForm" label="Active Form (optional)">
              <Input placeholder="Present continuous form (e.g., 'Processing data')" />
            </Form.Item>
          </Form>
        </Modal>

        {/* Task Details Modal */}
        {selectedTask && (
          <Modal
            title="Task Details"
            open={detailModalVisible}
            onCancel={() => {
              setDetailModalVisible(false);
              setSelectedTask(null);
            }}
            footer={[
              <Button
                key="delete"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteTask(selectedTask.id)}
              >
                Delete
              </Button>,
              <Button key="close" onClick={() => setDetailModalVisible(false)}>
                Close
              </Button>,
            ]}
            width={600}
          >
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 18 }}>{selectedTask.subject}</Text>
              <div style={{ marginTop: 8 }}>
                <Tag>{selectedTask.status.replace('_', ' ').toUpperCase()}</Tag>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Description:</Text>
              <Paragraph style={{ marginTop: 8 }}>{selectedTask.description}</Paragraph>
            </div>

            {selectedTask.activeForm && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Active Form:</Text>
                <Paragraph style={{ marginTop: 8 }}>{selectedTask.activeForm}</Paragraph>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <Space>
                <div>
                  <Text type="secondary">Created:</Text>
                  <br />
                  <Text>{new Date(selectedTask.createdAt).toLocaleString()}</Text>
                </div>
                <div>
                  <Text type="secondary">Updated:</Text>
                  <br />
                  <Text>{new Date(selectedTask.updatedAt).toLocaleString()}</Text>
                </div>
              </Space>
            </div>

            <div style={{ marginTop: 24 }}>
              <Space>
                {selectedTask.status === 'pending' && (
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => {
                      handleUpdateStatus(selectedTask.id, 'in_progress');
                      setDetailModalVisible(false);
                    }}
                  >
                    Mark In Progress
                  </Button>
                )}
                {selectedTask.status === 'in_progress' && (
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => {
                      handleUpdateStatus(selectedTask.id, 'completed');
                      setDetailModalVisible(false);
                    }}
                  >
                    Mark Completed
                  </Button>
                )}
              </Space>
            </div>
          </Modal>
        )}
      </Content>
    </Layout>
  );
};
