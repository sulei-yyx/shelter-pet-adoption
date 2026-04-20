import type { AdoptionApplication, Favorite, Pet, UserProfile } from '../src/types';
import { seedPets } from './seed-data';
import { supabaseRequest } from './supabase';

type FavoriteRow = {
  pet_id: string;
  created_at: string;
};

type ProfileRow = {
  user_id: string;
  name: string;
  bio: string;
  email: string;
  avatar: string;
  notifications: UserProfile['notifications'];
  preferences: UserProfile['preferences'];
};

type ApplicationRow = {
  id: string;
  pet_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  housing_type: string;
  fenced_yard: boolean;
  pet_experience: string;
  status: AdoptionApplication['status'];
  created_at: string;
};

const defaultProfile = (userId: string): UserProfile => ({
  userId,
  name: 'New adopter',
  bio: 'Animal lover looking for the next family member.',
  email: 'adopter@example.com',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
  notifications: { email: true, sms: false, push: true },
  preferences: { theme: 'light', language: 'en' },
});

function mapProfile(row: ProfileRow): UserProfile {
  return {
    userId: row.user_id,
    name: row.name,
    bio: row.bio,
    email: row.email,
    avatar: row.avatar,
    notifications: row.notifications,
    preferences: row.preferences,
  };
}

function mapApplication(row: ApplicationRow, pet?: Pet): AdoptionApplication {
  return {
    id: row.id,
    petId: row.pet_id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    housingType: row.housing_type,
    fencedYard: row.fenced_yard,
    petExperience: row.pet_experience,
    status: row.status,
    createdAt: row.created_at,
    pet,
  };
}

export async function ensureSeedData() {
  const pets = await supabaseRequest<Pet[]>('pets?select=id&limit=1');
  if (pets.length > 0) return;

  await supabaseRequest<Pet[]>('pets', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(seedPets),
  });
}

export function listPets() {
  return supabaseRequest<Pet[]>('pets?select=*&order=name.asc');
}

export async function getPet(id: string) {
  const pets = await supabaseRequest<Pet[]>(`pets?select=*&id=eq.${id}&limit=1`);
  return pets[0] ?? null;
}

export async function listFavorites(userId: string) {
  const rows = await supabaseRequest<FavoriteRow[]>(`favorites?select=pet_id,created_at&user_id=eq.${userId}&order=created_at.desc`);
  const petIds = rows.map((row) => row.pet_id);
  if (petIds.length === 0) {
    return { favorites: [] as Favorite[], pets: [] as Pet[] };
  }

  const pets = await supabaseRequest<Pet[]>(`pets?select=*&id=in.(${petIds.join(',')})`);
  return {
    favorites: rows.map((row) => ({ petId: row.pet_id, createdAt: row.created_at })),
    pets,
  };
}

export async function toggleFavorite(userId: string, petId: string) {
  const existing = await supabaseRequest<FavoriteRow[]>(`favorites?select=pet_id&user_id=eq.${userId}&pet_id=eq.${petId}&limit=1`);

  if (existing.length > 0) {
    await supabaseRequest<null>(`favorites?user_id=eq.${userId}&pet_id=eq.${petId}`, {
      method: 'DELETE',
    });
    return { favorited: false };
  }

  await supabaseRequest<FavoriteRow[]>('favorites', {
    method: 'POST',
    headers: {
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ user_id: userId, pet_id: petId }),
  });

  return { favorited: true };
}

export async function getProfile(userId: string) {
  const rows = await supabaseRequest<ProfileRow[]>(`profiles?select=*&user_id=eq.${userId}&limit=1`);
  if (rows[0]) {
    return mapProfile(rows[0]);
  }

  const profile = defaultProfile(userId);
  return updateProfile(userId, profile);
}

export async function updateProfile(userId: string, profile: Partial<UserProfile>) {
  const current = defaultProfile(userId);
  const rows = await supabaseRequest<ProfileRow[]>('profiles', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({
      user_id: userId,
      name: profile.name ?? current.name,
      bio: profile.bio ?? current.bio,
      email: profile.email ?? current.email,
      avatar: profile.avatar ?? current.avatar,
      notifications: profile.notifications ?? current.notifications,
      preferences: profile.preferences ?? current.preferences,
    }),
  });

  return mapProfile(rows[0]);
}

export async function listApplications(userId: string) {
  const rows = await supabaseRequest<ApplicationRow[]>(`applications?select=*&user_id=eq.${userId}&order=created_at.desc`);
  if (rows.length === 0) return [];

  const petIds = [...new Set(rows.map((row) => row.pet_id))];
  const pets = await supabaseRequest<Pet[]>(`pets?select=*&id=in.(${petIds.join(',')})`);
  const petMap = new Map(pets.map((pet) => [pet.id, pet]));
  return rows.map((row) => mapApplication(row, petMap.get(row.pet_id)));
}

export async function createApplication(
  userId: string,
  payload: Omit<AdoptionApplication, 'id' | 'userId' | 'status' | 'createdAt' | 'pet'>,
) {
  const rows = await supabaseRequest<ApplicationRow[]>('applications', {
    method: 'POST',
    headers: {
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      user_id: userId,
      pet_id: payload.petId,
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      housing_type: payload.housingType,
      fenced_yard: payload.fencedYard,
      pet_experience: payload.petExperience,
      status: 'submitted',
    }),
  });

  const pet = await getPet(payload.petId);
  return mapApplication(rows[0], pet ?? undefined);
}
