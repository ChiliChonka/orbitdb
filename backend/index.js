const express = require('express');
const { create } = require('ipfs-http-client');
const { OrbitDB } = require('@orbitdb/core');

const IPFS_API = process.env.IPFS_API || 'http://ipfs:5001';

(async () => {
  const ipfs = create({ url: IPFS_API });
  const orbitdb = await OrbitDB.createInstance(ipfs);
  const db = await orbitdb.feed('chat', { accessController: { write: ['*'] }});
  await db.load();

  const app = express();
  app.use(express.json());

  app.get('/address', (_req, res) => res.json({ address: db.address.toString() }));
  app.get('/messages', (_req, res) => res.json(db.iterator({ limit: -1 }).collect().map(e => e.payload.value)));
  app.post('/messages', async (req, res) => {
    const { text } = req.body;
    await db.add({ text, ts: Date.now() });
    res.json({ ok: true });
  });

  app.listen(3000, () => console.log('backend running'));
})();
