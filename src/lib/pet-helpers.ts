import type { ApplicationStatus, Pet, PetGender } from '../types';

export function petGenderLabel(gender: PetGender) {
  return gender === 'male' ? '公' : '母';
}

export function petSpeciesLabel(species: Pet['species']) {
  if (species === 'dog') return '狗狗';
  if (species === 'cat') return '猫咪';
  return '其他';
}

export function applicationStatusLabel(status: ApplicationStatus) {
  if (status === 'submitted') return '已提交';
  if (status === 'reviewing') return '审核中';
  if (status === 'approved') return '已通过';
  return '已拒绝';
}
