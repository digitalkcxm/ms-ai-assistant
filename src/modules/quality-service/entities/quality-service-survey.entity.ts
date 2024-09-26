import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { QualityServiceCategoryEntity } from './quality-service-category.entity';
import { QualityServiceGroupEntity } from './quality-service-group.entity';

@Entity('quality_service_surveys')
export class QualityServiceSurveyEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'pk_quality_service_surveys_id',
  })
  id: string;

  @Column()
  question: string;

  @Column()
  categoryId: string;

  @ManyToOne(() => QualityServiceCategoryEntity, (entity) => entity.id)
  @JoinColumn({
    foreignKeyConstraintName: 'fk_quality_service_surveys_category_id',
    name: 'category_id',
    referencedColumnName: 'id',
  })
  category: QualityServiceCategoryEntity;

  @Column()
  groupId: string;

  @ManyToOne(() => QualityServiceGroupEntity, (entity) => entity.id)
  @JoinColumn({
    foreignKeyConstraintName: 'fk_quality_service_surveys_group_id',
    name: 'group_id',
    referencedColumnName: 'id',
  })
  group: QualityServiceGroupEntity;

  @Column({ type: 'decimal' })
  weight: number;

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
