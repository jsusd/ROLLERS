import {
  CloudSyncConfig,
  Flavor,
  INITIAL_FLAVORS,
  KDSEventAction,
  KDSState,
  Order,
  OrderStatus,
} from '../types/kds';

const STORAGE_STATE_KEY = 'bull_market_kds_state_v2';
const STORAGE_FLAVORS_KEY = 'bull_market_kds_flavors_v2';
const CLOUD_CONFIG_KEY = 'bull_market_kds_cloud_config_v2';
const DEFAULT_ROOM_CODE = 'bull_market_kds_live_v1';
const CHANNEL_NAME = 'bull_market_kds_local_channel_v2';

export function getSavedFlavors(): Flavor[] {
  if (typeof window === 'undefined') return INITIAL_FLAVORS;
  try {
    const raw = localStorage.getItem(STORAGE_FLAVORS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingMap = new Map(parsed.map((f: Flavor) => [f.id, f]));
        const complete = INITIAL_FLAVORS.map((base) => {
          const saved = existingMap.get(base.id);
          if (!saved) return base;
          const cleanEmoji = saved.emoji && saved.emoji !== '??' ? saved.emoji : base.emoji;
          return {
            ...base,
            ...saved,
            name: base.name,
            emoji: cleanEmoji,
            imageKey: base.imageKey,
            imageUrl: base.imageUrl,
          };
        });

        parsed.forEach((custom: Flavor) => {
          if (!INITIAL_FLAVORS.some((b) => b.id === custom.id)) {
            complete.push(custom);
          }
        });

        return complete;
      }
    }
  } catch (e) {
    console.warn('Error leyendo sabores guardados:', e);
  }
  return INITIAL_FLAVORS;
}

export function saveFlavorsLocally(flavors: Flavor[]): void {
  try {
    localStorage.setItem(STORAGE_FLAVORS_KEY, JSON.stringify(flavors));
  } catch (e) {
    console.warn('Error guardando sabores en localStorage:', e);
  }
}

export function createInitialDemoOrders(flavors: Flavor[] = INITIAL_FLAVORS): Order[] {
  const now = Date.now();
  const getF = (code: string) => flavors.find((f) => f.shortCode === code) || flavors[0];

  const f1 = getF('AVE');
  const f2 = getF('TIR');
  const f3 = getF('DDL');
  const f4 = getF('OVO');
  const f5 = getF('LIM');
  const f6 = getF('PIS');

  return [
    {
      id: 'ord-demo-1',
      ticketNumber: '#001',
      customerOrTable: 'Mesa 4 - Terraza',
      orderType: 'comer_aqui',
      note: 'Bien caliente',
      status: 'preparando',
      createdAt: now - 4 * 60 * 1000 - 15 * 1000,
      startedAt: now - 2 * 60 * 1000,
      items: [
        {
          flavorId: f1.id,
          flavorName: f1.name,
          color: f1.color,
          emoji: f1.emoji,
          imageKey: f1.imageKey,
          imageUrl: f1.imageUrl,
          quantity: 2,
          checked: true,
        },
        {
          flavorId: f2.id,
          flavorName: f2.name,
          color: f2.color,
          emoji: f2.emoji,
          imageKey: f2.imageKey,
          imageUrl: f2.imageUrl,
          quantity: 2,
          checked: false,
        },
      ],
    },
    {
      id: 'ord-demo-2',
      ticketNumber: '#002',
      customerOrTable: 'Carlos M.',
      orderType: 'para_llevar',
      note: 'Empaque separado',
      status: 'pendiente',
      createdAt: now - 1 * 60 * 1000 - 25 * 1000,
      items: [
        {
          flavorId: f3.id,
          flavorName: f3.name,
          color: f3.color,
          emoji: f3.emoji,
          imageKey: f3.imageKey,
          imageUrl: f3.imageUrl,
          quantity: 3,
          checked: false,
        },
        {
          flavorId: f4.id,
          flavorName: f4.name,
          color: f4.color,
          emoji: f4.emoji,
          imageKey: f4.imageKey,
          imageUrl: f4.imageUrl,
          quantity: 1,
          checked: false,
        },
        {
          flavorId: f5.id,
          flavorName: f5.name,
          color: f5.color,
          emoji: f5.emoji,
          imageKey: f5.imageKey,
          imageUrl: f5.imageUrl,
          quantity: 2,
          checked: false,
        },
      ],
    },
    {
      id: 'ord-demo-3',
      ticketNumber: '#003',
      customerOrTable: 'Barra Express',
      orderType: 'comer_aqui',
      note: '',
      status: 'pendiente',
      createdAt: now - 35 * 1000,
      items: [
        {
          flavorId: f6.id,
          flavorName: f6.name,
          color: f6.color,
          emoji: f6.emoji,
          imageKey: f6.imageKey,
          imageUrl: f6.imageUrl,
          quantity: 2,
          checked: false,
        },
      ],
    },
  ];
}

export function getInitialState(): KDSState {
  const currentFlavors = getSavedFlavors();
  const defaultRoom = getCloudConfig().roomCode || DEFAULT_ROOM_CODE;

  if (typeof window === 'undefined') {
    return {
      flavors: currentFlavors,
      orders: [],
      nextTicketSeq: 1,
      lastUpdated: Date.now(),
      roomCode: defaultRoom,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as KDSState;
      if (parsed && Array.isArray(parsed.orders)) {
        return {
          ...parsed,
          // Sabores persistentes garantizados (nunca se borran)
          flavors:
            parsed.flavors && parsed.flavors.length > 0 ? parsed.flavors : currentFlavors,
          roomCode: parsed.roomCode || defaultRoom,
        };
      }
    }
  } catch (err) {
    console.warn('Error leyendo estado inicial:', err);
  }

  const initial: KDSState = {
    flavors: currentFlavors,
    orders: createInitialDemoOrders(currentFlavors),
    nextTicketSeq: 4,
    lastUpdated: Date.now(),
    roomCode: defaultRoom,
  };

  try {
    localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(initial));
    saveFlavorsLocally(currentFlavors);
  } catch {}

  return initial;
}

export function getCloudConfig(): CloudSyncConfig {
  try {
    const raw = localStorage.getItem(CLOUD_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw) as CloudSyncConfig;
    }
  } catch {}
  return {
    mode: 'cloud_auto',
    roomCode: DEFAULT_ROOM_CODE,
  };
}

export function saveCloudConfig(config: CloudSyncConfig): void {
  try {
    localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
  } catch {}
}

type StateListener = (
  state: KDSState,
  meta?: { isNewOrder?: boolean; newOrderTicket?: string; sourceDevice?: string }
) => void;

export class RealtimeSyncEngine {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<StateListener> = new Set();
  private sseSource: EventSource | null = null;
  private deviceId: string = 'dev_' + Math.random().toString(36).substring(2, 9);
  private currentState: KDSState;

  constructor() {
    this.currentState = getInitialState();

    if (typeof window !== 'undefined') {
      if ('BroadcastChannel' in window) {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type === 'KDS_STATE_UPDATE') {
            if (event.data.deviceId === this.deviceId) return;
            this.handleIncomingState(event.data.state, event.data.meta);
          }
        };
      }

      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_STATE_KEY && e.newValue) {
          try {
            const newState = JSON.parse(e.newValue) as KDSState;
            this.handleIncomingState(newState);
          } catch {}
        }
      });

      this.initCloudCentralizedSync();
    }
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(state: KDSState, meta?: { isNewOrder?: boolean; newOrderTicket?: string }) {
    this.currentState = state;
    this.listeners.forEach((fn) => fn(state, meta));
  }

  public getState(): KDSState {
    return this.currentState;
  }

  private handleIncomingState(
    incoming: KDSState,
    meta?: { isNewOrder?: boolean; newOrderTicket?: string }
  ) {
    if (!incoming || !incoming.lastUpdated) return;
    if (incoming.lastUpdated <= this.currentState.lastUpdated) return;

    // Rehidratar y unir sabores de forma segura
    let currentBase =
      Array.isArray(this.currentState.flavors) && this.currentState.flavors.length >= INITIAL_FLAVORS.length
        ? [...this.currentState.flavors]
        : INITIAL_FLAVORS.map((b) => ({ ...b }));

    if (incoming.flavors && incoming.flavors.length > 0) {
      incoming.flavors.forEach((incFlv) => {
        const idx = currentBase.findIndex((f) => f.id === incFlv.id);
        const baseRef = INITIAL_FLAVORS.find((b) => b.id === incFlv.id) || {};
        const cleanEmoji = incFlv.emoji && incFlv.emoji !== '??' ? incFlv.emoji : baseRef.emoji || '🥐';

        if (idx >= 0) {
          currentBase[idx] = {
            ...baseRef,
            ...currentBase[idx],
            ...incFlv,
            name: baseRef.name || currentBase[idx].name || incFlv.name,
            emoji: cleanEmoji,
            imageKey: baseRef.imageKey || currentBase[idx].imageKey || incFlv.imageKey || '',
            imageUrl: currentBase[idx].imageUrl || baseRef.imageUrl || '',
          };
        } else {
          currentBase.push({
            ...baseRef,
            ...incFlv,
            emoji: cleanEmoji,
            imageKey: baseRef.imageKey || incFlv.imageKey || '',
            imageUrl: baseRef.imageUrl || '',
          });
        }
      });
    }

    const mergedFlavors = currentBase;
    saveFlavorsLocally(mergedFlavors);

    const hydratedState: KDSState = {
      ...incoming,
      flavors: mergedFlavors,
    };

    try {
      localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(hydratedState));
    } catch {}

    const isNew =
      meta?.isNewOrder ||
      (incoming.orders && incoming.orders.length > this.currentState.orders.length);

    this.notify(hydratedState, { isNewOrder: isNew, newOrderTicket: meta?.newOrderTicket });
  }

  public publishState(
    nextState: KDSState,
    meta?: { isNewOrder?: boolean; newOrderTicket?: string }
  ): void {
    const stamped: KDSState = {
      ...nextState,
      lastUpdated: Date.now(),
    };

    this.currentState = stamped;

    // Guardar siempre sabores y estado por separado para evitar pérdidas al reiniciar el día
    if (stamped.flavors && stamped.flavors.length > 0) {
      saveFlavorsLocally(stamped.flavors);
    }

    try {
      localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(stamped));
    } catch {}

    if (this.channel) {
      this.channel.postMessage({
        type: 'KDS_STATE_UPDATE',
        state: stamped,
        meta,
        deviceId: this.deviceId,
      });
    }

    this.notify(stamped, meta);
    this.broadcastToCloud(stamped, meta);
  }

  public initCloudCentralizedSync(): void {
    if (this.sseSource) {
      this.sseSource.close();
      this.sseSource = null;
    }

    const cfg = getCloudConfig();
    const room = cfg.roomCode || DEFAULT_ROOM_CODE;

    // 1. Conexión en tiempo real instantánea entre todos los dispositivos (vía SSE global)
    try {
      const topicUrl = `https://ntfy.sh/${encodeURIComponent(room)}/sse`;
      const es = new EventSource(topicUrl);

      es.onmessage = async (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (!payload) return;

          // Manejar si ntfy.sh convirtió el mensaje en un archivo adjunto
          if (payload.attachment && payload.attachment.url) {
            try {
              const attRes = await fetch(payload.attachment.url);
              if (attRes.ok) {
                const parsed = await attRes.json();
                if (parsed && parsed.deviceId !== this.deviceId && parsed.state) {
                  this.handleIncomingState(parsed.state, parsed.meta);
                }
              }
            } catch {}
            return;
          }

          if (payload.message && typeof payload.message === 'string' && payload.message.startsWith('{')) {
            const parsed = JSON.parse(payload.message);
            if (parsed && parsed.deviceId !== this.deviceId && parsed.state) {
              this.handleIncomingState(parsed.state, parsed.meta);
            }
          }
        } catch {}
      };

      es.onerror = () => {
        // Reconexión automática nativa de EventSource
      };

      this.sseSource = es;
    } catch (e) {
      console.warn('Error conectando SSE Central:', e);
    }

    // 2. Traer el estado más reciente guardado en la nube al abrir la app en un nuevo dispositivo
    this.fetchRecentCloudState(room);

    // 3. Polling de respaldo cada 4 segundos
    setInterval(() => {
      this.fetchRecentCloudState(room);
    }, 4000);
  }

  private async fetchRecentCloudState(room: string) {
    try {
      const res = await fetch(
        `https://ntfy.sh/${encodeURIComponent(room)}/json?poll=1&since=12h`
      );
      if (!res.ok) return;
      const text = await res.text();
      const lines = text.trim().split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const item = JSON.parse(lines[i]);
          if (!item) continue;

          if (item.attachment && item.attachment.url) {
            try {
              const attRes = await fetch(item.attachment.url);
              if (attRes.ok) {
                const parsed = await attRes.json();
                if (parsed && parsed.state && parsed.state.lastUpdated > this.currentState.lastUpdated) {
                  this.handleIncomingState(parsed.state, parsed.meta);
                  break;
                }
              }
            } catch {}
            continue;
          }

          if (item.message && typeof item.message === 'string' && item.message.startsWith('{')) {
            const parsed = JSON.parse(item.message);
            if (parsed && parsed.state && parsed.state.lastUpdated) {
              if (parsed.state.lastUpdated > this.currentState.lastUpdated) {
                this.handleIncomingState(parsed.state, parsed.meta);
                break;
              }
            }
          }
        } catch {}
      }
    } catch {}
  }

  private async broadcastToCloud(
    state: KDSState,
    meta?: { isNewOrder?: boolean; newOrderTicket?: string }
  ) {
    const cfg = getCloudConfig();
    const room = cfg.roomCode || DEFAULT_ROOM_CODE;

    try {
      const completeFlavors =
        Array.isArray(state.flavors) && state.flavors.length >= INITIAL_FLAVORS.length
          ? state.flavors
          : getSavedFlavors();

      const leanFlavors = completeFlavors.map((f) => {
        const base = INITIAL_FLAVORS.find((b) => b.id === f.id);
        return {
          id: f.id,
          name: base?.name || f.name,
          shortCode: f.shortCode,
          color: f.color,
          available: f.available,
          emoji: f.emoji && f.emoji !== '??' ? f.emoji : base?.emoji || '🥐',
          imageKey: f.imageKey || base?.imageKey || '',
        };
      });

      const activeOrders = (state.orders || []).filter((o) => o.status !== 'despachado');
      const recentDispatched = (state.orders || []).filter((o) => o.status === 'despachado').slice(-15);
      const leanOrders = [...activeOrders, ...recentDispatched].map((o) => ({
        id: o.id,
        ticketNumber: o.ticketNumber,
        customerOrTable: o.customerOrTable,
        orderType: o.orderType,
        note: o.note,
        status: o.status,
        createdAt: o.createdAt,
        startedAt: o.startedAt,
        dispatchedAt: o.dispatchedAt,
        items: (o.items || []).map((it) => ({
          flavorId: it.flavorId,
          flavorName: it.flavorName,
          quantity: it.quantity,
          checked: it.checked,
          color: it.color,
        })),
      }));

      const leanState = {
        roomCode: state.roomCode,
        lastUpdated: state.lastUpdated,
        nextTicketSeq: state.nextTicketSeq,
        flavors: leanFlavors,
        orders: leanOrders,
      };

      const payload = JSON.stringify({
        deviceId: this.deviceId,
        state: leanState,
        meta,
      });

      await fetch(`https://ntfy.sh/${encodeURIComponent(room)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
    } catch (err) {
      console.warn('Error transmitiendo a la nube centralizada:', err);
    }
  }

  public setRoomCode(newRoomCode: string): void {
    const clean = newRoomCode.trim() || DEFAULT_ROOM_CODE;
    const cfg = getCloudConfig();
    cfg.roomCode = clean;
    saveCloudConfig(cfg);

    const nextState = {
      ...this.currentState,
      roomCode: clean,
      lastUpdated: Date.now(),
    };
    this.publishState(nextState);
    this.initCloudCentralizedSync();
  }
}

export const syncEngine = new RealtimeSyncEngine();
