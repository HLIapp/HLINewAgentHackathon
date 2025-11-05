/**
 * Shared Celebration Card Component
 * Displays completion celebration consistently across interventions
 */

import { StaticIntervention } from '@/data/staticInterventions';

interface StatItem {
  label: string;
  value: string | number;
}

interface CelebrationCardProps {
  intervention: StaticIntervention;
  stats: StatItem[];
  message?: string;
  onDone: () => void;
  reflection?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
}

export default function CelebrationCard({
  intervention,
  stats,
  message = "You did it! Great job completing your practice.",
  onDone,
  reflection,
}: CelebrationCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
      <div className="text-8xl mb-6">🎉</div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Practice Complete!
      </h2>
      <p className="text-lg text-gray-600 mb-8">{message}</p>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 text-left">
          {stats.map((stat, index) => (
            <div key={index}>
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
      {reflection && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Optional: How did this session feel?
          </label>
          <textarea
            value={reflection.value}
            onChange={(e) => reflection.onChange(e.target.value)}
            placeholder={reflection.placeholder || "Share any thoughts or observations..."}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            rows={3}
          />
        </div>
      )}
      <button
        onClick={onDone}
        className="w-full px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
      >
        Done
      </button>
    </div>
  );
}

