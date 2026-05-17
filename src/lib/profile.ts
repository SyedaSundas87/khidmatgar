/**
 * Profile Management Utility
 * Handles storing, retrieving, and updating user profile data in localStorage
 */

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  joined_at: string;
  role: 'user' | 'provider';
  provider_id?: string;
}

const PROFILE_STORAGE_KEY = 'khidmatgaar_user_profile';
const PROVIDER_DATA_STORAGE_KEY = 'khidmatgaar_provider_data';

export function getUserProfile(): UserProfile | null {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to retrieve user profile:', error);
    return null;
  }
}

export function saveUserProfile(profile: UserProfile): boolean {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    return true;
  } catch (error) {
    console.error('Failed to save user profile:', error);
    return false;
  }
}

export function updateUserProfile(updates: Partial<UserProfile>): boolean {
  try {
    const existing = getUserProfile();
    if (!existing) return false;
    return saveUserProfile({ ...existing, ...updates });
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return false;
  }
}

export function loginAsUser(name: string, email: string): UserProfile {
  const profile: UserProfile = { name, email, joined_at: new Date().toISOString(), role: 'user' };
  saveUserProfile(profile);
  return profile;
}

export function loginAsProvider(providerId: string): UserProfile {
  const profile: UserProfile = {
    name: `Provider ${providerId}`,
    email: `${providerId}@example.com`,
    joined_at: new Date().toISOString(),
    role: 'provider',
    provider_id: providerId,
  };
  saveUserProfile(profile);
  return profile;
}

export function clearUserProfile(): boolean {
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem(PROVIDER_DATA_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear user profile:', error);
    return false;
  }
}

export function hasUserProfile(): boolean {
  return getUserProfile() !== null;
}

export function getUserName(): string {
  return getUserProfile()?.name || 'Guest User';
}

export function getUserEmail(): string {
  return getUserProfile()?.email || '';
}

export function getProviderData(): any | null {
  try {
    const stored = localStorage.getItem(PROVIDER_DATA_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to retrieve provider data:', error);
    return null;
  }
}

export function saveProviderData(data: any): boolean {
  try {
    localStorage.setItem(PROVIDER_DATA_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save provider data:', error);
    return false;
  }
}
