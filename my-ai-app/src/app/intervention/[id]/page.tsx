'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getInterventionByTitle, getAllStaticInterventions, StaticIntervention } from '@/data/staticInterventions';
import { addCompletedIntervention, isInterventionCompletedToday, CompletedIntervention } from '@/utils/userStorage';

type GuideMode = 'text' | 'audio' | 'visual';

export default function InterventionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [intervention, setIntervention] = useState<StaticIntervention | null>(null);
  const [selectedModes, setSelectedModes] = useState<Set<GuideMode>>(new Set(['text']));
  const [loading, setLoading] = useState(true);
  const [synthesizedContent, setSynthesizedContent] = useState<Map<GuideMode, any>>(new Map());
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Reflection form state
  const [rating, setRating] = useState<number | null>(null);
  const [completedFull, setCompletedFull] = useState(true);
  const [changesNoticed, setChangesNoticed] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Extract intervention title from ID or load from localStorage
    const interventionId = params.id as string;
    
    // Try to get intervention from cache
    const cachedInterventions = localStorage.getItem('current_interventions');
    if (cachedInterventions) {
      try {
        const parsed = JSON.parse(cachedInterventions);
        const found = parsed.interventions.find((i: any) => i.id === interventionId);
        
        if (found) {
          // Get full details from static data
          const fullDetails = getInterventionByTitle(found.title);
          setIntervention(fullDetails);
          
          // Auto-load text guide from cache or generate it
          loadTextGuide(found.title, fullDetails);
        }
      } catch (error) {
        console.error('Error loading intervention:', error);
      }
    }

    // Fallback: try to find in all static interventions by ID pattern
    if (!intervention) {
      const allInterventions = getAllStaticInterventions();
      // Use first intervention as fallback for demo
      if (allInterventions.length > 0) {
        setIntervention(allInterventions[0]);
      }
    }

    setLoading(false);
    
    // Check if intervention is already completed today
    if (interventionId) {
      const completedToday = isInterventionCompletedToday(interventionId);
      setIsCompleted(completedToday);
    }
  }, [params.id]);

  const loadTextGuide = async (title: string, interventionDetails: any) => {
    // Check if text guide is already cached
    const cacheKey = `text_guide_${title}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const parsedCache = JSON.parse(cached);
        const cacheAge = Date.now() - new Date(parsedCache.timestamp).getTime();
        
        // Use cache if less than 24 hours old
        if (cacheAge < 86400000) {
          const newContent = new Map(synthesizedContent);
          newContent.set('text', { status: 'ready', data: parsedCache.data });
          setSynthesizedContent(newContent);
          return;
        }
      } catch (error) {
        console.error('Failed to load cached text guide:', error);
      }
    }

    // Generate new text guide
    if (interventionDetails) {
      const newContent = new Map(synthesizedContent);
      newContent.set('text', { status: 'loading' });
      setSynthesizedContent(newContent);
      
      try {
        const response = await fetch('/api/synthesize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            intervention_title: title,
            intervention_description: interventionDetails.description,
            mode: 'text',
            phase: interventionDetails.phase_tags[0],
          }),
        });

        const data = await response.json();
        const updatedContent = new Map(synthesizedContent);
        updatedContent.set('text', { status: 'ready', data });
        setSynthesizedContent(updatedContent);
        
        // Cache the generated guide
        localStorage.setItem(cacheKey, JSON.stringify({
          data: data,
          timestamp: new Date().toISOString(),
        }));
      } catch (error) {
        console.error('Synthesis error:', error);
        const updatedContent = new Map(synthesizedContent);
        updatedContent.set('text', { status: 'error', error });
        setSynthesizedContent(updatedContent);
      }
    }
  };

  const handleDoneClick = () => {
    setShowReflectionModal(true);
  };

  const handleSkipReflection = () => {
    // Save completion without reflection
    if (intervention && params.id) {
      const completion: CompletedIntervention = {
        intervention_id: params.id as string,
        intervention_title: intervention.title,
        completed_at: new Date().toISOString(),
        completed_full_practice: true,
      };
      
      addCompletedIntervention(completion);
      setIsCompleted(true);
      setShowReflectionModal(false);
      router.push('/');
    }
  };

  const handleSubmitReflection = async () => {
    if (!intervention || !params.id) return;

    const completion: CompletedIntervention = {
      intervention_id: params.id as string,
      intervention_title: intervention.title,
      completed_at: new Date().toISOString(),
      rating: rating || undefined,
      completed_full_practice: completedFull,
      changes_noticed: changesNoticed,
      notes: notes.trim() || undefined,
    };

    // Save to localStorage
    addCompletedIntervention(completion);

    // Also send to API
    try {
      await fetch('/api/reflection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completion),
      });
    } catch (error) {
      console.error('Failed to save reflection to API:', error);
    }

    setIsCompleted(true);
    setShowReflectionModal(false);
    router.push('/');
  };

  const toggleChangeTag = (tag: string) => {
    setChangesNoticed(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleModeToggle = async (mode: GuideMode) => {
    const newModes = new Set(selectedModes);
    
    if (newModes.has(mode)) {
      // Remove mode if already selected
      newModes.delete(mode);
    } else {
      // Add mode if not selected
      newModes.add(mode);
      
      // Load synthesized content for ALL modes (including text for enhanced guide)
      if (intervention && !synthesizedContent.has(mode)) {
        const newContent = new Map(synthesizedContent);
        newContent.set(mode, { status: 'loading' });
        setSynthesizedContent(newContent);
        
        try {
          const response = await fetch('/api/synthesize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              intervention_title: intervention.title,
              intervention_description: intervention.description,
              mode: mode,
              phase: intervention.phase_tags[0],
            }),
          });

          const data = await response.json();
          const updatedContent = new Map(synthesizedContent);
          updatedContent.set(mode, { status: 'ready', data });
          setSynthesizedContent(updatedContent);
        } catch (error) {
          console.error('Synthesis error:', error);
          const updatedContent = new Map(synthesizedContent);
          updatedContent.set(mode, { status: 'error', error });
          setSynthesizedContent(updatedContent);
        }
      }
    }
    
    setSelectedModes(newModes);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-xl text-gray-600">Loading intervention...</div>
        </div>
      </div>
    );
  }

  if (!intervention) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Intervention Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn't find this intervention. Please try again.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>

        {/* Intervention Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="text-6xl">{intervention.emoji}</div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {intervention.benefit}
                  </span>
                  {intervention.phase_tags.map((phase) => (
                    <span
                      key={phase}
                      className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${getPhaseColor(phase)}`}
                    >
                      {phase}
                    </span>
                  ))}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {intervention.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    ⏱️ {intervention.duration_minutes} minutes
                  </span>
                  <span className="flex items-center gap-1">
                    📍 {intervention.location}
                  </span>
                  <span className="flex items-center gap-1 capitalize">
                    🏷️ {intervention.category}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-800 leading-relaxed mb-4 font-semibold">
            {intervention.description}
          </p>

          {/* Personalized Introduction (if generated) */}
          {synthesizedContent.get('text')?.data?.introduction && (
            <p className="text-gray-700 leading-relaxed mb-6">
              {synthesizedContent.get('text').data.introduction}
            </p>
          )}

          {/* Research Citation */}
          <p className="text-sm text-gray-500 mb-6">
            <a 
              href="#research" 
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {intervention.research}
            </a>
          </p>
        </div>

        {/* Mode Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Choose Your Guide Format(s)</h2>
          <p className="text-sm text-gray-600 mb-4">Select one or more formats - you can use multiple at once!</p>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => handleModeToggle('text')}
              className={`p-4 rounded-lg border-2 transition-all relative ${
                selectedModes.has('text')
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {selectedModes.has('text') && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
              )}
              <div className="text-3xl mb-2">📝</div>
              <div className="font-semibold text-gray-900">Text</div>
              <div className="text-xs text-gray-600 mt-1">Step-by-step guide</div>
            </button>

            <button
              onClick={() => handleModeToggle('audio')}
              className={`p-4 rounded-lg border-2 transition-all relative ${
                selectedModes.has('audio')
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {selectedModes.has('audio') && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
              )}
              <div className="text-3xl mb-2">🔊</div>
              <div className="font-semibold text-gray-900">Audio</div>
              <div className="text-xs text-gray-600 mt-1">Guided narration</div>
            </button>

            <button
              onClick={() => handleModeToggle('visual')}
              className={`p-4 rounded-lg border-2 transition-all relative ${
                selectedModes.has('visual')
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {selectedModes.has('visual') && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
              )}
              <div className="text-3xl mb-2">🎨</div>
              <div className="font-semibold text-gray-900">Visual</div>
              <div className="text-xs text-gray-600 mt-1">Illustrated steps</div>
            </button>
          </div>

          {/* Content Display - Order: Audio → Visual → Text */}
          <div className="border-t pt-6 space-y-6">
            {selectedModes.size === 0 && (
              <div className="text-center py-12 text-gray-500">
                Select at least one format to view the practice guide
              </div>
            )}

            {/* Audio Content (First) */}
            {selectedModes.has('audio') && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🔊</span>
                  <h3 className="text-lg font-semibold text-gray-900">Audio Guide</h3>
                </div>

                {synthesizedContent.get('audio')?.status === 'loading' && (
                  <div className="text-center py-12">
                    <div className="animate-pulse text-6xl mb-4">🎧</div>
                    <p className="text-gray-600">Generating audio guide...</p>
                  </div>
                )}

                {synthesizedContent.get('audio')?.status === 'ready' && synthesizedContent.get('audio')?.data?.audio_base64 && (
                  <div className="bg-white border border-blue-300 rounded-lg p-4">
                    <audio
                      controls
                      className="w-full"
                      src={`data:audio/mpeg;base64,${synthesizedContent.get('audio').data.audio_base64}`}
                    >
                      Your browser does not support the audio element.
                    </audio>
                    <p className="text-sm text-blue-800 mt-3 text-center">
                      Duration: ~{Math.floor(synthesizedContent.get('audio').data.estimated_time / 60)} minutes
                    </p>
                  </div>
                )}

                {synthesizedContent.get('audio')?.status === 'ready' && !synthesizedContent.get('audio')?.data?.audio_base64 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                      Audio generation requires ElevenLabs API key. Please add it to your .env.local file.
                    </p>
                  </div>
                )}

                {synthesizedContent.get('audio')?.status === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">
                      Error generating audio guide. Please try again.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Visual Content (Second) */}
            {selectedModes.has('visual') && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🎨</span>
                  <h3 className="text-lg font-semibold text-gray-900">Visual Guide</h3>
                </div>

                {synthesizedContent.get('visual')?.status === 'loading' && (
                  <div className="text-center py-8">
                    <div className="animate-pulse text-5xl mb-3">🖼️</div>
                    <p className="text-gray-600 text-sm">Generating visual guide...</p>
                  </div>
                )}

                {(!synthesizedContent.has('visual') || synthesizedContent.get('visual')?.status === 'ready') && (
                  <div className="bg-white border border-purple-300 rounded-lg p-4">
                    <p className="text-purple-800 text-sm text-center">
                      🎨 Visual illustrated guides coming soon! We're working on generating beautiful step-by-step illustrations for you.
                    </p>
                  </div>
                )}

                {synthesizedContent.get('visual')?.status === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">
                      Error generating visual guide. Please try again.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Text Content (Third) */}
            {selectedModes.has('text') && intervention && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">📝</span>
                  <h3 className="text-lg font-semibold text-gray-900">Text Guide</h3>
                </div>

                {synthesizedContent.get('text')?.status === 'loading' && (
                  <div className="text-center py-8">
                    <div className="animate-pulse text-5xl mb-3">✍️</div>
                    <p className="text-gray-600 text-sm">Generating personalized guide...</p>
                  </div>
                )}

                {synthesizedContent.get('text')?.status === 'ready' && synthesizedContent.get('text')?.data && (
                  <div className="space-y-4">

                    {/* Equipment */}
                    {intervention.equipment && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2 text-sm">📦 Equipment Needed</h4>
                        <p className="text-yellow-800 text-sm">{intervention.equipment}</p>
                      </div>
                    )}

                    {/* Steps */}
                    <div className="space-y-3">
                      {synthesizedContent.get('text').data.steps.map((step: any) => (
                        <div key={step.step_number} className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="flex gap-4 items-start mb-2">
                            <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                              {step.step_number}
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-900 font-medium">{step.instruction}</p>
                              {step.duration_seconds && (
                                <p className="text-xs text-gray-500 mt-1">⏱️ {step.duration_seconds} seconds</p>
                              )}
                            </div>
                          </div>
                          
                          {step.breathing_cue && (
                            <div className="ml-12 mt-2 text-sm text-blue-700 bg-blue-50 rounded px-3 py-2">
                              🫁 {step.breathing_cue}
                            </div>
                          )}
                          
                          {step.physiological_explanation && (
                            <div className="ml-12 mt-2 text-xs text-gray-600 italic">
                              💡 {step.physiological_explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Modification */}
                    {synthesizedContent.get('text').data.modification && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-900 mb-2 text-sm">💡 Modification</h4>
                        <p className="text-purple-800 text-sm">{synthesizedContent.get('text').data.modification}</p>
                      </div>
                    )}
                  </div>
                )}

                {synthesizedContent.get('text')?.status === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">Error generating text guide. Please try again.</p>
                    <button
                      onClick={() => {
                        if (intervention) {
                          loadTextGuide(intervention.title, intervention);
                        }
                      }}
                      className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Completion Button */}
        <div className="flex justify-center">
          <button
            onClick={handleDoneClick}
            disabled={isCompleted}
            className={`py-3 px-12 rounded-md transition-colors font-medium text-lg shadow-lg ${
              isCompleted
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isCompleted ? '✅ Completed Today' : 'Done'}
          </button>
        </div>

        {/* Reflection Modal */}
        {showReflectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">How did it go?</h2>
                <p className="text-gray-600 mb-6">Share your experience to track your progress</p>

                {/* Rating Scale */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">How helpful was this practice?</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { value: 1, emoji: '😔', label: 'Not helpful' },
                      { value: 2, emoji: '😐', label: 'Slightly helpful' },
                      { value: 3, emoji: '🙂', label: 'Helpful' },
                      { value: 4, emoji: '😊', label: 'Very helpful' },
                      { value: 5, emoji: '🤩', label: 'Extremely helpful' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setRating(option.value)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          rating === option.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-3xl mb-1">{option.emoji}</div>
                        <div className="text-xs text-gray-600">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Completed Full Practice */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Did you complete the full practice?</h3>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setCompletedFull(true)}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        completedFull
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">✅</div>
                      <div className="font-medium">Yes</div>
                    </button>
                    <button
                      onClick={() => setCompletedFull(false)}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        !completedFull
                          ? 'border-orange-600 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">⏸️</div>
                      <div className="font-medium">Partially</div>
                    </button>
                  </div>
                </div>

                {/* Changes Noticed */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">What changed? (Select all that apply)</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'pain decreased',
                      'felt calmer',
                      'more energy',
                      'better mood',
                      'less bloating',
                      'improved focus',
                      'reduced anxiety',
                      'physical relief'
                    ].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleChangeTag(tag)}
                        className={`p-2 rounded-lg border-2 transition-all text-sm ${
                          changesNoticed.includes(tag)
                            ? 'border-blue-600 bg-blue-50 text-blue-900'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {changesNoticed.includes(tag) && '✓ '}
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Notes */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Additional notes (optional)</h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any other observations or feelings..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSkipReflection}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleSubmitReflection}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Submit Reflection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
