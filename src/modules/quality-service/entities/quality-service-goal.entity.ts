import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('quality_service_goals')
export class QualityServiceGoalEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'pk_quality_service_goals_id',
  })
  id: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  instruction: string;

  @Column({ nullable: true })
  referenceId?: string;

  @Column()
  companyToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  createdBy: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  updatedBy?: string;
}
