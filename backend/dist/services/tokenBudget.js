"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenBudgetService = void 0;
const lexFileSystem_1 = require("./lexFileSystem");
const js_yaml_1 = __importDefault(require("js-yaml"));
class TokenBudgetService {
    fs;
    constructor() {
        this.fs = new lexFileSystem_1.LexFileSystem();
    }
    async getBudget() {
        try {
            const content = await this.fs.readFile('LEX-CONFIG.yaml');
            const config = js_yaml_1.default.load(content);
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
        }
        catch (error) {
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
exports.TokenBudgetService = TokenBudgetService;
//# sourceMappingURL=tokenBudget.js.map