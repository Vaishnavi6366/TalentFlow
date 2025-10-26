import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Calendar, MessageSquare, Activity, CheckCircle, XCircle } from 'lucide-react';
import { candidatesApi } from '../lib/api';
import type { Candidate, TimelineEvent, CandidateStage } from '../lib/database.types';

const STAGES: CandidateStage[] = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'];

const STAGE_COLORS: Record<CandidateStage, string> = {
  applied: 'bg-blue-100 text-blue-700',
  screen: 'bg-yellow-100 text-yellow-700',
  tech: 'bg-purple-100 text-purple-700',
  offer: 'bg-green-100 text-green-700',
  hired: 'bg-green-200 text-green-800',
  rejected: 'bg-red-100 text-red-700'
};

function TimelineItem({ event }: { event: TimelineEvent }) {
  const getIcon = () => {
    switch (event.event_type) {
      case 'stage_change':
        return <Activity className="w-5 h-5" />;
      case 'note_added':
        return <MessageSquare className="w-5 h-5" />;
      case 'assessment_completed':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getColor = () => {
    if (event.event_type === 'stage_change' && event.to_stage === 'rejected') {
      return 'bg-red-100 text-red-600';
    }
    if (event.event_type === 'stage_change' && event.to_stage === 'hired') {
      return 'bg-green-100 text-green-600';
    }
    return 'bg-blue-100 text-blue-600';
  };

  const getDescription = () => {
    if (event.event_type === 'stage_change') {
      if (event.from_stage && event.to_stage) {
        return `Moved from ${event.from_stage} to ${event.to_stage}`;
      }
      return `Stage set to ${event.to_stage}`;
    }
    if (event.event_type === 'note_added') {
      return event.note || 'Note added';
    }
    if (event.event_type === 'assessment_completed') {
      return 'Completed assessment';
    }
    return 'Event occurred';
  };

  return (
    <div className="flex gap-4">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getColor()}`}>
        {getIcon()}
      </div>
      <div className="flex-1 pb-8">
        <p className="text-slate-900 font-medium">{getDescription()}</p>
        <p className="text-sm text-slate-500 mt-1">
          {new Date(event.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export function CandidateDetailPage() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    loadCandidate();
  }, [candidateId]);

  async function loadCandidate() {
    if (!candidateId) return;

    try {
      setLoading(true);
      const [candidateData, timelineData] = await Promise.all([
        candidatesApi.getCandidate(candidateId),
        candidatesApi.getTimeline(candidateId)
      ]);

      setCandidate(candidateData);
      setTimeline(timelineData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStageChange(newStage: CandidateStage) {
    if (!candidate) return;

    try {
      await candidatesApi.updateCandidate(candidate.id, { stage: newStage });
      await loadCandidate();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!candidate || !note.trim()) return;

    try {
      setAddingNote(true);
      await candidatesApi.addNote(candidate.id, note.trim());
      setNote('');
      await loadCandidate();
    } catch (err) {
      console.error(err);
    } finally {
      setAddingNote(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 mb-4">Candidate not found</p>
        <Link to="/candidates" className="text-blue-600 hover:underline">
          Back to Candidates
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/candidates"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Candidates
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{candidate.name}</h1>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4" />
                  <span>{candidate.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                  <Calendar className="w-4 h-4" />
                  <span>Applied {new Date(candidate.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <span className={`px-4 py-2 text-sm font-medium rounded-full ${STAGE_COLORS[candidate.stage]}`}>
                {candidate.stage}
              </span>
            </div>

            <div>
              <h2 className="font-semibold text-slate-900 mb-3">Move to Stage</h2>
              <div className="flex gap-2 flex-wrap">
                {STAGES.map(stage => (
                  <button
                    key={stage}
                    onClick={() => handleStageChange(stage)}
                    disabled={candidate.stage === stage}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      candidate.stage === stage
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600'
                    }`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add Note</h2>
            <form onSubmit={handleAddNote} className="space-y-4">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Add a note... (use @ to mention team members)"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!note.trim() || addingNote}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingNote ? 'Adding...' : 'Add Note'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Timeline</h2>

            {timeline.length === 0 ? (
              <p className="text-slate-600 text-center py-8">No events yet</p>
            ) : (
              <div className="space-y-2">
                {timeline.map(event => (
                  <TimelineItem key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
