"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialSchema1707258000000 = void 0;
const typeorm_1 = require("typeorm");
class InitialSchema1707258000000 {
    async up(queryRunner) {
        // Users table
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'users',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    default: 'gen_random_uuid()',
                },
                {
                    name: 'username',
                    type: 'varchar',
                    length: '255',
                    isUnique: true,
                    isNullable: false,
                },
                {
                    name: 'password_hash',
                    type: 'varchar',
                    length: '255',
                    isNullable: false,
                },
                {
                    name: 'role',
                    type: 'varchar',
                    length: '50',
                    default: "'admin'",
                },
                {
                    name: 'created_at',
                    type: 'timestamp',
                    default: 'now()',
                },
                {
                    name: 'last_login',
                    type: 'timestamp',
                    isNullable: true,
                },
            ],
        }), true);
        await queryRunner.createIndex('users', new typeorm_1.TableIndex({
            name: 'idx_users_username',
            columnNames: ['username'],
        }));
        // Sessions table (for connect-pg-simple)
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'session',
            columns: [
                {
                    name: 'sid',
                    type: 'varchar',
                    isPrimary: true,
                },
                {
                    name: 'sess',
                    type: 'json',
                    isNullable: false,
                },
                {
                    name: 'expire',
                    type: 'timestamp',
                    isNullable: false,
                },
            ],
        }), true);
        await queryRunner.createIndex('session', new typeorm_1.TableIndex({
            name: 'idx_session_expire',
            columnNames: ['expire'],
        }));
        // Audit logs table
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'audit_logs',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    default: 'gen_random_uuid()',
                },
                {
                    name: 'user_id',
                    type: 'uuid',
                    isNullable: true,
                },
                {
                    name: 'action',
                    type: 'varchar',
                    length: '255',
                    isNullable: false,
                },
                {
                    name: 'resource',
                    type: 'varchar',
                    length: '255',
                    isNullable: true,
                },
                {
                    name: 'details',
                    type: 'jsonb',
                    isNullable: true,
                },
                {
                    name: 'ip_address',
                    type: 'varchar',
                    length: '45',
                    isNullable: true,
                },
                {
                    name: 'timestamp',
                    type: 'timestamp',
                    default: 'now()',
                },
            ],
        }), true);
        await queryRunner.createIndex('audit_logs', new typeorm_1.TableIndex({
            name: 'idx_audit_logs_user',
            columnNames: ['user_id'],
        }));
        await queryRunner.createIndex('audit_logs', new typeorm_1.TableIndex({
            name: 'idx_audit_logs_timestamp',
            columnNames: ['timestamp'],
        }));
        await queryRunner.createIndex('audit_logs', new typeorm_1.TableIndex({
            name: 'idx_audit_logs_action',
            columnNames: ['action'],
        }));
        await queryRunner.createForeignKey('audit_logs', new typeorm_1.TableForeignKey({
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'SET NULL',
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropTable('audit_logs');
        await queryRunner.dropTable('session');
        await queryRunner.dropTable('users');
    }
}
exports.InitialSchema1707258000000 = InitialSchema1707258000000;
//# sourceMappingURL=1707258000000-InitialSchema.js.map