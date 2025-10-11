'use client';

import { useState } from 'react';
import { detectPhase, getPhaseDescription, getPhaseTips, CycleInfo, CyclePhase } from '@/utils/menstrualCycle';

export default function TestCyclePage() {
  const [lastPeriod, setLastPeriod] = useState('');
  const [cycleLength, setCycleLength] = useState(28);
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null);

  const handleCalculate = () => {
    if (!lastPeriod) return;

    const lastPeriodDate = new Date(lastPeriod);
    const info = detectPhase(lastPeriodDate, cycleLength);
    setCycleInfo(info);
  };

  const getPhaseColor = (phase: CyclePhase): string => {
    const colors = {
      menstrual: 'bg-red-100 text-red-800 border-red-200',
      follicular: 'bg-green-100 text-green-800 border-green-200',
      ovulatory: 'bg-blue-100 text-blue-800 border-blue-200',
      luteal: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[phase];
  };

  const getPhaseEmoji = (phase: CyclePhase): string => {
    const emojis = {
      menstrual: '🩸',
      follicular: '🌱',
      ovulatory: '🥚',
      luteal: '🌙'
    };
    return emojis[phase];
  };

  // Example calculations for different scenarios
  const examples = [
    {
      name: 'Today is Day 3 of cycle',
      lastPeriod: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      cycleLength: 28
    },
    {
      name: 'Today is Day 10 of cycle',
      lastPeriod: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      cycleLength: 28
    },
    {
      name: 'Today is Day 15 of cycle (ovulation)',
      lastPeriod: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      cycleLength: 28
    },
    {
      name: 'Today is Day 22 of cycle',
      lastPeriod: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
      cycleLength: 28
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Menstrual Cycle Phase Detection
        </h1>

        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Calculate Your Cycle Phase</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="lastPeriod" className="block text-sm font-medium text-gray-700 mb-2">
                Last Period Date
              </label>
              <input
                type="date"
                id="lastPeriod"
                value={lastPeriod}
                onChange={(e) => setLastPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="cycleLength" className="block text-sm font-medium text-gray-700 mb-2">
                Cycle Length (days)
              </label>
              <input
                type="number"
                id="cycleLength"
                value={cycleLength}
                onChange={(e) => setCycleLength(Number(e.target.value))}
                min="21"
                max="35"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleCalculate}
            disabled={!lastPeriod}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Calculate Cycle Phase
          </button>
        </div>

        {/* Results */}
        {cycleInfo && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Cycle Information</h2>
            <div className="space-y-4">
              <div className={`inline-flex items-center px-4 py-2 rounded-full border ${getPhaseColor(cycleInfo.phase)}`}>
                <span className="text-2xl mr-2">{getPhaseEmoji(cycleInfo.phase)}</span>
                <span className="font-medium capitalize">{cycleInfo.phase} Phase</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900">Day of Cycle</h3>
                  <p className="text-2xl font-bold text-blue-600">{cycleInfo.dayOfCycle}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900">Days Until Next Period</h3>
                  <p className="text-2xl font-bold text-purple-600">{cycleInfo.daysUntilNextPeriod}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900">Next Period</h3>
                  <p className="text-sm font-medium text-gray-600">
                    {cycleInfo.estimatedNextPeriod.toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Phase Description</h3>
                <p className="text-blue-800">{getPhaseDescription(cycleInfo.phase)}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Health Tips for This Phase</h3>
                <ul className="text-green-800 space-y-1">
                  {getPhaseTips(cycleInfo.phase).map((tip, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {cycleInfo.estimatedOvulation && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-medium text-yellow-900 mb-2">Estimated Ovulation</h3>
                  <p className="text-yellow-800">
                    {cycleInfo.estimatedOvulation.toLocaleDateString()} 
                    {cycleInfo.phase === 'ovulatory' && ' (Current Window)'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Examples */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Example Calculations</h2>
          <div className="space-y-4">
            {examples.map((example, index) => {
              const info = detectPhase(example.lastPeriod, example.cycleLength);
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{example.name}</h3>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full border text-sm ${getPhaseColor(info.phase)}`}>
                      <span className="mr-1">{getPhaseEmoji(info.phase)}</span>
                      <span className="capitalize">{info.phase}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                    <div>Day {info.dayOfCycle} of cycle</div>
                    <div>{info.daysUntilNextPeriod} days until next period</div>
                    <div>Last period: {example.lastPeriod.toLocaleDateString()}</div>
                    <div>Next period: {info.estimatedNextPeriod.toLocaleDateString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Documentation */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Cycle Phase Reference</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <div><strong>Menstrual (Days 1-5):</strong> Period is occurring</div>
            <div><strong>Follicular (Days 6-13):</strong> Follicles developing in ovaries</div>
            <div><strong>Ovulatory (Days 14-16):</strong> Ovulation occurring or about to occur</div>
            <div><strong>Luteal (Days 17-28):</strong> Uterine lining preparing for potential pregnancy</div>
          </div>
        </div>
      </div>
    </div>
  );
}
