import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { QualityServiceSurveyEntity } from './quality-service-survey.entity';
import { QualityServiceGoalEntity } from './quality-service-goal.entity';

@Entity('quality_service_groups')
export class QualityServiceGroupEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'pk_quality_service_groups_id',
  })
  id: string;

  @Column({ type: 'text' })
  instructions: string;

  @Column({ type: 'decimal' })
  samplingPercentage: number;

  @Column()
  referenceId: string;

  @Column()
  companyToken: string;

  @ManyToMany(() => QualityServiceGoalEntity)
  @JoinTable({
    name: 'quality_service_groups_goals',
    joinColumn: {
      foreignKeyConstraintName: 'fk_quality_service_groups_goals_group_id',
      name: 'group_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      foreignKeyConstraintName: 'fk_quality_service_groups_goals_goal_id',
      name: 'goal_id',
      referencedColumnName: 'id',
    },
  })
  goals: QualityServiceGoalEntity[];

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
