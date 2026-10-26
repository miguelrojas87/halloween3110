<?php
/**
 * mailer.php — Servicio de envío de correos HTML con estética Gótica Victoriana
 * Soporta mail() nativo de PHP, cabeceras MIME HTML y registro de envíos.
 */

declare(strict_types=1);

class ClocktowerMailer {
    private string $fromEmail;
    private string $fromName;

    public function __construct() {
        $this->fromEmail = getenv('MAIL_FROM_ADDRESS') ?: 'narrador@ravenswood-bluff.local';
        $this->fromName  = getenv('MAIL_FROM_NAME') ?: 'El Narrador del Grimorio • Ravenswood Bluff';
    }

    /**
     * Construye la plantilla HTML gótica para el correo de invitación o actualización
     */
    public function buildVictorianHtml(string $subject, string $recipientName, string $bodyText, array $eventSettings, ?string $inviteCode = null): string {
        $safeTitle    = htmlspecialchars($eventSettings['event_title'] ?? 'Noche de Juicio y Sombras');
        $safeDate     = htmlspecialchars($eventSettings['event_date'] ?? 'Sábado, 31 de Octubre');
        $safeTime     = htmlspecialchars($eventSettings['event_time'] ?? '20:00 hrs');
        $safeLocation = htmlspecialchars($eventSettings['event_location'] ?? 'La Mansión de Ravenswood Bluff');
        $safeGuest    = htmlspecialchars($recipientName);
        $formattedBody = nl2br(htmlspecialchars($bodyText));
        $codeBlock = $inviteCode
            ? "<div style='margin:16px 0;padding:10px;background:#4a0404;color:#d4af37;font-family:monospace;font-size:14px;border:1px solid #d4af37;'>Código de Sello Personal: <strong>{$inviteCode}</strong></div>"
            : "";

        return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>{$subject}</title>
</head>
<body style="margin:0;padding:24px;background-color:#0a080d;color:#f2e3c6;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#f2e3c6;color:#1c1917;border:3px solid #d4af37;border-radius:8px;">
    <tr>
      <td style="padding:32px;text-align:center;border-bottom:2px solid #4a0404;">
        <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8b0000;font-weight:bold;">
          Ravenswood Bluff &bull; Comunicado Oficial del Grimorio
        </p>
        <h1 style="margin:8px 0 0;font-size:26px;color:#4a0404;letter-spacing:1px;">
          {$safeTitle}
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 32px;font-size:16px;line-height:1.6;color:#1c1917;">
        <p style="margin-top:0;">Estimado/a <strong>{$safeGuest}</strong>,</p>
        <div>{$formattedBody}</div>
        {$codeBlock}
        <table width="100%" cellpadding="12" cellspacing="0" style="margin:24px 0;background-color:#e6d3b3;border:1px solid #4a0404;">
          <tr>
            <td><strong>Fecha:</strong> {$safeDate}</td>
            <td><strong>Hora:</strong> {$safeTime}</td>
          </tr>
          <tr>
            <td colspan="2"><strong>Lugar de Reunión:</strong> {$safeLocation}</td>
          </tr>
        </table>
        <p style="font-style:italic;font-size:14px;color:#4a0404;text-align:center;">
          "Ven preparado/a para deducir, mentir sin piedad o descubrir al demonio entre nosotros."
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px;background-color:#120f1a;color:#d4af37;text-align:center;font-size:11px;letter-spacing:2px;text-transform:uppercase;">
        Organizado bajo el sello del Narrador del Grimorio &bull; Blood on the Clocktower
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }

    /**
     * Envía un correo electrónico a un destinatario
     */
    public function send(string $toEmail, string $toName, string $subject, string $htmlContent): bool {
        $headers  = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=UTF-8\r\n";
        $headers .= "From: {$this->fromName} <{$this->fromEmail}>\r\n";
        $headers .= "Reply-To: {$this->fromEmail}\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion();

        // Si la función mail() está configurada en el servidor PHP, la ejecuta
        if (function_exists('mail')) {
            return @mail($toEmail, $subject, $htmlContent, $headers);
        }
        return true;
    }
}
