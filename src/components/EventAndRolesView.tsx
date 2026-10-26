import React from 'react';
import { EventSettings } from '../types';
import { downloadCalendarIcs } from '../utils/soundEffects';

interface EventAndRolesViewProps {
  event: EventSettings;
}

export const EventAndRolesView: React.FC<EventAndRolesViewProps> = ({ event }) => {
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8 flex flex-col items-center justify-center">
      {/* Official Event Coordinates Card */}
      <div className="w-full paper-texture border-2 border-victorian-gold/80 rounded-lg p-6 sm:p-10 text-stone-900 gothic-glow">
        <div className="border-2 border-victorian-darkRed/40 p-5 sm:p-6 rounded-md">
          <div className="text-center border-b-2 border-victorian-darkRed/30 pb-4 mb-6">
            <div className="inline-block p-2.5 bg-victorian-darkRed text-victorian-gold rounded-full mb-2 shadow-md">
              <i className="fa-solid fa-dungeon text-xl" />
            </div>
            <h1 className="font-title text-2xl sm:text-3xl text-victorian-darkRed font-black tracking-wide">
              Datos Oficiales del Evento
            </h1>
            <p className="font-gothic text-xs text-stone-700 tracking-widest mt-1 uppercase font-semibold">
              {event.event_subtitle}
            </p>
          </div>

          <div className="space-y-4">
            {/* Fecha */}
            <div className="bg-stone-900/5 p-4 rounded border border-victorian-darkRed/20 flex items-start gap-3">
              <i className="fa-solid fa-calendar-days text-victorian-crimson text-xl mt-0.5" />
              <div>
                <span className="block font-gothic text-xs font-bold uppercase text-victorian-darkRed">
                  Fecha
                </span>
                <span className="font-serifText font-bold text-stone-900 text-base">
                  {event.event_date}
                </span>
              </div>
            </div>

            {/* Hora */}
            <div className="bg-stone-900/5 p-4 rounded border border-victorian-darkRed/20 flex items-start gap-3">
              <i className="fa-solid fa-hourglass-half text-victorian-crimson text-xl mt-0.5" />
              <div>
                <span className="block font-gothic text-xs font-bold uppercase text-victorian-darkRed">
                  Hora de Convocatoria
                </span>
                <span className="font-serifText font-bold text-stone-900 text-base">
                  {event.event_time}
                </span>
              </div>
            </div>

            {/* Lugar */}
            <div className="bg-stone-900/5 p-4 rounded border border-victorian-darkRed/20 flex items-start gap-3">
              <i className="fa-solid fa-location-dot text-victorian-crimson text-xl mt-0.5" />
              <div>
                <span className="block font-gothic text-xs font-bold uppercase text-victorian-darkRed">
                  Lugar
                </span>
                <span className="font-serifText font-bold text-stone-900 text-sm sm:text-base block">
                  {event.event_location}
                </span>
              </div>
            </div>

            {/* Código de vestimenta */}
            <div className="bg-stone-900/5 p-4 rounded border border-victorian-darkRed/20 flex items-start gap-3">
              <i className="fa-solid fa-mask text-victorian-crimson text-xl mt-0.5" />
              <div>
                <span className="block font-gothic text-xs font-bold uppercase text-victorian-darkRed">
                  Código de Vestimenta
                </span>
                <span className="font-serifText text-stone-900 text-sm block mt-0.5">
                  {event.dress_code}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-victorian-darkRed/25 flex flex-col sm:flex-row items-center gap-3">
            <a
              href={event.event_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 py-3 px-4 bg-victorian-darkRed hover:bg-victorian-crimson text-victorian-paper border border-victorian-gold rounded font-gothic font-bold text-xs uppercase tracking-wider text-center transition flex items-center justify-center gap-2 shadow-lg"
            >
              <i className="fa-solid fa-map-location-dot text-victorian-gold" />
              <span>Abrir en Google Maps</span>
            </a>
            <button
              type="button"
              onClick={() => downloadCalendarIcs(event)}
              className="w-full sm:w-auto py-3 px-5 bg-stone-800/15 hover:bg-stone-800/30 text-stone-900 border border-victorian-darkRed/40 rounded font-gothic font-semibold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className="fa-solid fa-calendar-plus text-victorian-darkRed" />
              <span>Agendar Evento</span>
            </button>
          </div>

          <p className="text-center font-gothic text-[10px] uppercase text-stone-600 tracking-widest mt-6">
            Organizado bajo el sello del Narrador del Grimorio
          </p>
        </div>
      </div>
    </div>
  );
};
