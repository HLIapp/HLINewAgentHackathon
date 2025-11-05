'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { StaticIntervention } from '@/data/staticInterventions';
import { addCompletedIntervention } from '@/utils/userStorage';

interface ReflectiveJournalingInteractiveProps {
  intervention: StaticIntervention;
}

type InputMode = 'text' | 'audio';

interface JournalReflection {
  original_entry: string;
  insights: {
    main_theme: string;
    emotional_patterns: string[];
    temporary_vs_persistent: {
      temporary: string[];
      needs_attention: string[];
    };
    identified_pattern: string;
    recommendation: 'address_now' | 'wait_until_after_period' | 'both';
    reasoning: string;
  };
  reflection_questions: string[];
  generated_at: string;
}

export default function ReflectiveJournalingInteractive({ intervention }: ReflectiveJournalingInteractiveProps) {
  const router = useRouter();
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [journalText, setJournalText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isReflecting, setIsReflecting] = useState(false);
  const [reflection, setReflection] = useState<JournalReflection | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
    if (inputMode === 'text' && !journalText.trim()) {
      setError('Please write your journal entry');
      return;
    }

    if (inputMode === 'audio' && !audioBlob) {
      setError('Please record your journal entry');
      return;
    }

    setIsReflecting(true);
    setError(null);

    try {
      let audioBase64: string | undefined;
      
      if (inputMode === 'audio' && audioBlob) {
        audioBase64 = await convertBlobToBase64(audioBlob);
      }

      const response = await fetch('/api/journal-reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          journal_text: journalText || undefined,
          journal_audio_base64: audioBase64,
          intervention_title: intervention.title,
          phase: intervention.phase_tags[0],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process reflection');
      }

      const result: JournalReflection = await response.json();
      setReflection(result);
      
      // Save to localStorage
      const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
      journalEntries.push({
        entry: result.original_entry,
        reflection: result,
        created_at: new Date().toISOString(),
        intervention_title: intervention.title,
      });
      localStorage.setItem('journalEntries', JSON.stringify(journalEntries));
    } catch (err) {
      console.error('Error processing reflection:', err);
      setError(err instanceof Error ? err.message : 'Failed to process reflection. Please try again.');
    } finally {
      setIsReflecting(false);
    }
  };

  const handleDone = () => {
    const cachedInterventions = localStorage.getItem('current_interventions');
    let interventionId = 'reflective-journaling';
    
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
      luteal: {
        reflection: {
          title: 'Why This Matters',
          description: 'During your luteal phase, emotions can feel more intense and sensitive. Reflective journaling helps you process these feelings and gain clarity.',
          tips: [
            'Distinguish between temporary phase-related emotions and persistent concerns',
            'Processing feelings helps you understand what needs attention',
            'Journaling supports your emotional wellbeing during this phase'
          ]
        }
      }
    };
    return guidance[phase]?.[category] || {
      title: 'Why This Matters',
      description: 'Reflective journaling helps you process feelings, identify patterns, and gain clarity about what needs attention.',
      tips: [
        'Writing helps process emotions',
        'Regular reflection supports emotional wellbeing',
        'Patterns become clearer when documented'
      ]
    };
  };

  const getRecommendationColor = (recommendation: string) => {
    if (recommendation === 'address_now') return 'bg-green-50 text-green-800 border-green-200';
    if (recommendation === 'wait_until_after_period') return 'bg-blue-50 text-blue-800 border-blue-200';
    return 'bg-purple-50 text-purple-800 border-purple-200';
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

          {/* Example Prompts */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="text-xs font-semibold text-gray-900 mb-2">Example Prompts</h3>
            <div className="space-y-2">
              <button
                onClick={() => setJournalText("What's triggering me today? I noticed I felt really irritable when...")}
                className="text-xs text-gray-700 text-left block w-full hover:text-gray-900 transition-colors"
              >
                💭 "What's triggering me today? I noticed I felt really irritable when..."
              </button>
              <button
                onClick={() => setJournalText("I'm feeling overwhelmed by... Is this temporary stress or something that needs my attention?")}
                className="text-xs text-gray-700 text-left block w-full hover:text-gray-900 transition-colors"
              >
                🌊 "I'm feeling overwhelmed by... Is this temporary stress or something that needs my attention?"
              </button>
              <button
                onClick={() => setJournalText("I've noticed a pattern where I... I wonder if this is related to my cycle or something deeper.")}
                className="text-xs text-gray-700 text-left block w-full hover:text-gray-900 transition-colors"
              >
                🔍 "I've noticed a pattern where I... I wonder if this is related to my cycle or something deeper."
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 italic">
              Click any example to use it, or write your own stream of consciousness. No editing, just let it flow.
            </p>
          </div>
        </div>

        {/* Input Mode Selector */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-2 tracking-tight">
            Share Your Reflection
          </h2>
          <p className="text-xs text-gray-600 mb-5">
            Choose how you'd like to express yourself. Write freely without editing, or speak your thoughts aloud.
          </p>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setInputMode('text')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                inputMode === 'text'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✍️ Write
            </button>
            <button
              onClick={() => setInputMode('audio')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                inputMode === 'audio'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🎤 Record
            </button>
          </div>

          {/* Text Input Mode */}
          {inputMode === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Your journal entry
                </label>
                <textarea
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value)}
                  placeholder="Write freely... What's triggering you today? What patterns do you notice? No editing, just stream of consciousness..."
                  className="w-full h-48 p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm placeholder-gray-400"
                  maxLength={2000}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Write without judgment. Let your thoughts flow freely.
                </p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {journalText.length} / 2000 characters
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!journalText.trim() || isReflecting}
                  className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isReflecting ? (
                    <>
                      <span className="animate-spin">⚡</span>
                      Processing...
                    </>
                  ) : (
                    <>
                      ✨ Process Reflection
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
                  <li>Speak naturally, as if talking to a trusted friend</li>
                  <li>Share what's on your mind without filtering</li>
                  <li>Explore your triggers, patterns, and feelings</li>
                  <li>You can record for up to 3 minutes</li>
                </ul>
              </div>

              <div className="text-center py-8">
                {!audioBlob ? (
                  <div className="space-y-4">
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        className="px-8 py-4 bg-gray-900 text-white text-base font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-3 mx-auto"
                      >
                        <span className="text-2xl">🎤</span>
                        Start Recording
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-4xl animate-pulse">🔴</div>
                        <p className="text-sm font-medium text-gray-900">Recording...</p>
                        <button
                          onClick={stopRecording}
                          className="px-6 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Stop Recording
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <audio controls src={audioUrl || undefined} className="w-full" />
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => {
                          setAudioBlob(null);
                          setAudioUrl(null);
                          audioChunksRef.current = [];
                        }}
                        className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Record Again
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={isReflecting}
                        className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isReflecting ? (
                          <>
                            <span className="animate-spin">⚡</span>
                            Processing...
                          </>
                        ) : (
                          <>
                            ✨ Process Reflection
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
        {isReflecting && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-4xl mb-4 animate-pulse">✨</div>
            <p className="text-base font-medium text-gray-900 mb-2">
              Processing your reflection...
            </p>
            <p className="text-xs text-gray-600">
              We're identifying patterns, distinguishing temporary from persistent concerns, and gathering insights
            </p>
          </div>
        )}

        {/* Results Display */}
        {reflection && !isReflecting && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
            <div className="text-center mb-6">
              <div className="text-3xl mb-2">📝</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1 tracking-tight">
                Your Reflection Insights
              </h2>
              <p className="text-xs text-gray-600">
                Understanding your patterns and what needs attention
              </p>
            </div>

            {/* Main Theme */}
            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Main Theme:</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {reflection.insights.main_theme}
              </p>
            </div>

            {/* Emotional Patterns */}
            {reflection.insights.emotional_patterns.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Emotional Patterns:</h3>
                <div className="space-y-2">
                  {reflection.insights.emotional_patterns.map((pattern, idx) => (
                    <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-900">{pattern}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Temporary vs Persistent */}
            {(reflection.insights.temporary_vs_persistent.temporary.length > 0 ||
              reflection.insights.temporary_vs_persistent.needs_attention.length > 0) && (
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {reflection.insights.temporary_vs_persistent.temporary.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-yellow-900 mb-2">May Be Temporary:</h3>
                    <ul className="text-xs text-yellow-800 space-y-1 ml-4 list-disc">
                      {reflection.insights.temporary_vs_persistent.temporary.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {reflection.insights.temporary_vs_persistent.needs_attention.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-orange-900 mb-2">Needs Attention:</h3>
                    <ul className="text-xs text-orange-800 space-y-1 ml-4 list-disc">
                      {reflection.insights.temporary_vs_persistent.needs_attention.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Identified Pattern */}
            {reflection.insights.identified_pattern && (
              <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-purple-900 mb-2">Key Pattern:</h3>
                <p className="text-sm text-purple-800 leading-relaxed">
                  {reflection.insights.identified_pattern}
                </p>
              </div>
            )}

            {/* Recommendation */}
            <div className={`mb-6 border-2 rounded-lg p-5 ${getRecommendationColor(reflection.insights.recommendation)}`}>
              <div className="flex items-start gap-3">
                <span className="text-xl">
                  {reflection.insights.recommendation === 'address_now' && '⚡'}
                  {reflection.insights.recommendation === 'wait_until_after_period' && '⏳'}
                  {reflection.insights.recommendation === 'both' && '💭'}
                </span>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold mb-1">
                    {reflection.insights.recommendation === 'address_now' && 'Address This Now'}
                    {reflection.insights.recommendation === 'wait_until_after_period' && 'Wait Until After Your Period'}
                    {reflection.insights.recommendation === 'both' && 'Consider Both Approaches'}
                  </h3>
                  <p className="text-sm leading-relaxed">
                    {reflection.insights.reasoning}
                  </p>
                </div>
              </div>
            </div>

            {/* Reflection Questions */}
            {reflection.reflection_questions.length > 0 && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-900 mb-3">Reflection Questions:</h3>
                <ol className="space-y-3">
                  {reflection.reflection_questions.map((question, idx) => (
                    <li key={idx} className="flex gap-3 items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-200 text-green-900 rounded-full flex items-center justify-center text-xs font-semibold">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-green-800 leading-relaxed">{question}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <button
              onClick={handleDone}
              className="w-full px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Save & Continue
            </button>
          </div>
        )}
      </div>
  );
}

