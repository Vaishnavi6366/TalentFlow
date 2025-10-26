/*
  # TalentFlow Database Schema

  1. New Tables
    - `jobs`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `slug` (text, unique, required)
      - `status` (text, active|archived)
      - `tags` (text array)
      - `order` (integer, for drag-drop ordering)
      - `description` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `candidates`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `email` (text, unique, required)
      - `stage` (text, applied|screen|tech|offer|hired|rejected)
      - `job_id` (uuid, references jobs)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `assessments`
      - `id` (uuid, primary key)
      - `job_id` (uuid, references jobs, unique)
      - `sections` (jsonb, stores assessment structure)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `assessment_responses`
      - `id` (uuid, primary key)
      - `assessment_id` (uuid, references assessments)
      - `candidate_id` (uuid, references candidates)
      - `responses` (jsonb, stores answers)
      - `submitted_at` (timestamptz)
    
    - `candidate_timeline`
      - `id` (uuid, primary key)
      - `candidate_id` (uuid, references candidates)
      - `event_type` (text, stage_change|note_added|assessment_completed)
      - `from_stage` (text)
      - `to_stage` (text)
      - `note` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (no auth required for demo)
    - All tables have proper indexes for performance
*/

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active',
  tags text[] DEFAULT '{}',
  "order" integer NOT NULL DEFAULT 0,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_order ON jobs("order");

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  stage text NOT NULL DEFAULT 'applied',
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidates_stage ON candidates(stage);
CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_name ON candidates(name);

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid UNIQUE NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sections jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessments_job_id ON assessments(job_id);

-- Assessment responses table
CREATE TABLE IF NOT EXISTS assessment_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  responses jsonb NOT NULL DEFAULT '{}',
  submitted_at timestamptz DEFAULT now(),
  UNIQUE(assessment_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_assessment_responses_candidate ON assessment_responses(candidate_id);

-- Candidate timeline table
CREATE TABLE IF NOT EXISTS candidate_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_stage text,
  to_stage text,
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidate_timeline_candidate ON candidate_timeline(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_timeline_created ON candidate_timeline(created_at DESC);

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_timeline ENABLE ROW LEVEL SECURITY;

-- Public access policies (demo app, no auth required)
CREATE POLICY "Public can read jobs"
  ON jobs FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert jobs"
  ON jobs FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update jobs"
  ON jobs FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete jobs"
  ON jobs FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Public can read candidates"
  ON candidates FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert candidates"
  ON candidates FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update candidates"
  ON candidates FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete candidates"
  ON candidates FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Public can read assessments"
  ON assessments FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert assessments"
  ON assessments FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update assessments"
  ON assessments FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete assessments"
  ON assessments FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Public can read assessment_responses"
  ON assessment_responses FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert assessment_responses"
  ON assessment_responses FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update assessment_responses"
  ON assessment_responses FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can read candidate_timeline"
  ON candidate_timeline FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert candidate_timeline"
  ON candidate_timeline FOR INSERT
  TO anon
  WITH CHECK (true);