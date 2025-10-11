'use client';

import { useState, useEffect } from 'react';
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    username: '',
    lastPeriod: '',
    cycleLength: 28,
    goal: '',
    symptoms: [] as string[],
    mood: '',
    energy: '',
    voiceId: 'pNInz6obpgDQGcFmaJgB',
    notifications: true,
    theme: 'light' as 'light' | 'dark'
  });

  const symptomOptions = [
    'fatigue', 'bloating', 'headaches', 'mood swings', 
    'cramps', 'breast tenderness', 'acne', 'cravings',
    'irritability', 'anxiety', 'depression', 'insomnia'
  ];

  const moodOptions = ['low', 'moderate', 'high'];
  const energyOptions = ['low', 'moderate', 'high'];

  useEffect(() => {
    // Initialize user data if none exists
    const data = initializeUserData();
    const userProfile = getUserProfile() || data.profile;
    
    setProfile(userProfile);
    setUserData(data);
    setFormData({
      id: userProfile.id,
      username: userProfile.username,
      lastPeriod: userProfile.lastPeriod,
      cycleLength: userProfile.cycleLength,
      goal: userProfile.goal,
      symptoms: userProfile.symptoms,
      mood: userProfile.mood,
      energy: userProfile.energy,
      voiceId: userProfile.preferences?.voiceId || 'pNInz6obpgDQGcFmaJgB',
      notifications: userProfile.preferences?.notifications ?? true,
      theme: userProfile.preferences?.theme || 'light'
    });
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
        voiceId: formData.voiceId,
        notifications: formData.notifications,
        theme: formData.theme
      }
    };

    const updatedUserData: UserData = {
      ...userData!,
      profile: updatedProfile,
      lastUpdated: new Date().toISOString()
    };

    saveUserProfile(updatedProfile);
    saveUserData(updatedUserData);
    setProfile(updatedProfile);
    setUserData(updatedUserData);
    
    alert('Settings saved successfully!');
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
        voiceId: defaultData.profile.preferences?.voiceId || 'pNInz6obpgDQGcFmaJgB',
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
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          User Settings & Profile
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label htmlFor="lastPeriod" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Period Date
                </label>
                <input
                  type="date"
                  id="lastPeriod"
                  value={formData.lastPeriod}
                  onChange={(e) => setFormData({ ...formData, lastPeriod: e.target.value })}
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
                  value={formData.cycleLength}
                  onChange={(e) => setFormData({ ...formData, cycleLength: Number(e.target.value) })}
                  min="21"
                  max="35"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-2">
                  Health Goal
                </label>
                <input
                  type="text"
                  id="goal"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., energy management, mood tracking"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Mood
                </label>
                <select
                  value={formData.mood}
                  onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {moodOptions.map(mood => (
                    <option key={mood} value={mood} className="capitalize">
                      {mood}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Energy Level
                </label>
                <select
                  value={formData.energy}
                  onChange={(e) => setFormData({ ...formData, energy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {energyOptions.map(energy => (
                    <option key={energy} value={energy} className="capitalize">
                      {energy}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="voiceId" className="block text-sm font-medium text-gray-700 mb-2">
                  Voice ID (ElevenLabs)
                </label>
                <input
                  type="text"
                  id="voiceId"
                  value={formData.voiceId}
                  onChange={(e) => setFormData({ ...formData, voiceId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Voice ID for text-to-speech"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={formData.notifications}
                  onChange={(e) => setFormData({ ...formData, notifications: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="notifications" className="ml-2 block text-sm text-gray-700">
                  Enable notifications
                </label>
              </div>
            </div>
          </div>

          {/* Symptoms Section */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Current Symptoms (select all that apply)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {symptomOptions.map(symptom => (
                <label key={symptom} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.symptoms.includes(symptom)}
                    onChange={() => handleSymptomToggle(symptom)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{symptom}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Theme Selection */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              value={formData.theme}
              onChange={(e) => setFormData({ ...formData, theme: e.target.value as 'light' | 'dark' })}
              className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Settings
            </button>
            <button
              onClick={handleReset}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Reset Data
            </button>
          </div>
        </div>

        {/* Current Data Display */}
        {userData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Profile Data</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>User ID:</strong> {userData.profile.id}
              </div>
              <div>
                <strong>Username:</strong> {userData.profile.username}
              </div>
              <div>
                <strong>Created:</strong> {new Date(userData.createdAt).toLocaleString()}
              </div>
              <div>
                <strong>Last Updated:</strong> {new Date(userData.lastUpdated).toLocaleString()}
              </div>
              <div>
                <strong>Cycle History Entries:</strong> {userData.cycleHistory.length}
              </div>
              <div>
                <strong>Current Symptoms:</strong> {userData.profile.symptoms.join(', ') || 'None'}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Quick Navigation</h3>
          <div className="flex flex-wrap gap-2">
            <a
              href="/test-agent"
              className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
            >
              Test AI Agent
            </a>
            <a
              href="/test-cycle"
              className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700"
            >
              Test Cycle Tracker
            </a>
            <a
              href="/"
              className="bg-gray-600 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-700"
            >
              Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
