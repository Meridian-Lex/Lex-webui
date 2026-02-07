import api from './api';

export interface ConfigOverview {
  lexConfig: Record<string, any>;
  state: string;
  readme: string;
  paths: {
    meridianHome: string;
    projects: string;
    logs: string;
  };
}

export const configApi = {
  async getOverview(): Promise<ConfigOverview> {
    const response = await api.get('/config/overview');
    return response.data;
  },

  async getLexConfig(): Promise<Record<string, any>> {
    const response = await api.get('/config/lex-config');
    return response.data;
  },

  async getState(): Promise<{ content: string }> {
    const response = await api.get('/config/state');
    return response.data;
  },

  async getReadme(): Promise<{ content: string }> {
    const response = await api.get('/config/readme');
    return response.data;
  },
};
