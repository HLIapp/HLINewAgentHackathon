'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { StaticIntervention } from '@/data/staticInterventions';
import { HIITExercise, HIITWorkout } from '@/types/interventions';
import { addCompletedIntervention } from '@/utils/userStorage';

interface HIITCircuitInteractiveProps {
  intervention: StaticIntervention;
}

type WorkoutPhase = 'selection' | 'countdown' | 'work' | 'rest' | 'transition' | 'completed';

// Available exercises for HIIT circuit
const AVAILABLE_EXERCISES: HIITExercise[] = [
  { id: 'jumping-jacks', name: 'Jumping Jacks', emoji: '🏃', duration_seconds: 30, category: 'cardio', difficulty: 'easy' },
  { id: 'squats', name: 'Squats', emoji: '💪', duration_seconds: 30, category: 'strength', difficulty: 'easy' },
  { id: 'push-ups', name: 'Push-ups', emoji: '💪', duration_seconds: 30, category: 'strength', difficulty: 'moderate' },
  { id: 'lunges', name: 'Lunges', emoji: '🦵', duration_seconds: 30, category: 'strength', difficulty: 'moderate' },
  { id: 'burpees', name: 'Burpees', emoji: '🔥', duration_seconds: 30, category: 'full-body', difficulty: 'challenging' },
  { id: 'mountain-climbers', name: 'Mountain Climbers', emoji: '⛰️', duration_seconds: 30, category: 'cardio', difficulty: 'moderate' },
  { id: 'high-knees', name: 'High Knees', emoji: '🦵', duration_seconds: 30, category: 'cardio', difficulty: 'easy' },
  { id: 'plank', name: 'Plank', emoji: '🛡️', duration_seconds: 30, category: 'core', difficulty: 'moderate' },
  { id: 'jumping-lunges', name: 'Jumping Lunges', emoji: '💥', duration_seconds: 30, category: 'cardio', difficulty: 'challenging' },
  { id: 'wall-sit', name: 'Wall Sit', emoji: '🧘', duration_seconds: 30, category: 'strength', difficulty: 'moderate' },
  { id: 'glute-bridges', name: 'Glute Bridges', emoji: '🍑', duration_seconds: 30, category: 'strength', difficulty: 'easy' },
  { id: 'side-plank', name: 'Side Plank', emoji: '⚖️', duration_seconds: 30, category: 'core', difficulty: 'moderate' },
];

export default function HIITCircuitInteractive({ intervention }: HIITCircuitInteractiveProps) {
  const router = useRouter();
  const [selectedExercises, setSelectedExercises] = useState<HIITExercise[]>([]);
  const [workoutPhase, setWorkoutPhase] = useState<WorkoutPhase>('selection');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [workout, setWorkout] = useState<HIITWorkout | null>(null);
  const [musicEnabled, setMusicEnabled] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio cue functions
  const playAudioCue = (text: string) => {
    // Use Web Speech API for audio cues
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.2;
      utterance.pitch = 1.1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  // Music control
  useEffect(() => {
    if (workoutPhase === 'selection' || workoutPhase === 'completed') {
      // Stop music when not in workout
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    if (musicEnabled && workoutPhase === 'work') {
      // Play music during work intervals
      if (!audioRef.current) {
        // Create audio element (using a royalty-free workout music URL)
        // For now, we'll use a placeholder that can be replaced with actual music
        const audio = new Audio();
        // You can replace this with an actual music URL
        // audio.src = '/workout-music.mp3';
        audio.loop = true;
        audio.volume = 0.5;
        audioRef.current = audio;
        // Note: Audio won't play until user interaction due to browser autoplay policies
        // We'll attempt to play when workout starts
      }
      audioRef.current.play().catch(() => {
        // Autoplay blocked - user needs to interact first
        console.log('Music autoplay blocked. User interaction required.');
      });
    } else {
      // Pause or lower volume during rest
      if (audioRef.current) {
        if (workoutPhase === 'rest' || workoutPhase === 'transition' || workoutPhase === 'countdown') {
          audioRef.current.volume = 0.2;
        } else {
          audioRef.current.pause();
          audioRef.current = null;
        }
      }
    }

    return () => {
      if (audioRef.current && workoutPhase === 'completed') {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [musicEnabled, workoutPhase]);

  const startWorkout = () => {
    if (selectedExercises.length < 3) {
      alert('Please select at least 3 exercises');
      return;
    }

    const rounds = 2;
    const workDuration = selectedExercises[0].duration_seconds;
    const restDuration = 10;
    const totalDuration = (workDuration + restDuration) * selectedExercises.length * rounds;

    const newWorkout: HIITWorkout = {
      exercises: selectedExercises,
      rounds,
      work_duration: workDuration,
      rest_duration: restDuration,
      total_duration: totalDuration,
    };

    setWorkout(newWorkout);
    setWorkoutPhase('countdown');
    setCurrentExerciseIndex(0);
    setCurrentRound(1);
    setTimeRemaining(3); // 3 second countdown

    // Start countdown
    playAudioCue('Get ready!');
  };

  const toggleExercise = (exercise: HIITExercise) => {
    if (selectedExercises.find(e => e.id === exercise.id)) {
      setSelectedExercises(selectedExercises.filter(e => e.id !== exercise.id));
    } else {
      if (selectedExercises.length < 6) {
        setSelectedExercises([...selectedExercises, exercise]);
      }
    }
  };

  const calculateTotalTime = () => {
    if (selectedExercises.length === 0) return 0;
    const workDuration = selectedExercises[0].duration_seconds;
    const restDuration = 10;
    const rounds = 2;
    return (workDuration + restDuration) * selectedExercises.length * rounds;
  };

  // Timer logic
  useEffect(() => {
    if (workoutPhase === 'selection' || workoutPhase === 'completed' || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (timeRemaining <= 0) {
      // Transition to next phase
      if (workoutPhase === 'countdown') {
        setWorkoutPhase('work');
        setTimeRemaining(workout!.work_duration);
        playAudioCue('Go!');
      } else if (workoutPhase === 'work') {
        // Check if we've completed all rounds
        if (currentExerciseIndex >= workout!.exercises.length - 1 && currentRound >= workout!.rounds) {
          setWorkoutPhase('completed');
          playAudioCue('Workout complete! Great job!');
          return;
        }

        // Move to rest
        setWorkoutPhase('rest');
        setTimeRemaining(workout!.rest_duration);
        playAudioCue('Rest');
      } else if (workoutPhase === 'rest') {
        // Move to next exercise or next round
        if (currentExerciseIndex >= workout!.exercises.length - 1) {
          // Next round
          setCurrentRound(currentRound + 1);
          setCurrentExerciseIndex(0);
          setWorkoutPhase('transition');
          setTimeRemaining(3);
          playAudioCue(`Round ${currentRound + 1}`);
        } else {
          // Next exercise
          setCurrentExerciseIndex(currentExerciseIndex + 1);
          setWorkoutPhase('transition');
          setTimeRemaining(3);
          playAudioCue(`Next: ${workout!.exercises[currentExerciseIndex + 1].name}`);
        }
      } else if (workoutPhase === 'transition') {
        // Move to work
        setWorkoutPhase('work');
        setTimeRemaining(workout!.work_duration);
        playAudioCue('Go!');
      }
      return;
    }

    // Countdown timer
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        
        // Audio cues for countdown
        if (workoutPhase === 'work' && newTime === 10) {
          playAudioCue('10 seconds');
        } else if (workoutPhase === 'work' && newTime <= 3 && newTime > 0) {
          playAudioCue(newTime.toString());
        }
        
        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [workoutPhase, timeRemaining, workout, currentExerciseIndex, currentRound, isPaused]);

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      playAudioCue('Resuming');
    } else {
      playAudioCue('Paused');
    }
  };

  const handleDone = () => {
    // Mark as completed
    const cachedInterventions = localStorage.getItem('current_interventions');
    let interventionId = 'hiit-circuit';
    
    if (cachedInterventions) {
      try {
        const parsed = JSON.parse(cachedInterventions);
        const found = parsed.interventions.find((i: { title: string }) => i.title === intervention.title);
        if (found) {
          interventionId = found.id;
        }
      } catch {
        console.error('Error finding intervention ID');
      }
    }

    addCompletedIntervention({
      intervention_id: interventionId,
      intervention_title: intervention.title,
      completed_at: new Date().toISOString(),
      completed_full_practice: true,
    });

    router.push('/');
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

  // Exercise Selection Screen
  if (workoutPhase === 'selection') {
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

          {/* Header */}
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
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  {intervention.description}
                </p>
              </div>
            </div>
          </div>

          {/* Exercise Selection */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Choose Your Exercises
              </h2>
              <div className="text-sm text-gray-600">
                {selectedExercises.length} / 6 selected
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              Select 3-6 exercises. Tap to add or remove.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {AVAILABLE_EXERCISES.map((exercise) => {
                const isSelected = selectedExercises.find(e => e.id === exercise.id);
                return (
                  <button
                    key={exercise.id}
                    onClick={() => toggleExercise(exercise)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 hover:border-gray-400 bg-white'
                    }`}
                  >
                    <div className="text-3xl mb-2">{exercise.emoji}</div>
                    <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {exercise.name}
                    </div>
                    <div className={`text-xs mt-1 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                      {exercise.duration_seconds}s
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedExercises.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Your Circuit:</p>
                    <p className="text-xs text-gray-600">
                      {selectedExercises.map(e => e.name).join(' → ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ~{Math.ceil(calculateTotalTime() / 60)} min
                    </p>
                    <p className="text-xs text-gray-500">2 rounds</p>
                  </div>
                </div>
              </div>
            )}

            {/* Music Toggle */}
            <div className="mb-6">
              <button
                onClick={() => setMusicEnabled(!musicEnabled)}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                  musicEnabled
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">{musicEnabled ? '🔊' : '🔇'}</span>
                  <span className="text-sm font-medium">
                    {musicEnabled ? 'Music On' : 'Music Off'}
                  </span>
                </div>
              </button>
            </div>

            <button
              onClick={startWorkout}
              disabled={selectedExercises.length < 3}
              className="w-full px-6 py-4 bg-gray-900 text-white text-lg font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>🚀</span>
              Start Workout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Timer Screen (Full Screen)
  if (workoutPhase !== 'completed' && workout) {
    const currentExercise = workout.exercises[currentExerciseIndex];
    const progress = workoutPhase === 'work' 
      ? ((workout.work_duration - timeRemaining) / workout.work_duration) * 100
      : workoutPhase === 'rest'
      ? ((workout.rest_duration - timeRemaining) / workout.rest_duration) * 100
      : 0;

    return (
      <div className="fixed inset-0 bg-gray-900 text-white flex flex-col items-center justify-center z-50">
        {/* Phase Indicator */}
        <div className="absolute top-8 left-8 right-8 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-300">
            Round {currentRound} / {workout.rounds}
          </div>
          <div className="text-sm font-medium text-gray-300">
            {currentExerciseIndex + 1} / {workout.exercises.length}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          {/* Exercise Name */}
          <div className="text-5xl mb-8 font-bold text-center">
            {workoutPhase === 'work' && currentExercise.name}
            {workoutPhase === 'rest' && 'Rest'}
            {workoutPhase === 'transition' && (
              currentExerciseIndex < workout.exercises.length - 1
                ? workout.exercises[currentExerciseIndex + 1].name
                : workout.exercises[0].name
            )}
            {workoutPhase === 'countdown' && 'Get Ready!'}
          </div>

          {/* Emoji */}
          <div className="text-8xl mb-8">
            {workoutPhase === 'work' && currentExercise.emoji}
            {workoutPhase === 'rest' && '💤'}
            {workoutPhase === 'transition' && (
              currentExerciseIndex < workout.exercises.length - 1
                ? workout.exercises[currentExerciseIndex + 1].emoji
                : workout.exercises[0].emoji
            )}
            {workoutPhase === 'countdown' && '🏃'}
          </div>

          {/* Timer */}
          <div className="text-9xl font-bold mb-8">
            {timeRemaining}
          </div>

          {/* Progress Bar */}
          {(workoutPhase === 'work' || workoutPhase === 'rest') && (
            <div className="w-full max-w-md h-2 bg-gray-700 rounded-full mb-8">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Next Exercise Preview */}
          {workoutPhase === 'rest' && currentExerciseIndex < workout.exercises.length - 1 && (
            <div className="text-lg text-gray-400 mt-4">
              Next: {workout.exercises[currentExerciseIndex + 1].emoji} {workout.exercises[currentExerciseIndex + 1].name}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-8 right-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setMusicEnabled(!musicEnabled)}
            className={`px-6 py-3 rounded-lg transition-colors ${
              musicEnabled
                ? 'bg-white/30 text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {musicEnabled ? '🔊' : '🔇'}
          </button>
          <button
            onClick={handlePause}
            className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
          >
            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </button>
          <button
            onClick={() => {
              setWorkoutPhase('completed');
              if (timerRef.current) {
                clearInterval(timerRef.current);
              }
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
              }
            }}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Stop
          </button>
        </div>
      </div>
    );
  }

  // Completed Screen
  if (workoutPhase === 'completed' && workout) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center min-h-screen">
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-8xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Workout Complete!
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              You crushed it! Great job completing your HIIT circuit.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Exercises</p>
                  <p className="text-2xl font-bold text-gray-900">{workout.exercises.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Rounds</p>
                  <p className="text-2xl font-bold text-gray-900">{workout.rounds}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Time</p>
                  <p className="text-2xl font-bold text-gray-900">~{Math.ceil(workout.total_duration / 60)} min</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phase</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">{intervention.phase_tags[0]}</p>
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
