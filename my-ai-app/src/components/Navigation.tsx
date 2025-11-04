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
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Hormone Harmony Coach</h1>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
              <a
                href="/"
                className="text-gray-600 hover:text-gray-900 inline-flex items-center px-1 text-sm font-medium transition-colors"
              >
                Home
              </a>
              <a
                href="/library"
                className="text-gray-600 hover:text-gray-900 inline-flex items-center px-1 text-sm font-medium transition-colors"
              >
                Library
              </a>
              <a
                href="/settings"
                className="text-gray-600 hover:text-gray-900 inline-flex items-center px-1 text-sm font-medium transition-colors"
              >
                Settings
              </a>
            </div>
          </div>
          
          <div className="flex items-center">
            {userProfile && (
              <div className="text-sm text-gray-600 font-normal">
                {userProfile.username}
              </div>
            )}
            {!userProfile && (
              <div className="text-sm text-gray-500">
                <a href="/settings" className="hover:text-gray-900 transition-colors">
                  Set up profile
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
