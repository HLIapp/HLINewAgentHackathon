'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { StaticIntervention } from '@/data/staticInterventions';
import { MealAnalysis, MealSuggestionRequest, MealAnalysisRequest } from '@/types/interventions';
import { detectPhase, CyclePhase } from '@/utils/menstrualCycle';
import { getUserProfile } from '@/utils/userStorage';
import { saveMealLog, getLatestMealLog } from '@/utils/userStorage';

interface ProteinBreakfastInteractiveProps {
  intervention: StaticIntervention;
}

type TabMode = 'suggestions' | 'analyze';
type AnalyzeMode = 'describe' | 'photo';

interface MealSuggestion {
  name: string;
  description: string;
  protein_grams: number;
  preparation_steps: string[];
  phase_support: string;
}

interface MealSuggestionsResponse {
  suggestions: MealSuggestion[];
  tips?: string[];
  generated_at: string;
}

export default function ProteinBreakfastInteractive({ intervention }: ProteinBreakfastInteractiveProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabMode>('suggestions');
  const [analyzeMode, setAnalyzeMode] = useState<AnalyzeMode>('describe');
  
  // Suggestions state
  const [ingredients, setIngredients] = useState<string>('');
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [mealSuggestions, setMealSuggestions] = useState<MealSuggestionsResponse | null>(null);
  
  // Analysis state
  const [mealDescription, setMealDescription] = useState('');
  const [mealImage, setMealImage] = useState<string | null>(null);
  const [mealImageFile, setMealImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mealAnalysis, setMealAnalysis] = useState<MealAnalysis | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<CyclePhase>('follicular');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Get current phase
    const profile = getUserProfile();
    if (profile?.lastPeriod) {
      const cycleInfo = detectPhase(new Date(profile.lastPeriod), profile.cycleLength);
      setCurrentPhase(cycleInfo.phase);
    }
    
    // Load saved meal log if exists
    const savedLog = getLatestMealLog(intervention.title);
    if (savedLog) {
      setMealAnalysis(savedLog.meal_analysis);
      setMealDescription(savedLog.meal_description);
      if (savedLog.meal_image_base64) {
        setMealImage(`data:image/jpeg;base64,${savedLog.meal_image_base64}`);
      }
    }
  }, [intervention.title]);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setMealImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMealImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleGetSuggestions = async () => {
    if (!ingredients.trim()) {
      setError('Please enter at least one ingredient');
      return;
    }

    setIsLoadingSuggestions(true);
    setError(null);

    try {
      const ingredientsList = ingredients
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0);

      const request: MealSuggestionRequest = {
        ingredients: ingredientsList,
        intervention_title: intervention.title,
        phase: currentPhase,
      };

      const response = await fetch('/api/meal-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get suggestions');
      }

      const data: MealSuggestionsResponse = await response.json();
      setMealSuggestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get meal suggestions');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleAnalyzeMeal = async () => {
    if (analyzeMode === 'describe' && !mealDescription.trim()) {
      setError('Please describe what you ate');
      return;
    }

    if (analyzeMode === 'photo' && !mealImageFile) {
      setError('Please upload a photo of your meal');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      let mealImageBase64: string | undefined;
      if (mealImageFile) {
        mealImageBase64 = await convertFileToBase64(mealImageFile);
      }

      const request: MealAnalysisRequest = {
        meal_description: analyzeMode === 'describe' ? mealDescription : undefined,
        meal_image_base64: mealImageBase64,
        intervention_title: intervention.title,
        phase: currentPhase,
      };

      const response = await fetch('/api/meal-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze meal');
      }

      const analysis: MealAnalysis = await response.json();
      setMealAnalysis(analysis);
      
      // Save meal log
      saveMealLog(
        analysis.meal_description,
        analysis,
        mealImageBase64,
        intervention.title
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze meal');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDone = () => {
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
        nutrition: {
          title: 'Why This Matters',
          description: 'Your follicular phase is when your body is building. Nourishing yourself well now supports your entire cycle.',
          tips: [
            'Food is fuel and medicine for your body',
            'Every meal is an opportunity to support your wellbeing',
            'Simple, consistent choices make a big difference'
          ]
        }
      }
    };
    return guidance[phase]?.[category] || {
      title: 'Why This Matters',
      description: 'Protein intake supports hormone synthesis, tissue building, and sustained energy throughout your cycle.',
      tips: [
        'A protein-rich breakfast helps stabilize blood sugar',
        'Protein provides building blocks your body needs',
        'Consistent nutrition supports your hormonal health'
      ]
    };
  };

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

        {/* Tab Selector */}
        <div className="flex gap-2 mb-6 bg-white border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded transition-colors ${
              activeTab === 'suggestions'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Meal Ideas
          </button>
          <button
            onClick={() => setActiveTab('analyze')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded transition-colors ${
              activeTab === 'analyze'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Analyze My Meal
          </button>
        </div>

        {/* Meal Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              What ingredients do you have?
            </h2>
            <p className="text-xs text-gray-600 mb-4">
              Tell us what's in your kitchen, and we'll suggest protein-rich breakfast ideas tailored to your phase.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Ingredients (comma-separated)
                </label>
                <input
                  type="text"
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  placeholder="e.g., eggs, spinach, whole grain bread, avocado, Greek yogurt..."
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  List what you have available - we'll work with what you've got!
                </p>
              </div>

              <button
                onClick={handleGetSuggestions}
                disabled={!ingredients.trim() || isLoadingSuggestions}
                className="w-full px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoadingSuggestions ? (
                  <>
                    <span className="animate-spin">⚡</span>
                    Generating Ideas...
                  </>
                ) : (
                  <>
                    ✨ Get Meal Ideas
                  </>
                )}
              </button>

              {mealSuggestions && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">Your Meal Suggestions</h3>
                  {mealSuggestions.suggestions.map((suggestion, idx) => (
                    <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-900">{suggestion.name}</h4>
                        <span className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded">
                          {suggestion.protein_grams}g protein
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 mb-3">{suggestion.description}</p>
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-900 mb-1">Preparation:</p>
                        <ol className="text-xs text-gray-700 space-y-1 ml-4 list-decimal">
                          {suggestion.preparation_steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="text-xs text-blue-800">
                          <span className="font-medium">✨ Phase Support:</span> {suggestion.phase_support}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {mealSuggestions.tips && mealSuggestions.tips.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                      <p className="text-xs font-medium text-green-900 mb-2">💡 Tips:</p>
                      <ul className="text-xs text-green-800 space-y-1 ml-4 list-disc">
                        {mealSuggestions.tips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analyze Meal Tab */}
        {activeTab === 'analyze' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Tell us about your meal
            </h2>
            <p className="text-xs text-gray-600 mb-4">
              Describe what you ate or upload a photo, and we'll analyze how it supports your current phase.
            </p>

            {/* Analyze Mode Selector */}
            <div className="flex gap-2 mb-6 bg-gray-50 border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setAnalyzeMode('describe')}
                className={`flex-1 py-2 px-4 text-xs font-medium rounded transition-colors ${
                  analyzeMode === 'describe'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Describe
              </button>
              <button
                onClick={() => setAnalyzeMode('photo')}
                className={`flex-1 py-2 px-4 text-xs font-medium rounded transition-colors ${
                  analyzeMode === 'photo'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Upload Photo
              </button>
            </div>

            {/* Describe Mode */}
            {analyzeMode === 'describe' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    What did you eat?
                  </label>
                  <textarea
                    value={mealDescription}
                    onChange={(e) => setMealDescription(e.target.value)}
                    placeholder="e.g., Two scrambled eggs with spinach, whole grain toast with avocado, and a side of Greek yogurt..."
                    className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm placeholder-gray-400"
                  />
                </div>
                <button
                  onClick={handleAnalyzeMeal}
                  disabled={!mealDescription.trim() || isAnalyzing}
                  className="w-full px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <span className="animate-spin">⚡</span>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      🔍 Analyze Meal
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Photo Upload Mode */}
            {analyzeMode === 'photo' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Upload a photo of your meal
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  {mealImage ? (
                    <div className="space-y-3">
                      <div className="relative border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={mealImage}
                          alt="Your meal"
                          className="w-full max-h-64 object-cover"
                        />
                        <button
                          onClick={() => {
                            setMealImage(null);
                            setMealImageFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Change Photo
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                    >
                      <div className="text-3xl mb-2">📷</div>
                      <p className="text-sm text-gray-600 mb-1">Click to upload a photo</p>
                      <p className="text-xs text-gray-500">JPG, PNG, or WebP (max 5MB)</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleAnalyzeMeal}
                  disabled={!mealImageFile || isAnalyzing}
                  className="w-full px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <span className="animate-spin">⚡</span>
                      Analyzing Photo...
                    </>
                  ) : (
                    <>
                      🔍 Analyze Meal
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Analysis Results */}
            {mealAnalysis && !isAnalyzing && (
              <div className="mt-6 space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Your Meal:</h3>
                  <p className="text-sm text-gray-700">{mealAnalysis.meal_description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Estimated Calories</p>
                    <p className="text-lg font-semibold text-gray-900">{mealAnalysis.estimated_calories}</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Protein Content</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {mealAnalysis.estimated_protein}g
                      {mealAnalysis.estimated_protein >= 20 && (
                        <span className="text-xs text-green-600 ml-1">✓</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">Nutritional Assessment</h3>
                  <p className="text-xs text-blue-800 leading-relaxed">{mealAnalysis.nutritional_assessment}</p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-green-900 mb-2">Phase Support</h3>
                  <p className="text-xs text-green-800 leading-relaxed">{mealAnalysis.phase_support}</p>
                </div>

                {mealAnalysis.suggestions && mealAnalysis.suggestions.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-yellow-900 mb-2">💡 Suggestions</h3>
                    <ul className="text-xs text-yellow-800 space-y-1 ml-4 list-disc">
                      {mealAnalysis.suggestions.map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {mealAnalysis.alternatives && mealAnalysis.alternatives.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-purple-900 mb-2">🔄 Alternatives</h3>
                    <ul className="text-xs text-purple-800 space-y-1 ml-4 list-disc">
                      {mealAnalysis.alternatives.map((alt, i) => (
                        <li key={i}>{alt}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={handleDone}
                  className="w-full px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-xs text-red-800">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

