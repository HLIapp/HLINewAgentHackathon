/**
 * User Storage Utility for localStorage-based user management
 * Perfect for hackathon MVP without authentication
 * Integrates with existing mock data structure
 */

export interface UserProfile {
  id: string;
  username: string;
  lastPeriod: string;
  cycleLength: number;
  goal: string;
  symptoms: string[];
  mood: string;
  energy: string;
  preferences?: {
    voiceId?: string;
    notifications?: boolean;
    theme?: 'light' | 'dark';
  };
}

export interface CycleHistory {
  date: string;
  cycleLength: number;
  symptoms?: string[];
  mood?: string;
  energy?: string;
  notes?: string;
}

export interface UserData {
  profile: UserProfile;
  cycleHistory: CycleHistory[];
  createdAt: string;
  lastUpdated: string;
}

// Mock data structure matching existing mockData.json
export const defaultMockUser: UserProfile = {
  id: "user1",
  username: "User",
  lastPeriod: "2025-09-15",
  cycleLength: 28,
  goal: "energy management",
  symptoms: ["fatigue", "bloating"],
  mood: "low",
  energy: "moderate",
  preferences: {
    voiceId: 'pNInz6obpgDQGcFmaJgB',
    notifications: true,
    theme: 'light'
  }
};

export const getUserProfile = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('userProfile');
  return stored ? JSON.parse(stored) : null;
};

export const saveUserProfile = (profile: UserProfile): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('userProfile', JSON.stringify(profile));
};

export const getUserData = (): UserData | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('userData');
  return stored ? JSON.parse(stored) : null;
};

export const saveUserData = (data: UserData): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('userData', JSON.stringify(data));
};

export const getDefaultUserData = (): UserData => ({
  profile: defaultMockUser,
  cycleHistory: [
    {
      date: "2025-09-15",
      cycleLength: 28,
      symptoms: ["fatigue", "bloating"],
      mood: "low",
      energy: "moderate",
      notes: "Regular cycle start"
    }
  ],
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString()
});

export const updateUserCycleData = (lastPeriod: string, cycleLength?: number): void => {
  const userData = getUserData() || getDefaultUserData();
  const updatedProfile = {
    ...userData.profile,
    lastPeriod,
    cycleLength: cycleLength || userData.profile.cycleLength
  };
  
  const updatedData: UserData = {
    ...userData,
    profile: updatedProfile,
    lastUpdated: new Date().toISOString()
  };
  
  saveUserData(updatedData);
};

export const updateUserSymptoms = (symptoms: string[], mood: string, energy: string): void => {
  const userData = getUserData() || getDefaultUserData();
  const updatedProfile = {
    ...userData.profile,
    symptoms,
    mood,
    energy
  };
  
  const updatedData: UserData = {
    ...userData,
    profile: updatedProfile,
    lastUpdated: new Date().toISOString()
  };
  
  saveUserData(updatedData);
};

export const addCycleHistory = (cycleData: CycleHistory): void => {
  const userData = getUserData() || getDefaultUserData();
  const updatedData: UserData = {
    ...userData,
    cycleHistory: [...userData.cycleHistory, cycleData],
    lastUpdated: new Date().toISOString()
  };
  
  saveUserData(updatedData);
};

export const clearUserData = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('userProfile');
  localStorage.removeItem('userData');
};

export const initializeUserData = (): UserData => {
  const existingData = getUserData();
  if (existingData) {
    return existingData;
  }
  
  const defaultData = getDefaultUserData();
  saveUserData(defaultData);
  return defaultData;
};

// Mock users for demo purposes
export const mockUsers: Record<string, UserProfile> = {
  'demo-user': {
    id: "demo-user",
    username: "PJ Vang",
    lastPeriod: "2024-10-01",
    cycleLength: 28,
    goal: "energy management",
    symptoms: ["fatigue", "bloating"],
    mood: "moderate",
    energy: "moderate",
    preferences: {
      voiceId: 'pNInz6obpgDQGcFmaJgB',
      notifications: true,
      theme: 'light'
    }
  },
  'test-user': {
    id: "test-user",
    username: "PJ Vang",
    lastPeriod: "2024-09-28",
    cycleLength: 30,
    goal: "mood tracking",
    symptoms: ["headaches", "mood swings"],
    mood: "low",
    energy: "high",
    preferences: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
      notifications: false,
      theme: 'dark'
    }
  }
};

export const getMockUser = (username: string): UserProfile | null => {
  return mockUsers[username.toLowerCase().replace(/\s+/g, '-')] || null;
};

// Completion tracking functions
export interface CompletedIntervention {
  intervention_id: string;
  intervention_title: string;
  completed_at: string;
  rating?: number; // 1-5
  completed_full_practice: boolean;
  changes_noticed?: string[];
  notes?: string;
}

export const getCompletedInterventions = (): CompletedIntervention[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('completedInterventions');
  return stored ? JSON.parse(stored) : [];
};

export const addCompletedIntervention = (completion: CompletedIntervention): void => {
  if (typeof window === 'undefined') return;
  const completions = getCompletedInterventions();
  completions.push(completion);
  localStorage.setItem('completedInterventions', JSON.stringify(completions));
};

export const isInterventionCompletedToday = (interventionId: string): boolean => {
  const completions = getCompletedInterventions();
  const today = new Date().toDateString();
  
  return completions.some(c => {
    const completionDate = new Date(c.completed_at).toDateString();
    return c.intervention_id === interventionId && completionDate === today;
  });
};

export const getInterventionCompletionCount = (interventionId: string): number => {
  const completions = getCompletedInterventions();
  return completions.filter(c => c.intervention_id === interventionId).length;
};
