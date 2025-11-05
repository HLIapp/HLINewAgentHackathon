/**
 * Intervention Types
 * Types for the intervention generation and management system
 */

import { StaticIntervention } from '@/data/staticInterventions';

export type PracticeCategory = 
  | 'nutrition'
  | 'movement'
  | 'mindset'
  | 'breathwork'
  | 'sleep'
  | 'supplementation'
  | 'stress_management'
  | 'reflection';

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

export type InterventionType = 'standard' | 'interactive_goal' | 'interactive_nutrition' | 'interactive_movement' | 'interactive_breathwork' | 'interactive_supplementation';

/**
 * Base props for all interactive intervention components
 * Ensures consistency across components
 * 
 * This interface provides a standard structure for all intervention component props,
 * making it easier to type-check and maintain components. Components can extend
 * this interface to add their own specific props.
 * 
 * SwiftUI Migration: Maps directly to Swift struct with intervention property
 * 
 * @example
 * ```typescript
 * interface BoxBreathingProps extends BaseInterventionProps {
 *   // Add component-specific props here
 * }
 * ```
 */
export interface BaseInterventionProps {
  intervention: StaticIntervention;
}

/**
 * Common phase types for interventions
 * Used to represent the current state/stage of an intervention session
 * 
 * This type standardizes the phase states used across different intervention
 * components. Components can use subsets of these phases as needed.
 * 
 * SwiftUI Migration: Maps directly to Swift enum
 * 
 * @example
 * ```typescript
 * const [phase, setPhase] = useState<InterventionPhase>('setup');
 * ```
 */
export type InterventionPhase =
  | 'setup'
  | 'selection'
  | 'countdown'
  | 'session'
  | 'breathing'
  | 'work'
  | 'rest'
  | 'completed';

/**
 * Common state for timer-based interventions
 * Matches the state structure from useTimer hook
 * 
 * This interface represents the timer state used across timer-based interventions.
 * It matches the structure returned by the useTimer hook, ensuring type consistency.
 * 
 * SwiftUI Migration: Maps directly to Swift struct with same properties
 * 
 * @example
 * ```typescript
 * const timerState: TimerState = {
 *   timeRemaining: 300,
 *   isPaused: false,
 *   isRunning: true,
 * };
 * ```
 */
export interface TimerState {
  /** Time remaining in seconds */
  timeRemaining: number;
  /** Whether the timer is currently paused */
  isPaused: boolean;
  /** Whether the timer is currently running */
  isRunning: boolean;
}

/**
 * Common completion data structure
 * Used when marking interventions as completed
 * 
 * This interface provides a standardized structure for completion data across
 * all interventions. It's similar to CompletionOptions in useInterventionCompletion.ts
 * but more general purpose and can be used in contexts beyond the completion hook.
 * 
 * SwiftUI Migration: Maps directly to Swift struct with same properties
 * 
 * @example
 * ```typescript
 * const completionData: CompletionData = {
 *   rating: 5,
 *   notes: 'Great session!',
 *   completedFull: true,
 *   changesNoticed: ['Felt calmer', 'Reduced stress'],
 * };
 * ```
 */
export interface CompletionData {
  /** Rating from 1-5 (optional) */
  rating?: number;
  /** Free-form notes or reflection (optional) */
  notes?: string;
  /** Whether the full practice was completed (optional, defaults to true) */
  completedFull?: boolean;
  /** Array of changes or observations noticed (optional) */
  changesNoticed?: string[];
  /** Custom intervention-specific data (optional) */
  customData?: Record<string, any>;
}

export interface InterventionCard {
  id: string;
  phase_tags: CyclePhase[];
  category: PracticeCategory;
  emoji: string;
  benefit: string;
  title: string;
  duration_minutes: number;
  location: string;
  description: string;
  relevance_score?: number;
}

export interface InterventionRequest {
  phase: CyclePhase;
  symptoms: string[];
  mood: string;
  energy: string;
  goal: string;
  username?: string;
}

export interface InterventionResponse {
  interventions: InterventionCard[];
  phase: CyclePhase;
  generated_at: string;
  cached: boolean;
}

export interface InterventionDetail extends InterventionCard {
  why_recommended: string;
  expected_outcomes: string[];
  duration_minutes: number;
  difficulty_level: 'easy' | 'moderate' | 'challenging';
}

export interface SynthesizeRequest {
  intervention_title: string;
  intervention_description: string;
  mode: 'text' | 'audio' | 'visual';
  phase?: string;
}

export interface SynthesizedPractice {
  intervention_title: string;
  mode: 'text' | 'audio' | 'visual';
  steps: PracticeStep[];
  reflection_question: string;
  estimated_time: number;
  audio_base64?: string;
  visual_url?: string;
  visual_urls?: string[]; // Array of image URLs for step-by-step visual guides
  generated_at: string;
}

export interface PracticeStep {
  step_number: number;
  instruction: string;
  duration_seconds?: number;
  physiological_explanation?: string;
  breathing_cue?: string;
}

export interface CompletedIntervention {
  intervention_id: string;
  completed_at: string;
  rating?: number; // 1-5
  feedback?: string;
  completed_full_practice: boolean;
  changes_noticed?: string[];
}

export interface GoalSynthesisRequest {
  goal_text: string;
  goal_audio_base64?: string;
  intervention_title: string;
}

export interface ActionableGoal {
  original_goal: string;
  actionable_steps: {
    step_number: number;
    action: string;
    timeframe?: string;
  }[];
  next_action: string;
  generated_at: string;
}

export interface MealSuggestionRequest {
  ingredients: string[];
  intervention_title: string;
  phase: CyclePhase;
}

export interface MealAnalysisRequest {
  meal_description?: string;
  meal_image_base64?: string;
  intervention_title: string;
  phase: CyclePhase;
}

export interface MealAnalysis {
  meal_description: string;
  estimated_calories: number;
  estimated_protein: number;
  nutritional_assessment: string;
  phase_support: string;
  suggestions?: string[];
  alternatives?: string[];
  generated_at: string;
}

export interface WalkAccompanimentRequest {
  intervention_title: string;
  phase: CyclePhase;
  preference?: 'music' | 'affirmations' | 'meditation' | 'all';
}

export interface WalkAccompaniment {
  music_suggestions?: string[];
  affirmations?: string[];
  meditation_theme?: {
    theme: string;
    description: string;
  };
  photo_challenge?: {
    challenge: string;
    description: string;
  };
  generated_at: string;
}

export interface VoiceNeedsRequest {
  need_text?: string;
  need_audio_base64?: string;
  intervention_title: string;
}

export interface CommunicationTip {
  tip: string;
  explanation: string;
}

export interface VoiceNeedsNextStep {
  step_number: number;
  action: string;
  timeframe?: string;
}

export interface VoiceNeedsResponse {
  original_need: string;
  refined_statement: string;
  communication_tips: CommunicationTip[];
  practice_script: string;
  next_steps: VoiceNeedsNextStep[];
  generated_at?: string;
}

export interface HIITExercise {
  id: string;
  name: string;
  emoji: string;
  duration_seconds: number;
  category: string;
  difficulty?: 'easy' | 'moderate' | 'challenging';
}

export interface HIITWorkout {
  exercises: HIITExercise[];
  rounds: number;
  work_duration: number; // seconds per exercise
  rest_duration: number; // seconds between exercises
  total_duration: number; // calculated total time
}

export interface SuccessReviewPrompt {
  id: string;
  question: string;
  emoji: string;
  category: string;
}

export interface UserWin {
  prompt_id: string;
  win_text: string;
  timestamp: string;
}

export interface AmplifiedWin {
  original_win: string;
  amplified_statement: string;
  growth_insight: string;
  impact_reflection: string;
  shareable_quote: string;
  encouragement: string;
}

export interface SuccessReviewRequest {
  win_text: string;
  prompt_id?: string;
  intervention_title: string;
}

export interface SuccessReviewResponse {
  amplified_win: AmplifiedWin;
  generated_at: string;
}
