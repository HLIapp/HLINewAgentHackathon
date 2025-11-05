'use client';

import { useState, useEffect, useRef } from 'react';
import { StaticIntervention } from '@/data/staticInterventions';
import { useTimer, formatTime } from '@/hooks/useTimer';
import { useInterventionCompletion } from '@/hooks/useInterventionCompletion';
import InterventionHeader from '@/components/shared/InterventionHeader';
import CelebrationCard from '@/components/shared/CelebrationCard';

interface HeatTherapyInteractiveProps {
  intervention: StaticIntervention;
}

type PracticePhase = 'setup' | 'session' | 'completed';
type Position = 'abdomen' | 'back' | 'both';

export default function HeatTherapyInteractive({ intervention }: HeatTherapyInteractiveProps) {
  const { handleDone } = useInterventionCompletion();
  const [phase, setPhase] = useState<PracticePhase>('setup');
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [initialPainLevel, setInitialPainLevel] = useState<number>(5);
  const [finalPainLevel, setFinalPainLevel] = useState<number | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [equipmentReady, setEquipmentReady] = useState(false);
  const [showSafetyReminder, setShowSafetyReminder] = useState(true);
  const [reflection, setReflection] = useState('');
  const [showPositionReminder, setShowPositionReminder] = useState(false);
  const [currentSliderValue, setCurrentSliderValue] = useState(5);
  
  const positionReminderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const completeSession = () => {
    setPhase('completed');
    if (positionReminderTimeoutRef.current) clearTimeout(positionReminderTimeoutRef.current);
    stopRef.current?.();
  };

  const { timeRemaining, isPaused, start, pause, resume, stop } = useTimer({
    onComplete: completeSession,
  });

  // Store stop function in ref
  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  const startSession = () => {
    if (!selectedPosition || !equipmentReady) return;
    
    setPhase('session');
    setIsPaused(false);

    // Start main timer using hook (5 minutes = 300 seconds)
    start(300);

    // Position comfort reminder at 2 minutes (120 seconds)
    positionReminderTimeoutRef.current = setTimeout(() => {
      setShowPositionReminder(true);
    }, 120000); // 2 minutes
  };

  const canStartSession = selectedPosition !== null && equipmentReady;

  // Setup Phase
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <InterventionHeader intervention={intervention} onBack={() => handleDone(intervention)} />

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
              <CelebrationCard
                intervention={intervention}
                stats={[
                  { label: 'Position', value: selectedPosition ? selectedPosition.charAt(0).toUpperCase() + selectedPosition.slice(1) : '' },
                  { label: 'Initial Pain', value: `${initialPainLevel}/10` },
                  { label: 'Final Pain', value: `${finalPainLevel}/10` },
                  { label: 'Reduction', value: painReduction > 0 ? `-${painReduction}` : '0' },
                ]}
                message="You did it! Great job completing your heat therapy session."
                onDone={() => handleDone(intervention, { notes: reflection })}
                reflection={{
                  value: reflection,
                  onChange: setReflection,
                  placeholder: "Share any thoughts or observations..."
                }}
              />
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}

