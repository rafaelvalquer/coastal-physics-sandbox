import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const saveDir = path.join(root, 'saves');
const distDir = path.join(root, 'dist');
const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(express.json({ limit: '15mb' }));

const cleanSlot = (slot) => String(slot || 'slot-1').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48) || 'slot-1';

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

app.post('/api/save/:slot', async (req, res) => {
  const slot = cleanSlot(req.params.slot);
  await fs.mkdir(saveDir, { recursive: true });
  const payload = {
    savedAt: new Date().toISOString(),
    version: 1,
    state: req.body
  };
  await fs.writeFile(path.join(saveDir, `${slot}.json`), JSON.stringify(payload));
  res.json({ ok: true, slot, savedAt: payload.savedAt });
});

app.get('/api/save/:slot', async (req, res) => {
  const slot = cleanSlot(req.params.slot);
  try {
    const data = await fs.readFile(path.join(saveDir, `${slot}.json`), 'utf8');
    res.type('json').send(data);
  } catch (error) {
    if (error?.code === 'ENOENT') return res.status(404).json({ ok: false, error: 'Save não encontrado.' });
    throw error;
  }
});

app.delete('/api/save/:slot', async (req, res) => {
  const slot = cleanSlot(req.params.slot);
  try {
    await fs.unlink(path.join(saveDir, `${slot}.json`));
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  res.json({ ok: true, slot });
});

try {
  await fs.access(distDir);
  app.use(express.static(distDir));
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
} catch {
  // Durante `npm run dev`, o Vite serve o frontend.
}

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ ok: false, error: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`Physics sandbox server: http://localhost:${PORT}`);
});
