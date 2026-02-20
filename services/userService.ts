
import { User, UserRole, ModerationConfig } from '../types';
import { auth } from './firebaseService';

let currentUser: User = { 
    id: 'guest', 
    name: 'Guest', 
    email: '', 
    role: 'reviewer', 
    avatarUrl: '' 
};

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
  
  syncWithFirebase: (firebaseUser: any) => {
      if (!firebaseUser) {
          currentUser = { id: 'guest', name: 'Guest', email: '', role: 'reviewer', avatarUrl: '' };
          return currentUser;
      }
      
      currentUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          role: 'admin', // Defaulting to admin for the primary account holder
          avatarUrl: firebaseUser.photoURL || ''
      };
      return currentUser;
  },

  updateCurrentUser: (updates: Partial<User>) => {
      currentUser = { ...currentUser, ...updates };
      return { ...currentUser };
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
  },

  getAllUsers: () => [currentUser] // For now, only show the synced user
};
