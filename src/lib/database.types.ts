export type JobStatus = 'active' | 'archived';
export type CandidateStage = 'applied' | 'screen' | 'tech' | 'offer' | 'hired' | 'rejected';
export type TimelineEventType = 'stage_change' | 'note_added' | 'assessment_completed';

export interface Job {
  id: string;
  title: string;
  slug: string;
  status: JobStatus;
  tags: string[];
  order: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  stage: CandidateStage;
  job_id: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  job_id: string;
  sections: AssessmentSection[];
  created_at: string;
  updated_at: string;
}

export interface AssessmentSection {
  id: string;
  title: string;
  questions: Question[];
}

export type QuestionType = 'single-choice' | 'multi-choice' | 'short-text' | 'long-text' | 'numeric' | 'file';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: string[];
  minValue?: number;
  maxValue?: number;
  maxLength?: number;
  conditionalOn?: {
    questionId: string;
    value: string | string[];
  };
}

export interface AssessmentResponse {
  id: string;
  assessment_id: string;
  candidate_id: string;
  responses: Record<string, any>;
  submitted_at: string;
}

export interface TimelineEvent {
  id: string;
  candidate_id: string;
  event_type: TimelineEventType;
  from_stage: string | null;
  to_stage: string | null;
  note: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: Job;
        Insert: Omit<Job, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Job, 'id' | 'created_at' | 'updated_at'>>;
      };
      candidates: {
        Row: Candidate;
        Insert: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Candidate, 'id' | 'created_at' | 'updated_at'>>;
      };
      assessments: {
        Row: Assessment;
        Insert: Omit<Assessment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Assessment, 'id' | 'created_at' | 'updated_at'>>;
      };
      assessment_responses: {
        Row: AssessmentResponse;
        Insert: Omit<AssessmentResponse, 'id' | 'submitted_at'>;
        Update: Partial<Omit<AssessmentResponse, 'id' | 'submitted_at'>>;
      };
      candidate_timeline: {
        Row: TimelineEvent;
        Insert: Omit<TimelineEvent, 'id' | 'created_at'>;
        Update: Partial<Omit<TimelineEvent, 'id' | 'created_at'>>;
      };
    };
  };
}
