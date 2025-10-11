'use client';

import { useState, useEffect } from 'react';
import { getUserProfile } from '@/utils/userStorage';

export default function Navigation() {
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const profile = getUserProfile();
    setUserProfile(profile);
  }, []);

  return (
    <nav className="bg-white shadow-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">Health AI</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a
                href="/"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Home
              </a>
              <a
                href="/settings"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Settings
              </a>
              <a
                href="/test-agent"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                AI Agent
              </a>
              <a
                href="/test-cycle"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Cycle Tracker
              </a>
            </div>
          </div>
          
          <div className="flex items-center">
            {userProfile && (
              <div className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{userProfile.username}</span>
              </div>
            )}
            {!userProfile && (
              <div className="text-sm text-gray-500">
                <a href="/settings" className="hover:text-gray-700">
                  Set up your profile
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
