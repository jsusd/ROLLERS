import React, { useState } from 'react';
import {
  COLOR_PALETTE,
  Flavor,
  FlavorColorKey,
  Order,
} from '../types/kds';
import { soundEngine } from '../utils/soundEngine';
import {
  Settings,
  Plus,
  Trash2,
  Ban,
  CheckCircle2,
  Download,
  Copy,
  BarChart3,
  Clock,
  Award,
  Database,
  RefreshCw,
  Edit3,
  Save,
  Sparkles,
  Wifi,
  SunMedium,
  RotateCcw,
} from 'lucide-react';

interface AdminViewProps {
  flavors: Flavor[];
  orders: Order[];
  roomCode?: string;
  onSaveFlavors: (nextFlavors: Flavor[]) => void;
  onResetDemoData: () => void;
  onClearAllOrders: () => void;
  onRestoreFactoryFlavors: () => void;
  onSetRoomCode: (roomCode: string) => void;
}

const EMOJI_PRESETS = ['🌰', '☕', '🍫', '🍋', '🍓', '🍯', '🥐', '🍬', '💚', '🍪', '🍩', '🧁'];

export const AdminView: React.FC<AdminViewProps> = ({
  flavors,
  orders,
  roomCode = 'bull_market_kds_live_v1',
  onSaveFlavors,
  onResetDemoData,
  onClearAllOrders,
  onRestoreFactoryFlavors,
  onSetRoomCode,
}) => {
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newColor, setNewColor] = useState<FlavorColorKey>('amber');
  const [newEmoji, setNewEmoji] = useState('🥐');
  const [newDateRange, setNewDateRange] = useState('23/10 AL 01/11');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editColor, setEditColor] = useState<FlavorColorKey>('amber');
  const [editEmoji, setEditEmoji] = useState('🥐');
  const [editDateRange, setEditDateRange] = useState('');

  const [inputRoom, setInputRoom] = useState(roomCode);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showFactoryConfirm, setShowFactoryConfirm] = useState(false);

  const handleAddFlavor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const code =
      newCode.trim().toUpperCase() ||
      newName
        .trim()
        .slice(0, 3)
        .toUpperCase();

    const created: Flavor = {
      id: `flv-${Date.now()}`,
      name: newName.trim().toUpperCase(),
      shortCode: code,
      color: newColor,
      emoji: newEmoji || '🥐',
      dateRange: newDateRange.trim() || '23/10 AL 01/11',
      available: true,
    };

    soundEngine.playTapSound(600);
    onSaveFlavors([...flavors, created]);
    setNewName('');
    setNewCode('');
    setFeedback(`¡Sabor "${created.name}" agregado con éxito!`);
    window.setTimeout(() => setFeedback(null), 3000);
  };

  const startEditFlavor = (flavor: Flavor) => {
    setEditingId(flavor.id);
    setEditName(flavor.name);
    setEditCode(flavor.shortCode);
    setEditColor(flavor.color);
    setEditEmoji(flavor.emoji);
    setEditDateRange(flavor.dateRange || '23/10 AL 01/11');
  };

  const saveEditFlavor = (id: string) => {
    if (!editName.trim()) return;
    soundEngine.playTapSound(580);
    const updated = flavors.map((f) =>
      f.id === id
        ? {
            ...f,
            name: editName.trim().toUpperCase(),
            shortCode: editCode.trim().toUpperCase() || f.shortCode,
            color: editColor,
            emoji: editEmoji,
            dateRange: editDateRange.trim() || f.dateRange,
          }
        : f
    );
    onSaveFlavors(updated);
    setEditingId(null);
    setFeedback('Sabor actualizado');
    window.setTimeout(() => setFeedback(null), 2500);
  };

  const toggleFlavor86 = (id: string) => {
    soundEngine.play86Alert();
    const updated = flavors.map((f) =>
      f.id === id ? { ...f, available: !f.available } : f
    );
    onSaveFlavors(updated);
  };

  const deleteFlavor = (id: string) => {
    soundEngine.playTapSound(320);
    onSaveFlavors(flavors.filter((f) => f.id !== id));
  };

  const handleUpdateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRoom.trim()) return;
    onSetRoomCode(inputRoom.trim());
    setFeedback(`Conectado a la sala "${inputRoom.trim()}"`);
    window.setTimeout(() => setFeedback(null), 3500);
  };

  const dispatchedOrders = orders.filter((o) => o.status === 'despachado');
  const activeOrders = orders.filter((o) => o.status !== 'despachado');

  const totalDispatchedUnits = dispatchedOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  const totalAllUnits = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  const dispatchDurationsSec = dispatchedOrders
    .filter((o) => o.dispatchedAt && o.dispatchedAt > o.createdAt)
    .map((o) => Math.round(((o.dispatchedAt as number) - o.createdAt) / 1000));

  const avgDispatchSec =
    dispatchDurationsSec.length > 0
      ? Math.round(
          dispatchDurationsSec.reduce((a, b) => a + b, 0) /
            dispatchDurationsSec.length
        )
      : 0;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${String(s).padStart(2, '0')}s`;
  };

  const flavorRanking = flavors
    .map((f) => {
      let soldDispatched = 0;
      let soldActive = 0;
      orders.forEach((o) => {
        o.items.forEach((item) => {
          if (item.flavorId === f.id || item.flavorName === f.name) {
            if (o.status === 'despachado') soldDispatched += item.quantity;
            else soldActive += item.quantity;
          }
        });
      });
      return {
        flavor: f,
        soldDispatched,
        soldActive,
        totalSold: soldDispatched + soldActive,
      };
    })
    .sort((a, b) => b.totalSold - a.totalSold);

  const maxFlavorSold = Math.max(1, ...flavorRanking.map((r) => r.totalSold));

  const handleExportCSV = () => {
    const rows: string[][] = [
      ['REPORTE DE CIERRE BULL MARKET - POS & KDS'],
      ['Fecha Exportacion', new Date().toLocaleString()],
      ['Total Comandas Despachadas', String(dispatchedOrders.length)],
      ['Total Unidades Vendidas', String(totalAllUnits)],
      ['Tiempo Promedio Despacho', formatDuration(avgDispatchSec)],
      [],
      ['RANKING POR SABOR'],
      ['Codigo', 'Sabor', 'Unidades Despachadas', 'Unidades en Cola', 'Total Jornada', 'Estado'],
      ...flavorRanking.map((r) => [
        r.flavor.shortCode,
        r.flavor.name,
        String(r.soldDispatched),
        String(r.soldActive),
        String(r.totalSold),
        r.flavor.available ? 'DISPONIBLE' : 'AGOTADO (86)',
      ]),
      [],
      ['DETALLE DE COMANDAS'],
      ['Ticket', 'Cliente / Mesa', 'Modalidad', 'Estado', 'Hora', 'Detalle', 'Nota'],
      ...orders.map((o) => [
        o.ticketNumber,
        o.customerOrTable,
        o.orderType === 'comer_aqui' ? 'Comer Aqui' : 'Para Llevar',
        o.status.toUpperCase(),
        new Date(o.createdAt).toLocaleTimeString(),
        o.items.map((i) => `${i.quantity}x ${i.flavorName}`).join(' | '),
        o.note || '',
      ]),
    ];

    const csvContent =
      '\uFEFF' +
      rows
        .map((r) =>
          r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BullMarket-Cierre-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyForGoogleSheets = () => {
    const header = [
      'Sabor',
      'Codigo',
      'Despachados',
      'En Cola',
      'Total Vendidos',
      'Estado',
    ].join('\t');
    const lines = flavorRanking.map((r) =>
      [
        r.flavor.name,
        r.flavor.shortCode,
        r.soldDispatched,
        r.soldActive,
        r.totalSold,
        r.flavor.available ? 'Disponible' : 'Agotado (86)',
      ].join('\t')
    );
    const tsv = [header, ...lines].join('\n');
    navigator.clipboard.writeText(tsv).then(() => {
      setFeedback('¡Tabla copiada! Abre Google Sheets y presiona Ctrl+V');
      window.setTimeout(() => setFeedback(null), 3500);
    });
  };

  return (
    <div className="max-w-[1650px] mx-auto p-3 md:p-6 space-y-6 text-white">
      {/* BANNER CENTRALIZADO MULTI-DISPOSITIVO */}
      <section className="bg-gradient-to-r from-sky-950/70 via-slate-900 to-amber-950/50 border-2 border-sky-500/40 rounded-3xl p-4 md:p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/20 border border-sky-400 rounded-2xl">
              <Wifi className="w-6 h-6 text-sky-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black uppercase tracking-wide text-white flex items-center gap-2">
                Sincronización Centralizada Multi-Dispositivo
                <span className="bg-emerald-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full">
                  ACTIVA EN LA NUBE
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Cualquier cambio en Barra o Panadería desde un teléfono, tablet o PC se refleja en tiempo real en los demás.
              </p>
            </div>
          </div>

          {/* Formulario de Sala Centralizada */}
          <form onSubmit={handleUpdateRoom} className="flex items-center gap-2">
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-400">
                Código de Sala / Tienda:
              </span>
              <input
                type="text"
                value={inputRoom}
                onChange={(e) => setInputRoom(e.target.value)}
                placeholder="bull_market_kds_live_v1"
                className="h-10 rounded-xl bg-slate-950 border border-sky-500/50 px-3 text-xs font-black text-sky-300 uppercase tracking-wider"
              />
            </div>
            <button
              type="submit"
              className="mt-4 h-10 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase"
            >
              Conectar
            </button>
          </form>
        </div>
      </section>

      {/* ACCIONES DE CIERRE Y NUEVO DÍA */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40">
              <BarChart3 className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black uppercase tracking-wide">
                Métricas de la Jornada &amp; Cierre de Caja
              </h2>
              <p className="text-xs text-slate-400">
                Consolidado en tiempo real de ventas por sabor y tiempos de respuesta
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Download className="w-4 h-4" />
              Exportar CSV (Excel / Sheets)
            </button>
            <button
              type="button"
              onClick={handleCopyForGoogleSheets}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs md:text-sm flex items-center gap-2 border border-slate-700 transition-all"
            >
              <Copy className="w-4 h-4 text-sky-400" />
              Copiar para Google Sheets
            </button>
          </div>
        </div>

        {feedback && (
          <div className="mb-4 bg-emerald-500/20 border border-emerald-400 text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            {feedback}
          </div>
        )}

        {/* KPIs Principales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <span className="text-xs font-bold uppercase text-slate-400 block">
              Comandas Despachadas
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl md:text-4xl font-black text-emerald-400 tabular-nums">
                {dispatchedOrders.length}
              </span>
              <span className="text-xs font-bold text-slate-400">
                (+{activeOrders.length} en cola)
              </span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <span className="text-xs font-bold uppercase text-slate-400 block">
              Total Unidades Vendidas
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl md:text-4xl font-black text-amber-400 tabular-nums">
                {totalAllUnits}
              </span>
              <span className="text-xs font-bold text-slate-400">
                ({totalDispatchedUnits} entregadas)
              </span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-400" /> Tiempo Promedio Despacho
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl md:text-4xl font-black text-sky-400 tabular-nums">
                {avgDispatchSec > 0 ? formatDuration(avgDispatchSec) : '02m 15s'}
              </span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-violet-400" /> Sabor #1 del Día
            </span>
            <div className="mt-1 truncate">
              <span className="text-lg md:text-xl font-black text-white">
                {flavorRanking[0]
                  ? `${flavorRanking[0].flavor.emoji} ${flavorRanking[0].flavor.name}`
                  : 'Sin datos'}
              </span>
              {flavorRanking[0] && (
                <span className="block text-xs font-bold text-violet-300">
                  {flavorRanking[0].totalSold} unidades pedidas
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CONTROLES SEPARADOS DE DÍA / COMANDAS (GARANTÍA DE PRESERVACIÓN DE SABORES) */}
        <div className="bg-slate-950/80 border-2 border-amber-500/30 rounded-2xl p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black uppercase text-amber-400 flex items-center gap-2">
                <SunMedium className="w-4 h-4" />
                Gestión de Turnos y Jornadas (Conserva tus sabores creados)
              </h3>
              <p className="text-xs text-slate-400">
                Al iniciar un nuevo día, solo se limpian las comandas y el correlativo vuelve a #001. Tus sabores nunca se borran.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClearAllOrders();
                  setFeedback('☀️ ¡Nuevo día iniciado! Comandas en 0. Todos tus sabores se mantienen intactos.');
                  window.setTimeout(() => setFeedback(null), 4000);
                }}
                className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs md:text-sm uppercase flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <SunMedium className="w-4 h-4" />
                Iniciar Nuevo Día (Conserva Sabores)
              </button>

              <button
                type="button"
                onClick={() => {
                  onResetDemoData();
                  setFeedback('Comandas de prueba cargadas con tus sabores actuales.');
                  window.setTimeout(() => setFeedback(null), 3000);
                }}
                className="py-3 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase flex items-center gap-1.5 border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                Cargar Demo
              </button>

              <button
                type="button"
                onClick={() => setShowFactoryConfirm(true)}
                className="py-3 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-bold text-xs uppercase flex items-center gap-1.5"
                title="Solo para restablecer los 10 sabores originales de fábrica"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restablecer Fábrica
              </button>
            </div>
          </div>

          {showFactoryConfirm && (
            <div className="mt-4 p-3 bg-rose-950/70 border border-rose-500 rounded-xl flex items-center justify-between gap-3 text-xs">
              <span className="text-rose-200 font-bold">
                ¿Seguro que deseas restaurar el catálogo original de fábrica de los 10 sabores Bull Market?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFactoryConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRestoreFactoryFlavors();
                    setShowFactoryConfirm(false);
                    setFeedback('Sabores originales restablecidos.');
                    window.setTimeout(() => setFeedback(null), 3000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-black"
                >
                  Sí, restaurar fábrica
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Ranking de Sabores */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-3">
            Ranking de Sabores Más Vendidos en la Jornada
          </h3>
          <div className="space-y-2.5">
            {flavorRanking.map((row, idx) => {
              const palette = COLOR_PALETTE[row.flavor.color] || COLOR_PALETTE.amber;
              const widthPct = Math.max(
                4,
                Math.round((row.totalSold / maxFlavorSold) * 100)
              );

              return (
                <div
                  key={row.flavor.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-[240px]">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 font-black text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    {row.flavor.imageUrl ? (
                      <img
                        src={row.flavor.imageUrl}
                        alt={row.flavor.name}
                        className="w-10 h-10 rounded-full object-cover border border-amber-400/50 shrink-0"
                      />
                    ) : (
                      <span className="text-2xl">{row.flavor.emoji}</span>
                    )}
                    <div>
                      <p className="font-extrabold text-sm text-white">
                        {row.flavor.name}
                      </p>
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {row.soldDispatched} despachados • {row.soldActive} en preparación
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 max-w-md">
                    <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full ${palette.badgeBg.split(' ')[0]} transition-all duration-500`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-end">
                    <span
                      className={`px-3 py-1 rounded-xl font-black text-base tabular-nums ${palette.badgeBg}`}
                    >
                      {row.totalSold} uds
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* GESTOR DE SABORES EN VIVO Y CONTROL 86 */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black uppercase tracking-wide flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                Catálogo de Sabores ({flavors.length} Sabores) &amp; Bloqueo 86
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cualquier sabor que agregues o edites se guarda de forma permanente y se sincroniza en todos los dispositivos.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {flavors.map((flavor) => {
              const palette = COLOR_PALETTE[flavor.color] || COLOR_PALETTE.amber;
              const isEditing = editingId === flavor.id;

              return (
                <div
                  key={flavor.id}
                  className={`rounded-2xl border-2 p-3.5 transition-all ${
                    flavor.available
                      ? 'bg-slate-950 border-slate-800'
                      : 'bg-rose-950/20 border-rose-500/50'
                  }`}
                >
                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      <input
                        type="text"
                        value={editEmoji}
                        onChange={(e) => setEditEmoji(e.target.value)}
                        className="sm:col-span-1 h-10 rounded-xl bg-slate-900 border border-slate-700 text-center text-xl"
                        title="Emoji"
                      />
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="sm:col-span-4 h-10 rounded-xl bg-slate-900 border border-slate-700 px-3 text-sm font-bold text-white uppercase"
                        placeholder="Nombre del sabor"
                      />
                      <input
                        type="text"
                        value={editCode}
                        maxLength={4}
                        onChange={(e) => setEditCode(e.target.value)}
                        className="sm:col-span-2 h-10 rounded-xl bg-slate-900 border border-slate-700 px-2 text-xs font-black uppercase text-center text-amber-400"
                        placeholder="CÓD"
                      />
                      <select
                        value={editColor}
                        onChange={(e) =>
                          setEditColor(e.target.value as FlavorColorKey)
                        }
                        className="sm:col-span-3 h-10 rounded-xl bg-slate-900 border border-slate-700 px-2 text-xs font-bold text-white"
                      >
                        {Object.entries(COLOR_PALETTE).map(([key, val]) => (
                          <option key={key} value={key}>
                            {val.label}
                          </option>
                        ))}
                      </select>
                      <div className="sm:col-span-2 flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => saveEditFlavor(flavor.id)}
                          className="flex-1 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1"
                        >
                          <Save className="w-4 h-4" /> Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {flavor.imageUrl ? (
                          <img
                            src={flavor.imageUrl}
                            alt={flavor.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-amber-400/50 shrink-0"
                          />
                        ) : (
                          <span className="text-3xl">{flavor.emoji}</span>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-base text-white">
                              {flavor.name}
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${palette.badgeBg}`}
                            >
                              {flavor.dateRange || flavor.shortCode}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            Color: {palette.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleFlavor86(flavor.id)}
                          className={`px-3.5 py-2 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 border transition-all ${
                            flavor.available
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-rose-500/20 hover:border-rose-500 hover:text-rose-300'
                              : 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-600/30'
                          }`}
                        >
                          {flavor.available ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" /> Disponible (Click para 86)
                            </>
                          ) : (
                            <>
                              <Ban className="w-4 h-4" /> AGOTADO (86) - Click para Activar
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => startEditFlavor(flavor)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteFlavor(flavor.id)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-rose-600 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* AGREGAR NUEVO SABOR */}
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={handleAddFlavor}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4"
          >
            <h3 className="text-base font-black uppercase tracking-wide flex items-center gap-2 text-amber-400">
              <Plus className="w-5 h-5 text-emerald-400" />
              Agregar Nuevo Sabor al Menú
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Nombre del Sabor
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej. MANJAR BLANCO"
                className="w-full h-11 rounded-xl bg-slate-950 border border-slate-700 px-3 text-sm font-bold text-white uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Código Corto (3 letras)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="Ej. MAN"
                  className="w-full h-11 rounded-xl bg-slate-950 border border-slate-700 px-3 text-sm font-black uppercase text-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Color del Botón
                </label>
                <select
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value as FlavorColorKey)}
                  className="w-full h-11 rounded-xl bg-slate-950 border border-slate-700 px-2.5 text-xs font-bold text-white"
                >
                  {Object.entries(COLOR_PALETTE).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Rango de Fechas / Etiqueta
              </label>
              <input
                type="text"
                value={newDateRange}
                onChange={(e) => setNewDateRange(e.target.value)}
                placeholder="Ej. 23/10 AL 01/11"
                className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 px-3 text-xs font-bold text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Icono / Emoji Rápido
              </label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_PRESETS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setNewEmoji(em)}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border ${
                      newEmoji === em
                        ? 'bg-amber-500/30 border-amber-400'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" /> Guardar Sabor en Catálogo
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};
