'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { StaticIntervention } from '@/data/staticInterventions';
import { addCompletedIntervention } from '@/utils/userStorage';

interface HeatTherapyInteractiveProps {
  intervention: StaticIntervention;
}

type PracticePhase = 'setup' | 'session' | 'completed';
type Position = 'abdomen' | 'back' | 'both';

export default function HeatTherapyInteractive({ intervention }: HeatTherapyInteractiveProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<PracticePhase>('setup');
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [initialPainLevel, setInitialPainLevel] = useState<number>(5);
  const [finalPainLevel, setFinalPainLevel] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [isPaused, setIsPaused] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [equipmentReady, setEquipmentReady] = useState(false);
  const [showSafetyReminder, setShowSafetyReminder] = useState(true);
  const [reflection, setReflection] = useState('');
  const [showPositionReminder, setShowPositionReminder] = useState(false);
  const [currentSliderValue, setCurrentSliderValue] = useState(5);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const positionReminderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize slider value when entering completion phase
  useEffect(() => {
    if (phase === 'completed' && finalPainLevel === null) {
      setCurrentSliderValue(initialPainLevel);
    }
  }, [phase, initialPainLevel, finalPainLevel]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (positionReminderTimeoutRef.current) clearTimeout(positionReminderTimeoutRef.current);
    };
  }, []);

  const startSession = () => {
    if (!selectedPosition || !equipmentReady) return;
    
    setPhase('session');
    setTimeRemaining(300);
    setIsPaused(false);

    // Main timer
    const mainTimer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(mainTimer);
          completeSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    timerRef.current = mainTimer;

    // Position comfort reminder at 2 minutes (120 seconds)
    positionReminderTimeoutRef.current = setTimeout(() => {
      setShowPositionReminder(true);
    }, 120000); // 2 minutes
  };

  const completeSession = () => {
    setPhase('completed');
    if (timerRef.current) clearInterval(timerRef.current);
    if (positionReminderTimeoutRef.current) clearTimeout(positionReminderTimeoutRef.current);
  };

  const handlePause = () => {
    if (isPaused) {
      // Resume
      const remainingTime = timeRemaining || 300;
      
      const mainTimer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(mainTimer);
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      timerRef.current = mainTimer;
    } else {
      // Pause
      if (timerRef.current) clearInterval(timerRef.current);
    }
    
    setIsPaused((prev) => !prev);
  };

  const handleDone = () => {
    // Mark as completed
    const cachedInterventions = localStorage.getItem('current_interventions');
    let interventionId = 'heat-therapy';
    
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

    addCompletedIntervention({
      intervention_id: interventionId,
      intervention_title: intervention.title,
      completed_at: new Date().toISOString(),
      completed_full_practice: true,
    });

    router.back();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculatePainReduction = (): number => {
    if (finalPainLevel === null) return 0;
    return initialPainLevel - finalPainLevel;
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
        supplementation: {
          title: 'Why This Matters',
          description: 'During your menstrual phase, heat therapy can provide natural pain relief that\'s as effective as NSAIDs. This gentle approach supports your body\'s healing process.',
          tips: [
            'Heat increases blood flow and relaxes muscles',
            'This is a safe, drug-free way to manage pain',
            'Your comfort matters—adjust as needed'
          ]
        }
      }
    };
    
    return guidance[phase]?.[category] || {
      title: 'Why This Matters',
      description: 'Heat therapy provides natural pain relief by increasing blood flow and relaxing muscles.',
      tips: [
        'Heat increases blood flow and relaxes muscles',
        'This is a safe, drug-free way to manage pain',
        'Your comfort matters—adjust as needed'
      ]
    };
  };

  const canStartSession = selectedPosition !== null && equipmentReady;

  // Setup Phase
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-6 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            ← Back
          </button>

          {/* Intervention Header */}
          <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="text-4xl">{intervention.emoji}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  {intervention.phase_tags.map((phaseTag) => (
                    <span
                      key={phaseTag}
                      className={`text-xs font-medium px-2 py-0.5 rounded border capitalize ${getPhaseColor(phaseTag)}`}
                    >
                      {phaseTag}
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

          {/* Setup Wizard */}
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <h2 className="text-base font-semibold text-gray-900 mb-6 text-center">
              Set Up Your Session
            </h2>

            {/* Position Selector */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Where will you apply heat?</h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedPosition('abdomen')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPosition === 'abdomen'
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 hover:border-gray-400 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-2">🫁</div>
                  <div className="text-sm font-medium">Lower Abdomen</div>
                </button>
                <button
                  onClick={() => setSelectedPosition('back')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPosition === 'back'
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 hover:border-gray-400 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-2">🫂</div>
                  <div className="text-sm font-medium">Lower Back</div>
                </button>
                <button
                  onClick={() => setSelectedPosition('both')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPosition === 'both'
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 hover:border-gray-400 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-2">🔥</div>
                  <div className="text-sm font-medium">Both</div>
                </button>
              </div>
            </div>

            {/* Pain Level Slider */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Initial pain level: {initialPainLevel}/10
              </h3>
              <input
                type="range"
                min="1"
                max="10"
                value={initialPainLevel}
                onChange={(e) => setInitialPainLevel(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>No pain</span>
                <span>Severe pain</span>
              </div>
            </div>

            {/* Equipment Check */}
            <div className="mb-6">
              <button
                onClick={() => setEquipmentReady(!equipmentReady)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  equipmentReady
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 hover:border-gray-400 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-xl">{equipmentReady ? '✅' : '☐'}</div>
                  <div>
                    <div className="font-medium">I have my heat source ready</div>
                    <div className="text-xs opacity-75 mt-1">
                      {intervention.equipment || 'Heating pad or hot water bottle'}
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Temperature Safety Reminder */}
            {showSafetyReminder && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-yellow-900 mb-2">Safety Reminder</h4>
                    <p className="text-xs text-yellow-800 leading-relaxed">
                      Heat should feel warm and comfortable, not scalding. If it feels too hot, add a layer of fabric between the heat source and your skin. Always prioritize your comfort and safety.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSafetyReminder(false)}
                    className="ml-4 text-yellow-600 hover:text-yellow-800"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Start Session Button */}
            <button
              onClick={startSession}
              disabled={!canStartSession}
              className="w-full px-6 py-4 bg-gray-900 text-white text-lg font-semibold rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>🔥</span>
              Start Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Session Phase
  if (phase === 'session') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 flex flex-col items-center justify-center z-50">
        {/* Position Reminder Modal */}
        {showPositionReminder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Comfort Check</h3>
              <p className="text-sm text-gray-600 mb-4">
                How is your position feeling? Make sure you're comfortable and the heat source is still at a safe temperature.
              </p>
              <button
                onClick={() => setShowPositionReminder(false)}
                className="w-full px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
              >
                I'm comfortable
              </button>
            </div>
          </div>
        )}

        {/* Timer */}
        <div className="absolute top-8 left-8 right-8 flex items-center justify-between">
          <div className="text-lg font-medium text-gray-700">
            {formatTime(timeRemaining)}
          </div>
          <div className="text-sm font-medium text-gray-600">
            Heat Therapy Session
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          {/* Warmth Indicator */}
          <div 
            className="warmth-indicator mb-12" 
            style={isPaused ? { animationPlayState: 'paused' } : { animationPlayState: 'running' }} 
          />

          {/* Instruction Text */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Feel the Warmth
            </h2>
            <p className="text-lg text-gray-600">
              Breathe deeply and relax. Let the heat soothe your body.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-8 right-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`px-6 py-3 bg-white/80 backdrop-blur-sm text-gray-900 rounded-lg hover:bg-white transition-colors border border-gray-200 ${
              audioEnabled ? 'bg-orange-100 border-orange-300' : ''
            }`}
          >
            {audioEnabled ? '🔊 Audio On' : '🔇 Audio Off'}
          </button>
          <button
            onClick={handlePause}
            className="px-6 py-3 bg-white/80 backdrop-blur-sm text-gray-900 rounded-lg hover:bg-white transition-colors border border-gray-200"
          >
            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </button>
          <button
            onClick={() => {
              completeSession();
              if (timerRef.current) clearInterval(timerRef.current);
            }}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Stop
          </button>
        </div>
      </div>
    );
  }

  // Completion Phase
  if (phase === 'completed') {
    const painReduction = calculatePainReduction();
    const painReductionPercent = initialPainLevel > 0 
      ? Math.round((painReduction / initialPainLevel) * 100) 
      : 0;

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Final Pain Assessment */}
          {finalPainLevel === null ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                How are you feeling now?
              </h2>
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  Final pain level: <span className="font-semibold">{currentSliderValue}/10</span>
                </h3>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={currentSliderValue}
                  onChange={(e) => setCurrentSliderValue(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>No pain</span>
                  <span>Severe pain</span>
                </div>
              </div>
              <button
                onClick={() => setFinalPainLevel(currentSliderValue)}
                className="w-full px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Continue
              </button>
            </div>
          ) : (
            <>
              {/* Progress Visualization */}
              <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  Your Progress
                </h2>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <div className="text-xs text-red-600 mb-2">Before</div>
                    <div className="text-4xl font-bold text-red-900">{initialPainLevel}</div>
                    <div className="text-xs text-red-600 mt-1">/ 10</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <div className="text-xs text-green-600 mb-2">After</div>
                    <div className="text-4xl font-bold text-green-900">{finalPainLevel}</div>
                    <div className="text-xs text-green-600 mt-1">/ 10</div>
                  </div>
                </div>
                {painReduction > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                    <div className="text-sm font-semibold text-orange-900 mb-1">
                      Pain reduced by {painReduction} point{painReduction !== 1 ? 's' : ''}
                    </div>
                    {painReductionPercent > 0 && (
                      <div className="text-xs text-orange-700">
                        {painReductionPercent}% improvement
                      </div>
                    )}
                  </div>
                )}
                {painReduction === 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-sm font-semibold text-blue-900">
                      Your pain level stayed the same
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      Sometimes it takes time. You're still taking care of yourself.
                    </div>
                  </div>
                )}
              </div>

              {/* Celebration Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center mb-6">
                <div className="text-8xl mb-6">🎉</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Session Complete!
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  You did it! Great job completing your heat therapy session.
                </p>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Position</p>
                      <p className="text-2xl font-bold text-gray-900 capitalize">{selectedPosition}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Initial Pain</p>
                      <p className="text-2xl font-bold text-gray-900">{initialPainLevel}/10</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Final Pain</p>
                      <p className="text-2xl font-bold text-gray-900">{finalPainLevel}/10</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Reduction</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {painReduction > 0 ? `-${painReduction}` : '0'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Optional Reflection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Optional: How did this session feel?
                  </label>
                  <textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="Share any thoughts or observations..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <button
                  onClick={handleDone}
                  className="w-full px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}

