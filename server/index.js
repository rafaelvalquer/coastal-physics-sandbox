import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const saveDir = path.join(root, 'saves');
const distDir = path.join(root, 'dist');
export const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(express.json({ limit: '25mb' }));

const cleanSlot = (slot) =>
  String(slot || 'slot-1').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48) || 'slot-1';

async function writeSave(id, state) {
  const slot = cleanSlot(id);
  await fs.mkdir(saveDir, { recursive: true });
  const payload = {
    id: slot,
    savedAt: new Date().toISOString(),
    saveVersion: Number(state?.saveVersion || state?.gameplay?.saveVersion || 1),
    state
  };
  await fs.writeFile(path.join(saveDir, slot + '.json'), JSON.stringify(payload));
  return payload;
}

async function readSave(id) {
  const slot = cleanSlot(id);
  const data = await fs.readFile(path.join(saveDir, slot + '.json'), 'utf8');
  return JSON.parse(data);
}

async function removeSave(id) {
  const slot = cleanSlot(id);
  try {
    await fs.unlink(path.join(saveDir, slot + '.json'));
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return slot;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'coastal-physics-sandbox', time: new Date().toISOString() });
});

app.get('/api/presets', (_req, res) => {
  res.json([
    { id: 'calm', name: 'Mar calmo', wind: 3, gustiness: 0.15, rain: 0, tide: 0 },
    { id: 'trade-wind', name: 'Vento costeiro', wind: 12, gustiness: 0.35, rain: 4, tide: 0.25 },
    { id: 'storm', name: 'Tempestade', wind: 24, gustiness: 0.78, rain: 65, tide: 0.9 },
    { id: 'erosion-lab', name: 'Laboratório de erosão', wind: 16, gustiness: 0.42, rain: 18, tide: 0.45 }
  ]);
});

app.get('/api/saves', async (_req, res) => {
  await fs.mkdir(saveDir, { recursive: true });
  const names = (await fs.readdir(saveDir)).filter((name) => name.endsWith('.json'));
  const saves = [];
  for (const name of names) {
    try {
      const payload = JSON.parse(await fs.readFile(path.join(saveDir, name), 'utf8'));
      saves.push({
        id: payload.id || name.replace(/\.json$/, ''),
        savedAt: payload.savedAt,
        saveVersion: payload.saveVersion || payload.version || 1,
        scenarioId: payload.state?.gameplay?.scenarioId || null
      });
    } catch {
      // Ignora save corrompido na listagem; a leitura direta ainda retorna erro.
    }
  }
  saves.sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));
  res.json(saves);
});

app.post('/api/saves', async (req, res) => {
  const id = cleanSlot(req.body?.id || 'slot-1');
  const state = req.body?.state ?? req.body;
  const payload = await writeSave(id, state);
  res.status(201).json({
    ok: true,
    id: payload.id,
    savedAt: payload.savedAt,
    saveVersion: payload.saveVersion
  });
});

app.get('/api/saves/:id', async (req, res) => {
  try {
    res.json(await readSave(req.params.id));
  } catch (error) {
    if (error?.code === 'ENOENT') return res.status(404).json({ ok: false, error: 'Save não encontrado.' });
    throw error;
  }
});

app.delete('/api/saves/:id', async (req, res) => {
  const id = await removeSave(req.params.id);
  res.json({ ok: true, id });
});

// Compatibilidade com a interface anterior.
app.post('/api/save/:slot', async (req, res) => {
  const payload = await writeSave(req.params.slot, req.body);
  res.json({ ok: true, slot: payload.id, savedAt: payload.savedAt });
});

app.get('/api/save/:slot', async (req, res) => {
  try {
    res.json(await readSave(req.params.slot));
  } catch (error) {
    if (error?.code === 'ENOENT') return res.status(404).json({ ok: false, error: 'Save não encontrado.' });
    throw error;
  }
});

app.delete('/api/save/:slot', async (req, res) => {
  const slot = await removeSave(req.params.slot);
  res.json({ ok: true, slot });
});

try {
  await fs.access(distDir);
  app.use(express.static(distDir));
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
} catch {
  // Durante npm run dev, o Vite serve o frontend.
}

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ ok: false, error: 'Erro interno do servidor.' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log('Coastal Physics server: http://localhost:' + PORT);
  });
}
