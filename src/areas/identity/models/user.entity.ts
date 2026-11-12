import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type UserRole = 'consumer' | 'manufacturer' | 'inspector' | 'admin';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column()
  passwordHash: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'consumer',
  })
  role: UserRole;

  @Column({ default: true })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

