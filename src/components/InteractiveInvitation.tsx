import React, { useState, useEffect } from 'react';
import { EventSettings, GuestRecord } from '../types';
import { soundEngine, downloadCalendarIcs } from '../utils/soundEffects';

interface InteractiveInvitationProps {
  event: EventSettings;
  selectedGuest: GuestRecord | null;
  onRsvpSuccess: (data: {
    guest: GuestRecord;
    guests: GuestRecord[];
    message: string;
  }) => void;
}

const SHARD_CLASSES = [
  'shard-1 bg-victorian-crimson w-3 h-3 rounded-sm',
  'shard-2 bg-victorian-gold w-2.5 h-2.5 rounded-full',
  'shard-3 bg-victorian-darkRed w-3.5 h-2.5 rounded-sm',
  'shard-4 bg-victorian-crimson w-3 h-3 rounded-sm',
  'shard-5 bg-victorian-gold w-2 h-2 rounded-full',
  'shard-6 bg-victorian-darkRed w-3 h-3 rounded-sm',
  'shard-7 bg-victorian-crimson w-2.5 h-3.5 rounded-sm',
  'shard-8 bg-victorian-gold w-2.5 h-2.5 rounded-sm',
  'shard-9 bg-victorian-darkRed w-2.5 h-2.5 rounded-sm',
  'shard-10 bg-victorian-crimson w-3 h-2 rounded-sm',
  'shard-11 bg-victorian-gold w-2 h-2 rounded-full',
  'shard-12 bg-victorian-darkRed w-3 h-2.5 rounded-sm',
];

export const InteractiveInvitation: React.FC<InteractiveInvitationProps> = ({
  event,
  selectedGuest,
  onRsvpSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isBreakingSeal, setIsBreakingSeal] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [riddleFeedback, setRiddleFeedback] = useState<{
    text: string;
    isCorrect: boolean | null;
  }>({ text: '', isCorrect: null });
  const [wrongOptionClicked, setWrongOptionClicked] = useState<string | null>(null);

  // RSVP fields: Nombre, Teléfono, Correo y Check de deseo recibir actualizaciones
  const [guestNameInput, setGuestNameInput] = useState(
    selectedGuest ? selectedGuest.name : 'Lord / Lady Invitado'
  );
  const [rsvpPhone, setRsvpPhone] = useState(selectedGuest?.phone || '');
  const [rsvpEmail, setRsvpEmail] = useState(selectedGuest?.email || '');
  const [rsvpSubscribed, setRsvpSubscribed] = useState<boolean>(
    selectedGuest ? selectedGuest.subscribed_updates : true
  );
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);

  const [rsvpFeedbackModal, setRsvpFeedbackModal] = useState<{
    title: string;
    body: string;
    icon: string;
  } | null>(null);

  useEffect(() => {
    if (selectedGuest) {
      setGuestNameInput(selectedGuest.name);
      setRsvpPhone(selectedGuest.phone || '');
      setRsvpEmail(selectedGuest.email || '');
      setRsvpSubscribed(selectedGuest.subscribed_updates);
      setStep(1);
      setIsBreakingSeal(false);
      setRiddleFeedback({ text: '', isCorrect: null });
    }
  }, [selectedGuest]);

  const handleToggleAudio = () => {
    const next = soundEngine.toggleAmbientTicking();
    setIsAudioPlaying(next);
  };

  const handleOpenEnvelope = () => {
    if (isBreakingSeal) return;
    setIsBreakingSeal(true);

    soundEngine.playWaxSealBreak();

    if (!soundEngine.getIsTicking()) {
      const playing = soundEngine.toggleAmbientTicking(true);
      setIsAudioPlaying(playing);
    }

    window.setTimeout(() => {
      setStep(2);
      setIsBreakingSeal(false);
    }, 820);
  };

  const handleCheckAnswer = (optionLetter: 'A' | 'B' | 'C') => {
    const isCorrect = optionLetter === (event.riddle_correct_option || 'B');
    if (isCorrect) {
      soundEngine.playBellChime();
      setRiddleFeedback({
        text: '¡Correcto! Las agujas de la Torre marcan el destino...',
        isCorrect: true,
      });
      setWrongOptionClicked(null);
      window.setTimeout(() => {
        setStep(3);
      }, 950);
    } else {
      soundEngine.playWaxSealBreak();
      setWrongOptionClicked(optionLetter);
      setRiddleFeedback({
        text: 'Respuesta incorrecta. Las sombras se mofan de tu equivocación. Inténtalo de nuevo.',
        isCorrect: false,
      });
    }
  };

  const handleSubmitRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestNameInput.trim() || !rsvpPhone.trim() || !rsvpEmail.trim()) {
      setRsvpFeedbackModal({
        title: 'Datos Incompletos',
        body: 'Por favor confirma tu nombre, teléfono y correo electrónico para registrar tu asistencia en el Grimorio.',
        icon: 'fa-triangle-exclamation',
      });
      return;
    }

    setIsSubmittingRsvp(true);
    try {
      const response = await fetch('/api.php?action=rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_id: selectedGuest?.id || null,
          slug: selectedGuest?.slug || '',
          name: guestNameInput.trim(),
          phone: rsvpPhone.trim(),
          email: rsvpEmail.trim(),
          status: 'confirmed',
          subscribed_updates: rsvpSubscribed,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'No se pudo registrar la confirmación.');
      }

      soundEngine.playBellChime();
      onRsvpSuccess({
        guest: data.guest,
        guests: data.guests,
        message: data.message,
      });

      setRsvpFeedbackModal({
        title: '¡Asistencia Registrada!',
        body: `Tu presencia ha sido anotada en el Grimorio oficial de Ravenswood Bluff, ${guestNameInput.trim()}. Que la suerte esté de tu lado cuando suenen las campanas.`,
        icon: 'fa-user-check',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ocurrió un error al confirmar.';
      setRsvpFeedbackModal({
        title: 'Aviso de la Torre',
        body: msg,
        icon: 'fa-circle-exclamation',
      });
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  const handleAddToCalendar = () => {
    downloadCalendarIcs(event, guestNameInput);
    setRsvpFeedbackModal({
      title: 'Evento Agendado',
      body: 'Se ha descargado el recordatorio para tu calendario. No olvides llevar tu astucia y el mejor disfraz de la velada.',
      icon: 'fa-calendar-check',
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 my-auto relative z-10 select-none">
      {/* Floating Audio Toggle Control (Bottom Right, identical to reference HTML) */}
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

      {/* MAIN 3-STEP INVITATION CARD */}
      <div className="w-full max-w-2xl">
        {/* STEP 1: SEALED ENVELOPE FRONT */}
        {step === 1 && (
          <div
            onClick={handleOpenEnvelope}
            className={`paper-texture rounded-lg border-2 border-victorian-gold/60 p-8 sm:p-12 text-center text-stone-900 gothic-glow cursor-pointer transition-all duration-300 relative overflow-hidden group ${
              isBreakingSeal ? 'animate-envelope-unfold pointer-events-none' : ''
            }`}
          >
            {/* Envelope Corner Ornaments */}
            <div className="absolute top-3 left-3 border-t-2 border-l-2 border-victorian-darkRed w-8 h-8 pointer-events-none" />
            <div className="absolute top-3 right-3 border-t-2 border-r-2 border-victorian-darkRed w-8 h-8 pointer-events-none" />
            <div className="absolute bottom-3 left-3 border-b-2 border-l-2 border-victorian-darkRed w-8 h-8 pointer-events-none" />
            <div className="absolute bottom-3 right-3 border-b-2 border-r-2 border-victorian-darkRed w-8 h-8 pointer-events-none" />

            <p className="font-gothic text-xs tracking-[0.3em] uppercase text-victorian-darkRed font-bold mb-2">
              Confidencial &bull; Exclusivo
            </p>

            <h1 className="font-title text-2xl sm:text-4xl text-victorian-darkRed font-black mb-4 tracking-wider leading-tight">
              Para los Ojos de
              <br />
              <span className="underline decoration-victorian-gold decoration-2 underline-offset-4 block mt-1">
                {guestNameInput}
              </span>
            </h1>

            {/* Clocktower Emblem */}
            <div className="my-6 flex justify-center items-center">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <i
                  className={`fa-solid fa-clock-rotate-left text-6xl text-victorian-darkRed/80 transition duration-500 ${
                    isBreakingSeal ? 'scale-125 text-victorian-crimson' : 'group-hover:scale-110'
                  }`}
                />
              </div>
            </div>

            <p className="font-serifText italic text-sm sm:text-base text-stone-800 mb-8 max-w-md mx-auto">
              "Rómpase el sello únicamente si se atreve a enfrentarse a las sombras tras el repicar de la medianoche."
            </p>

            {/* Wax Seal Interactive Container with Shatter & Particle Effect */}
            <div className="inline-flex flex-col items-center gap-2 relative">
              <div className="relative w-24 h-24 flex items-center justify-center">
                {isBreakingSeal && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400/80 via-red-600/70 to-amber-300/80 blur-md animate-seal-flash pointer-events-none" />
                )}

                {isBreakingSeal &&
                  SHARD_CLASSES.map((shardCls, idx) => (
                    <span
                      key={idx}
                      className={`absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 animate-shard pointer-events-none shadow-md ${shardCls}`}
                    />
                  ))}

                {!isBreakingSeal ? (
                  <div className="wax-seal w-20 h-20 rounded-full flex items-center justify-center text-victorian-paper font-title text-xl font-bold border-2 border-amber-300/40 cursor-pointer shadow-2xl relative">
                    <i className="fa-solid fa-skull text-2xl" />
                  </div>
                ) : (
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <div className="wax-seal seal-half-left animate-seal-left absolute inset-0 rounded-full flex items-center justify-center text-victorian-paper border-2 border-amber-300/60 shadow-2xl">
                      <i className="fa-solid fa-skull text-2xl" />
                    </div>
                    <div className="wax-seal seal-half-right animate-seal-right absolute inset-0 rounded-full flex items-center justify-center text-victorian-paper border-2 border-amber-300/60 shadow-2xl">
                      <i className="fa-solid fa-skull text-2xl" />
                    </div>
                    <svg
                      viewBox="0 0 100 100"
                      className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_0_8px_rgba(255,200,50,0.95)]"
                    >
                      <polyline
                        points="54,2 44,26 58,50 42,75 55,98"
                        fill="none"
                        stroke="#f3cf55"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>

              <span className="font-gothic text-xs tracking-widest text-victorian-darkRed uppercase font-bold mt-1 animate-pulse">
                {isBreakingSeal
                  ? '¡Sello Roto • Abriendo Pergamino!'
                  : '[ Haz Clic Para Romper el Sello ]'}
              </span>
            </div>
          </div>
        )}

        {/* STEP 2: THE RIDDLE */}
        {step === 2 && (
          <div className="animate-parchment-reveal paper-texture rounded-lg border-2 border-victorian-gold/60 p-6 sm:p-10 text-stone-900 gothic-glow transition-all duration-300 relative">
            <div className="text-center border-b-2 border-victorian-darkRed/30 pb-4 mb-6">
              <span className="font-gothic text-xs tracking-[0.2em] text-victorian-crimson uppercase font-bold">
                El Primer Desafío de Ravenswood
              </span>
              <h2 className="font-title text-xl sm:text-3xl text-victorian-darkRed font-bold mt-1">
                El Acertijo de la Torre
              </h2>
            </div>

            <div className="text-center my-6 space-y-5">
              <p className="font-serifText italic text-stone-800 text-base sm:text-lg">
                Escuchas el tictac distante en la penumbra, <strong>{guestNameInput}</strong>... Uno de nosotros guarda un secreto mortal. Si deseas sobrevivir a la velada y descubrir tu pase de entrada, responde:
              </p>

              {/* Riddle Box */}
              <div className="bg-stone-900/10 border border-victorian-darkRed/30 p-5 sm:p-6 rounded-lg my-6 text-center shadow-inner">
                <blockquote className="font-gothic text-stone-900 font-semibold text-lg sm:text-xl leading-relaxed italic whitespace-pre-line">
                  "{event.riddle_question}"
                </blockquote>
              </div>

              {/* Interactive Answer Options */}
              <div className="space-y-3 max-w-md mx-auto pt-2">
                <p className="font-gothic text-xs uppercase tracking-wider text-stone-700 font-bold mb-2">
                  Selecciona tu respuesta:
                </p>

                {(
                  [
                    { letter: 'A', label: event.riddle_option_a, icon: 'fa-ghost' },
                    { letter: 'B', label: event.riddle_option_b, icon: 'fa-check' },
                    { letter: 'C', label: event.riddle_option_c, icon: 'fa-hat-wizard' },
                  ] as const
                ).map((opt) => {
                  const isWrong = wrongOptionClicked === opt.letter;
                  return (
                    <button
                      key={opt.letter}
                      type="button"
                      onClick={() => handleCheckAnswer(opt.letter)}
                      className={`w-full py-3 px-4 rounded-md font-gothic font-semibold transition text-sm flex items-center justify-between group cursor-pointer ${
                        isWrong
                          ? 'bg-red-950/20 border border-red-600 text-red-950'
                          : 'bg-stone-800/10 hover:bg-victorian-darkRed hover:text-victorian-paper border border-victorian-darkRed/40 text-stone-900'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <i
                        className={`fa-solid ${opt.icon} opacity-0 group-hover:opacity-100 transition`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Feedback Message */}
              {riddleFeedback.text && (
                <div
                  className={`min-h-6 font-gothic text-sm font-bold mt-4 transition-opacity duration-200 ${
                    riddleFeedback.isCorrect ? 'text-emerald-800' : 'text-victorian-crimson'
                  }`}
                >
                  {riddleFeedback.text}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: FULL INVITATION DETAILS & RSVP REGISTRATION */}
        {step === 3 && (
          <div className="animate-parchment-reveal paper-texture rounded-lg border-2 border-victorian-gold/80 p-6 sm:p-10 text-stone-900 gothic-glow transition-all duration-300 relative">
            <div className="border-2 border-victorian-darkRed/40 p-4 sm:p-6 rounded-md relative">
              {/* Header */}
              <div className="text-center border-b-2 border-victorian-darkRed/30 pb-4 mb-6">
                <div className="inline-block p-2.5 bg-victorian-darkRed text-victorian-gold rounded-full mb-2 shadow-md">
                  <i className="fa-solid fa-dungeon text-xl" />
                </div>
                <span className="block font-gothic text-xs tracking-[0.25em] text-victorian-crimson font-bold uppercase">
                  ¡Respuesta acertada!
                </span>
                <h2 className="font-title text-2xl sm:text-4xl text-victorian-darkRed font-black tracking-wide mt-1 max-w-xl mx-auto">
                  {event.event_title}
                </h2>
                <p className="font-gothic text-xs text-stone-700 tracking-widest mt-1 uppercase font-semibold">
                  {event.event_subtitle}
                </p>
              </div>

              {/* Invitation Body */}
              <p className="font-serifText text-base sm:text-lg text-stone-800 text-center leading-relaxed mb-6">
                Has probado tu agudeza mental, <strong>{guestNameInput}</strong>. Quedas formalmente convocado/a a una velada inmersiva de engaño, deducción, conspiración y juegos de estrategia en las penumbras de Halloween.
              </p>

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                {/* Date */}
                <div className="bg-stone-900/5 p-4 rounded border border-victorian-darkRed/20 flex items-start gap-3">
                  <i className="fa-solid fa-calendar-days text-victorian-crimson text-xl mt-1" />
                  <div>
                    <span className="block font-gothic text-xs font-bold uppercase text-victorian-darkRed">
                      ¿Cuándo?
                    </span>
                    <span className="font-serifText font-bold text-stone-900 text-sm sm:text-base">
                      {event.event_date}
                    </span>
                  </div>
                </div>

                {/* Time */}
                <div className="bg-stone-900/5 p-4 rounded border border-victorian-darkRed/20 flex items-start gap-3">
                  <i className="fa-solid fa-hourglass-half text-victorian-crimson text-xl mt-1" />
                  <div>
                    <span className="block font-gothic text-xs font-bold uppercase text-victorian-darkRed">
                      ¿Hora de Convocatoria?
                    </span>
                    <span className="font-serifText font-bold text-stone-900 text-sm sm:text-base">
                      {event.event_time}
                    </span>
                  </div>
                </div>

                {/* Location + Google Maps Link */}
                <div className="bg-stone-900/5 p-4 rounded border border-victorian-darkRed/20 flex items-start gap-3 sm:col-span-2">
                  <i className="fa-solid fa-location-dot text-victorian-crimson text-xl mt-1" />
                  <div className="w-full">
                    <span className="block font-gothic text-xs font-bold uppercase text-victorian-darkRed">
                      ¿Lugar de Reunión?
                    </span>
                    <span className="font-serifText font-bold text-stone-900 text-sm sm:text-base block">
                      {event.event_location}
                    </span>
                    {event.event_maps_url && (
                      <a
                        href={event.event_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 text-xs font-gothic font-bold text-victorian-crimson hover:text-victorian-darkRed underline underline-offset-4"
                      >
                        <i className="fa-solid fa-map-location-dot" />
                        <span>Ver ubicación en Google Maps</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Dress Code */}
                <div className="bg-stone-900/5 p-4 rounded border border-victorian-darkRed/20 flex items-start gap-3 sm:col-span-2">
                  <i className="fa-solid fa-mask text-victorian-crimson text-xl mt-1" />
                  <div>
                    <span className="block font-gothic text-xs font-bold uppercase text-victorian-darkRed">
                      Código de Vestimenta (Disfraz)
                    </span>
                    <span className="font-serifText text-stone-900 text-sm block mt-0.5">
                      {event.dress_code}
                    </span>
                  </div>
                </div>
              </div>

              {/* Role Assignment Card */}
              <div className="bg-victorian-darkRed text-victorian-paper p-4 rounded-lg shadow-md mb-6 text-center border border-victorian-gold/40">
                <i className="fa-solid fa-scroll text-victorian-gold text-2xl mb-1" />
                <h3 className="font-title text-sm tracking-wider uppercase text-victorian-gold">
                  Tu Misión en el Pueblo
                </h3>
                <p className="font-serifText text-xs sm:text-sm italic opacity-90 mt-1">
                  "Ven preparado/a para deducir, mentir sin piedad o descubrir al demonio entre nosotros. Se servirán brebajes y vituallas."
                </p>
              </div>

              {/* RSVP FORM: Nombre, Teléfono, Correo y Check de Actualizaciones */}
              <form
                onSubmit={handleSubmitRsvp}
                className="bg-stone-900/10 border border-victorian-darkRed/30 rounded-lg p-5 space-y-4 mb-4 select-text"
              >
                <div className="border-b border-victorian-darkRed/20 pb-2 text-center sm:text-left">
                  <h3 className="font-title text-base sm:text-lg text-victorian-darkRed font-bold">
                    Confirmación de Asistencia
                  </h3>
                  <p className="font-serifText text-xs text-stone-700">
                    Completa tus datos para anotar tu sello en el Grimorio de la velada:
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block font-gothic text-xs font-bold uppercase text-victorian-darkRed mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={guestNameInput}
                      onChange={(e) => setGuestNameInput(e.target.value)}
                      placeholder="Ej. Lord Manuel"
                      className="w-full bg-victorian-paper border border-victorian-darkRed/40 rounded px-3.5 py-2.5 text-sm text-stone-900 font-serifText font-semibold focus:outline-none focus:border-victorian-crimson"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-gothic text-xs font-bold uppercase text-victorian-darkRed mb-1">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        required
                        value={rsvpPhone}
                        onChange={(e) => setRsvpPhone(e.target.value)}
                        placeholder="Ej. 0412-0000000"
                        className="w-full bg-victorian-paper border border-victorian-darkRed/40 rounded px-3.5 py-2.5 text-sm text-stone-900 font-serifText focus:outline-none focus:border-victorian-crimson"
                      />
                    </div>

                    <div>
                      <label className="block font-gothic text-xs font-bold uppercase text-victorian-darkRed mb-1">
                        Correo *
                      </label>
                      <input
                        type="email"
                        required
                        value={rsvpEmail}
                        onChange={(e) => setRsvpEmail(e.target.value)}
                        placeholder="tucorreo@ejemplo.com"
                        className="w-full bg-victorian-paper border border-victorian-darkRed/40 rounded px-3.5 py-2.5 text-sm text-stone-900 font-serifText focus:outline-none focus:border-victorian-crimson"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rsvpSubscribed}
                      onChange={(e) => setRsvpSubscribed(e.target.checked)}
                      className="w-4 h-4 accent-victorian-darkRed rounded"
                    />
                    <span className="font-serifText text-sm text-stone-800 font-medium">
                      Deseo recibir actualizaciones
                    </span>
                  </label>
                </div>

                {/* Interactive Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
                  <button
                    type="submit"
                    disabled={isSubmittingRsvp}
                    className="w-full sm:w-auto px-8 py-3 bg-victorian-darkRed hover:bg-victorian-crimson text-victorian-paper font-gothic font-bold text-sm tracking-widest uppercase rounded shadow-xl border border-victorian-gold transition duration-300 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
                  >
                    <i className="fa-solid fa-check-double text-victorian-gold group-hover:scale-125 transition" />
                    <span>
                      {isSubmittingRsvp
                        ? 'Registrando...'
                        : 'Confirmar Asistencia (RSVP)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddToCalendar}
                    className="w-full sm:w-auto px-6 py-3 bg-stone-800/20 hover:bg-stone-800/40 text-stone-900 font-gothic font-semibold text-xs tracking-wider uppercase rounded border border-victorian-darkRed/40 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <i className="fa-solid fa-calendar-plus text-victorian-darkRed" />
                    <span>Agendar Evento</span>
                  </button>
                </div>
              </form>

              {/* Footer Note */}
              <p className="text-center font-gothic text-[10px] uppercase text-stone-600 tracking-widest mt-6">
                Organizado bajo el sello del Narrador del Grimorio
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Message Container */}
      {rsvpFeedbackModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-victorian-midnight border-2 border-victorian-gold rounded-lg max-w-md w-full p-6 text-center text-victorian-paper shadow-2xl relative">
            <div className="w-16 h-16 bg-victorian-darkRed rounded-full flex items-center justify-center mx-auto mb-4 border border-victorian-gold">
              <i className={`fa-solid ${rsvpFeedbackModal.icon} text-2xl text-victorian-gold`} />
            </div>
            <h3 className="font-title text-xl text-victorian-gold mb-2">
              {rsvpFeedbackModal.title}
            </h3>
            <p className="font-serifText text-sm opacity-90 mb-6 leading-relaxed">
              {rsvpFeedbackModal.body}
            </p>
            <button
              type="button"
              onClick={() => setRsvpFeedbackModal(null)}
              className="px-6 py-2 bg-victorian-darkRed hover:bg-victorian-crimson border border-victorian-gold text-victorian-paper font-gothic text-xs uppercase tracking-widest rounded transition cursor-pointer"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
