import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Mail, User } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { candidatesApi } from '../lib/api';
import type { Candidate, CandidateStage } from '../lib/database.types';

const STAGES: { value: CandidateStage | ''; label: string }[] = [
  { value: '', label: 'All Stages' },
  { value: 'applied', label: 'Applied' },
  { value: 'screen', label: 'Screen' },
  { value: 'tech', label: 'Technical' },
  { value: 'offer', label: 'Offer' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' }
];

const STAGE_COLORS: Record<CandidateStage, string> = {
  applied: 'bg-blue-100 text-blue-700',
  screen: 'bg-yellow-100 text-yellow-700',
  tech: 'bg-purple-100 text-purple-700',
  offer: 'bg-green-100 text-green-700',
  hired: 'bg-green-200 text-green-800',
  rejected: 'bg-red-100 text-red-700'
};

export function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<CandidateStage | ''>('');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: candidates.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 10,
  });

  useEffect(() => {
    setCandidates([]);
    setPage(1);
    setHasMore(true);
    loadCandidates(1, true);
  }, [search, stageFilter]);

  useEffect(() => {
    if (page > 1) {
      loadCandidates(page, false);
    }
  }, [page]);

  async function loadCandidates(pageNum: number, reset: boolean) {
    try {
      setLoading(true);
      const result = await candidatesApi.getCandidates({
        search,
        stage: stageFilter || undefined,
        page: pageNum,
        pageSize: 50
      });

      if (reset) {
        setCandidates(result.data);
      } else {
        setCandidates(prev => [...prev, ...result.data]);
      }

      setHasMore(result.data.length === 50);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const target = e.target as HTMLDivElement;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;

    if (bottom && !loading && hasMore) {
      setPage(p => p + 1);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Candidates</h1>
        <p className="text-slate-600 mt-1">Browse and manage candidate applications</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="text-slate-400 w-5 h-5" />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as CandidateStage | '')}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STAGES.map(stage => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="text-sm text-slate-600 mb-4">
          Showing {candidates.length} candidates
          {search || stageFilter ? ' (filtered)' : ''}
        </div>

        <div
          ref={parentRef}
          onScroll={handleScroll}
          className="h-[600px] overflow-auto border border-slate-200 rounded-lg"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const candidate = candidates[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <Link
                    to={`/candidates/${candidate.id}`}
                    className="block h-full px-4 py-3 hover:bg-slate-50 border-b border-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {candidate.name}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{candidate.email}</span>
                        </div>
                      </div>

                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${STAGE_COLORS[candidate.stage]}`}>
                        {candidate.stage}
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
