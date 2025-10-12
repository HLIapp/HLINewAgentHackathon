'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getUserProfile, 
  saveUserProfile, 
  getUserData, 
  saveUserData, 
  getDefaultUserData, 
  UserProfile, 
  UserData,
  initializeUserData,
  clearUserData
} from '@/utils/userStorage';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isFirstTime, setIsFirstTime] = useState(false);
  // Calculate a date that puts user in luteal phase (day 21 of cycle)
  const getLutealPhaseDate = () => {
    const today = new Date();
    const lutealStartDay = 21; // Days after period start
    const daysAgo = lutealStartDay - 1;
    const lutealDate = new Date(today);
    lutealDate.setDate(today.getDate() - daysAgo);
    return lutealDate.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    id: 'pjae',
    username: '',
    lastPeriod: getLutealPhaseDate(),
    cycleLength: 28,
    goal: '',
    symptoms: [] as string[],
    mood: '',
    energy: '',
    notifications: true,
    theme: 'light' as 'light' | 'dark'
  });

  const symptomOptions = [
    'bloating', 'headaches', 
    'cramps', 'breast tenderness', 'acne', 'cravings',
    'insomnia'
  ];

  const moodOptions = ['anxious', 'happy', 'calm', 'stressed', 'mood swings'];
  const energyOptions = ['drained', 'normal', 'energized'];

  useEffect(() => {
    // Check if this is the first time (onboarding)
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
    setIsFirstTime(!hasCompletedOnboarding);
    
    // Initialize user data
    const data = initializeUserData();
    const userProfile = getUserProfile() || data.profile;
    
    setProfile(userProfile);
    setUserData(data);
    
    // Only populate form with existing data if user has completed onboarding
    if (hasCompletedOnboarding) {
      setFormData({
        id: userProfile.id,
        username: userProfile.username,
        lastPeriod: userProfile.lastPeriod,
        cycleLength: userProfile.cycleLength,
        goal: userProfile.goal,
        symptoms: userProfile.symptoms,
        mood: userProfile.mood,
        energy: userProfile.energy,
        notifications: userProfile.preferences?.notifications ?? true,
        theme: userProfile.preferences?.theme || 'light'
      });
    }
    // If first time, keep the empty form defaults with luteal phase date
  }, []);

  const handleSave = () => {
    const updatedProfile: UserProfile = {
      id: formData.id,
      username: formData.username,
      lastPeriod: formData.lastPeriod,
      cycleLength: formData.cycleLength,
      goal: formData.goal,
      symptoms: formData.symptoms,
      mood: formData.mood,
      energy: formData.energy,
      preferences: {
        notifications: formData.notifications,
        theme: formData.theme
      }
    };

    // Create userData if it doesn't exist
    const baseUserData = userData || {
      profile: updatedProfile,
      cycleHistory: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    const updatedUserData: UserData = {
      ...baseUserData,
      profile: updatedProfile,
      lastUpdated: new Date().toISOString()
    };

    saveUserProfile(updatedProfile);
    saveUserData(updatedUserData);
    setProfile(updatedProfile);
    setUserData(updatedUserData);
    
    // Mark onboarding as completed
    localStorage.setItem('hasCompletedOnboarding', 'true');
    
    // Always redirect to home after saving (whether first time or not)
    setTimeout(() => {
      router.push('/');
    }, 100);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      const defaultData = getDefaultUserData();
      setFormData({
        id: defaultData.profile.id,
        username: defaultData.profile.username,
        lastPeriod: defaultData.profile.lastPeriod,
        cycleLength: defaultData.profile.cycleLength,
        goal: defaultData.profile.goal,
        symptoms: defaultData.profile.symptoms,
        mood: defaultData.profile.mood,
        energy: defaultData.profile.energy,
        notifications: defaultData.profile.preferences?.notifications ?? true,
        theme: defaultData.profile.preferences?.theme || 'light'
      });
      saveUserData(defaultData);
      setUserData(defaultData);
      setProfile(defaultData.profile);
    }
  };

  const handleSymptomToggle = (symptom: string) => {
    const newSymptoms = formData.symptoms.includes(symptom)
      ? formData.symptoms.filter(s => s !== symptom)
      : [...formData.symptoms, symptom];
    
    setFormData({ ...formData, symptoms: newSymptoms });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {isFirstTime && (
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2 tracking-tight">
              Welcome to Hormone Harmony Coach
            </h1>
            <p className="text-sm text-gray-600">
              Let's get started by setting up your daily log
            </p>
          </div>
        )}
        {!isFirstTime && (
          <h1 className="text-2xl font-semibold text-gray-900 mb-8 tracking-tight">
            Daily Log & Settings
          </h1>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6 tracking-tight">
            {isFirstTime ? 'Daily Log' : 'Your Profile'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-xs font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="lastPeriod" className="block text-xs font-medium text-gray-700 mb-2">
                  Last Period Date
                </label>
                <input
                  type="date"
                  id="lastPeriod"
                  value={formData.lastPeriod}
                  onChange={(e) => setFormData({ ...formData, lastPeriod: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                />
              </div>

              <div>
                <label htmlFor="cycleLength" className="block text-xs font-medium text-gray-700 mb-2">
                  Cycle Length (days)
                </label>
                <input
                  type="number"
                  id="cycleLength"
                  value={formData.cycleLength}
                  onChange={(e) => setFormData({ ...formData, cycleLength: Number(e.target.value) })}
                  min="21"
                  max="35"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                />
              </div>

              <div>
                <label htmlFor="goal" className="block text-xs font-medium text-gray-700 mb-2">
                  Health Goal
                </label>
                <input
                  type="text"
                  id="goal"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  placeholder="e.g., energy management"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Current Mood
                </label>
                <select
                  value={formData.mood}
                  onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                >
                  <option value="">Select mood</option>
                  {moodOptions.map(mood => (
                    <option key={mood} value={mood} className="capitalize">
                      {mood}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Energy Level
                </label>
                <select
                  value={formData.energy}
                  onChange={(e) => setFormData({ ...formData, energy: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                >
                  <option value="">Select energy level</option>
                  {energyOptions.map(energy => (
                    <option key={energy} value={energy} className="capitalize">
                      {energy}
                    </option>
                  ))}
                </select>
              </div>

              
            </div>
          </div>

          {/* Symptoms Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="block text-xs font-medium text-gray-700 mb-3">
              Current Symptoms
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {symptomOptions.map(symptom => (
                <label key={symptom} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.symptoms.includes(symptom)}
                    onChange={() => handleSymptomToggle(symptom)}
                    className="h-4 w-4 text-gray-900 focus:ring-gray-400 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-xs text-gray-700 capitalize">{symptom}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              className="flex-1 bg-gray-900 text-white py-2.5 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm font-medium"
            >
              {isFirstTime ? 'Continue to Recommendations' : 'Save Log'}
            </button>
            {!isFirstTime && (
              <button
                onClick={handleReset}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 px-4 rounded-md hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm font-medium"
              >
                Reset Data
              </button>
            )}
          </div>
        </div>

        {/* Current Data Display */}
        {userData && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4 tracking-tight">Profile Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="flex gap-2">
                <span className="text-gray-500">User ID:</span>
                <span className="text-gray-900">{userData.profile.id}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500">Username:</span>
                <span className="text-gray-900">{userData.profile.username}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500">Created:</span>
                <span className="text-gray-900">{new Date(userData.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500">Last Updated:</span>
                <span className="text-gray-900">{new Date(userData.lastUpdated).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500">Cycle History:</span>
                <span className="text-gray-900">{userData.cycleHistory?.length || 0} entries</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500">Current Symptoms:</span>
                <span className="text-gray-900">{userData.profile.symptoms?.join(', ') || 'None'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
