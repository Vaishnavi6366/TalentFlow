import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { Mail, User } from 'lucide-react';
import { candidatesApi } from '../lib/api';
import type { Candidate, CandidateStage } from '../lib/database.types';

const STAGES: { id: CandidateStage; title: string; color: string }[] = [
  { id: 'applied', title: 'Applied', color: 'border-blue-300 bg-blue-50' },
  { id: 'screen', title: 'Screening', color: 'border-yellow-300 bg-yellow-50' },
  { id: 'tech', title: 'Technical', color: 'border-purple-300 bg-purple-50' },
  { id: 'offer', title: 'Offer', color: 'border-green-300 bg-green-50' },
  { id: 'hired', title: 'Hired', color: 'border-green-400 bg-green-100' },
  { id: 'rejected', title: 'Rejected', color: 'border-red-300 bg-red-50' }
];

function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <Link
      to={`/candidates/${candidate.id}`}
      className="block bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 text-sm truncate">
            {candidate.name}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <Mail className="w-3 h-3" />
            <span className="truncate">{candidate.email}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Column({ stage, candidates, onDrop }: { stage: typeof STAGES[0]; candidates: Candidate[]; onDrop: (id: string, newStage: CandidateStage) => void }) {
  return (
    <div className="flex-1 min-w-[280px]">
      <div className={`rounded-lg border-2 ${stage.color} h-full flex flex-col`}>
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900">{stage.title}</h2>
          <p className="text-sm text-slate-600">{candidates.length} candidates</p>
        </div>

        <div
          className="flex-1 p-4 space-y-3 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 300px)' }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const candidateId = e.dataTransfer.getData('candidateId');
            if (candidateId) {
              onDrop(candidateId, stage.id);
            }
          }}
        >
          {candidates.map(candidate => (
            <div
              key={candidate.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('candidateId', candidate.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
            >
              <CandidateCard candidate={candidate} />
            </div>
          ))}

          {candidates.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">
              No candidates in this stage
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function KanbanPage() {
  const [candidatesByStage, setCandidatesByStage] = useState<Record<CandidateStage, Candidate[]>>({
    applied: [],
    screen: [],
    tech: [],
    offer: [],
    hired: [],
    rejected: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCandidates();
  }, []);

  async function loadCandidates() {
    try {
      setLoading(true);
      setError(null);

      const results = await Promise.all(
        STAGES.map(stage =>
          candidatesApi.getCandidates({ stage: stage.id, page: 1, pageSize: 100 })
        )
      );

      const byStage: Record<CandidateStage, Candidate[]> = {
        applied: [],
        screen: [],
        tech: [],
        offer: [],
        hired: [],
        rejected: []
      };

      STAGES.forEach((stage, index) => {
        byStage[stage.id] = results[index].data;
      });

      setCandidatesByStage(byStage);
    } catch (err) {
      setError('Failed to load candidates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDrop(candidateId: string, newStage: CandidateStage) {
    const currentStage = STAGES.find(s =>
      candidatesByStage[s.id].some(c => c.id === candidateId)
    );

    if (!currentStage || currentStage.id === newStage) return;

    const candidate = candidatesByStage[currentStage.id].find(c => c.id === candidateId);
    if (!candidate) return;

    const newByStage = { ...candidatesByStage };
    newByStage[currentStage.id] = newByStage[currentStage.id].filter(c => c.id !== candidateId);
    newByStage[newStage] = [...newByStage[newStage], { ...candidate, stage: newStage }];

    setCandidatesByStage(newByStage);

    try {
      await candidatesApi.updateCandidate(candidateId, { stage: newStage });
    } catch (err) {
      setError('Failed to update candidate. Reverting changes.');
      setCandidatesByStage(candidatesByStage);
      setTimeout(() => setError(null), 3000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Kanban Board</h1>
        <p className="text-slate-600 mt-1">Drag candidates between stages to update their status</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(stage => (
          <Column
            key={stage.id}
            stage={stage}
            candidates={candidatesByStage[stage.id]}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
}
