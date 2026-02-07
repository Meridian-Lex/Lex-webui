import { LexFileSystem } from './lexFileSystem';
import { Project } from '../types';

export class ProjectMapService {
  private readonly fs: LexFileSystem;

  constructor() {
    this.fs = new LexFileSystem();
  }

  async getProjects(): Promise<Project[]> {
    try {
      const content = await this.fs.readFile('PROJECT-MAP.md');
      return this.parseProjectMap(content);
    } catch (error) {
      console.error('Failed to read PROJECT-MAP.md:', error);
      return [];
    }
  }

  private parseProjectMap(content: string): Project[] {
    const projects: Project[] = [];

    // Simple parser - looks for project entries
    // Format: ## ProjectName
    const projectRegex = /^##\s+(.+)$/gm;
    let match;

    while ((match = projectRegex.exec(content)) !== null) {
      const name = match[1].trim();
      const startIndex = match.index;
      const nextMatch = projectRegex.exec(content);
      const endIndex = nextMatch ? nextMatch.index : content.length;

      // Reset regex for next iteration
      if (nextMatch) {
        projectRegex.lastIndex = nextMatch.index;
      }

      const section = content.substring(startIndex, endIndex);

      projects.push({
        name,
        path: this.extractPath(section) || `/projects/${name}`,
        status: this.extractStatus(section) || 'active',
        lastActivity: null, // TODO: Parse from git
        relationships: this.extractRelationships(section),
      });
    }

    return projects;
  }

  private extractPath(section: string): string | null {
    const match = section.match(/\*\*Path\*\*:?\s*(.+)/i);
    return match ? match[1].trim() : null;
  }

  private extractStatus(section: string): string | null {
    const match = section.match(/\*\*Status\*\*:?\s*(.+)/i);
    return match ? match[1].trim() : null;
  }

  private extractRelationships(section: string): string[] {
    const match = section.match(/\*\*Related\*\*:?\s*(.+)/i);
    if (!match) return [];

    return match[1]
      .split(',')
      .map(r => r.trim())
      .filter(r => r.length > 0);
  }
}
