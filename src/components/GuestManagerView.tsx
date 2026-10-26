import React, { useState } from 'react';
import { EventSettings, GuestRecord } from '../types';

interface GuestManagerViewProps {
  event: EventSettings;
  guests: GuestRecord[];
  onRefreshData: (guests: GuestRecord[], event?: EventSettings) => void;
  onOpenGuestEnvelope: (guest: GuestRecord) => void;
}

export const GuestManagerView: React.FC<GuestManagerViewProps> = ({
  event,
  guests,
  onRefreshData,
  onOpenGuestEnvelope,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | GuestRecord['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Add new guest state
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  const filteredGuests = guests.filter((g) => {
    const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      g.name.toLowerCase().includes(q) ||
      (g.email && g.email.toLowerCase().includes(q)) ||
      (g.phone && g.phone.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const confirmedCount = guests.filter((g) => g.status === 'confirmed').length;
  const pendingCount = guests.filter((g) => g.status === 'pending').length;
  const subscribedCount = guests.filter((g) => g.subscribed_updates && g.email).length;

  const getPersonalizedUrl = (guest: GuestRecord) => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}/?invitado=${encodeURIComponent(guest.slug)}`;
  };

  const handleCopyPersonalizedLink = (guest: GuestRecord) => {
    const url = getPersonalizedUrl(guest);
    navigator.clipboard.writeText(url);
    setCopiedId(guest.id);
    setActionBanner(`Enlace personalizado copiado para ${guest.name}: ${url}`);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === guest.id ? null : prev));
    }, 2500);
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsCreating(true);
    setActionBanner(null);

    try {
      const res = await fetch('/api.php?action=create_invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        onRefreshData(data.guests);
        setNewName('');
        setActionBanner(`Invitación personalizada creada para ${data.guest.name}.`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusChange = async (guest: GuestRecord, nextStatus: GuestRecord['status']) => {
    const res = await fetch('/api.php?action=update_guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: guest.id, status: nextStatus }),
    });
    const data = await res.json();
    if (data.ok) {
      onRefreshData(data.guests);
    }
  };

  const handleDeleteGuest = async (guest: GuestRecord) => {
    const res = await fetch('/api.php?action=delete_guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: guest.id }),
    });
    const data = await res.json();
    if (data.ok) {
      onRefreshData(data.guests);
      setActionBanner(`${guest.name} fue retirado de la lista.`);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Top Summary Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-victorian-midnight/90 border border-victorian-gold/30 rounded-lg p-5">
          <span className="block font-gothic text-xs text-victorian-paper/70">
            Total de Invitaciones
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold text-victorian-gold tabular-nums">
              {guests.length}
            </span>
            <span className="text-xs font-serifText text-victorian-paper/65">
              Enlaces únicos
            </span>
          </div>
        </div>

        <div className="bg-victorian-midnight/90 border border-victorian-gold/30 rounded-lg p-5">
          <span className="block font-gothic text-xs text-victorian-paper/70">
            Asistencia Confirmada
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold text-emerald-400 tabular-nums">
              {confirmedCount}
            </span>
            <span className="text-xs font-serifText text-victorian-paper/65">
              En el Grimorio
            </span>
          </div>
        </div>

        <div className="bg-victorian-midnight/90 border border-victorian-gold/30 rounded-lg p-5">
          <span className="block font-gothic text-xs text-victorian-paper/70">
            Pendientes por Responder
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold text-amber-400 tabular-nums">
              {pendingCount}
            </span>
            <span className="text-xs font-serifText text-victorian-paper/65">
              Sobres por abrir
            </span>
          </div>
        </div>

        <div className="bg-victorian-midnight/90 border border-victorian-gold/30 rounded-lg p-5">
          <span className="block font-gothic text-xs text-victorian-paper/70">
            Suscritos a Actualizaciones
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold text-victorian-paper tabular-nums">
              {subscribedCount}
            </span>
            <span className="text-xs font-serifText text-victorian-paper/65">
              Con correo registrado
            </span>
          </div>
        </div>
      </section>

      {actionBanner && (
        <div className="bg-victorian-darkRed/80 border border-victorian-gold/60 rounded-lg px-4 py-3 text-sm font-serifText text-victorian-paper flex items-center justify-between gap-4">
          <span className="break-all">
            <i className="fa-solid fa-scroll text-victorian-gold mr-2" />
            {actionBanner}
          </span>
          <button
            type="button"
            onClick={() => setActionBanner(null)}
            className="text-xs text-victorian-gold hover:underline shrink-0 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Guests Table & Personalized Links */}
      <section className="bg-victorian-midnight/90 border border-victorian-gold/30 rounded-lg p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="font-title text-xl sm:text-2xl text-victorian-gold">
              Lista Oficial de Invitados y Enlaces Personalizados ({filteredGuests.length})
            </h1>
            <p className="font-serifText text-sm text-victorian-paper/75">
              Cada invitado cuenta con su propio enlace único con las 3 etapas de la invitación. Copia el enlace para enviarlo a cada asistente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar invitado..."
              className="bg-stone-950 border border-stone-700 rounded px-3 py-1.5 text-xs text-victorian-paper font-serifText w-52 focus:outline-none focus:border-victorian-gold"
            />

            <div className="flex items-center gap-1 p-1 bg-stone-950 border border-stone-800 rounded-lg">
              {(
                [
                  { id: 'all', label: 'Todos' },
                  { id: 'confirmed', label: 'Confirmados' },
                  { id: 'pending', label: 'Pendientes' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1 text-xs font-gothic rounded transition whitespace-nowrap shrink-0 cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-victorian-crimson text-victorian-paper font-bold'
                      : 'text-victorian-paper/65 hover:text-victorian-gold'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Guest Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-victorian-gold/25 text-xs font-gothic text-victorian-gold">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Invitado</th>
                <th className="py-3 px-3">Teléfono y Correo</th>
                <th className="py-3 px-3">Actualizaciones</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3 text-right">Enlace Personalizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80 text-sm font-serifText">
              {filteredGuests.map((guest, index) => (
                <tr key={guest.id} className="hover:bg-stone-900/60 transition">
                  <td className="py-3 px-3 font-mono text-xs text-victorian-gold/80 tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-victorian-paper">{guest.name}</div>
                    <div className="text-xs text-victorian-paper/55 font-mono">
                      /?invitado={guest.slug}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-xs">
                    {guest.phone || guest.email ? (
                      <div className="space-y-0.5">
                        <div className="text-victorian-paper">
                          <i className="fa-solid fa-phone text-victorian-gold mr-1.5" />
                          {guest.phone || 'Sin teléfono'}
                        </div>
                        <div className="text-victorian-paper/75">
                          <i className="fa-solid fa-envelope text-victorian-gold mr-1.5" />
                          {guest.email || 'Sin correo'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-victorian-paper/45 italic">
                        Pendiente de registro
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-xs">
                    {guest.subscribed_updates ? (
                      <span className="text-emerald-400">Desea recibir avisos</span>
                    ) : (
                      <span className="text-victorian-paper/50">No suscrito</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <select
                      aria-label={`Estado de ${guest.name}`}
                      value={guest.status}
                      onChange={(e) =>
                        handleStatusChange(guest, e.target.value as GuestRecord['status'])
                      }
                      className={`bg-stone-950 border border-stone-700 rounded px-2.5 py-1 text-xs font-gothic focus:outline-none focus:border-victorian-gold ${
                        guest.status === 'confirmed'
                          ? 'text-emerald-400 font-bold'
                          : guest.status === 'declined'
                          ? 'text-red-400'
                          : 'text-amber-300'
                      }`}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="confirmed">Confirmado</option>
                      <option value="declined">No asistirá</option>
                    </select>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyPersonalizedLink(guest)}
                        className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-victorian-gold border border-victorian-gold/40 rounded text-xs font-gothic transition cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <i className="fa-solid fa-link mr-1.5" />
                        {copiedId === guest.id ? '¡Link Copiado!' : 'Copiar Link'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenGuestEnvelope(guest)}
                        className="px-3 py-1.5 bg-victorian-darkRed hover:bg-victorian-crimson text-victorian-paper border border-victorian-gold/50 rounded text-xs font-gothic transition cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Ver Invitación
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGuest(guest)}
                        title="Eliminar invitado"
                        className="px-2.5 py-1.5 bg-stone-900 hover:bg-red-950 text-stone-400 hover:text-red-300 border border-stone-700 rounded text-xs transition cursor-pointer"
                      >
                        <i className="fa-solid fa-trash-can" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Additional Guest */}
      <section className="bg-victorian-midnight/90 border border-victorian-gold/30 rounded-lg p-6">
        <h2 className="font-title text-lg text-victorian-gold mb-1">
          Agregar Nuevo Invitado a la Lista
        </h2>
        <p className="font-serifText text-xs text-victorian-paper/75 mb-4">
          Crea un enlace personalizado adicional para cualquier nuevo Lord o Lady convocado a la fiesta.
        </p>

        <form onSubmit={handleCreateInvite} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ej. Lord Gabriel y acompañante"
            className="flex-1 bg-stone-950 border border-stone-700 rounded px-3.5 py-2 text-sm text-victorian-paper font-serifText focus:outline-none focus:border-victorian-gold"
          />
          <button
            type="submit"
            disabled={isCreating}
            className="px-6 py-2 bg-victorian-crimson hover:bg-victorian-darkRed text-victorian-paper border border-victorian-gold/60 rounded font-gothic text-xs font-bold tracking-wider transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isCreating ? 'Agregando...' : 'Generar Enlace de Invitación'}
          </button>
        </form>
      </section>
    </div>
  );
};
