import { LexFileSystem } from './lexFileSystem';
import yaml from 'js-yaml';

interface LexConfig {
  daily_limit?: number;
  per_session_target?: number;
  reserved_for_commander?: number;
  max_daily_tokens?: number;
}

export class TokenBudgetService {
  private readonly fs: LexFileSystem;

  constructor() {
    this.fs = new LexFileSystem();
  }

  async getBudget(): Promise<{
    dailyLimit: number;
    used: number;
    remaining: number;
    reserved: number;
  }> {
    try {
      const content = await this.fs.readFile('LEX-CONFIG.yaml');
      const config = yaml.load(content) as LexConfig;

      const dailyLimit = config.daily_limit || config.max_daily_tokens || 100000;
      const reserved = config.reserved_for_commander || 20000;

      // TODO: Track actual usage from logs
      const used = 0;
      const remaining = dailyLimit - used;

      return {
        dailyLimit,
        used,
        remaining,
        reserved,
      };
    } catch (error) {
      console.error('Failed to read LEX-CONFIG.yaml:', error);

      // Return defaults
      return {
        dailyLimit: 100000,
        used: 0,
        remaining: 100000,
        reserved: 20000,
      };
    }
  }
}
