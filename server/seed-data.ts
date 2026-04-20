import type { Pet } from '../src/types';

export const seedPets: Pet[] = [
  {
    id: 'buddy',
    name: 'Buddy',
    breed: 'Golden Retriever',
    species: 'dog',
    age: '12 months',
    gender: 'male',
    weight: '15 kg',
    size: 'Medium',
    coatLength: 'Medium',
    description: 'Buddy is playful, steady, and happiest when he can join a walk or curl up near his human.',
    tags: ['Friendly', 'Playful', 'Family fit'],
    mainImage: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1200',
    gallery: [
      'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1591769225440-811ad7d6eca3?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=1200'
    ],
    location: 'Central Rescue Center',
    distance: '2.4 km',
    coordinates: { lat: 31.228, lng: 121.474 },
    urgent: true
  },
  {
    id: 'luna',
    name: 'Luna',
    breed: 'Short Hair Cat',
    species: 'cat',
    age: '3 months',
    gender: 'female',
    weight: '3 kg',
    size: 'Small',
    coatLength: 'Short',
    description: 'Luna is quiet and independent, with a soft spot for window sun and a calm home.',
    tags: ['Calm', 'Clean', 'Beginner friendly'],
    mainImage: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=1200',
    gallery: [
      'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&q=80&w=1200'
    ],
    location: 'City Cat House',
    distance: '5.1 km',
    coordinates: { lat: 31.216, lng: 121.492 },
    urgent: false
  },
  {
    id: 'winston',
    name: 'Winston',
    breed: 'French Bulldog',
    species: 'dog',
    age: '1 year',
    gender: 'male',
    weight: '10 kg',
    size: 'Small',
    coatLength: 'Short',
    description: 'Winston loves people and settles quickly into a home that wants a cheerful companion.',
    tags: ['Social', 'Curious', 'Companion'],
    mainImage: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=1200',
    gallery: [
      'https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?auto=format&fit=crop&q=80&w=1200'
    ],
    location: 'South Partner Clinic',
    distance: '3.0 km',
    coordinates: { lat: 31.205, lng: 121.463 },
    urgent: false
  },
  {
    id: 'marmalade',
    name: 'Marmalade',
    breed: 'Long Hair Cat',
    species: 'cat',
    age: '2 years',
    gender: 'female',
    weight: '4.8 kg',
    size: 'Medium',
    coatLength: 'Long',
    description: 'Marmalade is gentle, photogenic, and happiest in a quiet apartment with a warm lap.',
    tags: ['Gentle', 'Fluffy', 'Apartment ready'],
    mainImage: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&q=80&w=1200',
    gallery: [
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=1200'
    ],
    location: 'Jingan Foster Point',
    distance: '4.2 km',
    coordinates: { lat: 31.237, lng: 121.451 },
    urgent: false
  },
  {
    id: 'scout',
    name: 'Scout',
    breed: 'Border Collie Mix',
    species: 'dog',
    age: '8 months',
    gender: 'male',
    weight: '14 kg',
    size: 'Medium',
    coatLength: 'Medium',
    description: 'Scout learns fast and thrives with movement, games, and a family that enjoys training.',
    tags: ['Smart', 'Active', 'Trainable'],
    mainImage: 'https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?auto=format&fit=crop&q=80&w=1200',
    gallery: [
      'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?auto=format&fit=crop&q=80&w=1200'
    ],
    location: 'West Training Center',
    distance: '7.8 km',
    coordinates: { lat: 31.251, lng: 121.41 },
    urgent: false
  }
];
