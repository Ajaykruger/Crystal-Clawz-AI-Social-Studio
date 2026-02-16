
import { User, UserRole, ModerationConfig } from '../types';

// Mock User Data
const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Jenn', email: 'jenn@crystalclawz.co.za', role: 'admin', avatarUrl: '' },
  { id: 'u2', name: 'Sarah Editor', email: 'sarah@crystalclawz.co.za', role: 'editor', avatarUrl: '' },
  { id: 'u3', name: 'Mike Reviewer', email: 'mike@crystalclawz.co.za', role: 'reviewer', avatarUrl: '' }
];

let currentUser: User = MOCK_USERS[0]; // Default to Admin for demo

// Mock Global Config
let moderationConfig: ModerationConfig = {
    checkBrandVoice: true,
    checkCompliance: true,
    checkAudienceFit: true,
    checkMediaPresence: true,
    checkHashtagLimit: true
};

export const userService = {
  getCurrentUser: () => currentUser,
  
  switchUser: (userId: string) => {
      const u = MOCK_USERS.find(user => user.id === userId);
      if (u) currentUser = u;
      return currentUser;
  },

  updateCurrentUser: (updates: Partial<User>) => {
      currentUser = { ...currentUser, ...updates };
      const index = MOCK_USERS.findIndex(u => u.id === currentUser.id);
      if (index !== -1) {
          MOCK_USERS[index] = currentUser;
      }
      return { ...currentUser };
  },

  getAllUsers: () => MOCK_USERS,

  updateUserRole: (userId: string, role: UserRole) => {
      const u = MOCK_USERS.find(user => user.id === userId);
      if (u) u.role = role;
  },

  canApprove: () => {
      return ['admin', 'reviewer'].includes(currentUser.role);
  },

  canEditSettings: () => {
      return ['admin'].includes(currentUser.role);
  },

  getModerationConfig: () => moderationConfig,
  
  updateModerationConfig: (config: Partial<ModerationConfig>) => {
      moderationConfig = { ...moderationConfig, ...config };
      return moderationConfig;
  }
};
