import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { QualityServiceSurveyEntity } from './quality-service-survey.entity';

@Entity('quality_service_categories')
export class QualityServiceCategoryEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'pk_quality_service_categories_id',
  })
  id: string;

  @Column()
  name: string;

  @Column()
  referenceId: string;

  @Column()
  companyToken: string;

  @OneToMany(() => QualityServiceSurveyEntity, (entity) => entity.category, {
    cascade: true,
  })
  surveys: QualityServiceSurveyEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  createdBy: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  updatedBy?: string;
}
