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
  Input,
  Select,
  Skeleton,
  Empty,
  Divider,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  LinkOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { AppHeader } from '../components/AppHeader';
import { taskApi, Task, TaskStats } from '../services/task.service';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export const TaskBoard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');

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
      setError(null);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError('Failed to load tasks. Check connection to backend.');
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

  const filterTasks = (taskList: Task[]) => {
    return taskList.filter((task) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        task.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.id.toLowerCase().includes(searchQuery.toLowerCase());

      // Priority filter
      const matchesPriority =
        priorityFilter === 'all' ||
        (task.priority && task.priority.toUpperCase().includes(priorityFilter.toUpperCase()));

      // Assigned filter
      const matchesAssigned =
        assignedFilter === 'all' ||
        (task.assigned && task.assigned.toLowerCase().includes(assignedFilter.toLowerCase()));

      return matchesSearch && matchesPriority && matchesAssigned;
    });
  };

  const getTasksByStatus = (status: string) => {
    const statusFiltered = tasks.filter((task) => task.status === status);
    return filterTasks(statusFiltered);
  };

  // Get unique values for filters
  const uniquePriorities = Array.from(new Set(tasks.map((t) => t.priority).filter(Boolean)));
  const uniqueAssigned = Array.from(new Set(tasks.map((t) => t.assigned).filter(Boolean)));

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

    const isBlocked = task.metadata && 'blocked' in task.metadata && Boolean(task.metadata.blocked);

    return (
      <Card
        key={task.id}
        size="small"
        style={{
          marginBottom: 8,
          cursor: 'pointer',
          borderLeft: isBlocked ? '4px solid #faad14' : undefined,
        }}
        onClick={() => showTaskDetails(task)}
        hoverable
      >
        <div style={{ marginBottom: 8 }}>
          <Space>
            <Text strong>#{task.id}</Text>
            {isBlocked && <ExclamationCircleOutlined style={{ color: '#faad14' }} />}
          </Space>
          <div style={{ marginTop: 4 }}>
            <Text>{task.subject}</Text>
          </div>
        </div>
        <Paragraph
          ellipsis={{ rows: 2 }}
          style={{ marginBottom: 8, fontSize: 12 }}
          type="secondary"
        >
          {task.description}
        </Paragraph>
        <Space size="small" wrap style={{ marginBottom: 4 }}>
          <Tag color={statusColors[task.status]}>{task.status.replace('_', ' ').toUpperCase()}</Tag>
          {task.priority && (
            <Tag color={priorityColors[task.priority.toUpperCase().split(' ')[0]]}>
              {task.priority}
            </Tag>
          )}
          {task.complexity && (
            <Tag>{task.complexity.split(' ')[0]}</Tag>
          )}
          {task.assigned && <Tag icon={<LinkOutlined />}>{task.assigned}</Tag>}
        </Space>
        {task.updatedAt && (
          <Text type="secondary" style={{ fontSize: 11 }}>
            Updated: {new Date(task.updatedAt).toLocaleDateString()}
          </Text>
        )}
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

        {error && (
          <Alert
            message="Error Loading Tasks"
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Search and Filters */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={10}>
              <Input
                placeholder="Search tasks..."
                prefix={<SearchOutlined />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={12} sm={6} md={7}>
              <Select
                style={{ width: '100%' }}
                placeholder="Filter by priority"
                value={priorityFilter}
                onChange={setPriorityFilter}
                suffixIcon={<FilterOutlined />}
              >
                <Option value="all">All Priorities</Option>
                {uniquePriorities.map((priority) => (
                  <Option key={priority} value={priority || ''}>
                    {priority}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={6} md={7}>
              <Select
                style={{ width: '100%' }}
                placeholder="Filter by assigned"
                value={assignedFilter}
                onChange={setAssignedFilter}
                suffixIcon={<FilterOutlined />}
              >
                <Option value="all">All Assigned</Option>
                {uniqueAssigned.map((assigned) => (
                  <Option key={assigned} value={assigned || ''}>
                    {assigned}
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>
        </Card>

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
                <Skeleton active paragraph={{ rows: 4 }} />
              ) : getTasksByStatus('pending').length === 0 ? (
                <Empty description="No pending tasks" image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
                <Skeleton active paragraph={{ rows: 4 }} />
              ) : getTasksByStatus('in_progress').length === 0 ? (
                <Empty description="No tasks in progress" image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
                <Skeleton active paragraph={{ rows: 4 }} />
              ) : getTasksByStatus('completed').length === 0 ? (
                <Empty description="No completed tasks" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                getTasksByStatus('completed').map(renderTaskCard)
              )}
            </Card>
          </Col>
        </Row>

        {/* Task Details Modal */}
        {selectedTask && (
          <Modal
            title={
              <Space>
                <Text strong>Task #{selectedTask.id}</Text>
                <Tag color={selectedTask.status === 'completed' ? 'success' : selectedTask.status === 'in_progress' ? 'processing' : 'default'}>
                  {selectedTask.status.replace('_', ' ').toUpperCase()}
                </Tag>
              </Space>
            }
            open={detailModalVisible}
            onCancel={() => {
              setDetailModalVisible(false);
              setSelectedTask(null);
            }}
            footer={null}
            width={800}
          >
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 18 }}>{selectedTask.subject}</Text>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {selectedTask.metadata && 'blocked' in selectedTask.metadata && Boolean(selectedTask.metadata.blocked) && (
              <Alert
                message="Task Blocked"
                description="This task is waiting on dependencies or decisions before work can proceed."
                type="warning"
                icon={<ExclamationCircleOutlined />}
                style={{ marginBottom: 16 }}
                showIcon
              />
            )}

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                {selectedTask.priority && (
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary">Priority: </Text>
                    <Tag color={selectedTask.priority.includes('CRITICAL') ? 'red' : selectedTask.priority.includes('HIGH') ? 'orange' : 'default'}>
                      {selectedTask.priority}
                    </Tag>
                  </div>
                )}
                {selectedTask.complexity && (
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary">Complexity: </Text>
                    <Tag>{selectedTask.complexity}</Tag>
                  </div>
                )}
              </Col>
              <Col span={12}>
                {selectedTask.assigned && (
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary">Assigned: </Text>
                    <Tag icon={<LinkOutlined />}>{selectedTask.assigned}</Tag>
                  </div>
                )}
                {selectedTask.createdAt && (
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary">Created: </Text>
                    <Text>{new Date(selectedTask.createdAt).toLocaleString()}</Text>
                  </div>
                )}
                {selectedTask.updatedAt && (
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary">Updated: </Text>
                    <Text>{new Date(selectedTask.updatedAt).toLocaleString()}</Text>
                  </div>
                )}
              </Col>
            </Row>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ marginBottom: 16 }}>
              <Text strong>Description</Text>
              <Paragraph
                style={{
                  marginTop: 8,
                  whiteSpace: 'pre-wrap',
                  background: '#f5f5f5',
                  padding: 12,
                  borderRadius: 4,
                }}
              >
                {selectedTask.description}
              </Paragraph>
            </div>

            {selectedTask.activeForm && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Active Form</Text>
                <Paragraph style={{ marginTop: 8, fontStyle: 'italic' }}>
                  {selectedTask.activeForm}
                </Paragraph>
              </div>
            )}

            {selectedTask.metadata && Object.keys(selectedTask.metadata).length > 0 && (
              <div>
                <Text strong>Metadata</Text>
                <div
                  style={{
                    marginTop: 8,
                    background: '#f5f5f5',
                    padding: 12,
                    borderRadius: 4,
                    fontSize: 12,
                    fontFamily: 'monospace',
                  }}
                >
                  <pre style={{ margin: 0 }}>
                    {JSON.stringify(selectedTask.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </Modal>
        )}
      </Content>
    </Layout>
  );
};
