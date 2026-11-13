import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { FoodProduct } from '../../food-catalog/models/food-product.entity';
import { User } from '../../identity/models/user.entity';

// F11: One review per user per product.
@Entity('food_reviews')
@Unique(['productId', 'userId'])
export class FoodReview {
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

  @Column({ type: 'int' })
  rating: number;

  @Column({ length: 120, default: '' })
  title: string;

  @Column({ type: 'text' })
  comment: string;

  @Column({ type: 'text', nullable: true })
  manufacturerReply: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  repliedAt: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
