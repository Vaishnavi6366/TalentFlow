import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, Edit } from 'lucide-react';
import { jobsApi } from '../lib/api';
import type { Job } from '../lib/database.types';
import { JobModal } from '../components/JobModal';

export function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadJob();
  }, [jobId]);

  async function loadJob() {
    if (!jobId) return;

    try {
      setLoading(true);
      const data = await jobsApi.getJob(jobId);
      setJob(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleModalClose() {
    setModalOpen(false);
    loadJob();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 mb-4">Job not found</p>
        <Link to="/jobs" className="text-blue-600 hover:underline">
          Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/jobs"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{job.title}</h1>
              <p className="text-slate-600">/{job.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4" />
              Created {new Date(job.created_at).toLocaleDateString()}
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                job.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {job.status}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Description</h2>
          <p className="text-slate-600 whitespace-pre-wrap">
            {job.description || 'No description provided.'}
          </p>
        </div>

        {job.tags.length > 0 && (
          <div className="p-6 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Tags</h2>
            </div>
            <div className="flex gap-2 flex-wrap">
              {job.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Assessment</h3>
              <p className="text-sm text-slate-600">Create or edit the assessment for this job</p>
            </div>
            <Link
              to={`/jobs/${job.id}/assessment`}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Manage Assessment
            </Link>
          </div>
        </div>
      </div>

      {modalOpen && <JobModal job={job} onClose={handleModalClose} />}
    </div>
  );
}
