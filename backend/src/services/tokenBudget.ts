import { LexFileSystem } from './lexFileSystem';
import yaml from 'js-yaml';

interface TokenUsage {
  today?: number;
  this_week?: number;
  this_month?: number;
}

interface TokenBudgetConfig {
  daily_limit?: number;
  per_session_target?: number;
  reserved_for_commander?: number;
  max_daily_tokens?: number;
  usage?: TokenUsage;
}

interface LexConfig {
  token_budget?: TokenBudgetConfig;
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
    weekUsage: number;
    monthUsage: number;
    perSessionTarget: number;
  }> {
    try {
      const content = await this.fs.readFile('LEX-CONFIG.yaml');
      const config = yaml.load(content) as LexConfig;

      const tokenBudget = config.token_budget || {};
      const dailyLimit = tokenBudget.daily_limit || 200000;
      const reserved = tokenBudget.reserved_for_commander || 50000;
      const perSessionTarget = tokenBudget.per_session_target || 30000;

      const used = tokenBudget.usage?.today || 0;
      const weekUsage = tokenBudget.usage?.this_week || used;
      const monthUsage = tokenBudget.usage?.this_month || used;

      const remaining = dailyLimit - used;

      return {
        dailyLimit,
        used,
        remaining,
        reserved,
        weekUsage,
        monthUsage,
        perSessionTarget,
      };
    } catch (error) {
      console.error('Failed to read LEX-CONFIG.yaml:', error);

      // Return defaults
      return {
        dailyLimit: 200000,
        used: 0,
        remaining: 200000,
        reserved: 50000,
        weekUsage: 0,
        monthUsage: 0,
        perSessionTarget: 30000,
      };
    }
  }
}
