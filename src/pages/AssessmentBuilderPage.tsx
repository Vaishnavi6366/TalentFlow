import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, GripVertical, Eye } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { jobsApi, assessmentsApi } from '../lib/api';
import type { Job, AssessmentSection, Question, QuestionType } from '../lib/database.types';
import { AssessmentPreview } from '../components/AssessmentPreview';

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'short-text', label: 'Short Text' },
  { value: 'long-text', label: 'Long Text' },
  { value: 'single-choice', label: 'Single Choice' },
  { value: 'multi-choice', label: 'Multiple Choice' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'file', label: 'File Upload' }
];

function SortableQuestion({ question, sectionId, onUpdate, onDelete }: { question: Question; sectionId: string; onUpdate: (q: Question) => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <div className="flex items-start gap-3 mb-3">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 mt-2">
          <GripVertical className="w-5 h-5" />
        </button>

        <div className="flex-1 space-y-3">
          <div className="flex gap-3">
            <select
              value={question.type}
              onChange={(e) => onUpdate({ ...question, type: e.target.value as QuestionType })}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {QUESTION_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => onUpdate({ ...question, required: e.target.checked })}
                className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">Required</span>
            </label>
          </div>

          <input
            type="text"
            value={question.text}
            onChange={(e) => onUpdate({ ...question, text: e.target.value })}
            placeholder="Question text"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {(question.type === 'single-choice' || question.type === 'multi-choice') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Options (comma separated)</label>
              <input
                type="text"
                value={question.options?.join(', ') || ''}
                onChange={(e) => onUpdate({ ...question, options: e.target.value.split(',').map(o => o.trim()).filter(o => o) })}
                placeholder="Option 1, Option 2, Option 3"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {question.type === 'numeric' && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Min Value</label>
                <input
                  type="number"
                  value={question.minValue ?? ''}
                  onChange={(e) => onUpdate({ ...question, minValue: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Value</label>
                <input
                  type="number"
                  value={question.maxValue ?? ''}
                  onChange={(e) => onUpdate({ ...question, maxValue: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {(question.type === 'short-text' || question.type === 'long-text') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Length</label>
              <input
                type="number"
                value={question.maxLength ?? ''}
                onChange={(e) => onUpdate({ ...question, maxLength: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <button
          onClick={onDelete}
          className="text-red-500 hover:text-red-700 transition-colors mt-2"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export function AssessmentBuilderPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [sections, setSections] = useState<AssessmentSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadData();
  }, [jobId]);

  async function loadData() {
    if (!jobId) return;

    try {
      setLoading(true);
      const [jobData, assessmentData] = await Promise.all([
        jobsApi.getJob(jobId),
        assessmentsApi.getAssessment(jobId)
      ]);

      setJob(jobData);
      if (assessmentData?.sections) {
        setSections(assessmentData.sections);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function addSection() {
    const newSection: AssessmentSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      questions: []
    };
    setSections([...sections, newSection]);
  }

  function updateSection(index: number, updates: Partial<AssessmentSection>) {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], ...updates };
    setSections(newSections);
  }

  function deleteSection(index: number) {
    setSections(sections.filter((_, i) => i !== index));
  }

  function addQuestion(sectionIndex: number) {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      type: 'short-text',
      text: '',
      required: false
    };

    const newSections = [...sections];
    newSections[sectionIndex].questions.push(newQuestion);
    setSections(newSections);
  }

  function updateQuestion(sectionIndex: number, questionIndex: number, question: Question) {
    const newSections = [...sections];
    newSections[sectionIndex].questions[questionIndex] = question;
    setSections(newSections);
  }

  function deleteQuestion(sectionIndex: number, questionIndex: number) {
    const newSections = [...sections];
    newSections[sectionIndex].questions.splice(questionIndex, 1);
    setSections(newSections);
  }

  function handleDragEnd(event: DragEndEvent, sectionIndex: number) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const section = sections[sectionIndex];
    const oldIndex = section.questions.findIndex(q => q.id === active.id);
    const newIndex = section.questions.findIndex(q => q.id === over.id);

    const newSections = [...sections];
    newSections[sectionIndex].questions = arrayMove(section.questions, oldIndex, newIndex);
    setSections(newSections);
  }

  async function handleSave() {
    if (!jobId) return;

    try {
      setSaving(true);
      setError(null);
      await assessmentsApi.saveAssessment(jobId, sections);
    } catch (err: any) {
      setError('Failed to save assessment. Please try again.');
    } finally {
      setSaving(false);
    }
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

  if (showPreview) {
    return (
      <AssessmentPreview
        job={job}
        sections={sections}
        onClose={() => setShowPreview(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to={`/jobs/${job.id}`}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Job
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Assessment Builder</h1>
          <p className="text-slate-600 mt-1">{job.title}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center gap-2"
          >
            <Eye className="w-5 h-5" />
            Preview
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Assessment'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {sections.map((section, sectionIndex) => (
          <div key={section.id} className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="text"
                value={section.title}
                onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
                className="flex-1 text-xl font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Section Title"
              />

              <button
                onClick={() => deleteSection(sectionIndex)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd(e, sectionIndex)}
            >
              <SortableContext items={section.questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 mb-4">
                  {section.questions.map((question, questionIndex) => (
                    <SortableQuestion
                      key={question.id}
                      question={question}
                      sectionId={section.id}
                      onUpdate={(q) => updateQuestion(sectionIndex, questionIndex, q)}
                      onDelete={() => deleteQuestion(sectionIndex, questionIndex)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <button
              onClick={() => addQuestion(sectionIndex)}
              className="w-full px-4 py-2 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Question
            </button>
          </div>
        ))}

        <button
          onClick={addSection}
          className="w-full px-6 py-4 border-2 border-dashed border-slate-300 text-slate-600 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <Plus className="w-6 h-6" />
          Add Section
        </button>
      </div>
    </div>
  );
}
