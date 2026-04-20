import type { AdoptionApplication, Favorite, Pet, UserProfile } from '../types';
import { supabase } from './supabase';

const API_BASE = '/api';

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Request failed.' }));
    throw new Error(payload.error ?? 'Request failed.');
  }

  return response.json() as Promise<T>;
}

export const api = {
  registerUser(payload: { email: string; password: string }) {
    return requestJson<{ id: string; email: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  listPets() {
    return requestJson<Pet[]>('/pets');
  },
  getPet(id: string) {
    return requestJson<Pet>(`/pets/${id}`);
  },
  getFavorites() {
    return requestJson<{ favorites: Favorite[]; pets: Pet[] }>('/favorites');
  },
  toggleFavorite(petId: string) {
    return requestJson<{ favorited: boolean }>(`/favorites/${petId}`, { method: 'POST' });
  },
  getProfile() {
    return requestJson<UserProfile>('/profile');
  },
  updateProfile(profile: Partial<UserProfile>) {
    return requestJson<UserProfile>('/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  },
  listApplications() {
    return requestJson<AdoptionApplication[]>('/applications');
  },
  createApplication(payload: Omit<AdoptionApplication, 'id' | 'userId' | 'status' | 'createdAt' | 'pet'>) {
    return requestJson<AdoptionApplication>('/applications', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
