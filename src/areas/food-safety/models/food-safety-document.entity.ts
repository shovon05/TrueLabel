// Feature F06: Food safety documents & licence verification
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type DocumentType =
  | 'trade_licence'
  | 'halal'
  | 'iso22000'
  | 'lab_test'
  | 'gmp'
  | 'haccp'
  | 'organic';

export type DocumentStatus = 'pending' | 'approved' | 'rejected';

@Entity('food_safety_documents')
export class FoodSafetyDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 1 })
  manufacturerId: number;

  @Column({ length: 150 })
  companyName: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  documentType: DocumentType;

  @Index()
  @Column({ length: 100 })
  certificateNumber: string;

  @Column({ length: 150 })
  issuer: string; // e.g., 'BSTI', 'Islamic Foundation', 'ISO / SGS', 'BFSA'

  @Column({ type: 'date' })
  issueDate: string;

  @Column({ type: 'date' })
  expiryDate: string;

  @Column({ type: 'text', nullable: true })
  fileUrl: string;

  @Column({
    type: 'varchar',
    length: 30,
    default: 'pending',
  })
  status: DocumentStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  reviewedById: number;

  @Column({ length: 150, nullable: true })
  reviewedByName: string;

  @Column({ nullable: true })
  reviewDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
