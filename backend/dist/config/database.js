"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("../models/User");
const AuditLog_1 = require("../models/AuditLog");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [User_1.User, AuditLog_1.AuditLog],
    migrations: ['dist/migrations/*.js'],
    synchronize: false, // Never use in production
    logging: process.env.NODE_ENV === 'development',
});
//# sourceMappingURL=database.js.map