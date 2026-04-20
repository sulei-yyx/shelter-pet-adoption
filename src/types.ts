export type PetSpecies = 'dog' | 'cat' | 'other';
export type PetGender = 'male' | 'female';
export type ApplicationStatus = 'submitted' | 'reviewing' | 'approved' | 'rejected';

export interface Pet {
  id: string;
  name: string;
  breed: string;
  species: PetSpecies;
  age: string;
  gender: PetGender;
  weight: string;
  size: string;
  coatLength: string;
  description: string;
  tags: string[];
  mainImage: string;
  gallery: string[];
  location: string;
  distance: string;
  urgent?: boolean;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface Favorite {
  petId: string;
  createdAt: string;
}

export interface AdoptionApplication {
  id: string;
  petId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  housingType: string;
  fencedYard: boolean;
  petExperience: string;
  status: ApplicationStatus;
  createdAt: string;
  pet?: Pet;
}

export interface UserProfile {
  userId: string;
  name: string;
  bio: string;
  email: string;
  avatar: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: 'zh' | 'en' | 'jp';
  };
}
