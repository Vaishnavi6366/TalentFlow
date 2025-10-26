import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, GripVertical, Edit, Archive, ArchiveRestore, ExternalLink } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { jobsApi } from '../lib/api';
import type { Job, JobStatus } from '../lib/database.types';
import { JobModal } from '../components/JobModal';

function SortableJobRow({ job, onEdit, onToggleArchive }: { job: Job; onEdit: (job: Job) => void; onToggleArchive: (job: Job) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-4">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
          <GripVertical className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <Link to={`/jobs/${job.id}`} className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors">
              {job.title}
            </Link>
            {job.status === 'archived' && (
              <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded">
                Archived
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {job.tags.map(tag => (
              <span key={tag} className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/jobs/${job.id}/assessment`}
            className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>

          <button
            onClick={() => onEdit(job)}
            className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>

          <button
            onClick={() => onToggleArchive(job)}
            className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
          >
            {job.status === 'archived' ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 10;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadJobs();
  }, [search, statusFilter, page]);

  async function loadJobs() {
    try {
      setLoading(true);
      setError(null);
      const result = await jobsApi.getJobs({
        search,
        status: statusFilter || undefined,
        page,
        pageSize,
        sort: 'order'
      });
      setJobs(result.data);
      setTotal(result.total);
    } catch (err) {
      setError('Failed to load jobs. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = jobs.findIndex(job => job.id === active.id);
    const newIndex = jobs.findIndex(job => job.id === over.id);

    const newJobs = arrayMove(jobs, oldIndex, newIndex);
    setJobs(newJobs);

    try {
      await jobsApi.reorderJob(oldIndex, newIndex);
    } catch (err) {
      setError('Failed to reorder jobs. Reverting changes.');
      setJobs(jobs);
      setTimeout(() => setError(null), 3000);
    }
  }

  function handleEdit(job: Job) {
    setEditingJob(job);
    setModalOpen(true);
  }

  function handleCreate() {
    setEditingJob(null);
    setModalOpen(true);
  }

  async function handleToggleArchive(job: Job) {
    try {
      const newStatus: JobStatus = job.status === 'archived' ? 'active' : 'archived';
      await jobsApi.updateJob(job.id, { status: newStatus });
      await loadJobs();
    } catch (err) {
      setError('Failed to update job status');
      setTimeout(() => setError(null), 3000);
    }
  }

  function handleModalClose() {
    setModalOpen(false);
    setEditingJob(null);
    loadJobs();
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Jobs</h1>
          <p className="text-slate-600 mt-1">Manage your job openings</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Job
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="text-slate-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as JobStatus | '');
                setPage(1);
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <p className="text-slate-600">No jobs found. Create your first job to get started!</p>
        </div>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {jobs.map(job => (
                  <SortableJobRow
                    key={job.id}
                    job={job}
                    onEdit={handleEdit}
                    onToggleArchive={handleToggleArchive}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {modalOpen && <JobModal job={editingJob} onClose={handleModalClose} />}
    </div>
  );
}
