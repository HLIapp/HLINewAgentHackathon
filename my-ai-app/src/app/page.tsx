'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, initializeUserData, isInterventionCompletedToday } from '@/utils/userStorage';
import { detectPhase, getPhaseDescription } from '@/utils/menstrualCycle';
import { InterventionCard } from '@/types/interventions';

export default function Home() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [interventions, setInterventions] = useState<InterventionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayOfCycle, setDayOfCycle] = useState<number>(0);
  const [interventionIntros, setInterventionIntros] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
    
    if (!hasCompletedOnboarding) {
      // Redirect to settings for onboarding
      router.push('/settings');
      return;
    }

    // Initialize user data
    const userData = initializeUserData();
    const profile = getUserProfile() || userData.profile;
    setUserProfile(profile);

    // Detect current cycle phase
    if (profile.lastPeriod) {
      const cycleInfo = detectPhase(new Date(profile.lastPeriod), profile.cycleLength);
      setCurrentPhase(cycleInfo.phase);
      setDayOfCycle(cycleInfo.dayOfCycle);
      
      // Load interventions from cache or fetch new ones
      loadInterventions(profile, cycleInfo.phase);
    }
    
    setLoading(false);
  }, [router]);

  const loadInterventions = async (profile: any, phase: string) => {
    // Check localStorage cache first
    const cacheKey = `interventions_${phase}_${profile.symptoms.join('_')}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        const cacheAge = Date.now() - new Date(parsed.timestamp).getTime();
        
        // Use cache if less than 1 hour old
        if (cacheAge < 3600000) {
          setInterventions(parsed.interventions);
          return;
        }
      } catch (error) {
        console.error('Failed to parse cached interventions:', error);
      }
    }

    // Fetch new interventions
    setLoading(true);
    try {
      const response = await fetch('/api/interventions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phase: phase,
          symptoms: profile.symptoms,
          mood: profile.mood,
          energy: profile.energy,
          goal: profile.goal,
          username: profile.username,
        }),
      });

      const data = await response.json();
      
      if (data.interventions) {
        setInterventions(data.interventions);
        
        // Cache the results with multiple keys for easy access
        localStorage.setItem(cacheKey, JSON.stringify({
          interventions: data.interventions,
          timestamp: new Date().toISOString(),
        }));
        
        // Also store current interventions for detail page access
        localStorage.setItem('current_interventions', JSON.stringify({
          interventions: data.interventions,
          timestamp: new Date().toISOString(),
        }));
        
        // Load introduction text for each intervention
        loadInterventionIntros(data.interventions);
      }
    } catch (error) {
      console.error('Failed to load interventions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInterventionIntros = async (interventionList: InterventionCard[]) => {
    const intros: Record<string, string> = {};
    
    for (const intervention of interventionList) {
      // Check cache first
      const cacheKey = `text_guide_${intervention.title}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          if (parsedCache.data?.introduction) {
            intros[intervention.id] = parsedCache.data.introduction;
          }
        } catch (error) {
          console.error('Failed to load cached intro:', error);
        }
      }
    }
    
    setInterventionIntros(intros);
  };

  const getPhaseColor = (phase: string) => {
    const colors = {
      menstrual: 'bg-red-50 text-red-700 border-red-200',
      follicular: 'bg-green-50 text-green-700 border-green-200',
      ovulatory: 'bg-blue-50 text-blue-700 border-blue-200',
      luteal: 'bg-purple-50 text-purple-700 border-purple-200',
    };
    return colors[phase as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getPhaseEmoji = (phase: string) => {
    const emojis = {
      menstrual: '🩸',
      follicular: '🌱',
      ovulatory: '🥚',
      luteal: '🌙',
    };
    return emojis[phase as keyof typeof emojis] || '✨';
  };

  // Show loading state while checking onboarding
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Phase Banner */}
        {currentPhase && (
          <div className={`rounded-lg border p-8 mb-8 ${getPhaseColor(currentPhase)}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{getPhaseEmoji(currentPhase)}</span>
                  <h2 className="text-xl font-semibold capitalize tracking-tight">
                    {currentPhase} Phase - Day {dayOfCycle} of {userProfile?.cycleLength}
                  </h2>
                </div>
                
                {userProfile && (
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {getPhaseDescription(currentPhase as any)}
                  </p>
                )}
              </div>
              <a
                href="/settings"
                className="text-xs font-medium hover:opacity-70 transition-opacity"
              >
                Update Log
              </a>
            </div>
          </div>
        )}

        {/* Welcome Message */}
        {!userProfile && (
          <div className="text-center mb-12">
            <h1 className="text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
              Welcome to Hormone Harmony Coach
            </h1>
            <p className="text-sm text-gray-600 mb-8">
              Personalized practices for your menstrual cycle
            </p>
          </div>
        )}

        {/* Intervention Cards */}
        {userProfile && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
                Recommended for You
              </h2>
              {currentPhase && (
                <span className="text-xs text-gray-500 font-medium">
                  {currentPhase} phase
                </span>
              )}
            </div>

            {loading && (
              <div className="text-center py-16">
                <div className="text-sm text-gray-500">Loading practices...</div>
              </div>
            )}

            {!loading && interventions.length === 0 && (
              <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-4">No practices available</p>
                <a
                  href="/settings"
                  className="inline-block text-sm font-medium text-gray-900 hover:text-gray-700 border border-gray-300 px-4 py-2 rounded-md hover:border-gray-400 transition-colors"
                >
                  Update Profile
                </a>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {interventions.map((intervention) => {
                const completedToday = isInterventionCompletedToday(intervention.id);
                // Create URL-friendly slug from title
                const titleSlug = intervention.title
                  .toLowerCase()
                  .replace(/['"]/g, '') // Remove quotes
                  .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
                  .replace(/\s+/g, '-') // Replace spaces with hyphens
                  .replace(/-+/g, '-') // Collapse multiple hyphens
                  .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
                
                return (
                  <button
                    key={intervention.id}
                    onClick={() => window.location.href = `/intervention/${titleSlug}`}
                    className={`bg-white border rounded-lg p-6 text-left transition-all ${
                      completedToday 
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {/* Header with emoji and benefit */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-3xl">{intervention.emoji}</div>
                      <div className="flex flex-col gap-1.5 items-end">
                        <span className="text-xs font-medium text-gray-600 border border-gray-200 px-2 py-0.5 rounded">
                          {intervention.benefit}
                        </span>
                        {completedToday && (
                          <span className="text-xs font-medium text-green-700 border border-green-300 bg-green-50 px-2 py-0.5 rounded">
                            Done today
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-semibold text-gray-900 mb-3 tracking-tight">
                      {intervention.title}
                    </h3>

                    {/* Meta info */}
                    <div className="flex items-center gap-3 mb-4 text-xs text-gray-500">
                      <span>{intervention.duration_minutes} min</span>
                      <span>·</span>
                      <span className="capitalize">{intervention.category}</span>
                    </div>

                    {/* Description - Use OpenAI intro if available, otherwise static */}
                    <p className="text-xs text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                      {interventionIntros[intervention.id] || intervention.description}
                    </p>

                    {/* Action link */}
                    <div className="text-xs font-medium text-gray-900 flex items-center gap-1">
                      Start practice
                      <span className="text-gray-400">→</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Link to Settings */}
        {!userProfile && (
          <div className="flex justify-center mb-8">
            <a
              href="/settings"
              className="bg-white border border-gray-200 rounded-lg p-8 hover:border-gray-400 transition-all text-center max-w-md"
            >
              <div className="text-2xl mb-3">⚙️</div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Set Up Your Profile</h3>
              <p className="text-xs text-gray-600">
                Configure your cycle data to get started
              </p>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}