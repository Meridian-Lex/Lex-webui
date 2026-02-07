import { LexFileSystem } from './lexFileSystem';
import { LexStatus } from '../types';

export class StateManager {
  private readonly fs: LexFileSystem;

  constructor() {
    this.fs = new LexFileSystem();
  }

  async getStatus(): Promise<LexStatus> {
    try {
      const content = await this.fs.readFile('lex-internal/state/STATE.md');

      // Parse lex-internal/state/STATE.md (simple markdown parsing)
      const mode = this.extractField(content, 'Current Mode') as LexStatus['mode'] || 'IDLE';
      const currentProject = this.extractField(content, 'Current Project');

      // Get token budget from LEX-CONFIG.yaml (stub for now)
      const tokenBudget = {
        dailyLimit: 100000,
        used: 50000,
        remaining: 50000,
        reserved: 20000,
      };

      return {
        mode,
        currentProject,
        tokenBudget,
        lastUpdated: new Date(),
      };
    } catch (error) {
      // If lex-internal/state/STATE.md doesn't exist, return defaults
      return {
        mode: 'IDLE',
        currentProject: null,
        tokenBudget: {
          dailyLimit: 100000,
          used: 0,
          remaining: 100000,
          reserved: 20000,
        },
        lastUpdated: new Date(),
      };
    }
  }

  async setMode(mode: LexStatus['mode']): Promise<void> {
    const content = await this.fs.readFile('lex-internal/state/STATE.md');
    const updated = this.updateField(content, 'Current Mode', mode);
    await this.fs.writeFile('lex-internal/state/STATE.md', updated);
  }

  private extractField(content: string, field: string): string | null {
    const regex = new RegExp(`\\*\\*${field}\\*\\*:?\\s*(.+)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  }

  private updateField(content: string, field: string, value: string): string {
    const regex = new RegExp(`(\\*\\*${field}\\*\\*:?\\s*)(.+)`, 'i');
    if (regex.test(content)) {
      return content.replace(regex, `$1${value}`);
    } else {
      // Field doesn't exist, append it
      return content + `\n\n**${field}**: ${value}`;
    }
  }
}
