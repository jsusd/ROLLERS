import React, { useState, useEffect, useRef } from 'react';
import {
  Flavor,
  INITIAL_FLAVORS,
  KDSState,
  Order,
  OrderItem,
  OrderStatus,
  OrderType,
} from './types/kds';
import {
  createInitialDemoOrders,
  getInitialState,
  syncEngine,
} from './services/syncEngine';
import { soundEngine } from './utils/soundEngine';
import { BarraView } from './components/BarraView';
import { PanaderiaView } from './components/PanaderiaView';
import { AdminView } from './components/AdminView';
import {
  Store,
  Flame,
  Settings,
  Volume2,
  VolumeX,
  BellRing,
  Columns,
  ExternalLink,
  Wifi,
  Share2,
} from 'lucide-react';

type ActiveRoute = '/barra' | '/panaderia' | '/admin' | '/dual';

export function App() {
  const [state, setState] = useState<KDSState>(() => getInitialState());
  const [route, setRoute] = useState<ActiveRoute>(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === '/panaderia' || hash === '/admin' || hash === '/dual') {
      return hash;
    }
    return '/barra';
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [incomingBanner, setIncomingBanner] = useState<string | null>(null);
  const prevOrderCountRef = useRef<number>(state.orders.length);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((newState, meta) => {
      const hadLessOrders = newState.orders.length > prevOrderCountRef.current;
      prevOrderCountRef.current = newState.orders.length;
      setState(newState);

      if (meta?.isNewOrder || hadLessOrders) {
        soundEngine.playNewOrderBell();
        const newest = newState.orders[newState.orders.length - 1];
        if (newest) {
          setIncomingBanner(
            `🔔 ¡NUEVA COMANDA ${newest.ticketNumber} (${newest.customerOrTable}) EN COLA DE PANADERÍA!`
          );
          window.setTimeout(() => setIncomingBanner(null), 4000);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const navigate = (nextRoute: ActiveRoute) => {
    soundEngine.playTapSound(500);
    setRoute(nextRoute);
    window.location.hash = nextRoute;
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.enabled = next;
    if (next) {
      soundEngine.playNewOrderBell();
    }
  };

  const handleCreateOrder = (orderData: {
    ticketNumber: string;
    customerOrTable: string;
    orderType: OrderType;
    note: string;
    items: OrderItem[];
  }) => {
    const newOrder: Order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ticketNumber: orderData.ticketNumber,
      customerOrTable: orderData.customerOrTable,
      orderType: orderData.orderType,
      note: orderData.note,
      items: orderData.items,
      status: 'pendiente',
      createdAt: Date.now(),
    };

    const nextState: KDSState = {
      ...state,
      orders: [...state.orders, newOrder],
      nextTicketSeq: state.nextTicketSeq + 1,
      lastUpdated: Date.now(),
    };

    prevOrderCountRef.current = nextState.orders.length;
    syncEngine.publishState(nextState, {
      isNewOrder: true,
      newOrderTicket: newOrder.ticketNumber,
    });

    if (route === '/panaderia' || route === '/dual') {
      soundEngine.playNewOrderBell();
    }
  };

  const handleUpdateOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    const now = Date.now();
    const updatedOrders = state.orders.map((ord) => {
      if (ord.id !== orderId) return ord;
      return {
        ...ord,
        status: nextStatus,
        startedAt:
          nextStatus === 'preparando' && !ord.startedAt ? now : ord.startedAt,
        dispatchedAt: nextStatus === 'despachado' ? now : ord.dispatchedAt,
      };
    });

    syncEngine.publishState({
      ...state,
      orders: updatedOrders,
      lastUpdated: now,
    });
  };

  const handleToggleOrderItemCheck = (orderId: string, flavorId: string) => {
    const updatedOrders = state.orders.map((ord) => {
      if (ord.id !== orderId) return ord;
      const nextItems = ord.items.map((item) =>
        item.flavorId === flavorId ? { ...item, checked: !item.checked } : item
      );
      return { ...ord, items: nextItems };
    });

    syncEngine.publishState({
      ...state,
      orders: updatedOrders,
      lastUpdated: Date.now(),
    });
  };

  const handleToggleFlavorAvailability = (flavorId: string) => {
    const updatedFlavors = state.flavors.map((f) =>
      f.id === flavorId ? { ...f, available: !f.available } : f
    );
    syncEngine.publishState({
      ...state,
      flavors: updatedFlavors,
      lastUpdated: Date.now(),
    });
  };

  const handleSaveFlavors = (nextFlavors: Flavor[]) => {
    syncEngine.publishState({
      ...state,
      flavors: nextFlavors,
      lastUpdated: Date.now(),
    });
  };

  // 1. REINICIAR DÍA / LIMPIAR COMANDAS: CONSERVA SIEMPRE TODOS LOS SABORES CREADOS
  const handleClearAllOrders = () => {
    soundEngine.playTapSound(350);
    prevOrderCountRef.current = 0;
    syncEngine.publishState({
      ...state,
      // CONSERVA TODOS LOS SABORES
      orders: [],
      nextTicketSeq: 1,
      lastUpdated: Date.now(),
    });
  };

  // 2. CARGAR DEMO: CONSERVA LOS SABORES ACTUALES (NO LOS BORRA)
  const handleResetDemoData = () => {
    soundEngine.playNewOrderBell();
    const currentFlavors = state.flavors && state.flavors.length > 0 ? state.flavors : INITIAL_FLAVORS;
    const demoOrders = createInitialDemoOrders(currentFlavors);
    prevOrderCountRef.current = demoOrders.length;
    syncEngine.publishState({
      ...state,
      flavors: currentFlavors, // Conserva los sabores creados por el usuario
      orders: demoOrders,
      nextTicketSeq: demoOrders.length + 1,
      lastUpdated: Date.now(),
    });
  };

  // 3. RESTABLECER VALORES DE FÁBRICA (SOLO SI EL USUARIO LO PIDE EXPLÍCITAMENTE)
  const handleRestoreFactoryFlavors = () => {
    soundEngine.play86Alert();
    syncEngine.publishState({
      ...state,
      flavors: INITIAL_FLAVORS,
      lastUpdated: Date.now(),
    });
  };

  const activeOrderCount = state.orders.filter(
    (o) => o.status === 'pendiente' || o.status === 'preparando'
  ).length;

  const totalPendingUnits = state.orders
    .filter((o) => o.status === 'pendiente' || o.status === 'preparando')
    .reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* BARRA DE NAVEGACIÓN SUPERIOR */}
      <header className="sticky top-0 z-40 h-[64px] bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 md:px-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-md shadow-amber-500/20">
            🐂
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base md:text-lg tracking-tight text-white">
                BULL MARKET
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Wifi className="w-3 h-3 animate-pulse" /> MULTI-DISPOSITIVO EN VIVO
              </span>
            </div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-400/90 -mt-0.5">
              Sala: {state.roomCode || 'bull_market_kds_live_v1'}
            </span>
          </div>
        </div>

        {/* Selector de Vistas */}
        <nav className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/barra')}
            className={`px-3 md:px-4 py-1.5 rounded-xl font-extrabold text-xs md:text-sm flex items-center gap-1.5 transition-all ${
              route === '/barra'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>1. Barra</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/panaderia')}
            className={`px-3 md:px-4 py-1.5 rounded-xl font-extrabold text-xs md:text-sm flex items-center gap-1.5 transition-all ${
              route === '/panaderia'
                ? 'bg-orange-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>2. Panadería KDS</span>
            {activeOrderCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[11px] font-black tabular-nums ${
                  route === '/panaderia'
                    ? 'bg-slate-950 text-amber-400'
                    : 'bg-orange-500 text-slate-950'
                }`}
              >
                {activeOrderCount} ({totalPendingUnits})
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin')}
            className={`px-3 md:px-4 py-1.5 rounded-xl font-extrabold text-xs md:text-sm flex items-center gap-1.5 transition-all ${
              route === '/admin'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">3. Admin &amp; 86</span>
            <span className="sm:hidden">Admin</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/dual')}
            className={`hidden xl:flex px-3 py-1.5 rounded-xl font-extrabold text-xs items-center gap-1.5 transition-all ${
              route === '/dual'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Columns className="w-4 h-4" />
            <span>Vista Dual</span>
          </button>
        </nav>

        {/* Audio y Compartir */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => soundEngine.playNewOrderBell()}
            title="Probar campana de cocina (Web Audio API)"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-slate-700"
          >
            <BellRing className="w-3.5 h-3.5" /> Campana
          </button>

          <button
            type="button"
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}${window.location.pathname}#/panaderia`;
              window.open(url, '_blank', 'width=1280,height=820');
            }}
            className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
          >
            <ExternalLink className="w-3.5 h-3.5 text-sky-400" /> Abrir KDS
          </button>
        </div>
      </header>

      {incomingBanner && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 font-black text-center py-2 px-4 text-sm uppercase tracking-wider shadow-lg animate-bounce z-50">
          {incomingBanner}
        </div>
      )}

      <div className="flex-1">
        {route === '/barra' && (
          <BarraView
            flavors={state.flavors}
            orders={state.orders}
            nextTicketSeq={state.nextTicketSeq}
            onCreateOrder={handleCreateOrder}
          />
        )}

        {route === '/panaderia' && (
          <PanaderiaView
            flavors={state.flavors}
            orders={state.orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onToggleOrderItemCheck={handleToggleOrderItemCheck}
            onToggleFlavorAvailability={handleToggleFlavorAvailability}
          />
        )}

        {route === '/admin' && (
          <AdminView
            flavors={state.flavors}
            orders={state.orders}
            roomCode={state.roomCode}
            onSaveFlavors={handleSaveFlavors}
            onResetDemoData={handleResetDemoData}
            onClearAllOrders={handleClearAllOrders}
            onRestoreFactoryFlavors={handleRestoreFactoryFlavors}
            onSetRoomCode={(room) => syncEngine.setRoomCode(room)}
          />
        )}

        {route === '/dual' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 divide-y xl:divide-y-0 xl:divide-x divide-slate-800">
            <div className="xl:col-span-5 bg-slate-950">
              <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs font-black uppercase text-amber-400">
                🍹 Emisor de Barra (/barra)
              </div>
              <BarraView
                flavors={state.flavors}
                orders={state.orders}
                nextTicketSeq={state.nextTicketSeq}
                onCreateOrder={handleCreateOrder}
              />
            </div>
            <div className="xl:col-span-7 bg-slate-950">
              <div className="bg-orange-500/10 border-b border-orange-500/30 px-4 py-2 text-xs font-black uppercase text-orange-400">
                🔥 KDS de Panadería en Vivo (/panaderia)
              </div>
              <PanaderiaView
                flavors={state.flavors}
                orders={state.orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onToggleOrderItemCheck={handleToggleOrderItemCheck}
                onToggleFlavorAvailability={handleToggleFlavorAvailability}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
