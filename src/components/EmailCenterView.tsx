import React, { useState } from 'react';
import { EmailBroadcastRecord, EventSettings, GuestRecord } from '../types';
import { soundEngine } from '../utils/soundEffects';

interface EmailCenterViewProps {
  event: EventSettings;
  guests: GuestRecord[];
  emails: EmailBroadcastRecord[];
  onBroadcastSent: (emails: EmailBroadcastRecord[]) => void;
}

const EMAIL_TEMPLATES = [
  {
    id: 'invitation',
    label: '1. Convocatoria Inicial',
    subject: 'Convocatoria Oficial: Tu Sobre Sellado de Ravenswood Bluff ha llegado',
    body: `Has sido convocado/a formalmente a nuestra velada de Halloween de Blood on the Clocktower este 31 de octubre a las 6:00pm (a las 8:00pm medianoche en el pueblo).\n\nPor favor ingresa a tu enlace personalizado, rompe el sello de cera, resuelve el Acertijo de la Torre y confirma tu asistencia registrando tu teléfono y correo.`,
  },
  {
    id: 'rules_update',
    label: '2. Guía de Roles del Grimorio',
    subject: 'Actualización del Grimorio: Reglas y Roles en Ravenswood Bluff',
    body: `Las campanas de la Torre se preparan para sonar. Recuerda que durante la partida nadie queda eliminado de la velada: si caes durante la noche o por juicio del pueblo, seguirás participando como Fantasma con un último voto decisivo.\n\nCódigo de vestimenta: Gótico victoriano, aldeano sospechoso, demonio, o tu personaje emblemático de juego de mesa favorito.`,
  },
  {
    id: 'final_reminder',
    label: '3. Recordatorio de Llegada y Ubicación',
    subject: 'Último Repique: Te esperamos a las 6:00pm en Res. La Veguita',
    body: `Hoy es la noche del juicio. Te esperamos a partir de las 6:00pm (a las 8:00pm medianoche en el pueblo) en Av. Guzman Blanco, Res. La Veguita, Salón de Fiesta Edf. Los Monjes.\n\nUbicación en Google Maps: https://maps.app.goo.gl/13u9kLx49EwfpbDT6`,
  },
];

export const EmailCenterView: React.FC<EmailCenterViewProps> = ({
  event,
  guests,
  emails,
  onBroadcastSent,
}) => {
  const [audience, setAudience] = useState<'all_subscribed' | 'confirmed' | 'pending' | 'individual'>('all_subscribed');
  const [targetGuestId, setTargetGuestId] = useState<number>(guests[0]?.id || 1);
  const [templateType, setTemplateType] = useState('invitation');
  const [subject, setSubject] = useState(EMAIL_TEMPLATES[0].subject);
  const [bodyText, setBodyText] = useState(EMAIL_TEMPLATES[0].body);
  const [isSending, setIsSending] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<EmailBroadcastRecord | null>(null);

  const handleApplyTemplate = (tplId: string) => {
    const tpl = EMAIL_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    setTemplateType(tpl.id);
    setSubject(tpl.subject);
    setBodyText(tpl.body);
  };

  const getMatchingRecipients = () => {
    const subscribed = guests.filter((g) => g.subscribed_updates);
    if (audience === 'confirmed') {
      return subscribed.filter((g) => g.status === 'confirmed');
    }
    if (audience === 'pending') {
      return subscribed.filter((g) => g.status === 'pending');
    }
    if (audience === 'individual') {
      return guests.filter((g) => g.id === Number(targetGuestId));
    }
    return subscribed;
  };

  const matchingRecipients = getMatchingRecipients();
  const sampleRecipient = matchingRecipients[0] || guests[0];

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !bodyText.trim()) return;
    setIsSending(true);
    setSendFeedback(null);

    try {
      const res = await fetch('/api.php?action=send_broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          body_text: bodyText.trim(),
          audience,
          template_type: templateType,
          target_guest_id: audience === 'individual' ? targetGuestId : null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        soundEngine.playBellChime();
        onBroadcastSent(data.emails);
        setSendFeedback(data.message);
      } else {
        setSendFeedback(`Aviso: ${data.error}`);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Compose & Preview 2-Column Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left: Compose Broadcast Form */}
        <div className="lg:col-span-7 bg-victorian-midnight/90 border border-victorian-gold/30 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <p className="font-gothic text-xs tracking-widest text-victorian-gold mb-1">
              Mensajería del Grimorio · Avisos por Correo
            </p>
            <h1 className="font-title text-2xl text-victorian-paper mb-2">
              Enviar Actualizaciones del Evento
            </h1>
            <p className="font-serifText text-sm text-victorian-paper/75 mb-5">
              Envía comunicados oficiales sobre el evento, pistas del Grimorio o recordatorios de horario a los invitados que marcaron la casilla para recibir actualizaciones.
            </p>

            {/* Quick Template Selector */}
            <div className="mb-5">
              <span className="block font-gothic text-xs text-victorian-gold mb-2">
                Plantillas del Narrador:
              </span>
              <div className="flex flex-wrap gap-2">
                {EMAIL_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl.id)}
                    className={`px-3 py-1.5 rounded text-xs font-gothic border transition cursor-pointer whitespace-nowrap shrink-0 ${
                      templateType === tpl.id
                        ? 'bg-victorian-crimson text-victorian-paper border-victorian-gold/60 font-bold'
                        : 'bg-stone-950 text-victorian-paper/75 border-stone-700 hover:border-victorian-gold/40'
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <form id="broadcastForm" onSubmit={handleSendBroadcast} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-gothic text-xs text-victorian-gold mb-1">
                    Destinatarios
                  </label>
                  <select
                    value={audience}
                    onChange={(e) =>
                      setAudience(
                        e.target.value as 'all_subscribed' | 'confirmed' | 'pending' | 'individual'
                      )
                    }
                    className="w-full bg-stone-950 border border-stone-700 rounded px-3 py-2 text-sm text-victorian-paper font-serifText focus:outline-none focus:border-victorian-gold"
                  >
                    <option value="all_subscribed">
                      Todos los Suscritos ({guests.filter((g) => g.subscribed_updates).length})
                    </option>
                    <option value="confirmed">
                      Solo Confirmados (
                      {guests.filter((g) => g.subscribed_updates && g.status === 'confirmed').length}
                      )
                    </option>
                    <option value="pending">
                      Pendientes por Confirmar (
                      {guests.filter((g) => g.subscribed_updates && g.status === 'pending').length})
                    </option>
                    <option value="individual">Un Invitado Específico</option>
                  </select>
                </div>

                {audience === 'individual' ? (
                  <div>
                    <label className="block font-gothic text-xs text-victorian-gold mb-1">
                      Seleccionar Invitado
                    </label>
                    <select
                      value={targetGuestId}
                      onChange={(e) => setTargetGuestId(Number(e.target.value))}
                      className="w-full bg-stone-950 border border-stone-700 rounded px-3 py-2 text-sm text-victorian-paper font-serifText focus:outline-none focus:border-victorian-gold"
                    >
                      {guests.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} {g.email ? `(${g.email})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex flex-col justify-end">
                    <div className="bg-stone-950/90 border border-stone-800 rounded px-3 py-2 text-xs font-serifText text-victorian-paper/80">
                      Grupo seleccionado:{' '}
                      <strong className="font-mono text-victorian-gold tabular-nums">
                        {matchingRecipients.length}
                      </strong>{' '}
                      invitado(s).
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-gothic text-xs text-victorian-gold mb-1">
                  Asunto del Correo *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded px-3 py-2 text-sm text-victorian-paper font-serifText focus:outline-none focus:border-victorian-gold"
                />
              </div>

              <div>
                <label className="block font-gothic text-xs text-victorian-gold mb-1">
                  Mensaje del Comunicado *
                </label>
                <textarea
                  rows={5}
                  required
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded px-3 py-2 text-sm text-victorian-paper font-serifText focus:outline-none focus:border-victorian-gold"
                />
              </div>
            </form>
          </div>

          <div className="pt-4 mt-4 border-t border-victorian-gold/20 flex flex-wrap items-center justify-between gap-3">
            {sendFeedback ? (
              <span className="text-xs font-serifText text-emerald-400">
                <i className="fa-solid fa-circle-check mr-1.5" />
                {sendFeedback}
              </span>
            ) : (
              <span className="text-xs font-serifText text-victorian-paper/65">
                El correo incluirá la fecha, hora y ubicación exacta del evento.
              </span>
            )}

            <button
              type="submit"
              form="broadcastForm"
              disabled={isSending || matchingRecipients.length === 0}
              className="px-6 py-2.5 bg-victorian-crimson hover:bg-victorian-darkRed text-victorian-paper border border-victorian-gold rounded font-gothic font-bold text-xs tracking-wider transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <i className="fa-solid fa-paper-plane text-victorian-gold" />
              <span>
                {isSending
                  ? 'Enviando...'
                  : `Enviar Actualización por Correo (${matchingRecipients.length})`}
              </span>
            </button>
          </div>
        </div>

        {/* Right: Live Victorian Email Preview */}
        <div className="lg:col-span-5 bg-victorian-midnight/90 border border-victorian-gold/30 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-victorian-gold/20 pb-3 mb-4">
              <h2 className="font-title text-lg text-victorian-gold">
                Vista Previa del Correo
              </h2>
              <span className="font-gothic text-xs text-victorian-paper/60">
                Pergamino de Ravenswood
              </span>
            </div>

            <div className="paper-texture rounded-md border-2 border-victorian-gold/70 p-5 text-stone-900 text-sm space-y-3 shadow-xl">
              <div className="text-center border-b border-victorian-darkRed/30 pb-3">
                <p className="font-gothic text-[10px] tracking-[0.2em] text-victorian-crimson font-bold uppercase">
                  Ravenswood Bluff · Comunicado Oficial
                </p>
                <h3 className="font-title text-lg text-victorian-darkRed font-bold mt-1">
                  {subject || 'Sin Asunto'}
                </h3>
              </div>

              <p className="font-serifText text-xs text-stone-800">
                Estimado/a <strong>{sampleRecipient?.name || 'Lord / Lady'}</strong>,
              </p>

              <div className="font-serifText text-xs sm:text-sm text-stone-900 whitespace-pre-line leading-relaxed">
                {bodyText}
              </div>

              <div className="bg-stone-900/10 border border-victorian-darkRed/25 p-3 rounded text-xs font-serifText space-y-1">
                <div>
                  <strong>Fecha:</strong> {event.event_date}
                </div>
                <div>
                  <strong>Hora:</strong> {event.event_time}
                </div>
                <div>
                  <strong>Lugar:</strong> {event.event_location}
                </div>
              </div>

              <p className="text-center font-gothic text-[10px] text-stone-700 tracking-wider pt-2 border-t border-victorian-darkRed/20">
                Organizado bajo el sello del Narrador del Grimorio
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-victorian-gold/20 text-xs font-serifText text-victorian-paper/70">
            Vista previa para:{' '}
            <strong className="text-victorian-gold">
              {sampleRecipient ? sampleRecipient.name : 'Invitado'}
            </strong>
          </div>
        </div>
      </section>

      {/* Sent Emails History Log */}
      <section className="bg-victorian-midnight/90 border border-victorian-gold/30 rounded-lg p-6 space-y-4">
        <div>
          <h2 className="font-title text-xl text-victorian-gold">
            Historial de Comunicados Enviados ({emails.length})
          </h2>
          <p className="font-serifText text-xs text-victorian-paper/70">
            Registro de actualizaciones y confirmaciones enviadas a los invitados de la fiesta.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-victorian-gold/25 text-xs font-gothic text-victorian-gold">
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Asunto</th>
                <th className="py-3 px-3">Destinatarios</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3 text-right">Lectura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80 text-sm font-serifText">
              {emails.map((item) => (
                <tr key={item.id} className="hover:bg-stone-900/60 transition">
                  <td className="py-3 px-3 font-mono text-xs text-victorian-paper/75 tabular-nums whitespace-nowrap">
                    {item.sent_at}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-victorian-paper">{item.subject}</div>
                    <div className="text-xs text-victorian-paper/65 line-clamp-1">
                      {item.body_text}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-xs text-victorian-paper/80">
                    <span className="font-mono text-victorian-gold font-bold tabular-nums">
                      {item.recipients_count}
                    </span>{' '}
                    invitado(s)
                  </td>
                  <td className="py-3 px-3 text-xs text-emerald-400 font-gothic whitespace-nowrap">
                    <i className="fa-solid fa-check mr-1" />
                    {item.delivery_status}
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedLog(item)}
                      className="px-3 py-1 bg-stone-900 hover:bg-victorian-darkRed text-victorian-gold border border-victorian-gold/40 rounded text-xs font-gothic transition cursor-pointer"
                    >
                      Ver Mensaje
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal to view sent message */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-victorian-midnight border-2 border-victorian-gold rounded-lg max-w-xl w-full p-6 text-victorian-paper shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-victorian-gold/25 pb-3">
              <div>
                <span className="font-mono text-xs text-victorian-gold tabular-nums">
                  {selectedLog.sent_at}
                </span>
                <h3 className="font-title text-lg text-victorian-paper mt-1">
                  {selectedLog.subject}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-stone-400 hover:text-white px-2 py-1"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="paper-texture text-stone-900 p-5 rounded border border-victorian-gold font-serifText text-sm whitespace-pre-line leading-relaxed">
              {selectedLog.body_text}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-victorian-darkRed hover:bg-victorian-crimson text-victorian-paper border border-victorian-gold rounded font-gothic text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
