'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { StaticIntervention } from '@/data/staticInterventions';
import { ActionableGoal } from '@/types/interventions';
import { saveUserGoal, getLatestGoal, addCompletedIntervention } from '@/utils/userStorage';

interface GoalPlanningInteractiveProps {
  intervention: StaticIntervention;
}

type InputMode = 'text' | 'audio';

export default function GoalPlanningInteractive({ intervention }: GoalPlanningInteractiveProps) {
  const router = useRouter();
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [goalText, setGoalText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [actionableGoal, setActionableGoal] = useState<ActionableGoal | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load saved goal if exists
  useEffect(() => {
    const savedGoal = getLatestGoal(intervention.title);
    if (savedGoal) {
      setActionableGoal(savedGoal.actionable_steps);
      setGoalText(savedGoal.goal);
    }
  }, [intervention.title]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSubmit = async () => {
    if (inputMode === 'text' && !goalText.trim()) {
      setError('Please enter your goal');
      return;
    }

    if (inputMode === 'audio' && !audioBlob) {
      setError('Please record your goal');
      return;
    }

    setIsSynthesizing(true);
    setError(null);

    try {
      let audioBase64: string | undefined;
      
      if (inputMode === 'audio' && audioBlob) {
        audioBase64 = await convertBlobToBase64(audioBlob);
      }

      const response = await fetch('/api/goal-synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal_text: goalText || undefined,
          goal_audio_base64: audioBase64,
          intervention_title: intervention.title,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to synthesize goal');
      }

      const result: ActionableGoal = await response.json();
      setActionableGoal(result);
      
      // Save to localStorage
      saveUserGoal(result.original_goal, result, intervention.title);
    } catch (err) {
      console.error('Error synthesizing goal:', err);
      setError(err instanceof Error ? err.message : 'Failed to synthesize goal. Please try again.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleDone = () => {
    // Mark as completed
    const cachedInterventions = localStorage.getItem('current_interventions');
    let interventionId = 'goal-planning';
    
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
      follicular: {
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
        mindset: {
          title: 'Why This Matters',
          description: 'During ovulation, your communication skills and confidence peak. Use this energy to express yourself authentically.',
          tips: [
            'Your words carry more weight when you\'re clear',
            'This is a powerful time for setting boundaries',
            'Trust your voice—it\'s strongest right now'
          ]
        }
      }
    };
    return guidance[phase]?.[category] || {
      title: 'Why This Matters',
      description: 'Setting clear, achievable goals helps you make progress and feel accomplished.',
      tips: [
        'Break goals into actionable steps',
        'Focus on what you can control',
        'Celebrate small wins along the way'
      ]
    };
  };

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

        {/* Example Goals */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <h3 className="text-xs font-semibold text-gray-900 mb-2">Example Goals</h3>
          <div className="space-y-2">
              <button
                onClick={() => setGoalText("I want to establish a morning routine that energizes me for the day")}
                className="text-xs text-gray-700 text-left block w-full hover:text-gray-900 transition-colors"
              >
                💪 "I want to establish a morning routine that energizes me for the day"
              </button>
              <button
                onClick={() => setGoalText("I want to improve my sleep quality by going to bed 30 minutes earlier")}
                className="text-xs text-gray-700 text-left block w-full hover:text-gray-900 transition-colors"
              >
                😴 "I want to improve my sleep quality by going to bed 30 minutes earlier"
              </button>
              <button
                onClick={() => setGoalText("I want to try a new form of movement that feels good for my body")}
                className="text-xs text-gray-700 text-left block w-full hover:text-gray-900 transition-colors"
              >
                🏃 "I want to try a new form of movement that feels good for my body"
              </button>
              <button
                onClick={() => setGoalText("I want to practice setting boundaries with one person in my life")}
                className="text-xs text-gray-700 text-left block w-full hover:text-gray-900 transition-colors"
              >
                🗣️ "I want to practice setting boundaries with one person in my life"
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 italic">
              Click any example to use it, or write your own!
            </p>
          </div>

        {/* Input Mode Selector */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-2 tracking-tight">
            Share Your Goal
          </h2>
          <p className="text-xs text-gray-600 mb-5">
            Choose how you'd like to express your goal. There's no right or wrong way—whatever feels most natural to you!
          </p>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setInputMode('text')}
              className={`p-4 rounded-lg border transition-all ${
                inputMode === 'text'
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="text-2xl mb-2">📝</div>
              <div className="text-sm font-medium text-gray-900">Write It</div>
              <div className="text-xs text-gray-500 mt-0.5">Perfect for clarity</div>
            </button>

            <button
              onClick={() => setInputMode('audio')}
              className={`p-4 rounded-lg border transition-all ${
                inputMode === 'audio'
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="text-2xl mb-2">🎤</div>
              <div className="text-sm font-medium text-gray-900">Say It</div>
              <div className="text-xs text-gray-500 mt-0.5">Speak naturally</div>
            </button>
          </div>

          {/* Text Input Mode */}
          {inputMode === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  What goal would you like to work towards?
                </label>
                <textarea
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  placeholder="For example: 'I want to establish a morning routine that energizes me' or 'I'd like to improve my sleep quality'..."
                  className="w-full h-32 p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm placeholder-gray-400"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Don't worry about perfection—just write what feels true to you right now. You can always refine it later.
                </p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {goalText.length} / 1000 characters
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!goalText.trim() || isSynthesizing}
                  className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSynthesizing ? (
                    <>
                      <span className="animate-spin">⚡</span>
                      Creating Your Plan...
                    </>
                  ) : (
                    <>
                      ✨ Make It Actionable
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Audio Recording Mode */}
          {inputMode === 'audio' && (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-700 mb-2">
                  <strong>Tips for recording:</strong>
                </p>
                <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Speak naturally, as if you're talking to a friend</li>
                  <li>Start with "I want to..." or "I'd like to..."</li>
                  <li>Don't worry about being perfect—just say what's on your mind</li>
                  <li>You can record for up to 2 minutes</li>
                </ul>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                {!isRecording && !audioBlob && (
                  <div className="text-center">
                    <button
                      onClick={startRecording}
                      className="px-8 py-4 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <span className="text-xl">🎤</span>
                      Start Recording
                    </button>
                    <p className="text-xs text-gray-500 mt-3">
                      Click to begin recording your goal
                    </p>
                  </div>
                )}

                {isRecording && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-900">Recording...</span>
                      <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-xs text-gray-500">Speak naturally—we'll transcribe everything</p>
                    <button
                      onClick={stopRecording}
                      className="px-8 py-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Stop Recording
                    </button>
                  </div>
                )}

                {audioBlob && audioUrl && (
                  <div className="w-full space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-xs font-medium text-gray-700 mb-2">Your Recording:</p>
                      <audio src={audioUrl} controls className="w-full" />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setAudioBlob(null);
                          setAudioUrl(null);
                          audioChunksRef.current = [];
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Record Again
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={isSynthesizing}
                        className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 flex items-center justify-center gap-2"
                      >
                        {isSynthesizing ? (
                          <>
                            <span className="animate-spin">⚡</span>
                            Transcribing & Creating Plan...
                          </>
                        ) : (
                          <>
                            ✨ Make It Actionable
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-xs text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isSynthesizing && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-4xl mb-4 animate-pulse">✨</div>
            <p className="text-base font-medium text-gray-900 mb-2">
              Creating your personalized action plan...
            </p>
            <p className="text-xs text-gray-600">
              We're breaking down your goal into clear, achievable steps
            </p>
          </div>
        )}

        {/* Results Display */}
        {actionableGoal && !isSynthesizing && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
            <div className="text-center mb-6">
              <div className="text-3xl mb-2">🎯</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1 tracking-tight">
                Your Actionable Plan
              </h2>
              <p className="text-xs text-gray-600">
                Your goal broken down into clear, achievable steps
              </p>
            </div>

            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Your Goal:</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {actionableGoal.original_goal}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Your Action Steps:</h3>
              <ol className="space-y-4">
                {actionableGoal.actionable_steps.map((step) => (
                  <li key={step.step_number} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {step.step_number}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-sm text-gray-900 leading-relaxed">{step.action}</p>
                      {step.timeframe && (
                        <p className="text-xs text-gray-500 mt-1.5 font-medium">
                          📅 {step.timeframe}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-5 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-xl">🚀</span>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-900 mb-1">Your Next Action:</h3>
                  <p className="text-sm text-green-800 leading-relaxed">{actionableGoal.next_action}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>💡 Tip:</strong> Start with just the first step. You don't need to tackle everything at once. Small, consistent actions lead to big changes.
              </p>
            </div>

            <button
              onClick={handleDone}
              className="w-full px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Save & Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

