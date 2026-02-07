import { LexFileSystem } from './lexFileSystem';
import { Project } from '../types';

export class ProjectMapService {
  private readonly fs: LexFileSystem;

  constructor() {
    this.fs = new LexFileSystem();
  }

  async getProjects(): Promise<Project[]> {
    try {
      const content = await this.fs.readFile('lex-internal/state/PROJECT-MAP.md');
      return this.parseProjectMap(content);
    } catch (error) {
      console.error('Failed to read PROJECT-MAP.md:', error);
      return [];
    }
  }

  private parseProjectMap(content: string): Project[] {
    const projects: Project[] = [];

    // Parse table format: | Project Name | Status | Path | ...
    const lines = content.split('\n');
    let inTable = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip table header and separator rows
      if (trimmed.startsWith('| Project Name') || trimmed.startsWith('|---')) {
        inTable = true;
        continue;
      }

      // Parse table rows
      if (inTable && trimmed.startsWith('|') && !trimmed.startsWith('|---')) {
        const cells = trimmed.split('|').map((cell) => cell.trim()).filter((cell) => cell.length > 0);

        if (cells.length >= 3) {
          const [name, status, path, , , notes] = cells;

          // Skip if this looks like archived/completed projects
          if (status && status.toUpperCase() !== 'ARCHIVED') {
            projects.push({
              name,
              path: path || `~/meridian-home/projects/${name}`,
              status: status.toLowerCase(),
              lastActivity: null,
              relationships: [],
            });
          }
        }
      }

      // Stop when table ends
      if (inTable && trimmed && !trimmed.startsWith('|')) {
        break;
      }
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
      .map((r) => r.trim())
      .filter((r) => r.length > 0);
  }

  async getProjectGraph(): Promise<{
    nodes: Array<{ id: string; name: string; status: string; description?: string }>;
    links: Array<{ source: string; target: string; type: string }>;
  }> {
    const projects = await this.getProjects();

    const nodes = projects.map((project) => ({
      id: project.name,
      name: project.name,
      status: project.status,
      description: `Path: ${project.path}`,
    }));

    const links: Array<{ source: string; target: string; type: string }> = [];

    // Create links based on relationships
    projects.forEach((project) => {
      project.relationships.forEach((related) => {
        // Only create link if the related project exists
        if (projects.some((p) => p.name === related)) {
          links.push({
            source: project.name,
            target: related,
            type: 'related',
          });
        }
      });
    });

    return { nodes, links };
  }
}
