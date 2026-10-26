import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'clocktower_prod_v2.json');

export interface EventSettings {
  id: number;
  event_title: string;
  event_subtitle: string;
  event_date: string;
  event_time: string;
  event_location: string;
  event_maps_url: string;
  dress_code: string;
  script_edition: string;
  storyteller_name: string;
  max_capacity: number;
  riddle_question: string;
  riddle_option_a: string;
  riddle_option_b: string;
  riddle_option_c: string;
  riddle_correct_option: 'A' | 'B' | 'C';
  updated_at: string;
}

export interface GuestRecord {
  id: number;
  slug: string;
  invite_code: string;
  name: string;
  phone: string;
  email: string;
  status: 'confirmed' | 'pending' | 'declined';
  plus_ones: number;
  assigned_role: string;
  subscribed_updates: boolean;
  riddle_solved: boolean;
  responded_at: string | null;
  created_at: string;
}

export interface EmailBroadcastRecord {
  id: number;
  subject: string;
  audience: string;
  template_type: string;
  body_text: string;
  recipients_count: number;
  recipients_list: string;
  delivery_status: string;
  sent_at: string;
  preview_html?: string;
}

interface DatabaseSchema {
  event: EventSettings;
  guests: GuestRecord[];
  emails: EmailBroadcastRecord[];
}

function slugifyName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildVictorianEmailHtml(
  subject: string,
  recipientName: string,
  bodyText: string,
  event: EventSettings
): string {
  const formattedBody = bodyText.replace(/\n/g, '<br/>');

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="margin:0;padding:20px;background-color:#0a080d;color:#f2e3c6;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto;background-color:#f2e3c6;color:#1c1917;border:2px solid #d4af37;border-radius:8px;">
    <tr>
      <td style="padding:24px 28px;text-align:center;border-bottom:2px solid #4a0404;">
        <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8b0000;font-weight:bold;">
          Ravenswood Bluff &bull; Comunicado Oficial del Grimorio
        </p>
        <h2 style="margin:8px 0 0;font-size:24px;color:#4a0404;">${event.event_title}</h2>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 28px;font-size:15px;line-height:1.6;color:#1c1917;">
        <p style="margin-top:0;">Estimado/a <strong>${recipientName}</strong>,</p>
        <div>${formattedBody}</div>
        <table width="100%" cellpadding="10" cellspacing="0" style="margin:20px 0;background-color:#e6d3b3;border:1px solid #4a0404;font-size:13px;">
          <tr>
            <td><strong>Fecha:</strong> ${event.event_date}</td>
            <td><strong>Hora:</strong> ${event.event_time}</td>
          </tr>
          <tr>
            <td colspan="2"><strong>Lugar:</strong> ${event.event_location}</td>
          </tr>
          <tr>
            <td colspan="2"><strong>Mapa:</strong> <a href="${event.event_maps_url}" style="color:#8b0000;">Ver ubicación en Google Maps</a></td>
          </tr>
        </table>
        <p style="font-style:italic;font-size:13px;color:#4a0404;text-align:center;margin-bottom:0;">
          "Ven preparado/a para deducir, mentir sin piedad o descubrir al demonio entre nosotros."
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:14px;background-color:#120f1a;color:#d4af37;text-align:center;font-size:11px;letter-spacing:2px;text-transform:uppercase;">
        Organizado bajo el sello del Narrador del Grimorio &bull; Blood on the Clocktower
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const INITIAL_GUEST_NAMES = [
  { name: 'Lord Manuel', role: 'El Diablillo (Imp)' },
  { name: 'Lady Angela', role: 'Adivino (Fortune Teller)' },
  { name: 'Lord Arturo', role: 'Cazador (Slayer)' },
  { name: 'Lord Carlos', role: 'Envenenador (Poisoner)' },
  { name: 'Lord José y acompañante', role: 'Émpata (Empath)' },
  { name: 'Lady Angie', role: 'Guardiana de Cuervos (Ravenkeeper)' },
  { name: 'Lord Oes', role: 'Monje (Monk)' },
  { name: 'Lady Mariela y acompañante', role: 'Mujer Escarlata (Scarlet Woman)' },
  { name: 'Lady Adriana y acompañante', role: 'Lavandera (Washerwoman)' },
  { name: 'Lady Fadia', role: 'Investigador (Investigator)' },
  { name: 'Lord Diego León', role: 'Espía (Spy)' },
  { name: 'Lord Diego Rodriguez', role: 'Alcalde (Mayor)' },
  { name: 'Lady Johanna', role: 'Bibliotecario (Librarian)' },
  { name: 'Lord Pedro', role: 'Cocinero (Chef)' },
  { name: 'Lord Fernando', role: 'Enterrador (Undertaker)' },
  { name: 'Lady Mariana', role: 'El Santo (Saint)' },
  { name: 'Lord Seth', role: 'Soldado (Soldier)' },
];

const initialSeedData: DatabaseSchema = {
  event: {
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
  },
  guests: INITIAL_GUEST_NAMES.map((item, idx) => {
    const slug = slugifyName(item.name);
    const hasCompanion = item.name.toLowerCase().includes('acompañante');
    return {
      id: idx + 1,
      slug,
      invite_code: `RAVENS-${String(idx + 1).padStart(2, '0')}`,
      name: item.name,
      phone: '',
      email: '',
      status: 'pending' as const,
      plus_ones: hasCompanion ? 1 : 0,
      assigned_role: item.role,
      subscribed_updates: true,
      riddle_solved: false,
      responded_at: null,
      created_at: '2026-10-26 13:00:00',
    };
  }),
  emails: [
    {
      id: 1,
      subject: 'Convocatoria Oficial: El Reloj de Ravenswood Bluff ha sonado',
      audience: 'all_subscribed',
      template_type: 'invitation',
      body_text:
        'Quedas formalmente convocado/a este 31 de octubre a las 6:00pm (a las 8:00pm medianoche en el pueblo) en Av. Guzman Blanco, Res. La Veguita, Salón de Fiesta Edf. Los Monjes. Abre tu enlace personalizado, rompe el sello de cera y confirma tu asistencia.',
      recipients_count: 17,
      recipients_list: 'Lista oficial de los 17 invitados de Ravenswood Bluff',
      delivery_status: 'Enviado',
      sent_at: '2026-10-26 13:00:00',
    },
  ],
};

function readDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialSeedData, null, 2), 'utf-8');
    return JSON.parse(JSON.stringify(initialSeedData));
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as DatabaseSchema;
  } catch {
    return JSON.parse(JSON.stringify(initialSeedData));
  }
}

function writeDb(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function formatNow(): string {
  const now = new Date();
  return now.toISOString().replace('T', ' ').slice(0, 19);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const handleApiAction = (action: string, req: express.Request, res: express.Response) => {
    const db = readDb();

    switch (action) {
      case 'bootstrap': {
        return res.json({
          ok: true,
          event: db.event,
          guests: db.guests,
          emails: db.emails,
        });
      }

      case 'rsvp': {
        const body = req.body || {};
        const guestId = body.guest_id ? Number(body.guest_id) : null;
        const slugInput = String(body.slug || '').trim().toLowerCase();
        const name = String(body.name || '').trim();
        const phone = String(body.phone || '').trim();
        const email = String(body.email || '').trim();
        const status = (body.status || 'confirmed') as GuestRecord['status'];
        const subscribedUpdates =
          body.subscribed_updates === undefined ? true : Boolean(body.subscribed_updates);

        if (!name || !phone || !email) {
          return res.status(400).json({
            ok: false,
            error: 'Por favor confirma tu nombre, teléfono y correo electrónico.',
          });
        }

        let guest = db.guests.find(
          (g) =>
            (guestId && g.id === guestId) ||
            (slugInput && g.slug === slugInput) ||
            g.name.toLowerCase() === name.toLowerCase()
        );

        const nowStr = formatNow();

        if (guest) {
          guest.name = name;
          guest.phone = phone;
          guest.email = email;
          guest.status = status;
          guest.subscribed_updates = subscribedUpdates;
          guest.riddle_solved = true;
          guest.responded_at = nowStr;
        } else {
          const nextId = db.guests.reduce((max, g) => Math.max(max, g.id), 0) + 1;
          const newSlug = slugifyName(name) || `invitado-${nextId}`;
          const hasCompanion = name.toLowerCase().includes('acompañante');
          guest = {
            id: nextId,
            slug: newSlug,
            invite_code: `RAVENS-${String(nextId).padStart(2, '0')}`,
            name,
            phone,
            email,
            status,
            plus_ones: hasCompanion ? 1 : 0,
            assigned_role: 'Aldeano de Ravenswood Bluff',
            subscribed_updates: subscribedUpdates,
            riddle_solved: true,
            responded_at: nowStr,
            created_at: nowStr,
          };
          db.guests.push(guest);
        }

        // Send confirmation email log if email is provided
        const emailSubject = `Confirmación Registrada — ${db.event.event_title}`;
        const emailBody = `Hola ${guest.name},\n\nTu asistencia para el ${db.event.event_date} a las ${db.event.event_time} ha quedado registrada en el Grimorio de Ravenswood Bluff.\n\nTeléfono registrado: ${guest.phone}\nRecibir actualizaciones por correo: ${guest.subscribed_updates ? 'Sí' : 'No'}`;

        const nextEmailId = db.emails.reduce((max, e) => Math.max(max, e.id), 0) + 1;
        const previewHtml = buildVictorianEmailHtml(
          emailSubject,
          guest.name,
          emailBody,
          db.event
        );

        db.emails.unshift({
          id: nextEmailId,
          subject: emailSubject,
          audience: 'individual_rsvp',
          template_type: 'rsvp_confirmation',
          body_text: emailBody,
          recipients_count: 1,
          recipients_list: guest.email,
          delivery_status: 'Confirmación Enviada',
          sent_at: nowStr,
          preview_html: previewHtml,
        });

        writeDb(db);

        return res.json({
          ok: true,
          guest,
          event: db.event,
          guests: db.guests,
          emails: db.emails,
          message: `Tu asistencia ha sido anotada en el Grimorio oficial de Ravenswood Bluff, ${guest.name}.`,
        });
      }

      case 'create_invite': {
        const body = req.body || {};
        const name = String(body.name || '').trim();
        const phone = String(body.phone || '').trim();
        const email = String(body.email || '').trim();
        const assignedRole = String(body.assigned_role || 'Aldeano (Townsfolk)').trim();

        if (!name) {
          return res.status(400).json({
            ok: false,
            error: 'El nombre del invitado es obligatorio.',
          });
        }

        const nowStr = formatNow();
        const nextId = db.guests.reduce((max, g) => Math.max(max, g.id), 0) + 1;
        let slug = slugifyName(name);
        if (db.guests.some((g) => g.slug === slug)) {
          slug = `${slug}-${nextId}`;
        }
        const hasCompanion = name.toLowerCase().includes('acompañante');

        const newGuest: GuestRecord = {
          id: nextId,
          slug,
          invite_code: `RAVENS-${String(nextId).padStart(2, '0')}`,
          name,
          phone,
          email,
          status: 'pending',
          plus_ones: hasCompanion ? 1 : 0,
          assigned_role: assignedRole,
          subscribed_updates: true,
          riddle_solved: false,
          responded_at: null,
          created_at: nowStr,
        };

        db.guests.push(newGuest);
        writeDb(db);

        return res.json({
          ok: true,
          guest: newGuest,
          guests: db.guests,
          emails: db.emails,
          message: `Invitación personalizada creada para ${newGuest.name}.`,
        });
      }

      case 'update_guest': {
        const body = req.body || {};
        const id = Number(body.id);
        const guest = db.guests.find((g) => g.id === id);
        if (!guest) {
          return res.status(404).json({ ok: false, error: 'Invitado no encontrado.' });
        }
        if (body.name !== undefined) {
          guest.name = String(body.name).trim();
        }
        if (body.phone !== undefined) guest.phone = String(body.phone).trim();
        if (body.email !== undefined) guest.email = String(body.email).trim();
        if (body.status !== undefined) guest.status = body.status;
        if (body.assigned_role !== undefined) guest.assigned_role = String(body.assigned_role).trim();
        if (body.subscribed_updates !== undefined)
          guest.subscribed_updates = Boolean(body.subscribed_updates);

        writeDb(db);
        return res.json({
          ok: true,
          guest,
          guests: db.guests,
          message: 'Datos del invitado actualizados.',
        });
      }

      case 'delete_guest': {
        const id = Number(req.body?.id || req.query?.id);
        db.guests = db.guests.filter((g) => g.id !== id);
        writeDb(db);
        return res.json({
          ok: true,
          guests: db.guests,
          message: 'Invitado eliminado de la lista.',
        });
      }

      case 'update_event': {
        const body = req.body || {};
        db.event = {
          ...db.event,
          event_title: String(body.event_title ?? db.event.event_title),
          event_subtitle: String(body.event_subtitle ?? db.event.event_subtitle),
          event_date: String(body.event_date ?? db.event.event_date),
          event_time: String(body.event_time ?? db.event.event_time),
          event_location: String(body.event_location ?? db.event.event_location),
          event_maps_url: String(body.event_maps_url ?? db.event.event_maps_url),
          dress_code: String(body.dress_code ?? db.event.dress_code),
          script_edition: String(body.script_edition ?? db.event.script_edition),
          storyteller_name: String(body.storyteller_name ?? db.event.storyteller_name),
          max_capacity: Number(body.max_capacity ?? db.event.max_capacity),
          riddle_question: String(body.riddle_question ?? db.event.riddle_question),
          riddle_option_a: String(body.riddle_option_a ?? db.event.riddle_option_a),
          riddle_option_b: String(body.riddle_option_b ?? db.event.riddle_option_b),
          riddle_option_c: String(body.riddle_option_c ?? db.event.riddle_option_c),
          riddle_correct_option: (body.riddle_correct_option ||
            db.event.riddle_correct_option) as 'A' | 'B' | 'C',
          updated_at: formatNow(),
        };
        writeDb(db);
        return res.json({
          ok: true,
          event: db.event,
          message: 'Detalles del evento guardados.',
        });
      }

      case 'send_broadcast': {
        const body = req.body || {};
        const subject = String(body.subject || '').trim();
        const bodyText = String(body.body_text || '').trim();
        const audience = String(body.audience || 'all_subscribed');
        const templateType = String(body.template_type || 'custom');
        const targetGuestId = body.target_guest_id ? Number(body.target_guest_id) : null;

        if (!subject || !bodyText) {
          return res.status(400).json({
            ok: false,
            error: 'Por favor completa el asunto y el mensaje del correo.',
          });
        }

        let targetGuests = db.guests.filter((g) => g.subscribed_updates);
        if (audience === 'confirmed') {
          targetGuests = targetGuests.filter((g) => g.status === 'confirmed');
        } else if (audience === 'pending') {
          targetGuests = targetGuests.filter((g) => g.status === 'pending');
        } else if (audience === 'individual' && targetGuestId) {
          targetGuests = db.guests.filter((g) => g.id === targetGuestId);
        }

        if (targetGuests.length === 0) {
          return res.status(400).json({
            ok: false,
            error: 'No hay invitados en el grupo seleccionado.',
          });
        }

        const sampleGuest = targetGuests[0];
        const previewHtml = buildVictorianEmailHtml(
          subject,
          sampleGuest.name,
          bodyText,
          db.event
        );

        const nextEmailId = db.emails.reduce((max, e) => Math.max(max, e.id), 0) + 1;
        const recipientLabels = targetGuests.map((g) =>
          g.email ? `${g.name} <${g.email}>` : g.name
        );

        const newBroadcast: EmailBroadcastRecord = {
          id: nextEmailId,
          subject,
          audience,
          template_type: templateType,
          body_text: bodyText,
          recipients_count: recipientLabels.length,
          recipients_list: recipientLabels.join(', '),
          delivery_status: 'Enviado',
          sent_at: formatNow(),
          preview_html: previewHtml,
        };

        db.emails.unshift(newBroadcast);
        writeDb(db);

        return res.json({
          ok: true,
          broadcast: newBroadcast,
          emails: db.emails,
          recipients_count: recipientLabels.length,
          message: `Actualización enviada a ${recipientLabels.length} invitado(s).`,
        });
      }

      default:
        return res.status(404).json({ ok: false, error: 'Acción no encontrada' });
    }
  };

  app.all('/api.php', (req, res) => {
    const action = String(req.query.action || 'bootstrap');
    handleApiAction(action, req, res);
  });

  app.all('/api/:action', (req, res) => {
    const action = String(req.params.action || 'bootstrap');
    handleApiAction(action, req, res);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ravenswood Bluff Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
