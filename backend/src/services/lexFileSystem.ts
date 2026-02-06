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
}
