export type OrderStatus = 'pendiente' | 'preparando' | 'despachado';

export type OrderType = 'comer_aqui' | 'para_llevar';

export type FlavorColorKey =
  | 'amber'
  | 'rose'
  | 'emerald'
  | 'violet'
  | 'sky'
  | 'orange'
  | 'fuchsia'
  | 'lime';

export interface Flavor {
  id: string;
  name: string;
  shortCode: string;
  color: FlavorColorKey;
  available: boolean; // false = Agotado (86)
  emoji: string;
  imageUrl?: string;
  imageKey?: string;
  dateRange?: string; // Ej. "23/10 AL 01/11", "23/10 AL 25/10", "26/10 AL 29/10", "30/10 AL 01/11"
}

export interface OrderItem {
  flavorId: string;
  flavorName: string;
  color: FlavorColorKey;
  emoji: string;
  imageUrl?: string;
  imageKey?: string;
  quantity: number;
  checked: boolean;
}

export interface Order {
  id: string;
  ticketNumber: string;
  customerOrTable: string;
  orderType: OrderType;
  note: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: number;
  startedAt?: number;
  dispatchedAt?: number;
}

export interface CloudSyncConfig {
  mode: 'cloud_auto' | 'local_only' | 'custom_room' | 'firebase';
  roomCode: string; // Código de sala centralizado compartido entre dispositivos (ej. "bull_market_live")
  firebaseDatabaseUrl?: string;
  connectedDevicesCount?: number;
  lastSyncTimestamp?: number;
}

export interface KDSState {
  flavors: Flavor[];
  orders: Order[];
  nextTicketSeq: number;
  lastUpdated: number;
  roomCode: string;
}

export type KDSEventAction =
  | { type: 'NEW_ORDER'; order: Order }
  | { type: 'UPDATE_STATUS'; orderId: string; nextStatus: OrderStatus; timestamp: number }
  | { type: 'TOGGLE_ITEM_CHECK'; orderId: string; flavorId: string }
  | { type: 'TOGGLE_86'; flavorId: string; available: boolean }
  | { type: 'UPDATE_FLAVORS'; flavors: Flavor[] }
  | { type: 'CLEAR_ORDERS' }
  | { type: 'SYNC_SNAPSHOT'; state: KDSState }
  | { type: 'REQUEST_SYNC' };

export const COLOR_PALETTE: Record<
  FlavorColorKey,
  {
    label: string;
    bgBtn: string;
    border: string;
    badgeBg: string;
    textAccent: string;
    glow: string;
    hex: string;
  }
> = {
  amber: {
    label: 'Avellana / Chocolate',
    bgBtn: 'bg-amber-500/15 hover:bg-amber-500/25 active:bg-amber-500/35',
    border: 'border-amber-500',
    badgeBg: 'bg-amber-500 text-slate-950',
    textAccent: 'text-amber-300',
    glow: 'shadow-amber-500/20',
    hex: '#f59e0b',
  },
  orange: {
    label: 'Dulce de Leche / Tiramisú',
    bgBtn: 'bg-orange-500/15 hover:bg-orange-500/25 active:bg-orange-500/35',
    border: 'border-orange-500',
    badgeBg: 'bg-orange-500 text-slate-950',
    textAccent: 'text-orange-300',
    glow: 'shadow-orange-500/20',
    hex: '#f97316',
  },
  lime: {
    label: 'Pie de Limón',
    bgBtn: 'bg-lime-500/15 hover:bg-lime-500/25 active:bg-lime-500/35',
    border: 'border-lime-500',
    badgeBg: 'bg-lime-400 text-slate-950',
    textAccent: 'text-lime-300',
    glow: 'shadow-lime-500/20',
    hex: '#84cc16',
  },
  rose: {
    label: 'Frutos Rojos',
    bgBtn: 'bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/35',
    border: 'border-rose-500',
    badgeBg: 'bg-rose-500 text-white',
    textAccent: 'text-rose-300',
    glow: 'shadow-rose-500/20',
    hex: '#f43f5e',
  },
  emerald: {
    label: 'Pistacho',
    bgBtn: 'bg-emerald-500/15 hover:bg-emerald-500/25 active:bg-emerald-500/35',
    border: 'border-emerald-500',
    badgeBg: 'bg-emerald-500 text-slate-950',
    textAccent: 'text-emerald-300',
    glow: 'shadow-emerald-500/20',
    hex: '#10b981',
  },
  violet: {
    label: 'Ovomaltina / Samba',
    bgBtn: 'bg-violet-500/15 hover:bg-violet-500/25 active:bg-violet-500/35',
    border: 'border-violet-500',
    badgeBg: 'bg-violet-500 text-white',
    textAccent: 'text-violet-300',
    glow: 'shadow-violet-500/20',
    hex: '#8b5cf6',
  },
  sky: {
    label: 'Oreo / Cinnamon',
    bgBtn: 'bg-sky-500/15 hover:bg-sky-500/25 active:bg-sky-500/35',
    border: 'border-sky-500',
    badgeBg: 'bg-sky-400 text-slate-950',
    textAccent: 'text-sky-300',
    glow: 'shadow-sky-500/20',
    hex: '#0ea5e9',
  },
  fuchsia: {
    label: 'Especial Bull',
    bgBtn: 'bg-fuchsia-500/15 hover:bg-fuchsia-500/25 active:bg-fuchsia-500/35',
    border: 'border-fuchsia-500',
    badgeBg: 'bg-fuchsia-500 text-white',
    textAccent: 'text-fuchsia-300',
    glow: 'shadow-fuchsia-500/20',
    hex: '#d946ef',
  },
};

export const INITIAL_FLAVORS: Flavor[] = [
  {
    id: 'flv-avellanas',
    name: 'CREMA DE AVELLANAS',
    shortCode: 'AVE',
    color: 'amber',
    available: true,
    emoji: '🌰',
    imageKey: 'crema-avellanas',
    imageUrl: 'assets/rolls/crema-avellanas.png',
    dateRange: '23/10 AL 01/11',
  },
  {
    id: 'flv-tiramisu',
    name: 'TIRAMISÚ',
    shortCode: 'TIR',
    color: 'orange',
    available: true,
    emoji: '☕',
    imageKey: 'tiramisu',
    imageUrl: 'assets/rolls/tiramisu.png',
    dateRange: '23/10 AL 01/11',
  },
  {
    id: 'flv-ovomaltina',
    name: 'OVOMALTINA',
    shortCode: 'OVO',
    color: 'violet',
    available: true,
    emoji: '🍫',
    imageKey: 'ovomaltina',
    imageUrl: 'assets/rolls/ovomaltina.png',
    dateRange: '23/10 AL 01/11',
  },
  {
    id: 'flv-pie-limon',
    name: 'PIE DE LIMÓN',
    shortCode: 'LIM',
    color: 'lime',
    available: true,
    emoji: '🍋',
    imageKey: 'pie-limon',
    imageUrl: 'assets/rolls/pie-limon.png',
    dateRange: '23/10 AL 01/11',
  },
  {
    id: 'flv-frutos-rojos',
    name: 'FRUTOS ROJOS',
    shortCode: 'FRO',
    color: 'rose',
    available: true,
    emoji: '🍓',
    imageKey: 'frutos-rojos',
    imageUrl: 'assets/rolls/frutos-rojos.png',
    dateRange: '23/10 AL 01/11',
  },
  {
    id: 'flv-dulce-leche',
    name: 'DULCE DE LECHE',
    shortCode: 'DDL',
    color: 'amber',
    available: true,
    emoji: '🍯',
    imageKey: 'dulce-de-leche',
    imageUrl: 'assets/rolls/dulce-de-leche.png',
    dateRange: '23/10 AL 01/11',
  },
  {
    id: 'flv-cinnamon',
    name: 'CINNAMON',
    shortCode: 'CIN',
    color: 'sky',
    available: true,
    emoji: '🥐',
    imageKey: 'cinnamon',
    imageUrl: 'assets/rolls/cinnamon.png',
    dateRange: '23/10 AL 25/10',
  },
  {
    id: 'flv-samba',
    name: 'SAMBA',
    shortCode: 'SAM',
    color: 'fuchsia',
    available: true,
    emoji: '🍬',
    imageKey: 'samba',
    imageUrl: 'assets/rolls/samba.png',
    dateRange: '23/10 AL 25/10',
  },
  {
    id: 'flv-pistacho',
    name: 'PISTACHO',
    shortCode: 'PIS',
    color: 'emerald',
    available: true,
    emoji: '💚',
    imageKey: 'pistacho',
    imageUrl: 'assets/rolls/pistacho.png',
    dateRange: '26/10 AL 29/10',
  },
  {
    id: 'flv-oreo',
    name: 'OREO',
    shortCode: 'ORE',
    color: 'sky',
    available: true,
    emoji: '🍪',
    imageKey: 'oreo',
    imageUrl: 'assets/rolls/oreo.png',
    dateRange: '30/10 AL 01/11',
  },
];

export const QUICK_NOTES: string[] = [
  'Bien caliente',
  'Sin topping',
  'Cortado a la mitad',
  'Empaque separado',
  'Extra salsa',
  'Prioridad / VIP',
];
