# Health AI Assistant

A comprehensive health AI assistant built for hackathon MVP with localStorage-based user management, OpenAI integration, ElevenLabs text-to-speech, and menstrual cycle tracking.

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create `.env.local` with your API keys:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ELEVENLABS_VOICE_ID=your_voice_id_here
   ```

3. **Run the application**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Visit `http://localhost:3001`

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── agent/         # AI Agent endpoint
│   │   └── cycle-phase/   # Cycle tracking endpoint
│   ├── settings/          # User settings page
│   ├── test-agent/        # AI agent test interface
│   ├── test-cycle/        # Cycle tracker interface
│   ├── layout.tsx         # Root layout with navigation
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   └── Navigation.tsx     # Main navigation
├── types/                 # TypeScript type definitions
│   └── api.ts            # API request/response types
└── utils/                # Utility functions
    ├── menstrualCycle.ts  # Cycle tracking utilities
    └── userStorage.ts     # localStorage user management
```

## 🎯 Features

- **🤖 Personalized AI**: GPT-4 powered health assistant
- **🔊 Text-to-Speech**: ElevenLabs integration for audio responses
- **📅 Cycle Tracking**: Menstrual cycle phase detection and tracking
- **💾 Local Storage**: No authentication required, data stays private
- **🎨 Modern UI**: Clean, responsive interface with Tailwind CSS
- **📱 Mobile Friendly**: Responsive design for all devices

## 🔧 API Endpoints

- **`POST /api/agent`** - Chat with AI assistant
- **`POST /api/cycle-phase`** - Calculate cycle phase
- **`GET /api/agent`** - API information
- **`GET /api/cycle-phase`** - API information

## 📖 Documentation

For detailed setup instructions and API documentation, see [API_SETUP.md](./API_SETUP.md).

## 🛠 Development

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4
- **Voice**: ElevenLabs
- **Storage**: Browser localStorage

## 📄 License

Built for hackathon demonstration purposes.