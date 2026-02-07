import fs from 'fs/promises';
import path from 'path';

const MERIDIAN_HOME = process.env.MERIDIAN_HOME || '/home/meridian/meridian-home';

export class LexFileSystem {
  private readonly basePath: string;

  constructor() {
    this.basePath = MERIDIAN_HOME;
  }

  async readFile(relativePath: string): Promise<string> {
    const fullPath = path.join(this.basePath, relativePath);

    // Security: Ensure path is within MERIDIAN_HOME
    if (!fullPath.startsWith(this.basePath)) {
      throw new Error('Path traversal attempt detected');
    }

    try {
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read ${relativePath}: ${error}`);
    }
  }

  async writeFile(relativePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.basePath, relativePath);

    // Security: Ensure path is within MERIDIAN_HOME
    if (!fullPath.startsWith(this.basePath)) {
      throw new Error('Path traversal attempt detected');
    }

    try {
      await fs.writeFile(fullPath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write ${relativePath}: ${error}`);
    }
  }

  async fileExists(relativePath: string): Promise<boolean> {
    const fullPath = path.join(this.basePath, relativePath);

    if (!fullPath.startsWith(this.basePath)) {
      return false;
    }

    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async createBackup(relativePath: string): Promise<string> {
    const content = await this.readFile(relativePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `.lex-webui-backups/${path.basename(relativePath)}.${timestamp}.bak`;

    await this.writeFile(backupPath, content);
    return backupPath;
  }

  async readLogs(logFileName: string): Promise<Array<{ timestamp: string; level: 'info' | 'error' | 'warning'; message: string; context?: any }>> {
    const logPath = path.join('logs', logFileName);

    // Check if log file exists
    if (!await this.fileExists(logPath)) {
      return [];
    }

    try {
      const content = await this.readFile(logPath);
      const lines = content.split('\n');

      const logs: Array<{ timestamp: string; level: 'info' | 'error' | 'warning'; message: string }> = [];
      let currentLog: { timestamp: string; level: 'info' | 'error' | 'warning'; message: string } | null = null;

      for (const line of lines) {
        const trimmed = line.trim();

        // Skip completely empty lines
        if (!trimmed) {
          continue;
        }

        // Parse format: [YYYY-MM-DD HH:MM:SS] message
        const match = trimmed.match(/^\[([^\]]+)\]\s+(.+)$/);

        if (match) {
          // Save previous log entry if exists
          if (currentLog) {
            logs.push(currentLog);
          }

          const [, timestamp, message] = match;

          // Determine log level based on keywords
          let level: 'info' | 'error' | 'warning' = 'info';
          if (message.includes('ERROR') || message.includes('error') || message.includes('✗') || message.includes('Failed')) {
            level = 'error';
          } else if (message.includes('WARNING') || message.includes('warning') || message.includes('⚠')) {
            level = 'warning';
          }

          currentLog = {
            timestamp: new Date(timestamp).toISOString(),
            level,
            message,
          };
        } else if (currentLog) {
          // Line without timestamp - append to current log message
          currentLog.message += ' ' + trimmed;
        }
      }

      // Don't forget the last log entry
      if (currentLog) {
        logs.push(currentLog);
      }

      return logs;
    } catch (error) {
      console.error(`Failed to read log file ${logFileName}:`, error);
      return [];
    }
  }
}
