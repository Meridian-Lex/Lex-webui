"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateManager = void 0;
const lexFileSystem_1 = require("./lexFileSystem");
class StateManager {
    fs;
    constructor() {
        this.fs = new lexFileSystem_1.LexFileSystem();
    }
    async getStatus() {
        try {
            const content = await this.fs.readFile('STATE.md');
            // Parse STATE.md (simple markdown parsing)
            const mode = this.extractField(content, 'Current Mode') || 'IDLE';
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
        }
        catch (error) {
            // If STATE.md doesn't exist, return defaults
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
    async setMode(mode) {
        const content = await this.fs.readFile('STATE.md');
        const updated = this.updateField(content, 'Current Mode', mode);
        await this.fs.writeFile('STATE.md', updated);
    }
    extractField(content, field) {
        const regex = new RegExp(`\\*\\*${field}\\*\\*:?\\s*(.+)`, 'i');
        const match = content.match(regex);
        return match ? match[1].trim() : null;
    }
    updateField(content, field, value) {
        const regex = new RegExp(`(\\*\\*${field}\\*\\*:?\\s*)(.+)`, 'i');
        if (regex.test(content)) {
            return content.replace(regex, `$1${value}`);
        }
        else {
            // Field doesn't exist, append it
            return content + `\n\n**${field}**: ${value}`;
        }
    }
}
exports.StateManager = StateManager;
//# sourceMappingURL=stateManager.js.map