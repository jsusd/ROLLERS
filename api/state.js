// Vercel Serverless Function: Sincronización Centralizada Multi-Dispositivo (Bull Market POS & KDS)
if (!globalThis.__BULL_MARKET_KDS_ROOMS__) {
  globalThis.__BULL_MARKET_KDS_ROOMS__ = new Map();
}

const statusWeight = { pendiente: 1, preparando: 2, despachado: 3 };

function normalizeRoom(raw) {
  if (!raw || typeof raw !== 'string') return 'BULL_MARKET_LIVE';
  const clean = raw.trim().toUpperCase();
  if (
    !clean ||
    clean === 'BULL_MARKET_KDS_LIVE_V1' ||
    clean === 'BULL_MARKET_KDS_LIVE_V2' ||
    clean === 'BULL_MARKET_KDS_LIVE_V3'
  ) {
    return 'BULL_MARKET_LIVE';
  }
  return clean;
}

function mergeOrdersList(localOrders = [], incomingOrders = []) {
  const orderMap = new Map();

  localOrders.forEach((o) => {
    if (o && o.id) orderMap.set(o.id, { ...o });
  });

  incomingOrders.forEach((inc) => {
    if (!inc || !inc.id) return;
    const loc = orderMap.get(inc.id);
    if (!loc) {
      orderMap.set(inc.id, { ...inc });
    } else {
      const incMod = inc.modCount || 1;
      const locMod = loc.modCount || 1;

      if (incMod > locMod) {
        orderMap.set(inc.id, {
          ...loc,
          ...inc,
          startedAt: inc.startedAt || loc.startedAt,
          dispatchedAt: inc.dispatchedAt || loc.dispatchedAt,
          delivered: Boolean(inc.delivered ?? loc.delivered),
        });
      } else if (locMod > incMod) {
        orderMap.set(inc.id, {
          ...inc,
          ...loc,
          startedAt: loc.startedAt || inc.startedAt,
          dispatchedAt: loc.dispatchedAt || inc.dispatchedAt,
          delivered: Boolean(loc.delivered ?? inc.delivered),
        });
      } else {
        const incW = statusWeight[inc.status] || 0;
        const locW = statusWeight[loc.status] || 0;
        const chosenStatus = incW >= locW ? inc.status : loc.status;

        const mergedItems = (loc.items || inc.items || []).map((it, idx) => {
          const incIt = inc.items && inc.items[idx];
          return {
            ...it,
            ...(incIt || {}),
            checked: Boolean(it.checked || (incIt && incIt.checked)),
          };
        });

        orderMap.set(inc.id, {
          ...loc,
          ...inc,
          status: chosenStatus,
          items: mergedItems,
          startedAt: loc.startedAt || inc.startedAt,
          dispatchedAt: loc.dispatchedAt || inc.dispatchedAt,
          delivered: Boolean(loc.delivered || inc.delivered),
        });
      }
    }
  });

  return Array.from(orderMap.values()).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

function mergeStates(current, incoming) {
  if (!current) {
    return {
      ...incoming,
      epoch: incoming.epoch || 1,
      version: (incoming.version || 1) + 1,
      serverUpdatedAt: Date.now(),
    };
  }
  if (!incoming) return current;

  const curEpoch = current.epoch || 1;
  const incEpoch = incoming.epoch || 1;

  let mergedOrders = [];
  let effectiveEpoch = Math.max(curEpoch, incEpoch);

  if (incEpoch > curEpoch) {
    // El dispositivo entrante inició un nuevo día / limpió comandas
    mergedOrders = Array.isArray(incoming.orders) ? [...incoming.orders] : [];
  } else if (curEpoch > incEpoch) {
    // El servidor ya está en una época más reciente
    mergedOrders = Array.isArray(current.orders) ? [...current.orders] : [];
  } else {
    mergedOrders = mergeOrdersList(current.orders || [], incoming.orders || []);
  }

  // Mezclar sabores respetando modCount para cambios de Agotado (86)
  const flavorMap = new Map();
  (current.flavors || []).forEach((f) => {
    if (f && f.id) flavorMap.set(f.id, f);
  });
  (incoming.flavors || []).forEach((incF) => {
    if (!incF || !incF.id) return;
    const locF = flavorMap.get(incF.id);
    if (!locF) {
      flavorMap.set(incF.id, incF);
    } else {
      const incMod = incF.modCount || 1;
      const locMod = locF.modCount || 1;
      if (incMod >= locMod) {
        flavorMap.set(incF.id, { ...locF, ...incF });
      }
    }
  });
  const mergedFlavors = Array.from(flavorMap.values());

  // Mezclar avisos de Panadería a Barra respetando modCount (para edición de cantidad de tanda en vivo)
  const annMap = new Map();
  (current.announcements || []).forEach((a) => {
    if (a && a.id) {
      annMap.set(a.id, a);
    }
  });
  (incoming.announcements || []).forEach((incA) => {
    if (!incA || !incA.id) return;
    const locA = annMap.get(incA.id);
    if (!locA || (incA.modCount || 1) >= (locA.modCount || 1)) {
      annMap.set(incA.id, { ...(locA || {}), ...incA });
    }
  });
  const mergedAnnouncements = Array.from(annMap.values())
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 15);

  const nextTicketSeq =
    incEpoch > curEpoch
      ? incoming.nextTicketSeq || mergedOrders.length + 1
      : Math.max(
          current.nextTicketSeq || 1,
          incoming.nextTicketSeq || 1,
          mergedOrders.length + 1
        );

  return {
    epoch: effectiveEpoch,
    version: Math.max(current.version || 0, incoming.version || 0) + 1,
    roomCode: normalizeRoom(incoming.roomCode || current.roomCode),
    lastUpdated: Date.now(),
    serverUpdatedAt: Date.now(),
    nextTicketSeq,
    flavors: mergedFlavors,
    orders: mergedOrders,
    announcements: mergedAnnouncements,
  };
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rooms = globalThis.__BULL_MARKET_KDS_ROOMS__;
  const queryRoom = normalizeRoom(req.query && req.query.room);

  if (req.method === 'GET') {
    const entry = rooms.get(queryRoom) || null;
    return res.status(200).json({
      ok: true,
      room: queryRoom,
      ...(entry || { state: null }),
    });
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const incomingState = body.state;
      const deviceId = body.deviceId || 'unknown';
      const meta = body.meta || {};
      const room = normalizeRoom((incomingState && incomingState.roomCode) || queryRoom);

      if (!incomingState) {
        return res.status(400).json({ ok: false, error: 'Missing state' });
      }

      const existing = rooms.get(room);
      const merged = mergeStates(existing ? existing.state : null, incomingState);

      const record = {
        state: merged,
        meta,
        deviceId,
        updatedAt: Date.now(),
      };
      rooms.set(room, record);

      return res.status(200).json({
        ok: true,
        room,
        ...record,
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: String(err) });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
