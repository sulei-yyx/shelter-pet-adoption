import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import { authenticateRequest, createConfirmedUser } from './auth';
import {
  createApplication,
  ensureSeedData,
  getPet,
  getProfile,
  listApplications,
  listFavorites,
  listPets,
  toggleFavorite,
  updateProfile,
} from './repository';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const app = express();
const port = Number(process.env.PORT ?? 8787);

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_ORIGIN ?? '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

async function requireUser(req: express.Request, res: express.Response) {
  const user = await authenticateRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required.' });
    return null;
  }
  return user;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');

    if (!email || !password || password.length < 6) {
      res.status(400).json({ error: '邮箱和密码不合法。' });
      return;
    }

    const user = await createConfirmedUser(email, password);
    res.status(201).json({ id: user.id, email: user.email });
  } catch (error) {
    const message = error instanceof Error ? error.message : '注册失败。';
    if (message.includes('already been registered') || message.includes('already registered')) {
      res.status(409).json({ error: '这个邮箱已经注册过了。' });
      return;
    }
    res.status(500).json({ error: message });
  }
});

app.get('/api/pets', async (_req, res) => {
  try {
    res.json(await listPets());
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load pets.' });
  }
});

app.get('/api/pets/:id', async (req, res) => {
  try {
    const pet = await getPet(req.params.id);
    if (!pet) {
      res.status(404).json({ error: 'Pet not found.' });
      return;
    }
    res.json(pet);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load pet.' });
  }
});

app.get('/api/favorites', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json(await listFavorites(user.id));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load favorites.' });
  }
});

app.post('/api/favorites/:petId', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json(await toggleFavorite(user.id, req.params.petId));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update favorite.' });
  }
});

app.get('/api/profile', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json(await getProfile(user.id));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load profile.' });
  }
});

app.put('/api/profile', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json(await updateProfile(user.id, req.body ?? {}));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update profile.' });
  }
});

app.get('/api/applications', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json(await listApplications(user.id));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load applications.' });
  }
});

app.post('/api/applications', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    res.status(201).json(await createApplication(user.id, req.body));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to submit application.' });
  }
});

ensureSeedData()
  .then(() => {
    app.listen(port, () => {
      console.log(`Shelter API listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to bootstrap Supabase data:', error);
    process.exit(1);
  });
