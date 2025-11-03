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
  const [visualImagesLoaded, setVisualImagesLoaded] = useState(false);
  
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
      if (mode === 'visual') {
        setVisualImagesLoaded(false);
      }
    } else {
      // Add mode if not selected
      newModes.add(mode);
      
      // Load synthesized content for ALL modes (including text for enhanced guide)
      if (intervention && !synthesizedContent.has(mode)) {
        const newContent = new Map(synthesizedContent);
        newContent.set(mode, { status: 'loading' });
        setSynthesizedContent(newContent);
        
        // For visual mode, simulate loading delay to show spinner
        if (mode === 'visual') {
          setVisualImagesLoaded(false);
          
          // Simulate 2 second loading delay
          setTimeout(async () => {
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
              
              // Show images after a brief additional delay to complete the loading effect
              setTimeout(() => {
                setVisualImagesLoaded(true);
              }, 500);
            } catch (error) {
              console.error('Synthesis error:', error);
              const updatedContent = new Map(synthesizedContent);
              updatedContent.set(mode, { status: 'error', error });
              setSynthesizedContent(updatedContent);
            }
          }, 2000);
        } else {
          // For other modes, load immediately
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
      } else if (mode === 'visual' && synthesizedContent.has('visual')) {
        // If already loaded, show images immediately
        setVisualImagesLoaded(true);
      }
    }
    
    setSelectedModes(newModes);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!intervention) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Practice Not Found</h2>
          <p className="text-sm text-gray-600 mb-6">We couldn't find this practice.</p>
          <button
            onClick={() => router.push('/')}
            className="text-sm font-medium text-gray-900 border border-gray-300 px-4 py-2 rounded-md hover:border-gray-400 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="mb-6 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
        >
          ← Back
        </button>

        {/* Intervention Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-4xl">{intervention.emoji}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                {intervention.phase_tags.map((phase) => (
                  <span
                    key={phase}
                    className={`text-xs font-medium px-2 py-0.5 rounded border capitalize ${getPhaseColor(phase)}`}
                  >
                    {phase}
                  </span>
                ))}
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight">
                {intervention.title}
              </h1>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{intervention.duration_minutes} min</span>
                <span>·</span>
                <span className="capitalize">{intervention.category}</span>
                <span>·</span>
                <span>{intervention.location}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-900 leading-relaxed mb-3 font-medium">
            {intervention.description}
          </p>

          {/* Personalized Introduction (if generated) */}
          {synthesizedContent.get('text')?.data?.introduction && (
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              {synthesizedContent.get('text').data.introduction}
            </p>
          )}

          {/* Research Citation */}
          <p className="text-xs text-gray-500">
            <a 
              href="#research" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              {intervention.research}
            </a>
          </p>
        </div>

        {/* Mode Selection */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-2 tracking-tight">Choose Your Guide Format</h2>
          <p className="text-xs text-gray-600 mb-5">Select one or multiple formats</p>
          
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => handleModeToggle('text')}
              className={`p-4 rounded-lg border transition-all relative ${
                selectedModes.has('text')
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              {selectedModes.has('text') && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-gray-900 text-white rounded flex items-center justify-center text-xs">
                  ✓
                </div>
              )}
              <div className="text-2xl mb-2">📝</div>
              <div className="text-sm font-medium text-gray-900">Text</div>
              <div className="text-xs text-gray-500 mt-0.5">Step-by-step</div>
            </button>

            <button
              onClick={() => handleModeToggle('audio')}
              className={`p-4 rounded-lg border transition-all relative ${
                selectedModes.has('audio')
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              {selectedModes.has('audio') && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-gray-900 text-white rounded flex items-center justify-center text-xs">
                  ✓
                </div>
              )}
              <div className="text-2xl mb-2">🔊</div>
              <div className="text-sm font-medium text-gray-900">Audio</div>
              <div className="text-xs text-gray-500 mt-0.5">Narration</div>
            </button>

            <button
              onClick={() => handleModeToggle('visual')}
              className={`p-4 rounded-lg border transition-all relative ${
                selectedModes.has('visual')
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              {selectedModes.has('visual') && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-gray-900 text-white rounded flex items-center justify-center text-xs">
                  ✓
                </div>
              )}
              <div className="text-2xl mb-2">🎨</div>
              <div className="text-sm font-medium text-gray-900">Visual</div>
              <div className="text-xs text-gray-500 mt-0.5">Illustrated</div>
            </button>
          </div>

          {/* Content Display - Order: Audio → Visual → Text */}
          <div className="border-t border-gray-200 pt-6 space-y-5">
            {selectedModes.size === 0 && (
              <div className="text-center py-16 text-xs text-gray-500">
                Select at least one format to view the guide
              </div>
            )}

            {/* Audio Content (First) */}
            {selectedModes.has('audio') && (
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🔊</span>
                  <h3 className="text-sm font-semibold text-gray-900">Audio Guide</h3>
                </div>

                {synthesizedContent.get('audio')?.status === 'loading' && (
                  <div className="text-center py-12">
                    <div className="text-3xl mb-3">🎧</div>
                    <p className="text-xs text-gray-600">Generating audio...</p>
                  </div>
                )}

                {synthesizedContent.get('audio')?.status === 'ready' && synthesizedContent.get('audio')?.data?.audio_base64 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <audio
                      controls
                      className="w-full"
                      src={`data:audio/mpeg;base64,${synthesizedContent.get('audio').data.audio_base64}`}
                    >
                      Your browser does not support the audio element.
                    </audio>
                    <p className="text-xs text-gray-600 mt-3 text-center">
                      ~{Math.floor(synthesizedContent.get('audio').data.estimated_time / 60)} min
                    </p>
                  </div>
                )}

                {synthesizedContent.get('audio')?.status === 'ready' && !synthesizedContent.get('audio')?.data?.audio_base64 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-xs text-yellow-800">
                      Audio generation requires ElevenLabs API key
                    </p>
                  </div>
                )}

                {synthesizedContent.get('audio')?.status === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-xs text-red-800">
                      Error generating audio guide
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Visual Content (Second) */}
            {selectedModes.has('visual') && (
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🎨</span>
                  <h3 className="text-sm font-semibold text-gray-900">Visual Guide</h3>
                </div>

                {(synthesizedContent.get('visual')?.status === 'loading' || 
                  (synthesizedContent.get('visual')?.status === 'ready' && !visualImagesLoaded)) && (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-3 animate-pulse">🖼️</div>
                    <p className="text-xs text-gray-600">Generating visual diagrams...</p>
                  </div>
                )}

                {synthesizedContent.get('visual')?.status === 'ready' && visualImagesLoaded && (
                  <div className="space-y-4">
                    {synthesizedContent.get('visual')?.data?.visual_urls && 
                     synthesizedContent.get('visual')?.data?.visual_urls.length > 0 ? (
                      // Display step-by-step visual diagrams in 2 columns
                      <div className="grid grid-cols-2 gap-3">
                        {synthesizedContent.get('visual')?.data?.visual_urls.map((url: string, index: number) => {
                          const step = synthesizedContent.get('visual')?.data?.steps?.[index];
                          return (
                            <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex-shrink-0 w-5 h-5 bg-gray-900 text-white rounded flex items-center justify-center font-medium text-xs">
                                  {index + 1}
                                </div>
                                {step && (
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 line-clamp-2">{step.instruction}</p>
                                  </div>
                                )}
                              </div>
                              <div className="w-full rounded-lg overflow-hidden border border-gray-200 mb-2">
                                <img 
                                  src={url} 
                                  alt={`Step ${index + 1}: ${step?.instruction || ''}`}
                                  className="w-full h-auto object-contain max-h-48"
                                  loading="lazy"
                                />
                              </div>
                              {step?.physiological_explanation && (
                                <p className="text-xs text-gray-600 italic line-clamp-2">
                                  {step.physiological_explanation}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // No visual URLs available (placeholder)
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-xs text-gray-600 text-center">
                          Visual guides coming soon
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {synthesizedContent.get('visual')?.status === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-xs text-red-800">
                      Error generating visual guide
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Text Content (Third) */}
            {selectedModes.has('text') && intervention && (
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">📝</span>
                  <h3 className="text-sm font-semibold text-gray-900">Text Guide</h3>
                </div>

                {synthesizedContent.get('text')?.status === 'loading' && (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-3">✍️</div>
                    <p className="text-xs text-gray-600">Generating guide...</p>
                  </div>
                )}

                {synthesizedContent.get('text')?.status === 'ready' && synthesizedContent.get('text')?.data && (
                  <div className="space-y-4">

                    {/* Equipment */}
                    {intervention.equipment && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-1 text-xs">Equipment Needed</h4>
                        <p className="text-gray-700 text-xs">{intervention.equipment}</p>
                      </div>
                    )}

                    {/* Steps */}
                    <div className="space-y-3">
                      {synthesizedContent.get('text').data.steps.map((step: any) => (
                        <div key={step.step_number} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex gap-3 items-start mb-2">
                            <div className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded flex items-center justify-center font-medium text-xs">
                              {step.step_number}
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-900 text-sm font-medium">{step.instruction}</p>
                            </div>
                          </div>
                          
                          {step.breathing_cue && (
                            <div className="ml-9 mt-2 text-xs text-gray-700 bg-white border border-gray-200 rounded px-3 py-2">
                              {step.breathing_cue}
                            </div>
                          )}
                          
                          {step.duration_seconds && (
                            <div className="ml-9 mt-2 text-xs text-gray-500">
                              {step.duration_seconds}s
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Modification */}
                    {synthesizedContent.get('text').data.modification && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-1 text-xs">Modification</h4>
                        <p className="text-gray-700 text-xs">{synthesizedContent.get('text').data.modification}</p>
                      </div>
                    )}
                  </div>
                )}

                {synthesizedContent.get('text')?.status === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-xs text-red-800 mb-2">Error generating text guide</p>
                    <button
                      onClick={() => {
                        if (intervention) {
                          loadTextGuide(intervention.title, intervention);
                        }
                      }}
                      className="text-xs font-medium text-gray-900 border border-gray-300 px-3 py-1.5 rounded-md hover:border-gray-400 transition-colors"
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
            className={`py-2.5 px-8 rounded-md transition-colors text-sm font-medium ${
              isCompleted
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300'
                : 'bg-gray-900 text-white hover:bg-gray-800 border border-gray-900'
            }`}
          >
            {isCompleted ? 'Completed Today' : 'Mark as Done'}
          </button>
        </div>

        {/* Reflection Modal */}
        {showReflectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-gray-300 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1 tracking-tight">How did it go?</h2>
                <p className="text-xs text-gray-600 mb-6">Share your experience to track progress</p>

                {/* Rating Scale */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">How helpful was this practice?</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { value: 1, emoji: '😔', label: 'Not helpful' },
                      { value: 2, emoji: '😐', label: 'Slightly' },
                      { value: 3, emoji: '🙂', label: 'Helpful' },
                      { value: 4, emoji: '😊', label: 'Very' },
                      { value: 5, emoji: '🤩', label: 'Extremely' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setRating(option.value)}
                        className={`p-3 rounded-lg border transition-all ${
                          rating === option.value
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-2xl mb-1">{option.emoji}</div>
                        <div className="text-xs text-gray-600">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Completed Full Practice */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Did you complete the full practice?</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCompletedFull(true)}
                      className={`flex-1 p-3 rounded-lg border transition-all ${
                        completedFull
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-xl mb-1">✅</div>
                      <div className="text-xs font-medium">Yes</div>
                    </button>
                    <button
                      onClick={() => setCompletedFull(false)}
                      className={`flex-1 p-3 rounded-lg border transition-all ${
                        !completedFull
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-xl mb-1">⏸️</div>
                      <div className="text-xs font-medium">Partially</div>
                    </button>
                  </div>
                </div>

                {/* Changes Noticed */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">What changed? (Select all that apply)</h3>
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
                        className={`p-2 rounded-lg border transition-all text-xs ${
                          changesNoticed.includes(tag)
                            ? 'border-gray-900 bg-gray-50 text-gray-900'
                            : 'border-gray-200 hover:border-gray-400 text-gray-700'
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
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Additional notes (optional)</h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any other observations..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSkipReflection}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:border-gray-400 transition-colors text-sm font-medium"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleSubmitReflection}
                    className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    Submit
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
