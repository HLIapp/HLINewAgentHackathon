'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { StaticIntervention } from '@/data/staticInterventions';
import { addCompletedIntervention } from '@/utils/userStorage';

interface BoxBreathingInteractiveProps {
  intervention: StaticIntervention;
}

type PracticePhase = 'selection' | 'countdown' | 'breathing' | 'completed';
type BreathingPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

export default function BoxBreathingInteractive({ intervention }: BoxBreathingInteractiveProps) {
  const router = useRouter();
  const [duration, setDuration] = useState<3 | 5>(3);
  const [phase, setPhase] = useState<PracticePhase>('selection');
  const [countdown, setCountdown] = useState(3);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [breathingPhase, setBreathingPhase] = useState<BreathingPhase>('inhale');
  const [cycleCount, setCycleCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const breathingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  const startCountdown = () => {
    setPhase('countdown');
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          startBreathing();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    countdownTimerRef.current = countdownInterval;
  };

  const startBreathing = () => {
    const totalSeconds = duration * 60;
    setTimeRemaining(totalSeconds);
    setPhase('breathing');
    setBreathingPhase('inhale');
    setCycleCount(0);
    setIsPaused(false);

    // Main timer
    const mainTimer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(mainTimer);
          completePractice();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    timerRef.current = mainTimer;

    // Breathing phase timer (4 seconds per phase)
    let currentBreathingPhase: BreathingPhase = 'inhale';
    let phaseCounter = 0;
    
    const breathingTimer = setInterval(() => {
      phaseCounter++;
      
      // Cycle through breathing phases
      const phases: BreathingPhase[] = ['inhale', 'hold1', 'exhale', 'hold2'];
      const phaseIndex = phaseCounter % 4;
      currentBreathingPhase = phases[phaseIndex];
      setBreathingPhase(currentBreathingPhase);
      
      // Increment cycle count when we complete a full cycle (4 phases)
      if (phaseIndex === 0) {
        setCycleCount((prev) => prev + 1);
      }
    }, 4000);
    
    breathingTimerRef.current = breathingTimer;
  };

  const completePractice = () => {
    setPhase('completed');
    if (timerRef.current) clearInterval(timerRef.current);
    if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
  };

  const handlePause = () => {
    if (isPaused) {
      // Resume
      // Resume main timer
      const mainTimer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(mainTimer);
            completePractice();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      timerRef.current = mainTimer;

      // Resume breathing phase timer
      let phaseCounter = 0;
      const phases: BreathingPhase[] = ['inhale', 'hold1', 'exhale', 'hold2'];
      const currentPhaseIndex = phases.indexOf(breathingPhase);
      phaseCounter = cycleCount * 4 + currentPhaseIndex;
      
      const breathingTimer = setInterval(() => {
        phaseCounter++;
        const phaseIndex = phaseCounter % 4;
        const currentBreathingPhase = phases[phaseIndex];
        setBreathingPhase(currentBreathingPhase);
        
        if (phaseIndex === 0) {
          setCycleCount((prev) => prev + 1);
        }
      }, 4000);
      
      breathingTimerRef.current = breathingTimer;
    } else {
      // Pause
      if (timerRef.current) clearInterval(timerRef.current);
      if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
    }
    
    setIsPaused((prev) => !prev);
  };

  const handleDone = () => {
    // Mark as completed
    const cachedInterventions = localStorage.getItem('current_interventions');
    let interventionId = 'box-breathing';
    
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

  const getBreathingInstruction = (): string => {
    switch (breathingPhase) {
      case 'inhale':
        return 'Breathe In';
      case 'hold1':
        return 'Hold';
      case 'exhale':
        return 'Breathe Out';
      case 'hold2':
        return 'Hold';
      default:
        return 'Breathe';
    }
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
        breathwork: {
          title: 'Why This Matters',
          description: 'During your menstrual phase, your body needs rest and recovery. This breathing practice helps activate your parasympathetic nervous system, reducing stress and promoting calm.',
          tips: [
            'This practice directly supports your nervous system',
            'Even a few minutes can make a difference',
            'There\'s no wrong way to breathe—trust your body'
          ]
        }
      },
      luteal: {
        breathwork: {
          title: 'Why This Matters',
          description: 'During your luteal phase, your nervous system may be more sensitive to stress. Breathwork helps you find calm.',
          tips: [
            'This practice directly supports your nervous system',
            'Even a few minutes can make a difference',
            'There\'s no wrong way to breathe—trust your body'
          ]
        }
      }
    };
    
    return guidance[phase]?.[category] || {
      title: 'Why This Matters',
      description: 'Controlled breathing activates your parasympathetic response, reducing cortisol and stress.',
      tips: [
        'This practice directly supports your nervous system',
        'Even a few minutes can make a difference',
        'There\'s no wrong way to breathe—trust your body'
      ]
    };
  };

  // Selection Screen
  if (phase === 'selection') {
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

          {/* Duration Selection */}
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="mb-8">
              <h2 className="text-base font-semibold text-gray-900 mb-4 text-center">
                Choose Duration
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDuration(3)}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    duration === 3
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 hover:border-gray-400 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-2">⏱️</div>
                  <div className="text-lg font-semibold">3 Minutes</div>
                  <div className="text-xs mt-1 opacity-75">~11 cycles</div>
                </button>
                <button
                  onClick={() => setDuration(5)}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    duration === 5
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 hover:border-gray-400 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-2">⏱️</div>
                  <div className="text-lg font-semibold">5 Minutes</div>
                  <div className="text-xs mt-1 opacity-75">~18 cycles</div>
                </button>
              </div>
            </div>

            <button
              onClick={startCountdown}
              className="w-full px-6 py-4 bg-gray-900 text-white text-lg font-semibold rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <span>🚀</span>
              Start Practice
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Countdown Screen
  if (phase === 'countdown') {
    return (
      <div className="fixed inset-0 bg-gray-900 text-white flex flex-col items-center justify-center z-50">
        <div className="text-9xl font-bold mb-8">
          {countdown > 0 ? countdown : 'Begin'}
        </div>
        <div className="text-xl text-gray-300">
          Get ready to breathe
        </div>
      </div>
    );
  }

  // Breathing Practice Screen
  if (phase === 'breathing') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex flex-col items-center justify-center z-50">
        {/* Timer */}
        <div className="absolute top-8 left-8 right-8 flex items-center justify-between">
          <div className="text-lg font-medium text-gray-700">
            {formatTime(timeRemaining)}
          </div>
          <div className="text-sm font-medium text-gray-600">
            Cycle {cycleCount + 1}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          {/* Breathing Circle */}
          <div 
            className="breathing-circle mb-12" 
            style={isPaused ? { animationPlayState: 'paused' } : { animationPlayState: 'running' }} 
          />

          {/* Instruction Text */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              {getBreathingInstruction()}
            </h2>
            <p className="text-lg text-gray-600">
              {breathingPhase === 'inhale' && 'Slowly through your nose'}
              {breathingPhase === 'hold1' && 'Keep holding'}
              {breathingPhase === 'exhale' && 'Gently through your mouth'}
              {breathingPhase === 'hold2' && 'Stay empty'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-8 right-8 flex items-center justify-center gap-4">
          <button
            onClick={handlePause}
            className="px-6 py-3 bg-white/80 backdrop-blur-sm text-gray-900 rounded-lg hover:bg-white transition-colors border border-gray-200"
          >
            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </button>
          <button
            onClick={() => {
              completePractice();
              if (timerRef.current) clearInterval(timerRef.current);
              if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
            }}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Stop
          </button>
        </div>
      </div>
    );
  }

  // Completed/Celebration Screen
  if (phase === 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center min-h-screen">
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-8xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Practice Complete!
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              You did it! Great job completing your breathing practice.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Duration</p>
                  <p className="text-2xl font-bold text-gray-900">{duration} min</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Cycles</p>
                  <p className="text-2xl font-bold text-gray-900">{cycleCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phase</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">{intervention.phase_tags[0]}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Benefit</p>
                  <p className="text-2xl font-bold text-gray-900">{intervention.benefit}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleDone}
              className="w-full px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

