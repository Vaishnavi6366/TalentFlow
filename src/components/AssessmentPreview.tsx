import { useState } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import type { Job, AssessmentSection, Question } from '../lib/database.types';

interface AssessmentPreviewProps {
  job: Job;
  sections: AssessmentSection[];
  onClose: () => void;
}

export function AssessmentPreview({ job, sections, onClose }: AssessmentPreviewProps) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateResponse(questionId: string, value: any) {
    setResponses(prev => ({ ...prev, [questionId]: value }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[questionId];
      return newErrors;
    });
  }

  function shouldShowQuestion(question: Question): boolean {
    if (!question.conditionalOn) return true;

    const { questionId, value } = question.conditionalOn;
    const response = responses[questionId];

    if (Array.isArray(value)) {
      return Array.isArray(response) ? value.some(v => response.includes(v)) : value.includes(response);
    }

    return response === value;
  }

  function validateQuestion(question: Question): string | null {
    if (!question.required) return null;

    const value = responses[question.id];

    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      return 'This field is required';
    }

    if (question.type === 'numeric') {
      const num = Number(value);
      if (isNaN(num)) return 'Please enter a valid number';
      if (question.minValue !== undefined && num < question.minValue) {
        return `Value must be at least ${question.minValue}`;
      }
      if (question.maxValue !== undefined && num > question.maxValue) {
        return `Value must be at most ${question.maxValue}`;
      }
    }

    if (question.type === 'short-text' || question.type === 'long-text') {
      if (question.maxLength !== undefined && String(value).length > question.maxLength) {
        return `Maximum ${question.maxLength} characters allowed`;
      }
    }

    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    sections.forEach(section => {
      section.questions.forEach(question => {
        if (shouldShowQuestion(question)) {
          const error = validateQuestion(question);
          if (error) {
            newErrors[question.id] = error;
          }
        }
      });
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    alert('Assessment submitted successfully! (This is a preview)');
  }

  function renderQuestion(question: Question) {
    if (!shouldShowQuestion(question)) return null;

    const error = errors[question.id];

    return (
      <div key={question.id} className="space-y-2">
        <label className="block">
          <span className="text-slate-900 font-medium">
            {question.text}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </span>

          {question.type === 'short-text' && (
            <input
              type="text"
              value={responses[question.id] || ''}
              onChange={(e) => updateResponse(question.id, e.target.value)}
              maxLength={question.maxLength}
              className={`mt-2 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-slate-300'
              }`}
            />
          )}

          {question.type === 'long-text' && (
            <textarea
              value={responses[question.id] || ''}
              onChange={(e) => updateResponse(question.id, e.target.value)}
              maxLength={question.maxLength}
              rows={4}
              className={`mt-2 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-slate-300'
              }`}
            />
          )}

          {question.type === 'numeric' && (
            <input
              type="number"
              value={responses[question.id] ?? ''}
              onChange={(e) => updateResponse(question.id, e.target.value)}
              min={question.minValue}
              max={question.maxValue}
              className={`mt-2 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-slate-300'
              }`}
            />
          )}

          {question.type === 'single-choice' && (
            <div className="mt-2 space-y-2">
              {question.options?.map(option => (
                <label key={option} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={responses[question.id] === option}
                    onChange={(e) => updateResponse(question.id, e.target.value)}
                    className="text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-slate-700">{option}</span>
                </label>
              ))}
            </div>
          )}

          {question.type === 'multi-choice' && (
            <div className="mt-2 space-y-2">
              {question.options?.map(option => (
                <label key={option} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value={option}
                    checked={(responses[question.id] || []).includes(option)}
                    onChange={(e) => {
                      const current = responses[question.id] || [];
                      const updated = e.target.checked
                        ? [...current, option]
                        : current.filter((v: string) => v !== option);
                      updateResponse(question.id, updated);
                    }}
                    className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-slate-700">{option}</span>
                </label>
              ))}
            </div>
          )}

          {question.type === 'file' && (
            <div className="mt-2">
              <label className="block w-full px-4 py-8 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 transition-colors cursor-pointer">
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      updateResponse(question.id, file.name);
                    }
                  }}
                  className="hidden"
                />
                <div className="text-center">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600">
                    {responses[question.id] || 'Click to upload file'}
                  </p>
                </div>
              </label>
            </div>
          )}
        </label>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {question.maxLength && (question.type === 'short-text' || question.type === 'long-text') && (
          <p className="text-sm text-slate-500">
            {(responses[question.id] || '').length} / {question.maxLength} characters
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Assessment Preview</h1>
          <p className="text-slate-600 mt-1">{job.title}</p>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          This is a live preview of your assessment. Try filling it out to test validation and conditional logic.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {sections.map(section => (
          <div key={section.id} className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{section.title}</h2>
            <div className="space-y-6">
              {section.questions.map(renderQuestion)}
            </div>
          </div>
        ))}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
          >
            Back to Editor
          </button>

          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Submit Assessment
          </button>
        </div>
      </form>
    </div>
  );
}
