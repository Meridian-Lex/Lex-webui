import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

const MERIDIAN_HOME = process.env.MERIDIAN_HOME || '/home/meridian/meridian-home';

class ConfigService {
  private async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return '';
      }
      throw error;
    }
  }

  async getLexConfig(): Promise<Record<string, unknown>> {
    const configPath = path.join(MERIDIAN_HOME, 'lex-internal/config/LEX-CONFIG.yaml');
    const content = await this.readFile(configPath);

    if (!content) {
      return { error: 'Configuration file not found' };
    }

    try {
      return yaml.load(content) as Record<string, unknown>;
    } catch (error) {
      throw new Error(`Failed to parse YAML: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getState(): Promise<string> {
    const statePath = path.join(MERIDIAN_HOME, 'lex-internal/state/STATE.md');
    return await this.readFile(statePath);
  }

  async getReadme(): Promise<string> {
    const readmePath = path.join(MERIDIAN_HOME, 'README.md');
    return await this.readFile(readmePath);
  }

  async getConfigOverview(): Promise<{
    lexConfig: Record<string, unknown>;
    state: string;
    readme: string;
    paths: {
      meridianHome: string;
      projects: string;
      logs: string;
    };
  }> {
    const [lexConfig, state, readme] = await Promise.all([
      this.getLexConfig(),
      this.getState(),
      this.getReadme(),
    ]);

    return {
      lexConfig,
      state,
      readme,
      paths: {
        meridianHome: MERIDIAN_HOME,
        projects: path.join(MERIDIAN_HOME, 'projects'),
        logs: path.join(MERIDIAN_HOME, 'logs'),
      },
    };
  }
}

export const configService = new ConfigService();
