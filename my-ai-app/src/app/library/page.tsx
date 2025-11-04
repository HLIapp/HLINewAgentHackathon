'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getAllUniqueInterventions, StaticIntervention } from '@/data/staticInterventions';
import { CyclePhase, PracticeCategory } from '@/types/interventions';

type FilterPhase = CyclePhase | 'all';
type FilterCategory = PracticeCategory | 'all';

export default function LibraryPage() {
  const router = useRouter();
  const [selectedPhase, setSelectedPhase] = useState<FilterPhase>('all');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get all unique interventions (avoid duplicates across phases)
  const allInterventions = useMemo(() => {
    return getAllUniqueInterventions();
  }, []);

  // Filter interventions
  const filteredInterventions = useMemo(() => {
    return allInterventions.filter(intervention => {
      // Phase filter
      if (selectedPhase !== 'all' && !intervention.phase_tags.includes(selectedPhase)) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && intervention.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          intervention.title.toLowerCase().includes(query) ||
          intervention.description.toLowerCase().includes(query) ||
          intervention.benefit.toLowerCase().includes(query) ||
          intervention.category.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [allInterventions, selectedPhase, selectedCategory, searchQuery]);

  const createSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const phaseLabels: Record<CyclePhase, string> = {
    menstrual: 'Menstrual Phase',
    follicular: 'Follicular Phase',
    ovulatory: 'Ovulatory Phase',
    luteal: 'Luteal Phase',
  };

  const categoryLabels: Record<PracticeCategory, string> = {
    nutrition: 'Nutrition',
    movement: 'Movement',
    mindset: 'Mindset',
    breathwork: 'Breathwork',
    sleep: 'Sleep',
    supplementation: 'Supplementation',
    stress_management: 'Stress Management',
    reflection: 'Reflection',
  };

  const phases: CyclePhase[] = ['menstrual', 'follicular', 'ovulatory', 'luteal'];
  const categories: PracticeCategory[] = [
    'movement',
    'nutrition',
    'mindset',
    'breathwork',
    'sleep',
    'supplementation',
    'stress_management',
    'reflection',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
            Practice Library
          </h1>
          <p className="text-sm text-gray-600">
            Browse all available practices. No account or period tracking needed—just explore and practice.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          {/* Search */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, benefit, or category..."
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Phase Filter */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Cycle Phase
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedPhase('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  selectedPhase === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Phases
              </button>
              {phases.map(phase => (
                <button
                  key={phase}
                  onClick={() => setSelectedPhase(phase)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
                    selectedPhase === phase
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {phaseLabels[phase]}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Categories
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    selectedCategory === category
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {categoryLabels[category]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium text-gray-900">{filteredInterventions.length}</span> practice{filteredInterventions.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Interventions Grid */}
        {filteredInterventions.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No practices found</h3>
            <p className="text-sm text-gray-600">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInterventions.map((intervention) => {
              const slug = createSlug(intervention.title);
              
              return (
                <button
                  key={intervention.title}
                  onClick={() => router.push(`/intervention/${slug}`)}
                  className="bg-white border border-gray-200 rounded-lg p-6 text-left transition-all hover:border-gray-400 hover:shadow-md"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{intervention.emoji}</div>
                    <div className="flex flex-col gap-1.5 items-end">
                      <span className="text-xs font-medium text-gray-600 border border-gray-200 px-2 py-0.5 rounded">
                        {intervention.benefit}
                      </span>
                      {intervention.interaction_type && (
                        <span className="text-xs font-medium text-blue-600 border border-blue-200 bg-blue-50 px-2 py-0.5 rounded">
                          Interactive
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 tracking-tight">
                    {intervention.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {intervention.description}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <span>⏱️</span>
                      {intervention.duration_minutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <span>📍</span>
                      {intervention.location}
                    </span>
                  </div>

                  {/* Phase Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {intervention.phase_tags.map(phase => (
                      <span
                        key={phase}
                        className="text-xs font-medium px-2 py-0.5 rounded capitalize"
                        style={{
                          backgroundColor: phase === 'menstrual' ? '#FEE2E2' :
                                          phase === 'follicular' ? '#DCFCE7' :
                                          phase === 'ovulatory' ? '#DBEAFE' :
                                          '#F3E8FF',
                          color: phase === 'menstrual' ? '#991B1B' :
                                 phase === 'follicular' ? '#166534' :
                                 phase === 'ovulatory' ? '#1E40AF' :
                                 '#6B21A8',
                        }}
                      >
                        {phase}
                      </span>
                    ))}
                    <span className="text-xs font-medium text-gray-600 px-2 py-0.5 rounded bg-gray-100">
                      {categoryLabels[intervention.category]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> Want personalized recommendations? Set up your profile in{' '}
            <a href="/settings" className="underline font-medium hover:text-blue-900">
              Settings
            </a>{' '}
            to get practices tailored to your cycle phase and needs.
          </p>
        </div>
      </div>
    </div>
  );
}

