import React, { useState, useEffect } from 'react';
import { COLOR_PALETTE, Flavor, Order, OrderStatus } from '../types/kds';
import { soundEngine } from '../utils/soundEngine';
import {
  Flame,
  Clock,
  CheckCircle2,
  ChefHat,
  Utensils,
  ShoppingBag,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  Square,
  Zap,
  Layers,
} from 'lucide-react';

interface PanaderiaViewProps {
  flavors: Flavor[];
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, nextStatus: OrderStatus) => void;
  onToggleOrderItemCheck: (orderId: string, flavorId: string) => void;
  onToggleFlavorAvailability: (flavorId: string) => void;
}

export const PanaderiaView: React.FC<PanaderiaViewProps> = ({
  flavors,
  orders,
  onUpdateOrderStatus,
  onToggleOrderItemCheck,
  onToggleFlavorAvailability,
}) => {
  const [now, setNow] = useState<number>(Date.now());
  const [discountCheckedItems, setDiscountCheckedItems] = useState<boolean>(false);
  const [showRecentlyDispatched, setShowRecentlyDispatched] = useState<boolean>(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeOrders = [...orders]
    .filter((o) => o.status === 'pendiente' || o.status === 'preparando')
    .sort((a, b) => a.createdAt - b.createdAt);

  const dispatchedOrders = [...orders]
    .filter((o) => o.status === 'despachado')
    .sort((a, b) => (b.dispatchedAt || b.createdAt) - (a.dispatchedAt || a.createdAt))
    .slice(0, 8);

  const batchTotals = flavors.map((flavor) => {
    let totalInActiveOrders = 0;
    let totalUnchecked = 0;

    activeOrders.forEach((ord) => {
      ord.items.forEach((item) => {
        if (item.flavorId === flavor.id) {
          totalInActiveOrders += item.quantity;
          if (!item.checked) {
            totalUnchecked += item.quantity;
          }
        }
      });
    });

    const displayedCount = discountCheckedItems ? totalUnchecked : totalInActiveOrders;
    const checkedInTray = totalInActiveOrders - totalUnchecked;

    return {
      flavor,
      displayedCount,
      totalInActiveOrders,
      checkedInTray,
    };
  });

  const totalPendingUnits = batchTotals.reduce((acc, b) => acc + b.displayedCount, 0);

  const getUrgencyLevel = (createdAt: number): 'green' | 'yellow' | 'red' => {
    const elapsedMinutes = (now - createdAt) / 60000;
    if (elapsedMinutes < 3) return 'green';
    if (elapsedMinutes <= 6) return 'yellow';
    return 'red';
  };

  const formatTimer = (createdAt: number): string => {
    const diffSec = Math.max(0, Math.floor((now - createdAt) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatTimeOfDay = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-slate-950 text-white">
      {/* =====================================================================
          1. PANEL SUPERIOR FIJO: RESUMEN TOTAL DE SABORES PENDIENTES (BATCH)
         ===================================================================== */}
      <section className="sticky top-[60px] z-30 bg-slate-950/95 backdrop-blur-md border-b-2 border-slate-800 px-3 py-3 md:px-6 md:py-3.5 shadow-2xl">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="bg-amber-500/20 border border-amber-500/50 p-1.5 rounded-xl">
                <Layers className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                  Consolidado en Vivo por Sabor (Producción en Lote)
                  <span className="bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full tabular-nums">
                    {totalPendingUnits} UDS PENDIENTES
                  </span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playTapSound(460);
                  setDiscountCheckedItems((prev) => !prev);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold border transition-all flex items-center gap-1.5 ${
                  discountCheckedItems
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                {discountCheckedItems
                  ? 'Descontando ítems tachados en bandeja'
                  : 'Descontar al despachar comanda'}
              </button>

              <button
                type="button"
                onClick={() => setShowRecentlyDispatched((prev) => !prev)}
                className="px-3 py-1.5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                Historial ({dispatchedOrders.length})
              </button>
            </div>
          </div>

          {/* Grid de 10 Sabores con Foto Real y Contador Gigante */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {batchTotals.map(({ flavor, displayedCount, checkedInTray }) => {
              const palette = COLOR_PALETTE[flavor.color] || COLOR_PALETTE.amber;
              const hasPending = displayedCount > 0;

              return (
                <div
                  key={flavor.id}
                  className={`relative rounded-2xl border-2 px-3 py-2 flex items-center justify-between transition-all ${
                    !flavor.available
                      ? 'bg-rose-950/30 border-rose-600/60 opacity-75'
                      : hasPending
                      ? `bg-[#4a2e1b] ${palette.border} shadow-lg ${palette.glow}`
                      : 'bg-slate-900/60 border-slate-800/80 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-1.5">
                    {flavor.imageUrl ? (
                      <img
                        src={flavor.imageUrl}
                        alt={flavor.name}
                        className="w-11 h-11 rounded-full object-cover border border-amber-400/60 shrink-0 shadow"
                      />
                    ) : (
                      <span className="text-2xl">{flavor.emoji}</span>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white uppercase leading-tight truncate">
                        {flavor.name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.play86Alert();
                            onToggleFlavorAvailability(flavor.id);
                          }}
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                            flavor.available
                              ? 'bg-slate-950/70 border-slate-700 text-slate-400 hover:text-rose-400'
                              : 'bg-rose-600 border-rose-400 text-white'
                          }`}
                        >
                          {flavor.available ? '86' : 'AGOTADO'}
                        </button>
                        {checkedInTray > 0 && (
                          <span className="text-[10px] font-bold text-emerald-300 truncate">
                            ✓{checkedInTray}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Número Gigante del Consolidado */}
                  <div
                    className={`shrink-0 min-w-[46px] h-11 px-2 rounded-xl flex items-center justify-center text-2xl font-black tabular-nums shadow-inner ${
                      hasPending
                        ? palette.badgeBg
                        : 'bg-slate-950 text-slate-600 border border-slate-800'
                    }`}
                  >
                    {displayedCount}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {showRecentlyDispatched && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
          <div className="max-w-[1800px] mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase text-sky-400 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4" /> Últimas Comandas Despachadas (Toca
                &quot;Recuperar&quot; para devolver a la cola)
              </span>
              <button
                type="button"
                onClick={() => setShowRecentlyDispatched(false)}
                className="text-xs text-slate-400 hover:text-white font-bold"
              >
                Cerrar ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {dispatchedOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5"
                >
                  <span className="font-black text-sm text-emerald-400">
                    {ord.ticketNumber}
                  </span>
                  <span className="text-xs text-slate-300">{ord.customerOrTable}</span>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playTapSound(500);
                      onUpdateOrderStatus(ord.id, 'preparando');
                    }}
                    className="text-xs font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded-lg"
                  >
                    Recuperar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          2. PANEL PRINCIPAL: COLA DE COMANDAS EN ORDEN DE LLEGADA (GRID FIFO)
         ===================================================================== */}
      <main className="flex-1 p-3 md:p-6 max-w-[1800px] w-full mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-base md:text-lg font-black uppercase tracking-wide text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              Cola de Despacho FIFO ({activeOrders.length}{' '}
              {activeOrders.length === 1 ? 'Comanda Activa' : 'Comandas Activas'})
            </h3>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> &lt; 3 min
            </span>
            <span className="inline-flex items-center gap-1.5 text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 3 - 6 min
            </span>
            <span className="inline-flex items-center gap-1.5 text-rose-300 bg-rose-950/60 border border-rose-500/40 px-2.5 py-1 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" /> &gt; 6 min
            </span>
          </div>
        </div>

        {activeOrders.length === 0 ? (
          <div className="border-2 border-dashed border-slate-800 rounded-3xl p-12 text-center my-6 bg-slate-900/30">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-3 opacity-80" />
            <h4 className="text-2xl font-black text-white">
              ¡Todo al día en Panadería!
            </h4>
            <p className="text-slate-400 mt-1 text-sm max-w-md mx-auto">
              No hay comandas pendientes en la cola FIFO.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeOrders.map((order, fifoIndex) => {
              const urgency = getUrgencyLevel(order.createdAt);
              const totalOrderUnits = order.items.reduce((s, i) => s + i.quantity, 0);
              const checkedUnits = order.items.reduce(
                (s, i) => s + (i.checked ? i.quantity : 0),
                0
              );
              const progressPct =
                totalOrderUnits > 0
                  ? Math.round((checkedUnits / totalOrderUnits) * 100)
                  : 0;

              const urgencyStyles = {
                green: {
                  cardBorder:
                    order.status === 'preparando'
                      ? 'border-sky-400 shadow-lg shadow-sky-500/10'
                      : 'border-emerald-500/70',
                  headerBg: 'bg-emerald-500/15 border-b border-emerald-500/30',
                  timerBadge: 'bg-emerald-500 text-slate-950',
                },
                yellow: {
                  cardBorder: 'border-amber-400 shadow-lg shadow-amber-500/15',
                  headerBg: 'bg-amber-500/20 border-b border-amber-500/40',
                  timerBadge: 'bg-amber-400 text-slate-950',
                },
                red: {
                  cardBorder:
                    'border-rose-500 shadow-xl shadow-rose-500/25 ring-2 ring-rose-500/50',
                  headerBg: 'bg-rose-600/30 border-b border-rose-500 animate-pulse',
                  timerBadge: 'bg-rose-600 text-white animate-bounce',
                },
              }[urgency];

              return (
                <article
                  key={order.id}
                  className={`rounded-2xl bg-slate-900 border-2 flex flex-col justify-between overflow-hidden transition-all ${urgencyStyles.cardBorder}`}
                >
                  <div>
                    <div className={`p-3.5 ${urgencyStyles.headerBg}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-slate-950 text-amber-400 border border-amber-500/30">
                              FIFO #{fifoIndex + 1}
                            </span>
                            {order.status === 'preparando' && (
                              <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-sky-500 text-slate-950 flex items-center gap-1">
                                <ChefHat className="w-3.5 h-3.5" /> Preparando
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl md:text-4xl font-black tracking-tight text-white tabular-nums">
                              {order.ticketNumber}
                            </span>
                            <span className="text-sm font-extrabold text-slate-200 truncate max-w-[140px]">
                              {order.customerOrTable}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-lg font-black tabular-nums shadow ${urgencyStyles.timerBadge}`}
                          >
                            <Clock className="w-4 h-4" />
                            {formatTimer(order.createdAt)}
                          </div>
                          <span className="block text-[11px] font-bold text-slate-300 mt-1">
                            Entró: {formatTimeOfDay(order.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/10 text-xs font-bold">
                        {order.orderType === 'comer_aqui' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-300">
                            <Utensils className="w-3.5 h-3.5" /> Para Comer Aquí
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-300">
                            <ShoppingBag className="w-3.5 h-3.5" /> Para Llevar
                          </span>
                        )}
                        <span className="bg-slate-950/80 text-white px-2.5 py-0.5 rounded-lg font-black">
                          Total: {totalOrderUnits} uds
                        </span>
                      </div>
                    </div>

                    {order.note && (
                      <div className="mx-3.5 mt-3 bg-amber-500/20 border-l-4 border-amber-400 px-3 py-2 rounded-r-xl flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                        <p className="text-xs md:text-sm font-extrabold text-amber-200 leading-snug">
                          NOTA: {order.note}
                        </p>
                      </div>
                    )}

                    <div className="px-3.5 pt-3">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                        <span>Toca cada sabor al poner en bandeja:</span>
                        <span className="text-emerald-400 font-black">
                          {checkedUnits}/{totalOrderUnits} listos ({progressPct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3.5 space-y-2">
                      {order.items.map((item) => {
                        const palette =
                          COLOR_PALETTE[item.color] || COLOR_PALETTE.amber;
                        return (
                          <button
                            key={item.flavorId}
                            type="button"
                            onClick={() => {
                              soundEngine.playTapSound(item.checked ? 380 : 620);
                              onToggleOrderItemCheck(order.id, item.flavorId);
                            }}
                            className={`w-full rounded-xl border-2 p-2 flex items-center justify-between text-left transition-all active:scale-[0.98] ${
                              item.checked
                                ? 'bg-emerald-950/30 border-emerald-600/40 opacity-65'
                                : `bg-[#3b2313]/90 ${palette.border}`
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {item.checked ? (
                                <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-400 shrink-0" />
                              )}
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.flavorName}
                                  className="w-9 h-9 rounded-full object-cover border border-amber-400/50 shrink-0"
                                />
                              ) : (
                                <span className="text-2xl shrink-0">{item.emoji}</span>
                              )}
                              <span
                                className={`font-black text-sm md:text-base uppercase leading-tight truncate ${
                                  item.checked
                                    ? 'line-through text-slate-400'
                                    : 'text-[#fff8eb]'
                                }`}
                              >
                                {item.flavorName}
                              </span>
                            </div>

                            <span
                              className={`shrink-0 ml-2 min-w-[44px] h-10 px-2.5 rounded-xl flex items-center justify-center text-xl font-black tabular-nums ${
                                item.checked
                                  ? 'bg-emerald-600 text-white'
                                  : palette.badgeBg
                              }`}
                            >
                              x{item.quantity}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3.5 pt-0 mt-1">
                    {order.status === 'pendiente' ? (
                      <div className="grid grid-cols-12 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playTapSound(540);
                            onUpdateOrderStatus(order.id, 'preparando');
                          }}
                          className="col-span-8 py-3.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-black text-sm md:text-base uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all"
                        >
                          <ChefHat className="w-5 h-5" />
                          Preparar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playOrderDispatchedSound();
                            onUpdateOrderStatus(order.id, 'despachado');
                          }}
                          className="col-span-4 py-3.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs uppercase flex items-center justify-center gap-1 shadow-lg transition-all"
                        >
                          <Zap className="w-4 h-4" />
                          Listo
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playOrderDispatchedSound();
                          onUpdateOrderStatus(order.id, 'despachado');
                        }}
                        className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 active:scale-95 text-slate-950 font-black text-base md:text-lg uppercase tracking-wide flex items-center justify-center gap-2 shadow-xl transition-all"
                      >
                        <CheckCircle2 className="w-6 h-6" />
                        ¡Despachado! (Listo)
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
