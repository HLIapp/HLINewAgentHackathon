'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getInterventionByTitle, getAllStaticInterventions, StaticIntervention } from '@/data/staticInterventions';
import { addCompletedIntervention, isInterventionCompletedToday, CompletedIntervention } from '@/utils/userStorage';
import GoalPlanningInteractive from '@/components/GoalPlanningInteractive';
import VoiceYourNeedsInteractive from '@/components/VoiceYourNeedsInteractive';
import SuccessReviewInteractive from '@/components/SuccessReviewInteractive';
import HIITCircuitInteractive from '@/components/HIITCircuitInteractive';
import ProteinBreakfastInteractive from '@/components/ProteinBreakfastInteractive';
import PowerWalkInteractive from '@/components/PowerWalkInteractive';
import ReflectiveJournalingInteractive from '@/components/ReflectiveJournalingInteractive';

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
    // Extract intervention ID from URL - could be an ID or a title slug
    const interventionSlug = params.id as string;
    
    // Convert slug to title format for lookup
    const slugToTitle = (slug: string): string => {
      // Handle special cases first
      const specialCases: Record<string, string> = {
        'childs-pose': "Child's Pose",
        'box-breathing': 'Box Breathing',
        'heat-therapy': 'Heat Therapy',
        'power-walk': 'Power Walk',
        'protein-rich-breakfast': 'Protein-Rich Breakfast',
        'goal-planning': 'Goal Planning',
        'hiit-circuit': 'HIIT Circuit',
        'voice-your-needs': 'Voice Your Needs',
        'success-review': 'Success Review',
        'reflective-journaling': 'Reflective Journaling',
      };
      
      if (specialCases[slug]) {
        return specialCases[slug];
      }
      
      // Generic conversion
      return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };
    
    const interventionTitle = slugToTitle(interventionSlug);
    
    // Try to get intervention from cache first
    const cachedInterventions = localStorage.getItem('current_interventions');
    let foundIntervention: any = null;
    
    if (cachedInterventions) {
      try {
        const parsed = JSON.parse(cachedInterventions);
        // Try to find by title (matching the slug)
        foundIntervention = parsed.interventions.find((i: any) => 
          i.title === interventionTitle ||
          i.title.toLowerCase() === interventionTitle.toLowerCase()
        );
      } catch (error) {
        console.error('Error loading intervention from cache:', error);
      }
    }
    
    // Get full details from static data
    let fullDetails = getInterventionByTitle(interventionTitle);
    
    // If not found, try case-insensitive search
    if (!fullDetails) {
      const allInterventions = getAllStaticInterventions();
      fullDetails = allInterventions.find(
        i => i.title.toLowerCase() === interventionTitle.toLowerCase()
      ) || null;
    }
    
    if (fullDetails) {
      setIntervention(fullDetails);
      loadTextGuide(fullDetails.title, fullDetails);
      
      // Check completion status using the found intervention ID or title
      if (foundIntervention) {
        const completedToday = isInterventionCompletedToday(foundIntervention.id);
        setIsCompleted(completedToday);
      } else {
        // Try to find completion by title if ID not available
        const completedData = localStorage.getItem('completed_interventions');
        if (completedData) {
          try {
            const parsed = JSON.parse(completedData);
            const completedToday = parsed.some((c: any) => 
              c.intervention_title === fullDetails.title &&
              new Date(c.completed_at).toDateString() === new Date().toDateString()
            );
            setIsCompleted(completedToday);
          } catch (error) {
            console.error('Error checking completion:', error);
          }
        }
      }
    }

    setLoading(false);
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
      // Find the intervention ID from cache if available
      const cachedInterventions = localStorage.getItem('current_interventions');
      let interventionId = params.id as string;
      
      if (cachedInterventions) {
        try {
          const parsed = JSON.parse(cachedInterventions);
          const found = parsed.interventions.find((i: any) => i.title === intervention?.title);
          if (found) {
            interventionId = found.id;
          }
        } catch (error) {
          console.error('Error finding intervention ID:', error);
        }
      }
      
      const completion: CompletedIntervention = {
        intervention_id: interventionId,
        intervention_title: intervention.title,
        completed_at: new Date().toISOString(),
        completed_full_practice: true,
      };
      
      addCompletedIntervention(completion);
      setIsCompleted(true);
      setShowReflectionModal(false);
      router.back();
    }
  };

  const handleSubmitReflection = async () => {
    if (!intervention || !params.id) return;

    // Find the intervention ID from cache if available
    const cachedInterventions = localStorage.getItem('current_interventions');
    let interventionId = params.id as string;
    
    if (cachedInterventions) {
      try {
        const parsed = JSON.parse(cachedInterventions);
        const found = parsed.interventions.find((i: any) => i.title === intervention.title);
        if (found) {
          interventionId = found.id;
        }
      } catch (error) {
        console.error('Error finding intervention ID:', error);
      }
    }

    const completion: CompletedIntervention = {
      intervention_id: interventionId,
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
    router.back();
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
        } else if (mode === 'text') {
          // For text mode, simulate loading delay to show spinner
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
            } catch (error) {
              console.error('Synthesis error:', error);
              const updatedContent = new Map(synthesizedContent);
              updatedContent.set(mode, { status: 'error', error });
              setSynthesizedContent(updatedContent);
            }
          }, 1500); // 1.5 second delay for text generation
        } else if (mode === 'audio') {
          // For audio mode, simulate loading delay to show spinner
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
            } catch (error) {
              console.error('Synthesis error:', error);
              const updatedContent = new Map(synthesizedContent);
              updatedContent.set(mode, { status: 'error', error });
              setSynthesizedContent(updatedContent);
            }
          }, 2000); // 2 second delay for audio generation
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

  const getPhaseGuidance = (phase: string, category: string) => {
    const guidance: Record<string, Record<string, { title: string; description: string; tips: string[] }>> = {
      menstrual: {
        movement: {
          title: 'Why This Matters',
          description: 'During your menstrual phase, your body needs gentle movement and rest. This practice supports your body\'s natural recovery process.',
          tips: [
            'Listen to your body—if something doesn\'t feel right, modify or skip',
            'This is a time for self-compassion, not pushing yourself',
            'Even gentle movement can help ease discomfort'
          ]
        },
        breathwork: {
          title: 'Why This Matters',
          description: 'Your menstrual phase is a time when your body naturally wants to slow down. Breathwork can help you honor that need while easing any discomfort.',
          tips: [
            'There\'s no "right" way to breathe—just what feels good to you',
            'If you feel dizzy, slow down or stop',
            'This practice is here to support you, not add pressure'
          ]
        },
        supplementation: {
          title: 'Why This Matters',
          description: 'During your period, your body is working hard. Simple comfort measures can make a significant difference in how you feel.',
          tips: [
            'This is evidence-based care for your body',
            'You deserve comfort and relief',
            'Take your time—there\'s no rush'
          ]
        }
      },
      follicular: {
        movement: {
          title: 'Why This Matters',
          description: 'During your follicular phase, rising estrogen gives you more energy and strength. This is the perfect time to build momentum.',
          tips: [
            'Your body is primed for building strength right now',
            'Start where you are—every movement counts',
            'This phase supports your body\'s natural capacity for growth'
          ]
        },
        nutrition: {
          title: 'Why This Matters',
          description: 'Your follicular phase is when your body is building. Nourishing yourself well now supports your entire cycle.',
          tips: [
            'Food is fuel and medicine for your body',
            'Every meal is an opportunity to support your wellbeing',
            'Simple, consistent choices make a big difference'
          ]
        },
        mindset: {
          title: 'Why This Matters',
          description: 'During your follicular phase, your cognitive function and optimism peak. This is the perfect time to harness that clarity.',
          tips: [
            'Your brain is at its most capable right now',
            'This is a great time to set intentions',
            'Trust your instincts—they\'re sharper during this phase'
          ]
        }
      },
      ovulatory: {
        movement: {
          title: 'Why This Matters',
          description: 'During ovulation, your body reaches peak performance. This is your window to challenge yourself and feel your strength.',
          tips: [
            'Your coordination and reaction time are at their peak',
            'This is a great time to try something new',
            'Your body is showing you what it\'s capable of'
          ]
        },
        mindset: {
          title: 'Why This Matters',
          description: 'During ovulation, your communication skills and confidence peak. Use this energy to express yourself authentically.',
          tips: [
            'Your words carry more weight when you\'re clear',
            'This is a powerful time for setting boundaries',
            'Trust your voice—it\'s strongest right now'
          ]
        },
        reflection: {
          title: 'Why This Matters',
          description: 'During ovulation, your mood and self-perception are at their peak. This is the perfect time to acknowledge your wins.',
          tips: [
            'Celebrating yourself builds confidence',
            'Your accomplishments deserve recognition',
            'Positive self-reflection supports your wellbeing'
          ]
        }
      },
      luteal: {
        movement: {
          title: 'Why This Matters',
          description: 'During your luteal phase, your body needs gentle, grounding movement. This practice supports your body\'s natural rhythm.',
          tips: [
            'Gentle movement can ease tension and discomfort',
            'This is not about pushing—it\'s about supporting',
            'Your body knows what it needs—listen to it'
          ]
        },
        reflection: {
          title: 'Why This Matters',
          description: 'During your luteal phase, emotions can feel more intense. Journaling helps process these feelings without judgment.',
          tips: [
            'There\'s no right or wrong way to journal',
            'Writing helps you understand yourself better',
            'This is a safe space for whatever you\'re feeling'
          ]
        },
        breathwork: {
          title: 'Why This Matters',
          description: 'During your luteal phase, your nervous system may be more sensitive to stress. Breathwork helps you find calm.',
          tips: [
            'This practice directly supports your nervous system',
            'Even a few minutes can make a difference',
            'You\'re learning to regulate your body\'s response'
          ]
        }
      }
    };
    
    return guidance[phase]?.[category] || {
      title: 'Why This Matters',
      description: 'This practice is designed to support your body during this phase of your cycle.',
      tips: [
        'Listen to your body',
        'There\'s no perfect way to do this',
        'Every small step counts'
      ]
    };
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
            onClick={() => router.back()}
            className="text-sm font-medium text-gray-900 border border-gray-300 px-4 py-2 rounded-md hover:border-gray-400 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Render interactive component for HIIT Circuit
  if (intervention.interaction_type === 'interactive_movement' && intervention.title === 'HIIT Circuit') {
    return <HIITCircuitInteractive intervention={intervention} />;
  }

  // Render interactive component for Goal Planning
  if (intervention.interaction_type === 'interactive_goal' && intervention.title === 'Goal Planning') {
    return <GoalPlanningInteractive intervention={intervention} />;
  }

  // Render interactive component for Voice Your Needs
  if (intervention.interaction_type === 'interactive_goal' && intervention.title === 'Voice Your Needs') {
    return <VoiceYourNeedsInteractive intervention={intervention} />;
  }

  // Render interactive component for Success Review
  if (intervention.interaction_type === 'interactive_goal' && intervention.title === 'Success Review') {
    return <SuccessReviewInteractive intervention={intervention} />;
  }

  // Render interactive component for Reflective Journaling
  if (intervention.interaction_type === 'interactive_goal' && intervention.title === 'Reflective Journaling') {
    return <ReflectiveJournalingInteractive intervention={intervention} />;
  }

  // Render interactive component for Protein-Rich Breakfast
  if (intervention.interaction_type === 'interactive_nutrition') {
    return <ProteinBreakfastInteractive intervention={intervention} />;
  }

  // Render interactive component for Power Walk
  if (intervention.interaction_type === 'interactive_movement') {
    return <PowerWalkInteractive intervention={intervention} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
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
          <p className="text-sm text-gray-900 leading-relaxed mb-4 font-medium">
            {intervention.description}
          </p>

          {/* Phase-Specific Guidance */}
          {intervention.phase_tags[0] && (
            <div className={`rounded-lg border p-4 mb-4 ${getPhaseColor(intervention.phase_tags[0])}`}>
              {(() => {
                const guidance = getPhaseGuidance(intervention.phase_tags[0], intervention.category);
                return (
                  <>
                    <h3 className="text-xs font-semibold mb-2">{guidance.title}</h3>
                    <p className="text-xs leading-relaxed mb-3">
                      {guidance.description}
                    </p>
                    <div className="space-y-1">
                      {guidance.tips.map((tip: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-xs mt-0.5">•</span>
                          <p className="text-xs leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Personalized Introduction (if generated) */}
          {synthesizedContent.get('text')?.data?.introduction && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                {synthesizedContent.get('text').data.introduction}
              </p>
            </div>
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
          <p className="text-xs text-gray-600 mb-5">
            Pick the format that works best for you—or select multiple! There's no right or wrong way to practice.
          </p>
          
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
              <div className="text-xs text-gray-500 mt-0.5">Read at your pace</div>
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
              <div className="text-xs text-gray-500 mt-0.5">Hands-free guidance</div>
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
              <div className="text-xs text-gray-500 mt-0.5">See it step-by-step</div>
            </button>
          </div>

          {/* Content Display - Order: Audio → Visual → Text */}
          <div className="border-t border-gray-200 pt-6 space-y-5">
            {selectedModes.size === 0 && (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">✨</div>
                <p className="text-sm font-medium text-gray-900 mb-2">Ready to get started?</p>
                <p className="text-xs text-gray-500">
                  Select a format above to view your personalized guide
                </p>
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
                    <div className="text-4xl mb-4 animate-pulse">🎧</div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Preparing your audio guide...</p>
                    <p className="text-xs text-gray-600">This will only take a moment</p>
                  </div>
                )}

                {synthesizedContent.get('audio')?.status === 'ready' && synthesizedContent.get('audio')?.data?.audio_base64 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-3 text-center">
                      💡 Put on headphones for the best experience. You can pause anytime.
                    </p>
                    <audio
                      controls
                      className="w-full"
                      src={`data:audio/mpeg;base64,${synthesizedContent.get('audio').data.audio_base64}`}
                    >
                      Your browser does not support the audio element.
                    </audio>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      Duration: ~{Math.floor(synthesizedContent.get('audio').data.estimated_time / 60)} minutes
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
                    <div className="text-4xl mb-4 animate-pulse">🖼️</div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Preparing visual guides...</p>
                    <p className="text-xs text-gray-600">Just a moment</p>
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
                    <div className="text-4xl mb-4 animate-pulse">✍️</div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Creating your personalized guide...</p>
                    <p className="text-xs text-gray-600">This will only take a moment</p>
                  </div>
                )}

                {synthesizedContent.get('text')?.status === 'ready' && synthesizedContent.get('text')?.data && (
                  <div className="space-y-4">

                    {/* Equipment */}
                    {intervention.equipment && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-1 text-xs flex items-center gap-2">
                          <span>📦</span>
                          What You'll Need
                        </h4>
                        <p className="text-blue-800 text-xs">{intervention.equipment}</p>
                      </div>
                    )}

                    {/* Steps */}
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Follow along at your own pace:</p>
                      {synthesizedContent.get('text').data.steps.map((step: any) => (
                        <div key={step.step_number} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex gap-3 items-start mb-2">
                            <div className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded flex items-center justify-center font-medium text-xs">
                              {step.step_number}
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-900 text-sm font-medium leading-relaxed">{step.instruction}</p>
                            </div>
                          </div>
                          
                          {step.breathing_cue && (
                            <div className="ml-9 mt-2 text-xs text-gray-700 bg-white border border-gray-200 rounded px-3 py-2">
                              <span className="font-medium">💨 Breathing:</span> {step.breathing_cue}
                            </div>
                          )}
                          
                          {step.physiological_explanation && (
                            <div className="ml-9 mt-2 text-xs text-gray-600 italic">
                              {step.physiological_explanation}
                            </div>
                          )}
                          
                          {step.duration_seconds && (
                            <div className="ml-9 mt-2 text-xs text-gray-500">
                              ⏱️ {step.duration_seconds} seconds
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                        <p className="text-xs text-green-800 text-center">
                          ✨ You did it! Take a moment to notice how you feel.
                        </p>
                      </div>
                    </div>

                    {/* Modification */}
                    {synthesizedContent.get('text').data.modification && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-900 mb-1 text-xs flex items-center gap-2">
                          <span>💡</span>
                          Modification Tip
                        </h4>
                        <p className="text-green-800 text-xs">{synthesizedContent.get('text').data.modification}</p>
                        <p className="text-xs text-green-700 mt-2 italic">Remember: Modifications are about making it work for YOU</p>
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
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="text-center">
            {isCompleted ? (
              <>
                <div className="text-3xl mb-2">🎉</div>
                <p className="text-sm font-medium text-gray-900 mb-1">You completed this practice today!</p>
                <p className="text-xs text-gray-600">Great job taking care of yourself</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-900 mb-3">
                  Ready to mark this as complete?
                </p>
                <p className="text-xs text-gray-600 mb-4">
                  You can share how it went, or just mark it done—whatever feels right
                </p>
                <button
                  onClick={handleDoneClick}
                  className="px-8 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Mark as Done ✨
                </button>
              </>
            )}
          </div>
        </div>

        {/* Reflection Modal */}
        {showReflectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-gray-300 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl mb-2">✨</div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1 tracking-tight">How did it go?</h2>
                  <p className="text-xs text-gray-600">Share your experience—or skip if you prefer. This is completely optional!</p>
                </div>

                {/* Rating Scale */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">How helpful was this practice?</h3>
                  <p className="text-xs text-gray-500 mb-3">This helps us understand what works best for you</p>
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
                  <p className="text-xs text-gray-500 mb-3">No judgment—partial completion counts too!</p>
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
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Notice any changes? (Optional)</h3>
                  <p className="text-xs text-gray-500 mb-3">Select what you noticed—this helps track what works for you</p>
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
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Anything else you'd like to note? (Optional)</h3>
                  <p className="text-xs text-gray-500 mb-3">Your thoughts, feelings, or observations—whatever comes to mind</p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="For example: 'I felt more relaxed' or 'This was easier than I expected'..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 resize-none"
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSkipReflection}
                    className="flex-1 border border-gray-300 text-gray-700 py-2.5 px-4 rounded-md hover:border-gray-400 hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Skip for Now
                  </button>
                  <button
                    onClick={handleSubmitReflection}
                    className="flex-1 bg-gray-900 text-white py-2.5 px-4 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    Save Reflection ✨
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
