'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StaticIntervention } from '@/data/staticInterventions';
import { SuccessReviewPrompt, SuccessReviewResponse } from '@/types/interventions';
import { addCompletedIntervention } from '@/utils/userStorage';

interface SuccessReviewInteractiveProps {
  intervention: StaticIntervention;
}

type ViewMode = 'prompt-selection' | 'win-input' | 'celebration';

// Reflection prompts
const REFLECTION_PROMPTS: SuccessReviewPrompt[] = [
  {
    id: 'past-desire',
    question: 'What did you really want a month ago?',
    emoji: '🌱',
    category: 'Progress',
  },
  {
    id: 'challenge-overcome',
    question: 'What challenge did you overcome?',
    emoji: '💪',
    category: 'Strength',
  },
  {
    id: 'progress-made',
    question: 'What progress did you make?',
    emoji: '📈',
    category: 'Growth',
  },
  {
    id: 'boundary-set',
    question: 'What boundary did you set?',
    emoji: '🛡️',
    category: 'Self-Care',
  },
  {
    id: 'skill-practiced',
    question: 'What skill did you practice?',
    emoji: '🎯',
    category: 'Learning',
  },
];

export default function SuccessReviewInteractive({ intervention }: SuccessReviewInteractiveProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('prompt-selection');
  const [selectedPrompt, setSelectedPrompt] = useState<SuccessReviewPrompt | null>(null);
  const [winText, setWinText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [amplifiedWin, setAmplifiedWin] = useState<SuccessReviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

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
        reflection: {
          title: 'Why This Matters',
          description: 'During your menstrual phase, reflection helps you honor your body\'s needs and process your experiences.',
          tips: [
            'Your feelings are valid and important',
            'This is a time for self-compassion',
            'Reflection supports your emotional wellbeing'
          ]
        }
      },
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
        reflection: {
          title: 'Why This Matters',
          description: 'During ovulation, your mood and self-perception are at their peak. This is the perfect time to acknowledge your wins.',
          tips: [
            'Celebrating yourself builds confidence',
            'Your accomplishments deserve recognition',
            'Positive self-reflection supports your wellbeing'
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
        }
      },
      luteal: {
        reflection: {
          title: 'Why This Matters',
          description: 'During your luteal phase, reflecting on your wins can boost mood and remind you of your strengths.',
          tips: [
            'Acknowledging progress helps maintain perspective',
            'Your accomplishments matter, especially now',
            'Celebration supports your emotional balance'
          ]
        }
      }
    };
    return guidance[phase]?.[category] || {
      title: 'Why This Matters',
      description: 'Reflecting on your successes helps build confidence and momentum for continued growth.',
      tips: [
        'Every win, big or small, deserves celebration',
        'Your progress is meaningful',
        'Positive reflection supports your wellbeing'
      ]
    };
  };

  const handlePromptSelect = (prompt: SuccessReviewPrompt) => {
    setSelectedPrompt(prompt);
    setViewMode('win-input');
  };

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

  const clearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
  };

  const handleSubmit = async () => {
    if (!winText.trim() && !audioBlob) {
      setError('Please share your win using text or voice.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let audioBase64: string | undefined;
      
      if (audioBlob) {
        audioBase64 = await convertBlobToBase64(audioBlob);
      }

      // If audio is provided, transcribe it first
      let finalWinText = winText;
      
      if (audioBase64 && !winText.trim()) {
        // Transcribe audio using the voice-needs API (it handles Whisper transcription)
        const transcriptionResponse = await fetch('/api/voice-needs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            need_audio_base64: audioBase64,
            need_text: '',
            intervention_title: intervention.title,
          }),
        });
        
        if (transcriptionResponse.ok) {
          const transcriptionData = await transcriptionResponse.json();
          // Use original_need which contains the transcribed text
          finalWinText = transcriptionData.original_need || transcriptionData.refined_statement || '';
        } else {
          throw new Error('Failed to transcribe audio. Please try using text input.');
        }
      }

      if (!finalWinText.trim()) {
        setError('Could not process audio. Please try using text input.');
        setIsProcessing(false);
        return;
      }

      // Amplify the win
      const response = await fetch('/api/success-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          win_text: finalWinText,
          prompt_id: selectedPrompt?.id,
          intervention_title: intervention.title,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to amplify win');
      }

      const data: SuccessReviewResponse = await response.json();
      setAmplifiedWin(data);
      setViewMode('celebration');
    } catch (error) {
      console.error('Error processing win:', error);
      setError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDone = () => {
    // Mark as completed
    const cachedInterventions = localStorage.getItem('current_interventions');
    let interventionId = 'success-review';
    
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

    router.back();
  };

  // Prompt Selection Screen
  if (viewMode === 'prompt-selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 py-8">
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

          {/* Reflection Prompts */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Choose a Reflection Prompt
            </h2>
            <p className="text-sm text-gray-600 mb-8">
              Select a question to help you identify a win you want to celebrate
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {REFLECTION_PROMPTS.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => handlePromptSelect(prompt)}
                  className="p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-purple-400 hover:bg-purple-50 transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{prompt.emoji}</div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-purple-600 mb-2 uppercase tracking-wide">
                        {prompt.category}
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-purple-900 transition-colors">
                        {prompt.question}
                      </h3>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Win Input Screen
  if (viewMode === 'win-input') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Back Button */}
          <button
            onClick={() => setViewMode('prompt-selection')}
            className="mb-6 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
          >
            ← Back
          </button>

          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 mb-8 shadow-lg">
            <div className="flex items-start gap-4 mb-6">
              <div className="text-5xl">{selectedPrompt?.emoji}</div>
              <div className="flex-1">
                <div className="text-xs font-medium text-purple-600 mb-2 uppercase tracking-wide">
                  {selectedPrompt?.category}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {selectedPrompt?.question}
                </h2>
                <p className="text-sm text-gray-600">
                  Share your win in detail. What happened? How did it make you feel?
                </p>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-lg mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share your win
              </label>
              <textarea
                value={winText}
                onChange={(e) => setWinText(e.target.value)}
                placeholder="Tell us about your win... What did you accomplish? How did it feel? What does it mean to you?"
                className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Audio Recording Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Or record your win
                </label>
                {audioUrl && (
                  <button
                    onClick={clearAudio}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                {!isRecording && !audioBlob && (
                  <button
                    onClick={startRecording}
                    className="px-6 py-3 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                  >
                    🎤 Start Recording
                  </button>
                )}

                {isRecording && (
                  <button
                    onClick={stopRecording}
                    className="px-6 py-3 rounded-lg font-medium transition-colors bg-red-500 text-white hover:bg-red-600"
                  >
                    ⏹️ Stop Recording
                  </button>
                )}

                {audioUrl && !isRecording && (
                  <div className="flex items-center gap-4 flex-1">
                    <audio
                      src={audioUrl}
                      controls
                      className="flex-1 h-10"
                    />
                    <span className="text-sm text-green-600">✓ Ready</span>
                  </div>
                )}
              </div>

              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>
          </div>

                        {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={(!winText.trim() && !audioBlob) || isProcessing}
                className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? '✨ Amplifying your win...' : '✨ Celebrate My Win'}
              </button>
        </div>
      </div>
    );
  }

  // Celebration Card Screen
  if (viewMode === 'celebration' && amplifiedWin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Celebration Card */}
          <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-yellow-500 rounded-3xl p-12 shadow-2xl text-white mb-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-7xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold mb-2">You Did It!</h2>
              <p className="text-lg opacity-90">Let&apos;s celebrate your win</p>
            </div>

            {/* Amplified Statement */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 mb-6 border border-white/30">
              <p className="text-xl font-semibold leading-relaxed text-center">
                &quot;{amplifiedWin.amplified_win.amplified_statement}&quot;
              </p>
            </div>

            {/* Shareable Quote */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/20">
              <div className="text-center">
                <p className="text-lg italic leading-relaxed">
                  {amplifiedWin.amplified_win.shareable_quote}
                </p>
              </div>
            </div>
          </div>

          {/* Insights Card */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-lg mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">✨ Your Growth Insights</h3>
            
            <div className="space-y-6">
              {/* Growth Insight */}
              <div className="border-l-4 border-purple-500 pl-6">
                <div className="text-sm font-semibold text-purple-600 mb-2 uppercase tracking-wide">
                  Growth
                </div>
                <p className="text-gray-800 leading-relaxed">
                  {amplifiedWin.amplified_win.growth_insight}
                </p>
              </div>

              {/* Impact Reflection */}
              <div className="border-l-4 border-pink-500 pl-6">
                <div className="text-sm font-semibold text-pink-600 mb-2 uppercase tracking-wide">
                  Impact
                </div>
                <p className="text-gray-800 leading-relaxed">
                  {amplifiedWin.amplified_win.impact_reflection}
                </p>
              </div>

              {/* Encouragement */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <div className="text-sm font-semibold text-purple-600 mb-2 uppercase tracking-wide">
                  Keep Going
                </div>
                <p className="text-gray-800 leading-relaxed font-medium">
                  {amplifiedWin.amplified_win.encouragement}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
                                onClick={() => {
                    setViewMode('prompt-selection');
                    setSelectedPrompt(null);
                    setWinText('');
                    clearAudio();
                    setAmplifiedWin(null);
                    setError(null);
                  }}
              className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Celebrate Another Win
            </button>
            <button
              onClick={handleDone}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
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
