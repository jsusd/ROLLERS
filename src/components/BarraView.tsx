import React, { useState, useEffect } from 'react';
import {
  COLOR_PALETTE,
  Flavor,
  Order,
  OrderItem,
  OrderType,
  QUICK_NOTES,
} from '../types/kds';
import { soundEngine } from '../utils/soundEngine';
import {
  Send,
  Plus,
  Minus,
  Trash2,
  Utensils,
  ShoppingBag,
  Clock,
  CheckCircle2,
  ChefHat,
  Ban,
  Sparkles,
  User,
  Hash,
  FileText,
} from 'lucide-react';

interface BarraViewProps {
  flavors: Flavor[];
  orders: Order[];
  nextTicketSeq: number;
  onCreateOrder: (orderData: {
    ticketNumber: string;
    customerOrTable: string;
    orderType: OrderType;
    note: string;
    items: OrderItem[];
  }) => void;
}

export const BarraView: React.FC<BarraViewProps> = ({
  flavors,
  orders,
  nextTicketSeq,
  onCreateOrder,
}) => {
  const formattedSeq = `#${String(nextTicketSeq).padStart(3, '0')}`;
  const [customTicket, setCustomTicket] = useState<string>('');
  const [customerOrTable, setCustomerOrTable] = useState<string>('');
  const [orderType, setOrderType] = useState<OrderType>('comer_aqui');
  const [note, setNote] = useState<string>('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [flashSuccess, setFlashSuccess] = useState<string | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  const getRollImage = (flavor: Flavor) => {
    if (!flavor) return '';
    const b64Map = (window as unknown as { BULL_MARKET_ROLL_IMAGES?: Record<string, string> }).BULL_MARKET_ROLL_IMAGES;
    if (flavor.imageKey && b64Map && b64Map[flavor.imageKey]) {
      return b64Map[flavor.imageKey];
    }
    const idMap: Record<string, string> = {
      'flv-avellanas': 'crema-avellanas',
      'flv-tiramisu': 'tiramisu',
      'flv-ovomaltina': 'ovomaltina',
      'flv-pie-limon': 'pie-limon',
      'flv-frutos-rojos': 'frutos-rojos',
      'flv-dulce-leche': 'dulce-de-leche',
      'flv-cinnamon': 'cinnamon',
      'flv-samba': 'samba',
      'flv-pistacho': 'pistacho',
      'flv-oreo': 'oreo',
    };
    const mapped = idMap[flavor.id];
    if (mapped && b64Map && b64Map[mapped]) {
      return b64Map[mapped];
    }
    return flavor.imageUrl || '';
  };

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleTapFlavor = (flavor: Flavor) => {
    if (!flavor.available) {
      soundEngine.play86Alert();
      return;
    }
    soundEngine.playTapSound(520);
    setCart((prev) => ({
      ...prev,
      [flavor.id]: (prev[flavor.id] || 0) + 1,
    }));
  };

  const handleAdjustQuantity = (
    e: React.MouseEvent,
    flavor: Flavor,
    delta: number
  ) => {
    e.stopPropagation();
    if (!flavor.available && delta > 0) {
      soundEngine.play86Alert();
      return;
    }
    soundEngine.playTapSound(delta > 0 ? 580 : 380);
    setCart((prev) => {
      const nextQty = (prev[flavor.id] || 0) + delta;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[flavor.id];
        return copy;
      }
      return { ...prev, [flavor.id]: nextQty };
    });
  };

  const toggleQuickNote = (chip: string) => {
    soundEngine.playTapSound(460);
    setNote((prev) => {
      const parts = prev
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.includes(chip)) {
        return parts.filter((p) => p !== chip).join(', ');
      }
      return [...parts, chip].join(', ');
    });
  };

  const totalUnits = Object.values(cart).reduce((acc, q) => acc + q, 0);

  const handleSubmitOrder = () => {
    if (totalUnits === 0) return;

    const items: OrderItem[] = flavors
      .filter((f) => (cart[f.id] || 0) > 0)
      .map((f) => ({
        flavorId: f.id,
        flavorName: f.name,
        color: f.color,
        emoji: f.emoji,
        imageUrl: f.imageUrl,
        quantity: cart[f.id],
        checked: false,
      }));

    const finalTicket = customTicket.trim() || formattedSeq;

    onCreateOrder({
      ticketNumber: finalTicket,
      customerOrTable: customerOrTable.trim() || 'Barra Directa',
      orderType,
      note: note.trim(),
      items,
    });

    soundEngine.playTapSound(740);
    setFlashSuccess(`Comanda ${finalTicket} enviada a Panadería (${totalUnits} uds)`);
    window.setTimeout(() => setFlashSuccess(null), 2600);

    setCart({});
    setCustomTicket('');
    setCustomerOrTable('');
    setNote('');
  };

  const recentOrders = [...orders]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 12);

  const formatElapsed = (timestamp: number) => {
    const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-3 md:p-5 max-w-[1650px] mx-auto">
      {/* COLUMNA IZQUIERDA / PRINCIPAL: TECLADO VISUAL DE SABORES */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#4a2e1b]/80 border border-amber-500/30 rounded-2xl px-4 py-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-base md:text-lg font-black tracking-tight text-[#fdf5e6] uppercase">
              Sabores Bull Market — Toca el Roll para sumar (+1)
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm text-amber-200/80">
            <span>Disponibles:</span>
            <span className="font-black text-emerald-400">
              {flavors.filter((f) => f.available).length}
            </span>
            <span>/</span>
            <span className="font-black text-rose-400">
              {flavors.filter((f) => !f.available).length} Agotados (86)
            </span>
          </div>
        </div>

        {/* Grid de Botones Grandes con Foto Real del New York Roll */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          {flavors.map((flavor) => {
            const palette = COLOR_PALETTE[flavor.color] || COLOR_PALETTE.amber;
            const qty = cart[flavor.id] || 0;
            const isSelected = qty > 0;

            return (
              <div
                key={flavor.id}
                onClick={() => handleTapFlavor(flavor)}
                role="button"
                tabIndex={0}
                className={`relative select-none rounded-2xl border-2 p-3 transition-all duration-150 flex flex-col justify-between min-h-[200px] ${
                  !flavor.available
                    ? 'bg-slate-900/40 border-slate-800 opacity-60 cursor-not-allowed'
                    : isSelected
                    ? `bg-[#5c3820] ${palette.border} shadow-xl ${palette.glow} scale-[1.02] cursor-pointer`
                    : `bg-[#3b2313]/90 hover:bg-[#4d2f1a] border-amber-900/60 hover:${palette.border} cursor-pointer active:scale-95`
                }`}
              >
                {/* Sello de AGOTADO (86) */}
                {!flavor.available && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center z-20 p-2 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-rose-600 text-white text-xs font-black uppercase px-3 py-1.5 rounded-full shadow-lg border border-rose-400">
                      <Ban className="w-4 h-4" /> AGOTADO (86)
                    </span>
                    <span className="text-[11px] text-rose-300 mt-1 font-medium">
                      No vender en Barra
                    </span>
                  </div>
                )}

                {/* Etiqueta de fecha + Contador en vivo */}
                <div className="flex items-center justify-between gap-1 z-10">
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${palette.badgeBg}`}
                  >
                    {flavor.dateRange || flavor.shortCode}
                  </span>

                  {qty > 0 && (
                    <span
                      className={`inline-flex items-center justify-center min-w-[36px] h-9 px-2 rounded-xl text-lg font-black tabular-nums shadow-lg ${palette.badgeBg}`}
                    >
                      {qty}
                    </span>
                  )}
                </div>

                  {/* Imagen Circular del New York Roll como protagonista del botón */}
                  <div className="my-2 flex flex-col items-center text-center">
                    {getRollImage(flavor) ? (
                      <img
                        src={getRollImage(flavor)}
                        alt={flavor.name}
                        className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover shadow-lg border-2 border-amber-400/50 transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-5xl py-3">{flavor.emoji}</span>
                    )}
                  <p className="mt-2 text-sm md:text-base font-black text-[#fff8eb] uppercase tracking-tight leading-tight">
                    {flavor.name}
                  </p>
                </div>

                {/* Controles rápidos - / + */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  {qty > 0 ? (
                    <div className="flex items-center justify-between w-full gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleAdjustQuantity(e, flavor, -1)}
                        className="h-9 w-10 rounded-xl bg-slate-950/90 hover:bg-rose-600 text-white font-bold flex items-center justify-center border border-white/15 transition-colors active:scale-90"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className={`text-[11px] font-black uppercase ${palette.textAccent}`}>
                        {qty} uds
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleAdjustQuantity(e, flavor, 1)}
                        className="h-9 w-10 rounded-xl bg-slate-950/90 hover:bg-emerald-600 text-white font-bold flex items-center justify-center border border-white/15 transition-colors active:scale-90"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-200/70 mx-auto flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5 text-amber-400" /> Toca para +1
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Datos Rápidos de la Comanda */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-amber-400" /> N° Comanda
              </label>
              <input
                type="text"
                value={customTicket}
                onChange={(e) => setCustomTicket(e.target.value)}
                placeholder={formattedSeq}
                className="w-full h-12 rounded-xl bg-slate-950 border border-slate-700 px-3 text-lg font-black text-amber-400 placeholder:text-amber-400/70 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-sky-400" /> Cliente / Mesa
              </label>
              <input
                type="text"
                value={customerOrTable}
                onChange={(e) => setCustomerOrTable(e.target.value)}
                placeholder="Ej. Mesa 5, Ana, Barra..."
                className="w-full h-12 rounded-xl bg-slate-950 border border-slate-700 px-3 text-base font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Modalidad (1 Toque)
              </label>
              <div className="grid grid-cols-2 gap-2 h-12">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playTapSound(440);
                    setOrderType('comer_aqui');
                  }}
                  className={`rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 border transition-all ${
                    orderType === 'comer_aqui'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Utensils className="w-4 h-4" /> Comer Aquí
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playTapSound(440);
                    setOrderType('para_llevar');
                  }}
                  className={`rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 border transition-all ${
                    orderType === 'para_llevar'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" /> Para Llevar
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase text-slate-500 mr-1">
              Rápido:
            </span>
            {['Barra 1', 'Barra 2', 'Mesa 1', 'Mesa 2', 'Mesa 3', 'Terraza', 'VIP'].map(
              (preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    soundEngine.playTapSound(480);
                    setCustomerOrTable(preset);
                  }}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                    customerOrTable === preset
                      ? 'bg-sky-500 text-slate-950 border-sky-400'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {preset}
                </button>
              )
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-amber-400" /> Nota para Panadería
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Sin topping, bien caliente, alergia..."
              className="w-full h-11 rounded-xl bg-slate-950 border border-slate-700 px-3 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 mb-2"
            />
            <div className="flex flex-wrap gap-1.5">
              {QUICK_NOTES.map((chip) => {
                const active = note
                  .split(',')
                  .map((s) => s.trim())
                  .includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => toggleQuickNote(chip)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                      active
                        ? 'bg-amber-500 text-slate-950 border-amber-300'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    + {chip}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* COLUMNA DERECHA: RESUMEN DE COMANDA + BOTÓN GIGANTE + HISTORIAL EN VIVO */}
      <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
        <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block">
                  Comanda Actual
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-amber-400 tabular-nums">
                    {customTicket.trim() || formattedSeq}
                  </span>
                  <span className="text-sm font-bold text-slate-300 truncate max-w-[160px]">
                    • {customerOrTable.trim() || 'Barra Directa'}
                  </span>
                </div>
              </div>

              {totalUnits > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playTapSound(300);
                    setCart({});
                    setNote('');
                  }}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-2 rounded-xl flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Limpiar
                </button>
              )}
            </div>

            {totalUnits === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/50 my-2">
                <p className="text-slate-400 font-bold text-sm">
                  Toca las fotos de los sabores para armar la comanda
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Se enviará en tiempo real al KDS de Panadería
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 my-2">
                {flavors
                  .filter((f) => (cart[f.id] || 0) > 0)
                  .map((f) => {
                    const palette = COLOR_PALETTE[f.color] || COLOR_PALETTE.amber;
                    const qty = cart[f.id];
                    return (
                      <div
                        key={f.id}
                        className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3 py-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {f.imageUrl ? (
                            <img
                              src={f.imageUrl}
                              alt={f.name}
                              className="w-10 h-10 rounded-full object-cover border border-amber-400/50 shrink-0"
                            />
                          ) : (
                            <span className="text-xl">{f.emoji}</span>
                          )}
                          <span className="font-extrabold text-white text-sm truncate">
                            {f.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleAdjustQuantity(e, f, -1)}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-600 text-white flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span
                            className={`min-w-[34px] text-center font-black text-base tabular-nums px-2 py-0.5 rounded-lg ${palette.badgeBg}`}
                          >
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleAdjustQuantity(e, f, 1)}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-emerald-600 text-white flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {flashSuccess && (
            <div className="my-2 bg-emerald-500/20 border border-emerald-400 text-emerald-200 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{flashSuccess}</span>
            </div>
          )}

          <button
            type="button"
            disabled={totalUnits === 0}
            onClick={handleSubmitOrder}
            className={`mt-3 w-full py-4 px-5 rounded-2xl font-black text-lg md:text-xl uppercase tracking-wide flex items-center justify-between transition-all shadow-xl ${
              totalUnits > 0
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/25 active:scale-[0.98] cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Send className="w-6 h-6" />
              Enviar a Panadería
            </span>
            <span className="bg-slate-950/90 text-amber-400 px-3.5 py-1 rounded-xl text-base font-black tabular-nums">
              {totalUnits} {totalUnits === 1 ? 'ud' : 'uds'}
            </span>
          </button>
        </div>

        {/* HISTORIAL EN VIVO DE COMANDAS ENVIADAS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Estado en Vivo en Panadería
            </h3>
            <span className="text-xs font-bold text-slate-400">
              Últimas {recentOrders.length}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {recentOrders.map((ord) => {
              const count = ord.items.reduce((s, i) => s + i.quantity, 0);
              return (
                <div
                  key={ord.id}
                  className={`rounded-xl border p-3 transition-all ${
                    ord.status === 'despachado'
                      ? 'bg-emerald-950/25 border-emerald-500/40'
                      : ord.status === 'preparando'
                      ? 'bg-sky-950/30 border-sky-500/50'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base text-white tabular-nums">
                        {ord.ticketNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-300 truncate max-w-[120px]">
                        {ord.customerOrTable}
                      </span>
                      <span className="text-[11px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                        {count} uds
                      </span>
                    </div>

                    {ord.status === 'pendiente' && (
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <Clock className="w-3.5 h-3.5" /> Pendiente (
                        {formatElapsed(ord.createdAt)})
                      </span>
                    )}
                    {ord.status === 'preparando' && (
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 animate-pulse">
                        <ChefHat className="w-3.5 h-3.5" /> En Preparación (
                        {formatElapsed(ord.createdAt)})
                      </span>
                    )}
                    {ord.status === 'despachado' && (
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ¡Listo para retirar!
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {ord.items.map((item) => (
                      <span
                        key={item.flavorId}
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          item.checked
                            ? 'bg-emerald-500/20 text-emerald-300 line-through'
                            : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.flavorName}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        )}
                        {item.quantity}x {item.flavorName}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
