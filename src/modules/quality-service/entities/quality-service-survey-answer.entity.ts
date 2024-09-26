import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('quality_service_survey_answers')
export class QualityServiceSurveyAnswerEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'pk_quality_service_survey_answers_id',
  })
  id: string;

  @Column({ type: 'text' })
  rawInput: string;

  @Column({ type: 'text', nullable: true })
  rawOutput: string;

  @Column({ type: 'jsonb', nullable: true })
  answer: string;

  @Column()
  referenceId: string;

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
