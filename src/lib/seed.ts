import { supabase } from './supabase';
import type { Job, Candidate, AssessmentSection } from './database.types';

const JOB_TITLES = [
  'Senior Frontend Developer',
  'Backend Engineer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Product Manager',
  'UX Designer',
  'Data Scientist',
  'Mobile Developer',
  'QA Engineer',
  'Technical Writer',
  'Security Engineer',
  'Cloud Architect',
  'ML Engineer',
  'Engineering Manager',
  'Sales Engineer',
  'Customer Success Manager',
  'Marketing Manager',
  'HR Coordinator',
  'Business Analyst',
  'Scrum Master',
  'Solutions Architect',
  'Site Reliability Engineer',
  'Database Administrator',
  'IT Support Specialist',
  'Content Strategist'
];

const TAGS = [
  'Remote',
  'Onsite',
  'Hybrid',
  'Full-time',
  'Contract',
  'Urgent',
  'Senior',
  'Junior',
  'Mid-level',
  'Tech',
  'Non-tech',
  'Leadership'
];

const FIRST_NAMES = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William',
  'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander',
  'Abigail', 'Michael', 'Emily', 'Daniel', 'Elizabeth', 'Matthew', 'Sofia', 'Joseph', 'Avery', 'David'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
];

const STAGES = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'] as const;

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function seedDatabase() {
  const { data: existingJobs } = await supabase.from('jobs').select('id').limit(1);

  if (existingJobs && existingJobs.length > 0) {
    console.log('Database already seeded');
    return;
  }

  console.log('Seeding database...');

  const jobs: Omit<Job, 'id' | 'created_at' | 'updated_at'>[] = JOB_TITLES.map((title, index) => ({
    title,
    slug: generateSlug(title),
    status: Math.random() > 0.3 ? 'active' : 'archived',
    tags: randomItems(TAGS, Math.floor(Math.random() * 4) + 1),
    order: index,
    description: `We are looking for an exceptional ${title} to join our growing team. This role offers competitive salary, benefits, and opportunities for growth.`
  }));

  const { data: insertedJobs, error: jobsError } = await supabase
    .from('jobs')
    .insert(jobs)
    .select();

  if (jobsError) {
    console.error('Error seeding jobs:', jobsError);
    return;
  }

  console.log(`Seeded ${insertedJobs.length} jobs`);

  const candidates: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>[] = [];

  for (let i = 0; i < 1000; i++) {
    const firstName = randomItem(FIRST_NAMES);
    const lastName = randomItem(LAST_NAMES);
    const job = randomItem(insertedJobs);

    candidates.push({
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      stage: randomItem(STAGES),
      job_id: job.id,
      notes: ''
    });
  }

  const batchSize = 100;
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const { error } = await supabase.from('candidates').insert(batch);

    if (error) {
      console.error(`Error seeding candidates batch ${i / batchSize + 1}:`, error);
    } else {
      console.log(`Seeded candidates ${i + 1}-${Math.min(i + batchSize, candidates.length)}`);
    }
  }

  const sampleAssessments = insertedJobs.slice(0, 5).map(job => {
    const sections: AssessmentSection[] = [
      {
        id: 'section-1',
        title: 'Background & Experience',
        questions: [
          {
            id: 'q1',
            type: 'short-text',
            text: 'What is your current job title?',
            required: true,
            maxLength: 100
          },
          {
            id: 'q2',
            type: 'numeric',
            text: 'How many years of relevant experience do you have?',
            required: true,
            minValue: 0,
            maxValue: 50
          },
          {
            id: 'q3',
            type: 'single-choice',
            text: 'What is your highest level of education?',
            required: true,
            options: ['High School', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Other']
          }
        ]
      },
      {
        id: 'section-2',
        title: 'Technical Skills',
        questions: [
          {
            id: 'q4',
            type: 'multi-choice',
            text: 'Which programming languages are you proficient in?',
            required: true,
            options: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'Other']
          },
          {
            id: 'q5',
            type: 'single-choice',
            text: 'Have you worked with React before?',
            required: true,
            options: ['Yes', 'No']
          },
          {
            id: 'q6',
            type: 'long-text',
            text: 'Please describe a complex project you worked on with React.',
            required: true,
            maxLength: 1000,
            conditionalOn: {
              questionId: 'q5',
              value: 'Yes'
            }
          }
        ]
      },
      {
        id: 'section-3',
        title: 'Motivation & Fit',
        questions: [
          {
            id: 'q7',
            type: 'long-text',
            text: 'Why are you interested in this position?',
            required: true,
            maxLength: 500
          },
          {
            id: 'q8',
            type: 'single-choice',
            text: 'What is your preferred work arrangement?',
            required: true,
            options: ['Remote', 'Hybrid', 'Onsite']
          },
          {
            id: 'q9',
            type: 'numeric',
            text: 'What is your expected salary (in thousands)?',
            required: false,
            minValue: 0,
            maxValue: 500
          },
          {
            id: 'q10',
            type: 'file',
            text: 'Upload your resume (PDF)',
            required: true
          }
        ]
      }
    ];

    return {
      job_id: job.id,
      sections
    };
  });

  for (const assessment of sampleAssessments) {
    const { error } = await supabase.from('assessments').insert(assessment);
    if (error) {
      console.error('Error seeding assessment:', error);
    }
  }

  console.log(`Seeded ${sampleAssessments.length} assessments`);
  console.log('Database seeding complete!');
}
