import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { FoodProduct } from '../../food-catalog/models/food-product.entity';
import { User } from '../../identity/models/user.entity';

export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';
export type ReportCategory = 'quality' | 'expired' | 'label' | 'allergen' | 'other';

// F13: These reports must never be exposed through a public route.
@Entity('food_reports')
export class FoodReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @ManyToOne(() => FoodProduct, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: FoodProduct;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  author: User;

  @Column({ type: 'varchar', length: 20 })
  category: ReportCategory;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: ReportStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
