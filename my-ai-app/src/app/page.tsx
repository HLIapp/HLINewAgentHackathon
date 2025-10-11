'use client';

import { useEffect, useState } from 'react';
import { getUserProfile } from '@/utils/userStorage';

export default function Home() {
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const profile = getUserProfile();
    setUserProfile(profile);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Health AI Assistant
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Personalized AI support for menstrual cycle tracking and women's health
          </p>
          {userProfile && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-8">
              Welcome back, <strong>{userProfile.username}</strong>! Your profile is set up and ready.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">AI Health Assistant</h2>
              <p className="text-gray-600 mb-4">
                Get personalized health advice and support from our AI assistant. 
                Share your symptoms and get tailored recommendations.
              </p>
              <a
                href="/test-agent"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Try AI Agent
              </a>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">📅</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Cycle Tracker</h2>
              <p className="text-gray-600 mb-4">
                Track your menstrual cycle phases and get insights into your 
                current phase with personalized health tips.
              </p>
              <a
                href="/test-cycle"
                className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Track Cycle
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl mb-2">💾</div>
              <h3 className="font-medium text-gray-900 mb-2">Local Storage</h3>
              <p className="text-sm text-gray-600">
                Your data stays private in your browser's localStorage
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-medium text-gray-900 mb-2">Personalized</h3>
              <p className="text-sm text-gray-600">
                AI responses tailored to your symptoms and goals
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🔊</div>
              <h3 className="font-medium text-gray-900 mb-2">Voice Support</h3>
              <p className="text-sm text-gray-600">
                Optional text-to-speech for accessibility
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get Started</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/settings"
              className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 transition-colors"
            >
              {userProfile ? 'Update Settings' : 'Set Up Profile'}
            </a>
            <a
              href="/test-agent"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Chat with AI
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
