# Health AI Assistant - Complete Setup Guide

This project includes a comprehensive health AI assistant with localStorage-based user management, OpenAI integration, ElevenLabs text-to-speech, and menstrual cycle tracking.

## Features

- **OpenAI Integration**: Uses GPT-4 for personalized health responses
- **ElevenLabs Integration**: Optional text-to-speech conversion of AI responses
- **localStorage User Management**: No authentication required, perfect for hackathon MVP
- **Menstrual Cycle Tracking**: Comprehensive cycle phase detection and tracking
- **Personalized AI**: Responses tailored to user's symptoms, mood, and goals
- **TypeScript Support**: Fully typed APIs with proper error handling
- **Complete UI**: Settings, navigation, and test interfaces

## Setup Instructions

### 1. Install Dependencies

The required dependencies are already installed:
- `openai` - OpenAI SDK
- `@elevenlabs/elevenlabs-js` - ElevenLabs SDK

### 2. Environment Variables

**Required**: Create a `.env.local` file in the project root with the following variables:

```env
# OpenAI API Configuration (Required for AI responses)
OPENAI_API_KEY=your_openai_api_key_here

# ElevenLabs API Configuration (Optional for text-to-speech)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# ElevenLabs Voice ID (Optional - uses default if not provided)
ELEVENLABS_VOICE_ID=your_voice_id_here
```

**Note**: The application will work without ElevenLabs keys, but audio generation will be disabled.

### 3. Get API Keys

#### OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Go to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env.local` file

#### ElevenLabs API Key
1. Visit [ElevenLabs](https://elevenlabs.io/)
2. Sign up or log in to your account
3. Go to your profile settings
4. Find your API key
5. Copy the key and add it to your `.env.local` file

#### ElevenLabs Voice ID (Optional)
1. In your ElevenLabs dashboard, go to Voice Library
2. Choose a voice you like
3. Copy the Voice ID from the URL or voice details
4. Add it to your `.env.local` file

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## API Usage

### Endpoint: `POST /api/agent`

Send a message to the AI agent and optionally generate audio.

#### Request Body
```json
{
  "message": "Hello, how are you?",
  "voiceId": "optional_voice_id",
  "generateAudio": true
}
```

#### Response
```json
{
  "message": "Hello! I'm doing well, thank you for asking. How can I help you today?",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "audio": "data:audio/mpeg;base64,..." // Only if generateAudio is true
}
```

### Endpoint: `GET /api/agent`

Get information about the API endpoint and its usage.

## Available Pages

- **`/`** - Home page with feature overview and user status
- **`/settings`** - User profile configuration and preferences
- **`/test-agent`** - AI agent interface with personalized responses
- **`/test-cycle`** - Menstrual cycle tracking and phase detection

## Testing

### Quick Start
1. Visit `http://localhost:3001/` for the home page
2. Go to `/settings` to set up your user profile
3. Use `/test-agent` to chat with the personalized AI
4. Use `/test-cycle` to track your menstrual cycle

## Error Handling

The API includes comprehensive error handling for:
- Missing or invalid API keys
- OpenAI API errors
- ElevenLabs API errors
- Invalid request parameters
- Network issues

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your API keys secure and don't share them publicly
- Consider implementing rate limiting for production use
- Use environment-specific API keys for different deployments

## Troubleshooting

### Common Issues

1. **"API key not found" error**
   - Ensure your `.env.local` file is in the project root
   - Check that the environment variable names match exactly
   - Restart the development server after adding environment variables

2. **ElevenLabs audio not working**
   - Verify your ElevenLabs API key is valid
   - Check that you have sufficient credits in your ElevenLabs account
   - Ensure the voice ID is valid (or let it use the default)

3. **OpenAI API errors**
   - Verify your OpenAI API key is valid
   - Check that you have sufficient credits in your OpenAI account
   - Ensure the API key has the necessary permissions

### Debug Mode

To see detailed error logs, check the browser console and the terminal where you're running the development server.
