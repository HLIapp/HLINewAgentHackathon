'use client';

import { useState } from 'react';
import { AgentRequest, AgentResponse } from '@/types/api';

export default function TestAgentPage() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [generateAudio, setGenerateAudio] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const requestBody: AgentRequest = {
        message: message.trim(),
        generateAudio,
      };

      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data: AgentResponse = await res.json();
      setResponse(data);
    } catch (error) {
      console.error('Error:', error);
      setResponse({
        message: 'Error occurred while calling the API',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (response?.audio) {
      const audio = new Audio(response.audio);
      audio.play();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          AI Agent Test Page
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="generateAudio"
                checked={generateAudio}
                onChange={(e) => setGenerateAudio(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="generateAudio" className="ml-2 block text-sm text-gray-700">
                Generate audio response (requires ElevenLabs API key)
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>

        {response && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Response</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-700 whitespace-pre-wrap">{response.message}</p>
              </div>
              
              <div className="text-sm text-gray-500">
                <p>Timestamp: {new Date(response.timestamp).toLocaleString()}</p>
              </div>

              {response.audio && (
                <div className="border-t pt-4">
                  <button
                    onClick={playAudio}
                    className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    🔊 Play Audio
                  </button>
                </div>
              )}

              {response.audioError && (
                <div className="border-t pt-4">
                  <p className="text-red-600 text-sm">
                    Audio Error: {response.audioError}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Setup Instructions</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Add your OpenAI API key to <code className="bg-blue-100 px-1 rounded">.env.local</code></li>
            <li>Add your ElevenLabs API key to <code className="bg-blue-100 px-1 rounded">.env.local</code></li>
            <li>Optionally add a voice ID for ElevenLabs (default voice will be used if not provided)</li>
            <li>Start the development server with <code className="bg-blue-100 px-1 rounded">npm run dev</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
}
