import { Link } from 'react-router-dom';
import { Briefcase, Users, ClipboardList, Zap, Shield, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { seedDatabase } from '../lib/seed';

export function HomePage() {
  const [stats, setStats] = useState({ jobs: 0, candidates: 0, assessments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
  }, []);

  async function initializeData() {
    try {
      await seedDatabase();

      const [jobsRes, candidatesRes, assessmentsRes] = await Promise.all([
        supabase.from('jobs').select('id', { count: 'exact', head: true }),
        supabase.from('candidates').select('id', { count: 'exact', head: true }),
        supabase.from('assessments').select('id', { count: 'exact', head: true })
      ]);

      setStats({
        jobs: jobsRes.count || 0,
        candidates: candidatesRes.count || 0,
        assessments: assessmentsRes.count || 0
      });
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Initializing TalentFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-slate-900">
          Welcome to <span className="text-blue-600">TalentFlow</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          A modern hiring platform to manage jobs, candidates, and assessments with ease.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border-2 border-slate-200 hover:border-blue-400 transition-all hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-3xl font-bold text-slate-900">{stats.jobs}</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Job Openings</h3>
          <p className="text-sm text-slate-600 mb-4">Manage and organize your job postings</p>
          <Link
            to="/jobs"
            className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View Jobs
          </Link>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-slate-200 hover:border-green-400 transition-all hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-3xl font-bold text-slate-900">{stats.candidates}</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Candidates</h3>
          <p className="text-sm text-slate-600 mb-4">Track applicants through hiring stages</p>
          <Link
            to="/candidates"
            className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            View Candidates
          </Link>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-slate-200 hover:border-purple-400 transition-all hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-3xl font-bold text-slate-900">{stats.assessments}</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Assessments</h3>
          <p className="text-sm text-slate-600 mb-4">Create and manage job assessments</p>
          <Link
            to="/jobs"
            className="block w-full text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Manage Assessments
          </Link>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-8 text-center">Platform Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Fast & Efficient</h3>
            <p className="text-blue-100">
              Virtualized lists and optimized performance for handling thousands of records
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Reliable</h3>
            <p className="text-blue-100">
              Optimistic updates with automatic rollback on errors for seamless experience
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Powerful</h3>
            <p className="text-blue-100">
              Advanced filtering, drag-and-drop, kanban boards, and customizable assessments
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Start Guide</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Browse Jobs</h3>
              <p className="text-sm text-slate-600">
                View, create, edit, and manage job postings with drag-and-drop reordering
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Review Candidates</h3>
              <p className="text-sm text-slate-600">
                Search through candidates, view profiles, and track their progress through hiring stages
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Use Kanban Board</h3>
              <p className="text-sm text-slate-600">
                Drag candidates between stages to update their status in real-time
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              4
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Create Assessments</h3>
              <p className="text-sm text-slate-600">
                Build custom assessments with various question types and conditional logic
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
