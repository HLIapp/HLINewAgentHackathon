// API Request Types
export interface AgentRequest {
  message: string;
  voiceId?: string;
  generateAudio?: boolean;
  username?: string;
}

// API Response Types
export interface AgentResponse {
  message: string;
  timestamp: string;
  audio?: string; // Base64 encoded audio data
  audioError?: string;
  username?: string;
}

export interface AgentError {
  error: string;
}

// API Info Response
export interface AgentInfoResponse {
  message: string;
  endpoints: {
    POST: string;
    parameters: {
      message: string;
      voiceId: string;
      generateAudio: string;
      username: string;
    };
  };
}
