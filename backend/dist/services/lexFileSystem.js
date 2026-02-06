"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LexFileSystem = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const MERIDIAN_HOME = process.env.MERIDIAN_HOME || '/home/meridian/meridian-home';
class LexFileSystem {
    basePath;
    constructor() {
        this.basePath = MERIDIAN_HOME;
    }
    async readFile(relativePath) {
        const fullPath = path_1.default.join(this.basePath, relativePath);
        // Security: Ensure path is within MERIDIAN_HOME
        if (!fullPath.startsWith(this.basePath)) {
            throw new Error('Path traversal attempt detected');
        }
        try {
            return await promises_1.default.readFile(fullPath, 'utf-8');
        }
        catch (error) {
            throw new Error(`Failed to read ${relativePath}: ${error}`);
        }
    }
    async writeFile(relativePath, content) {
        const fullPath = path_1.default.join(this.basePath, relativePath);
        // Security: Ensure path is within MERIDIAN_HOME
        if (!fullPath.startsWith(this.basePath)) {
            throw new Error('Path traversal attempt detected');
        }
        try {
            await promises_1.default.writeFile(fullPath, content, 'utf-8');
        }
        catch (error) {
            throw new Error(`Failed to write ${relativePath}: ${error}`);
        }
    }
    async fileExists(relativePath) {
        const fullPath = path_1.default.join(this.basePath, relativePath);
        if (!fullPath.startsWith(this.basePath)) {
            return false;
        }
        try {
            await promises_1.default.access(fullPath);
            return true;
        }
        catch {
            return false;
        }
    }
    async createBackup(relativePath) {
        const content = await this.readFile(relativePath);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `.lex-webui-backups/${path_1.default.basename(relativePath)}.${timestamp}.bak`;
        await this.writeFile(backupPath, content);
        return backupPath;
    }
}
exports.LexFileSystem = LexFileSystem;
//# sourceMappingURL=lexFileSystem.js.map