import React, { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authService } from '../../services/auth.service';

interface FirstRunSetupProps {
  onComplete: () => void;
}

export default function FirstRunSetup({ onComplete }: FirstRunSetupProps): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: { username: string; password: string; confirmPassword: string }) {
    setLoading(true);
    setError(null);

    try {
      await authService.setup(values);
      onComplete();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Setup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form
      name="setup"
      onFinish={handleSubmit}
      autoComplete="off"
      style={{ maxWidth: 400, margin: '0 auto' }}
    >
      <h1 style={{ textAlign: 'center', marginBottom: 8 }}>
        Lex Fleet Command
      </h1>
      <p style={{ textAlign: 'center', marginBottom: 24, color: '#888' }}>
        Create your admin account
      </p>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form.Item
        name="username"
        rules={[
          { required: true, message: 'Please enter a username' },
          { min: 3, message: 'Username must be at least 3 characters' },
        ]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="Username"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: 'Please enter a password' },
          { min: 8, message: 'Password must be at least 8 characters' },
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Password"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        dependencies={['password']}
        rules={[
          { required: true, message: 'Please confirm your password' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Passwords do not match'));
            },
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Confirm Password"
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          size="large"
        >
          Create Admin Account
        </Button>
      </Form.Item>
    </Form>
  );
}
