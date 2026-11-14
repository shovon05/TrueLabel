// Feature F06: Food safety documents & licence verification
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type LicenceStatus = 'valid' | 'expired' | 'suspended' | 'revoked';

@Entity('manufacturer_licences')
export class ManufacturerLicence {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ unique: true, length: 100 })
  licenceNumber: string;

  @Column({ length: 150 })
  companyName: string;

  @Column({ length: 150 })
  authority: string; // e.g. 'BSTI', 'BFSA', 'FDA'

  @Column({ length: 100 })
  category: string; // e.g. 'Packaged Food & Dairy', 'Beverages & Syrups'

  @Column({ type: 'date' })
  issueDate: string;

  @Column({ type: 'date' })
  expiryDate: string;

  @Column({
    type: 'varchar',
    length: 30,
    default: 'valid',
  })
  status: LicenceStatus;

  @Column({ length: 255, nullable: true })
  address: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
