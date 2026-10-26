import React, { useState, useEffect, useCallback } from 'react';
import { EmailBroadcastRecord, EventSettings, GuestRecord } from './types';
import { InteractiveInvitation } from './components/InteractiveInvitation';
import { EventAndRolesView } from './components/EventAndRolesView';
import { GuestManagerView } from './components/GuestManagerView';
import { EmailCenterView } from './components/EmailCenterView';
import { soundEngine } from './utils/soundEffects';

const DEFAULT_EVENT: EventSettings = {
  id: 1,
  event_title: 'NOCHE DE JUICIO Y SOMBRAS',
  event_subtitle: 'Fiesta de Juegos de Mesa • Blood on the Clocktower',
  event_date: '31 de octubre.',
  event_time: '6:00pm (a las 8:00pm medianoche en el pueblo).',
  event_location: 'Av. Guzman Blanco, Res. La Veguita, Salón de Fiesta Edf. Los Monjes.',
  event_maps_url: 'https://maps.app.goo.gl/13u9kLx49EwfpbDT6',
  dress_code:
    'Gótico victoriano, aldeano sospechoso, demonio, o tu personaje emblemático de juego de mesa favorito.',
  script_edition: 'Trouble Brewing & Sects and Violets',
  storyteller_name: 'El Narrador del Grimorio',
  max_capacity: 25,
  riddle_question:
    'Tengo agujas pero no coso,\nmarco el tiempo del inocente y el reposo.\n¿Qué soy?',
  riddle_option_a: 'A) Un Reloj de la Villa',
  riddle_option_b: 'B) La Torre del Reloj',
  riddle_option_c: 'C) Una Bruja del Bosque',
  riddle_correct_option: 'B',
  updated_at: '2026-10-26 13:00:00',
};

type ViewMode = 'public_home' | 'guest_invitation' | 'backend_admin';
type AdminSubTab = 'guests' | 'emails';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('public_home');
  const [adminTab, setAdminTab] = useState<AdminSubTab>('guests');
  const [event, setEvent] = useState<EventSettings>(DEFAULT_EVENT);
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [emails, setEmails] = useState<EmailBroadcastRecord[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<GuestRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const fetchBootstrapData = useCallback(async () => {
    try {
      const res = await fetch('/api.php?action=bootstrap');
      const data = await res.json();
      if (data.ok) {
        if (data.event) setEvent(data.event);
        const loadedGuests: GuestRecord[] = Array.isArray(data.guests) ? data.guests : [];
        setGuests(loadedGuests);
        if (Array.isArray(data.emails)) setEmails(data.emails);

        const params = new URLSearchParams(window.location.search);
        const pathName = window.location.pathname.toLowerCase();
        const isBackendParam =
          params.has('admin') ||
          params.has('backend') ||
          params.get('panel') === 'narrador' ||
          pathName === '/admin' ||
          pathName === '/backend';

        const slugParam = (
          params.get('invitado') ||
          params.get('i') ||
          params.get('guest') ||
          ''
        )
          .trim()
          .toLowerCase();

        if (slugParam) {
          const matched = loadedGuests.find(
            (g) =>
              g.slug.toLowerCase() === slugParam ||
              g.invite_code.toLowerCase() === slugParam
          );
          setSelectedGuest(
            matched || {
              id: 0,
              slug: slugParam,
              invite_code: 'RAVENS-00',
              name: slugParam.replace(/-/g, ' '),
              phone: '',
              email: '',
              status: 'pending',
              plus_ones: 0,
              assigned_role: 'Aldeano',
              subscribed_updates: true,
              riddle_solved: false,
              responded_at: null,
              created_at: '',
            }
          );
          setViewMode('guest_invitation');
        } else if (isBackendParam) {
          setViewMode('backend_admin');
        } else {
          setViewMode('public_home');
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBootstrapData();
  }, [fetchBootstrapData]);

  const handleToggleAudio = () => {
    const next = soundEngine.toggleAmbientTicking();
    setIsAudioPlaying(next);
  };

  const enterBackendMode = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('invitado');
    url.searchParams.set('admin', 'grimorio');
    window.history.replaceState({}, '', url.toString());
    setViewMode('backend_admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const enterPublicHome = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('invitado');
    url.searchParams.delete('admin');
    url.searchParams.delete('backend');
    url.searchParams.delete('panel');
    window.history.replaceState({}, '', url.toString());
    setViewMode('public_home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenGuestEnvelope = (guest: GuestRecord) => {
    setSelectedGuest(guest);
    const url = new URL(window.location.href);
    url.searchParams.delete('admin');
    url.searchParams.set('invitado', guest.slug);
    window.history.replaceState({}, '', url.toString());
    setViewMode('guest_invitation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-victorian-night text-victorian-paper font-serifText flex flex-col relative overflow-x-hidden">
      {/* Visual Background: Lightning Storm, Fog, Embers & Clockwork Gothic Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Base Dark Vignette & Blood Moon Halo */}
        <div className="blood-moon-glow absolute -top-32 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(139,0,0,0.42)_0%,rgba(74,4,4,0.18)_45%,rgba(0,0,0,0)_72%)]" />

        {/* Drifting Crimson & Midnight Fog Layers */}
        <div className="fog-layer absolute inset-0 w-[130%] -left-[15%] opacity-35 bg-[radial-gradient(ellipse_at_30%_40%,rgba(139,0,0,0.32)_0%,rgba(0,0,0,0)_65%)]" />
        <div className="fog-layer-reverse absolute inset-0 w-[130%] -left-[15%] opacity-30 bg-[radial-gradient(ellipse_at_70%_65%,rgba(120,20,40,0.26)_0%,rgba(0,0,0,0)_65%)]" />

        {/* Periodic Storm Sky Flashes (Lightning Illumination) */}
        <div className="lightning-flash-primary absolute inset-0 bg-[radial-gradient(circle_at_22%_15%,rgba(220,230,255,0.28)_0%,rgba(139,0,0,0.16)_45%,rgba(10,8,13,0)_80%)]" />
        <div className="lightning-flash-secondary absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(235,220,255,0.24)_0%,rgba(160,20,20,0.14)_45%,rgba(10,8,13,0)_80%)]" />

        {/* Left Branching Lightning Bolt SVG */}
        <svg
          viewBox="0 0 260 600"
          className="lightning-bolt-1 absolute top-0 left-[4%] sm:left-[10%] w-44 sm:w-64 h-[75vh] drop-shadow-[0_0_18px_rgba(220,235,255,0.95)]"
          fill="none"
        >
          <path
            d="M140 0 L110 110 L145 125 L95 250 L130 265 L70 420 L105 435 L45 590"
            stroke="#eef4ff"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M110 110 L65 175 L40 230"
            stroke="#cbdcfb"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M95 250 L155 320 L185 385"
            stroke="#cbdcfb"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M70 420 L25 485"
            stroke="#cbdcfb"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>

        {/* Right Branching Lightning Bolt SVG */}
        <svg
          viewBox="0 0 260 600"
          className="lightning-bolt-2 absolute top-0 right-[4%] sm:right-[10%] w-44 sm:w-64 h-[70vh] drop-shadow-[0_0_18px_rgba(240,210,255,0.9)]"
          fill="none"
        >
          <path
            d="M120 0 L150 95 L115 115 L165 240 L125 255 L180 395 L140 415 L195 570"
            stroke="#f5efff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M150 95 L205 160 L225 215"
            stroke="#e2c6ff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M165 240 L95 310 L75 365"
            stroke="#e2c6ff"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>

        {/* Center-Upper Branching Lightning Bolt SVG */}
        <svg
          viewBox="0 0 260 600"
          className="lightning-bolt-3 absolute top-0 left-1/2 -translate-x-1/2 w-48 sm:w-72 h-[65vh] drop-shadow-[0_0_20px_rgba(255,215,215,0.95)]"
          fill="none"
        >
          <path
            d="M130 0 L105 90 L140 110 L90 225 L135 245 L85 380 L120 400 L75 540"
            stroke="#fff0f0"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M105 90 L55 150 L30 205"
            stroke="#fecaca"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M90 225 L160 295 L195 350"
            stroke="#fecaca"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>

        {/* Large Clockwork Gears Silhouette Background */}
        <div className="absolute -top-24 -right-24 w-96 h-96 sm:w-[480px] sm:h-[480px] opacity-[0.07] gear-spin border-8 border-dashed border-victorian-gold rounded-full flex items-center justify-center">
          <div className="w-3/4 h-3/4 border-4 border-victorian-gold border-dotted rounded-full flex items-center justify-center">
            <i className="fa-solid fa-gear text-9xl text-victorian-gold opacity-40" />
          </div>
        </div>

        <div className="absolute -bottom-20 -left-20 w-80 h-80 opacity-[0.06] gear-spin-rev border-4 border-victorian-gold rounded-full flex items-center justify-center">
          <i className="fa-solid fa-clock text-9xl text-victorian-gold" />
        </div>

        {/* Floating Glowing Embers & Ash Particles */}
        <span className="ember-particle ember-1 absolute w-1.5 h-1.5 rounded-full bg-victorian-gold shadow-[0_0_8px_#d4af37]" />
        <span className="ember-particle ember-2 absolute w-2 h-2 rounded-full bg-red-500/80 shadow-[0_0_10px_#dc2626]" />
        <span className="ember-particle ember-3 absolute w-1 h-1 rounded-full bg-amber-300 shadow-[0_0_6px_#fcd34d]" />
        <span className="ember-particle ember-4 absolute w-2 h-2 rounded-full bg-victorian-crimson shadow-[0_0_10px_#8b0000]" />
        <span className="ember-particle ember-5 absolute w-1.5 h-1.5 rounded-full bg-victorian-gold shadow-[0_0_8px_#d4af37]" />
        <span className="ember-particle ember-6 absolute w-1 h-1 rounded-full bg-red-400 shadow-[0_0_8px_#f87171]" />
        <span className="ember-particle ember-7 absolute w-2 h-2 rounded-full bg-amber-400/80 shadow-[0_0_10px_#fbbf24]" />
        <span className="ember-particle ember-8 absolute w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
        <span className="ember-particle ember-9 absolute w-1 h-1 rounded-full bg-victorian-gold shadow-[0_0_6px_#d4af37]" />
        <span className="ember-particle ember-10 absolute w-2 h-2 rounded-full bg-red-600/80 shadow-[0_0_10px_#dc2626]" />
        <span className="ember-particle ember-11 absolute w-1.5 h-1.5 rounded-full bg-amber-200 shadow-[0_0_8px_#fde68a]" />
        <span className="ember-particle ember-12 absolute w-1.5 h-1.5 rounded-full bg-red-500/90 shadow-[0_0_9px_#ef4444]" />

        {/* Deep Edge Vignette Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(5,3,8,0.85)_100%)]" />
      </div>

      {isLoading ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
          <div className="w-16 h-16 rounded-full border-2 border-victorian-gold/50 flex items-center justify-center mb-4">
            <i className="fa-solid fa-hourglass-half text-2xl text-victorian-gold animate-spin" />
          </div>
          <p className="font-gothic text-sm text-victorian-gold tracking-widest">
            Abriendo el Grimorio de Ravenswood Bluff...
          </p>
        </div>
      ) : viewMode === 'guest_invitation' ? (
        /* =====================================================================
           MODO 1: INVITACIÓN PERSONALIZADA A PANTALLA COMPLETA (NADA MÁS)
           ===================================================================== */
        <InteractiveInvitation
          event={event}
          selectedGuest={selectedGuest}
          onRsvpSuccess={({ guest, guests: updatedGuests }) => {
            setSelectedGuest(guest);
            setGuests(updatedGuests);
          }}
        />
      ) : viewMode === 'backend_admin' ? (
        /* =====================================================================
           MODO 3: PANEL BACKEND (GESTIÓN DE INVITADOS, LINKS Y CORREOS)
           ===================================================================== */
        <>
          <header className="relative z-30 flex items-center justify-between gap-8 px-6 py-4 bg-victorian-midnight/95 border-b border-victorian-gold/25">
            <a
              href="#admin"
              onClick={(e) => {
                e.preventDefault();
                setAdminTab('guests');
              }}
              className="font-title text-lg font-bold tracking-wider text-victorian-gold whitespace-nowrap shrink-0"
            >
              Grimorio Backend
            </a>

            <nav className="flex items-center gap-6 text-sm font-gothic text-victorian-paper/80">
              <a
                href="#guests"
                onClick={(e) => {
                  e.preventDefault();
                  setAdminTab('guests');
                }}
                className={`hover:text-victorian-gold hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
                  adminTab === 'guests' ? 'text-victorian-gold font-bold underline' : ''
                }`}
              >
                Gestión de Invitados ({guests.length})
              </a>
              <a
                href="#emails"
                onClick={(e) => {
                  e.preventDefault();
                  setAdminTab('emails');
                }}
                className={`hover:text-victorian-gold hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
                  adminTab === 'emails' ? 'text-victorian-gold font-bold underline' : ''
                }`}
              >
                Actualizaciones por Correo
              </a>
            </nav>

            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={enterPublicHome}
                className="px-4 py-2 text-xs font-gothic font-bold text-victorian-paper bg-stone-900 hover:bg-victorian-darkRed border border-victorian-gold/50 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Ver Página Principal
              </button>
            </div>
          </header>

          <main className="relative z-10 flex-1">
            {adminTab === 'guests' ? (
              <GuestManagerView
                event={event}
                guests={guests}
                onRefreshData={(updatedGuests, updatedEvent) => {
                  setGuests(updatedGuests);
                  if (updatedEvent) setEvent(updatedEvent);
                }}
                onOpenGuestEnvelope={handleOpenGuestEnvelope}
              />
            ) : (
              <EmailCenterView
                event={event}
                guests={guests}
                emails={emails}
                onBroadcastSent={(updatedEmails) => setEmails(updatedEmails)}
              />
            )}
          </main>
        </>
      ) : (
        /* =====================================================================
           MODO 2: PÁGINA PRINCIPAL PÚBLICA (SIN MENÚ, SOLO DATOS DEL EVENTO)
           ===================================================================== */
        <main className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
          <button
            type="button"
            onClick={handleToggleAudio}
            className="fixed bottom-4 right-4 z-50 bg-victorian-midnight/85 hover:bg-victorian-darkRed border border-victorian-gold/50 text-victorian-gold p-3 rounded-full shadow-2xl transition duration-300 flex items-center justify-center group cursor-pointer"
            title="Alternar Sonido de Fondo"
          >
            <i
              className={`fa-solid ${
                isAudioPlaying ? 'fa-volume-high animate-pulse' : 'fa-volume-xmark'
              } text-lg group-hover:scale-110 transition`}
            />
          </button>

          <EventAndRolesView event={event} />

          <button
            type="button"
            onClick={enterBackendMode}
            className="mt-2 text-victorian-paper/30 hover:text-victorian-gold transition cursor-pointer text-[11px] font-gothic"
            title="Panel de Gestión del Organizador"
          >
            <i className="fa-solid fa-key mr-1.5" />
            Acceso Backend
          </button>
        </main>
      )}
    </div>
  );
}
