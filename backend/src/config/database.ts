import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, AuditLog],
  migrations: ['dist/migrations/*.js'],
  synchronize: false, // Never use in production
  logging: process.env.NODE_ENV === 'development',
});
