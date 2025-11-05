'use client';

import { useState, useEffect, useRef } from 'react';
import { StaticIntervention } from '@/data/staticInterventions';
import { useTimer, formatTime } from '@/hooks/useTimer';
import { useInterventionCompletion } from '@/hooks/useInterventionCompletion';
import InterventionHeader from '@/components/shared/InterventionHeader';
import CelebrationCard from '@/components/shared/CelebrationCard';

interface BoxBreathingInteractiveProps {
  intervention: StaticIntervention;
}

type PracticePhase = 'selection' | 'countdown' | 'breathing' | 'completed';
type BreathingPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

export default function BoxBreathingInteractive({ intervention }: BoxBreathingInteractiveProps) {
  const { handleDone } = useInterventionCompletion();
  const [duration, setDuration] = useState<3 | 5>(3);
  const [phase, setPhase] = useState<PracticePhase>('selection');
  const [countdown, setCountdown] = useState(3);
  const [breathingPhase, setBreathingPhase] = useState<BreathingPhase>('inhale');
  const [cycleCount, setCycleCount] = useState(0);
  
  const breathingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const completePractice = () => {
    setPhase('completed');
    if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
    stopRef.current?.();
  };

  const { timeRemaining, isPaused, start, pause, resume, stop } = useTimer({
    onComplete: completePractice,
  });

  // Store stop function in ref
  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
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
    setPhase('breathing');
    setBreathingPhase('inhale');
    setCycleCount(0);

    // Start main timer using hook
    start(totalSeconds);

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

  const handlePause = () => {
    if (isPaused) {
      // Resume main timer
      resume();

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
      pause();
      if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
    }
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


  // Selection Screen
  if (phase === 'selection') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <InterventionHeader intervention={intervention} onBack={() => handleDone(intervention)} />

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
          <CelebrationCard
            intervention={intervention}
            stats={[
              { label: 'Duration', value: `${duration} min` },
              { label: 'Cycles', value: cycleCount },
              { label: 'Phase', value: intervention.phase_tags[0] ? intervention.phase_tags[0].charAt(0).toUpperCase() + intervention.phase_tags[0].slice(1) : '' },
              { label: 'Benefit', value: intervention.benefit },
            ]}
            message="You did it! Great job completing your breathing practice."
            onDone={() => handleDone(intervention)}
          />
        </div>
      </div>
    );
  }

  return null;
}

