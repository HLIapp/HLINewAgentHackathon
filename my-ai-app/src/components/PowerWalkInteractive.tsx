'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StaticIntervention } from '@/data/staticInterventions';
import { WalkAccompaniment, WalkAccompanimentRequest } from '@/types/interventions';
import { detectPhase, CyclePhase } from '@/utils/menstrualCycle';
import { getUserProfile } from '@/utils/userStorage';
import { saveWalkPhoto, getWalkPhotos } from '@/utils/userStorage';

interface PowerWalkInteractiveProps {
  intervention: StaticIntervention;
}

type TabMode = 'accompaniments' | 'challenge';

export default function PowerWalkInteractive({ intervention }: PowerWalkInteractiveProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabMode>('accompaniments');
  const [isLoading, setIsLoading] = useState(false);
  const [accompaniment, setAccompaniment] = useState<WalkAccompaniment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<CyclePhase>('follicular');
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [walkPhotos, setWalkPhotos] = useState<Array<{ photo_base64: string; challenge?: string; created_at: string }>>([]);

  useEffect(() => {
    // Get current phase
    const profile = getUserProfile();
    if (profile?.lastPeriod) {
      const cycleInfo = detectPhase(new Date(profile.lastPeriod), profile.cycleLength);
      const phase = cycleInfo.phase;
      setCurrentPhase(phase);
      
      // Load accompaniments for this phase
      const loadAccompaniments = async () => {
        setIsLoading(true);
        setError(null);

        try {
          const request: WalkAccompanimentRequest = {
            intervention_title: intervention.title,
            phase: phase,
            preference: 'all',
          };

          const response = await fetch('/api/walk-accompaniment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate accompaniments');
          }

          const data: WalkAccompaniment = await response.json();
          setAccompaniment(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to generate accompaniments');
        } finally {
          setIsLoading(false);
        }
      };

      loadAccompaniments();
    }
    
    // Load saved photos
    const photos = getWalkPhotos(intervention.title);
    setWalkPhotos(photos);
  }, [intervention.title]);

  const handleGenerateAccompaniments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const request: WalkAccompanimentRequest = {
        intervention_title: intervention.title,
        phase: currentPhase,
        preference: 'all',
      };

      const response = await fetch('/api/walk-accompaniment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate accompaniments');
      }

      const data: WalkAccompaniment = await response.json();
      setAccompaniment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate accompaniments');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleSavePhoto = async () => {
    if (!photoFile || !accompaniment?.photo_challenge) return;

    try {
      const photoBase64 = await convertFileToBase64(photoFile);
      saveWalkPhoto(photoBase64, accompaniment.photo_challenge.challenge, intervention.title);
      
      // Refresh photos list
      const photos = getWalkPhotos(intervention.title);
      setWalkPhotos(photos);
      
      // Reset upload
      setPhotoFile(null);
      setUploadedPhoto(null);
      
      // Show success message
      alert('Photo saved! Great job completing the challenge! 🎉');
    } catch (err) {
      setError('Failed to save photo');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const handleDone = () => {
    router.push('/');
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
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{intervention.emoji}</span>
            <h1 className="text-2xl font-bold text-gray-900">{intervention.title}</h1>
          </div>
          <p className="text-sm text-gray-600">{intervention.description}</p>
        </div>

        {/* Guidance Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Why This Matters</h3>
          <p className="text-xs text-blue-800 leading-relaxed">
            During your {currentPhase} phase, brisk walking capitalizes on your body's natural rhythms to enhance cardiovascular health, boost mood, and increase energy. This is a perfect time to move your body in a way that feels good and supports your cycle.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 mb-6 bg-white border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('accompaniments')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded transition-colors ${
              activeTab === 'accompaniments'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Music & Affirmations
          </button>
          <button
            onClick={() => setActiveTab('challenge')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded transition-colors ${
              activeTab === 'challenge'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Photo Challenge
          </button>
        </div>

        {/* Music & Affirmations Tab */}
        {activeTab === 'accompaniments' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                Your Walk Companions
              </h2>
              <button
                onClick={handleGenerateAccompaniments}
                disabled={isLoading}
                className="text-xs text-gray-600 hover:text-gray-900 underline disabled:opacity-50"
              >
                Regenerate
              </button>
            </div>

            {isLoading && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4 animate-pulse">🎵</div>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Creating your personalized accompaniments...
                </p>
                <p className="text-xs text-gray-600">
                  Finding the perfect music, affirmations, and meditation for your walk
                </p>
              </div>
            )}

            {accompaniment && !isLoading && (
              <div className="space-y-6">
                {/* Music Suggestions */}
                {accompaniment.music_suggestions && accompaniment.music_suggestions.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        🎵 Music Suggestions
                      </h3>
                      <button
                        onClick={() => copyToClipboard(accompaniment.music_suggestions!.join('\n'))}
                        className="text-xs text-gray-600 hover:text-gray-900 underline"
                      >
                        Copy All
                      </button>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                      {accompaniment.music_suggestions.map((song, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <p className="text-sm text-gray-900">{song}</p>
                          <button
                            onClick={() => copyToClipboard(song)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Copy
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 italic">
                      💡 Tip: Search for these on your favorite music platform
                    </p>
                  </div>
                )}

                {/* Affirmations */}
                {accompaniment.affirmations && accompaniment.affirmations.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        ✨ Affirmations
                      </h3>
                      <button
                        onClick={() => copyToClipboard(accompaniment.affirmations!.join('\n'))}
                        className="text-xs text-gray-600 hover:text-gray-900 underline"
                      >
                        Copy All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {accompaniment.affirmations.map((affirmation, idx) => (
                        <div
                          key={idx}
                          className="bg-green-50 border border-green-200 rounded-lg p-4"
                        >
                          <p className="text-sm text-green-900 leading-relaxed">{affirmation}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 italic">
                      💡 Tip: Repeat these to yourself as you walk
                    </p>
                  </div>
                )}

                {/* Meditation Theme */}
                {accompaniment.meditation_theme && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      🧘 Meditation Theme
                    </h3>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-purple-900 mb-2">
                        {accompaniment.meditation_theme.theme}
                      </p>
                      <p className="text-xs text-purple-800 leading-relaxed">
                        {accompaniment.meditation_theme.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleDone}
                className="w-full px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Photo Challenge Tab */}
        {activeTab === 'challenge' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Your Photo Challenge
            </h2>

            {isLoading && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4 animate-pulse">📸</div>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Creating your challenge...
                </p>
              </div>
            )}

            {accompaniment?.photo_challenge && !isLoading && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center">
                  <div className="text-3xl mb-3">📸</div>
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                    {accompaniment.photo_challenge.challenge}
                  </h3>
                  <p className="text-sm text-yellow-800 leading-relaxed">
                    {accompaniment.photo_challenge.description}
                  </p>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Upload your photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  
                  {uploadedPhoto ? (
                    <div className="space-y-3">
                      <div className="relative border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={uploadedPhoto}
                          alt="Your walk photo"
                          className="w-full max-h-64 object-cover"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSavePhoto}
                          className="flex-1 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
                        >
                          Save Photo
                        </button>
                        <label
                          htmlFor="photo-upload"
                          className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-center cursor-pointer"
                        >
                          Change Photo
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="photo-upload"
                      className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                    >
                      <div className="text-3xl mb-2">📷</div>
                      <p className="text-sm text-gray-600 mb-1">Click to upload your photo</p>
                      <p className="text-xs text-gray-500">JPG, PNG, or WebP (max 5MB)</p>
                    </label>
                  )}
                </div>

                {/* Previous Photos */}
                {walkPhotos.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Your Previous Challenge Photos
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {walkPhotos.map((photo, idx) => (
                        <div key={idx} className="relative border border-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={`data:image/jpeg;base64,${photo.photo_base64}`}
                            alt={`Challenge ${idx + 1}`}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2">
                            {new Date(photo.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleDone}
                className="w-full px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Done
              </button>
            </div>
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

