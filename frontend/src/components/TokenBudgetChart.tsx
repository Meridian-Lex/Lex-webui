import React from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Typography } from 'antd';
import {
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ThunderboltOutlined, WarningOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface TokenBudgetChartProps {
  dailyLimit: number;
  todayUsage: number;
  weekUsage: number;
  monthUsage: number;
  reservedForCommander: number;
}

export const TokenBudgetChart: React.FC<TokenBudgetChartProps> = ({
  dailyLimit,
  todayUsage,
  weekUsage,
  monthUsage,
  reservedForCommander,
}) => {
  const usagePercent = (todayUsage / dailyLimit) * 100;
  const remaining = dailyLimit - todayUsage;
  const availableForAutonomous = dailyLimit - reservedForCommander - todayUsage;

  // Simulated daily usage data for the past week
  const dailyData = [
    { day: 'Mon', tokens: 45000, limit: dailyLimit },
    { day: 'Tue', tokens: 38000, limit: dailyLimit },
    { day: 'Wed', tokens: 52000, limit: dailyLimit },
    { day: 'Thu', tokens: 41000, limit: dailyLimit },
    { day: 'Fri', tokens: 48000, limit: dailyLimit },
    { day: 'Sat', tokens: 35000, limit: dailyLimit },
    { day: 'Today', tokens: todayUsage, limit: dailyLimit },
  ];

  // Budget breakdown for pie chart
  const budgetData = [
    { name: 'Used Today', value: todayUsage, color: '#1890ff' },
    { name: 'Reserved (Commander)', value: reservedForCommander, color: '#52c41a' },
    {
      name: 'Available (Autonomous)',
      value: Math.max(0, availableForAutonomous),
      color: '#faad14',
    },
  ];

  const getStatusColor = (): 'success' | 'exception' | 'normal' => {
    if (usagePercent >= 90) return 'exception';
    if (usagePercent >= 75) return 'normal';
    return 'success';
  };

  const getStatusTag = () => {
    if (usagePercent >= 90) return <Tag color="red">CRITICAL - 90%+</Tag>;
    if (usagePercent >= 75) return <Tag color="orange">WARNING - 75%+</Tag>;
    return <Tag color="green">NOMINAL</Tag>;
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Today's Usage"
              value={todayUsage.toLocaleString()}
              suffix={`/ ${dailyLimit.toLocaleString()}`}
              valueStyle={{ fontSize: 20 }}
            />
            <Progress
              percent={parseFloat(usagePercent.toFixed(1))}
              status={getStatusColor()}
              strokeColor={
                usagePercent >= 90 ? '#ff4d4f' : usagePercent >= 75 ? '#faad14' : '#52c41a'
              }
            />
            {getStatusTag()}
          </Col>
          <Col span={6}>
            <Statistic
              title="Tokens Remaining"
              value={remaining.toLocaleString()}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: remaining < dailyLimit * 0.25 ? '#ff4d4f' : '#3f8600' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Week Total"
              value={weekUsage.toLocaleString()}
              valueStyle={{ fontSize: 20 }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Month Total"
              value={monthUsage.toLocaleString()}
              valueStyle={{ fontSize: 20 }}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="Daily Usage Trend (Past 7 Days)" size="small">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  stackId="1"
                  stroke="#1890ff"
                  fill="#1890ff"
                  name="Tokens Used"
                />
                <Line
                  type="monotone"
                  dataKey="limit"
                  stroke="#ff4d4f"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Daily Limit"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="Budget Allocation" size="small">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={budgetData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {budgetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Available for autonomous operations:
              </Text>
              <br />
              <Text strong style={{ fontSize: 16, color: '#faad14' }}>
                {Math.max(0, availableForAutonomous).toLocaleString()} tokens
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {usagePercent >= 75 && (
        <Card
          style={{ marginTop: 16, borderColor: usagePercent >= 90 ? '#ff4d4f' : '#faad14' }}
          size="small"
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <WarningOutlined
              style={{
                fontSize: 24,
                color: usagePercent >= 90 ? '#ff4d4f' : '#faad14',
                marginRight: 16,
              }}
            />
            <div>
              <Text strong>
                {usagePercent >= 90 ? 'CRITICAL:' : 'WARNING:'} Token Budget Alert
              </Text>
              <br />
              <Text type="secondary">
                {usagePercent >= 90
                  ? 'Daily token budget is critically low. Consider halting autonomous operations.'
                  : 'Approaching daily token limit. Monitor usage carefully.'}
              </Text>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
