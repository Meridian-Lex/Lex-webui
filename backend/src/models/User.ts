import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 255 })
  username!: string;

  @Column({ length: 255, name: 'password_hash' })
  passwordHash!: string;

  @Column({ length: 50, default: 'admin' })
  role!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login' })
  lastLogin!: Date | null;
}
