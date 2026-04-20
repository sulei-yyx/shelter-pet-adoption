import { bootstrapServer } from './app';

bootstrapServer().catch((error) => {
  console.error('Failed to bootstrap Supabase data:', error);
  process.exit(1);
});
