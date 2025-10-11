'use client';

import { useEffect, useState } from 'react';
import { getUserProfile, initializeUserData } from '@/utils/userStorage';
import { detectPhase } from '@/utils/menstrualCycle';
import { InterventionCard } from '@/types/interventions';

export default function Home() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [interventions, setInterventions] = useState<InterventionCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [dayOfCycle, setDayOfCycle] = useState<number>(0);

  useEffect(() => {
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
  }, []);

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
      }
    } catch (error) {
      console.error('Failed to load interventions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPhaseColor = (phase: string) => {
    const colors = {
      menstrual: 'bg-red-100 text-red-800 border-red-300',
      follicular: 'bg-green-100 text-green-800 border-green-300',
      ovulatory: 'bg-blue-100 text-blue-800 border-blue-300',
      luteal: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    return colors[phase as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Phase Banner */}
        {currentPhase && (
          <div className={`rounded-lg border-2 p-6 mb-8 ${getPhaseColor(currentPhase)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-4xl">{getPhaseEmoji(currentPhase)}</span>
                <div>
                  <h2 className="text-2xl font-bold capitalize">
                    Today: {currentPhase} Phase
                  </h2>
                  <p className="text-sm mt-1">
                    Day {dayOfCycle} of your cycle
                    {userProfile && ` · ${userProfile.username}`}
                  </p>
                </div>
              </div>
              <a
                href="/settings"
                className="text-sm underline hover:no-underline"
              >
                Update Profile
              </a>
            </div>
          </div>
        )}

        {/* No Profile State */}
        {!userProfile && (
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Health AI Assistant
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Personalized AI support for menstrual cycle tracking and women's health
            </p>
            <a
              href="/settings"
              className="inline-block bg-purple-600 text-white px-8 py-3 rounded-md hover:bg-purple-700 transition-colors text-lg font-medium"
            >
              Set Up Your Profile to Get Started
            </a>
          </div>
        )}

        {/* Intervention Cards */}
        {userProfile && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Recommended Practices for You
              </h2>
              {currentPhase && (
                <span className="text-sm text-gray-600">
                  Based on your {currentPhase} phase
                </span>
              )}
            </div>

            {loading && (
              <div className="text-center py-12">
                <div className="animate-pulse text-gray-600">Loading personalized practices...</div>
              </div>
            )}

            {!loading && interventions.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <p className="text-gray-600">No interventions available. Please update your profile.</p>
                <a
                  href="/settings"
                  className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Update Profile
                </a>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {interventions.map((intervention) => (
                <div
                  key={intervention.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-300"
                >
                  <div className="p-6">
                    {/* Header with emoji and benefit */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-4xl">{intervention.emoji}</div>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        {intervention.benefit}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {intervention.title}
                    </h3>

                    {/* Category badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded capitalize">
                        {intervention.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {intervention.duration_minutes} min · {intervention.location}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                      {intervention.description}
                    </p>

                    {/* Action button */}
                    <button
                      onClick={() => window.location.href = `/intervention/${intervention.id}`}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Start Practice →
                    </button>
                  </div>

                  {/* Relevance indicator */}
                  <div className="bg-gray-50 px-6 py-3 border-t">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Relevance</span>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 w-2 rounded-full ${
                              i < Math.floor((intervention.relevance_score || 1) * 5)
                                ? 'bg-blue-600'
                                : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <a
            href="/test-agent"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center"
          >
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold text-gray-900 mb-2">AI Assistant</h3>
            <p className="text-sm text-gray-600">
              Get personalized health advice
            </p>
          </a>

          <a
            href="/test-cycle"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center"
          >
            <div className="text-3xl mb-3">📅</div>
            <h3 className="font-semibold text-gray-900 mb-2">Cycle Tracker</h3>
            <p className="text-sm text-gray-600">
              Track your menstrual cycle
            </p>
          </a>

          <a
            href="/settings"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center"
          >
            <div className="text-3xl mb-3">⚙️</div>
            <h3 className="font-semibold text-gray-900 mb-2">Settings</h3>
            <p className="text-sm text-gray-600">
              Update your preferences
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}