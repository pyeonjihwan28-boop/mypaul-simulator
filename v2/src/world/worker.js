// 메셔 워커 — 세계 복사본을 들고 청크 메시를 만들어 보낸다.
import { meshChunk } from './mesher.js';

let world = null, shape = null, dims = null, table = null, atlas = null;

self.onmessage = (ev) => {
  const m = ev.data;
  switch (m.type) {
    case 'init':
      world = m.world; shape = m.shape; dims = m.dims; table = m.table; atlas = m.atlas;
      self.postMessage({ type: 'ready' });
      break;
    case 'set': { // [x,y,z,id,shape,...]
      const u = m.updates; const { SY, SZ } = dims;
      for (let i = 0; i < u.length; i += 5) { const j = (u[i] * SZ + u[i + 2]) * SY + u[i + 1]; world[j] = u[i + 3]; shape[j] = u[i + 4]; }
      break;
    }
    case 'mesh': {
      for (const [cx, cz] of m.chunks) {
        const g = meshChunk(world, shape, dims, table, atlas, cx, cz);
        const transfer = [];
        for (const k of ['opaque', 'cutout', 'glass']) if (g[k]) for (const b of ['pos', 'nrm', 'uv', 'col', 'idx']) transfer.push(g[k][b].buffer);
        self.postMessage({ type: 'chunk', cx, cz, gen: m.gen, geo: g }, transfer);
      }
      break;
    }
  }
};
