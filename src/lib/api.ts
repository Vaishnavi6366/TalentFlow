import { supabase } from './supabase';
import type { Job, Candidate, Assessment, TimelineEvent, JobStatus, CandidateStage } from './database.types';

const simulateLatency = () => new Promise(resolve => {
  const delay = Math.random() * 1000 + 200;
  setTimeout(resolve, delay);
});

const simulateError = () => {
  if (Math.random() < 0.08) {
    throw new Error('Simulated network error');
  }
};

export const jobsApi = {
  async getJobs(params: {
    search?: string;
    status?: JobStatus;
    page?: number;
    pageSize?: number;
    sort?: string;
  }) {
    await simulateLatency();

    const { search, status, page = 1, pageSize = 10, sort = 'order' } = params;

    let query = supabase.from('jobs').select('*', { count: 'exact' });

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    if (sort === 'order') {
      query = query.order('order', { ascending: true });
    } else if (sort === 'title') {
      query = query.order('title', { ascending: true });
    } else if (sort === 'created_at') {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return { data: data || [], total: count || 0 };
  },

  async createJob(job: Omit<Job, 'id' | 'created_at' | 'updated_at'>) {
    await simulateLatency();
    simulateError();

    const { data, error } = await supabase
      .from('jobs')
      .insert(job)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateJob(id: string, updates: Partial<Job>) {
    await simulateLatency();
    simulateError();

    const { data, error } = await supabase
      .from('jobs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async reorderJob(fromOrder: number, toOrder: number) {
    await simulateLatency();
    simulateError();

    const { data: jobs, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .order('order', { ascending: true });

    if (fetchError) throw fetchError;
    if (!jobs) return;

    const updatedJobs = [...jobs];
    const [movedJob] = updatedJobs.splice(fromOrder, 1);
    updatedJobs.splice(toOrder, 0, movedJob);

    const updates = updatedJobs.map((job, index) => ({
      id: job.id,
      order: index
    }));

    for (const update of updates) {
      await supabase
        .from('jobs')
        .update({ order: update.order })
        .eq('id', update.id);
    }
  },

  async getJob(id: string) {
    await simulateLatency();

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};

export const candidatesApi = {
  async getCandidates(params: {
    search?: string;
    stage?: CandidateStage;
    page?: number;
    pageSize?: number;
  }) {
    await simulateLatency();

    const { search, stage, page = 1, pageSize = 50 } = params;

    let query = supabase.from('candidates').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (stage) {
      query = query.eq('stage', stage);
    }

    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return { data: data || [], total: count || 0 };
  },

  async getCandidate(id: string) {
    await simulateLatency();

    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createCandidate(candidate: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>) {
    await simulateLatency();
    simulateError();

    const { data, error } = await supabase
      .from('candidates')
      .insert(candidate)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('candidate_timeline').insert({
      candidate_id: data.id,
      event_type: 'stage_change',
      from_stage: null,
      to_stage: candidate.stage,
      note: null
    });

    return data;
  },

  async updateCandidate(id: string, updates: Partial<Candidate>) {
    await simulateLatency();
    simulateError();

    if (updates.stage) {
      const { data: current } = await supabase
        .from('candidates')
        .select('stage')
        .eq('id', id)
        .single();

      if (current) {
        await supabase.from('candidate_timeline').insert({
          candidate_id: id,
          event_type: 'stage_change',
          from_stage: current.stage,
          to_stage: updates.stage,
          note: null
        });
      }
    }

    const { data, error } = await supabase
      .from('candidates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getTimeline(candidateId: string) {
    await simulateLatency();

    const { data, error } = await supabase
      .from('candidate_timeline')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async addNote(candidateId: string, note: string) {
    await simulateLatency();
    simulateError();

    const { error } = await supabase.from('candidate_timeline').insert({
      candidate_id: candidateId,
      event_type: 'note_added',
      from_stage: null,
      to_stage: null,
      note
    });

    if (error) throw error;
  }
};

export const assessmentsApi = {
  async getAssessment(jobId: string) {
    await simulateLatency();

    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('job_id', jobId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async saveAssessment(jobId: string, sections: any[]) {
    await simulateLatency();
    simulateError();

    const existing = await this.getAssessment(jobId);

    if (existing) {
      const { data, error } = await supabase
        .from('assessments')
        .update({ sections, updated_at: new Date().toISOString() })
        .eq('job_id', jobId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('assessments')
        .insert({ job_id: jobId, sections })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  async submitResponse(assessmentId: string, candidateId: string, responses: Record<string, any>) {
    await simulateLatency();
    simulateError();

    const { data, error } = await supabase
      .from('assessment_responses')
      .insert({ assessment_id: assessmentId, candidate_id: candidateId, responses })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('candidate_timeline').insert({
      candidate_id: candidateId,
      event_type: 'assessment_completed',
      from_stage: null,
      to_stage: null,
      note: 'Completed assessment'
    });

    return data;
  },

  async getResponse(assessmentId: string, candidateId: string) {
    await simulateLatency();

    const { data, error } = await supabase
      .from('assessment_responses')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('candidate_id', candidateId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};
