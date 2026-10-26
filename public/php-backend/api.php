<?php
/**
 * api.php — Controlador de producción para invitaciones de Halloween Blood on the Clocktower
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mailer.php';

$pdo = Database::getConnection();
$mailer = new ClocktowerMailer();
$action = $_GET['action'] ?? 'bootstrap';

function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return $_POST;
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

try {
    switch ($action) {
        case 'bootstrap': {
            $event = $pdo->query("SELECT * FROM event_settings WHERE id = 1")->fetch();
            $guests = $pdo->query("SELECT * FROM guests ORDER BY id ASC")->fetchAll();
            $emails = $pdo->query("SELECT * FROM email_broadcasts ORDER BY id DESC LIMIT 30")->fetchAll();

            echo json_encode([
                'ok' => true,
                'event' => $event,
                'guests' => $guests,
                'emails' => $emails,
            ]);
            break;
        }

        case 'rsvp': {
            $data = getJsonInput();
            $guestId = isset($data['guest_id']) ? (int)$data['guest_id'] : 0;
            $slug = trim($data['slug'] ?? '');
            $name = trim($data['name'] ?? '');
            $phone = trim($data['phone'] ?? '');
            $email = trim($data['email'] ?? '');
            $status = $data['status'] ?? 'confirmed';
            $subscribed = !empty($data['subscribed_updates']) ? 1 : 0;

            if ($name === '' || $phone === '' || $email === '') {
                http_response_code(400);
                echo json_encode(['ok' => false, 'error' => 'Por favor confirma tu nombre, teléfono y correo electrónico.']);
                exit;
            }

            $stmt = $pdo->prepare("SELECT * FROM guests WHERE id = :id OR slug = :slug OR LOWER(name) = LOWER(:name) LIMIT 1");
            $stmt->execute([':id' => $guestId, ':slug' => $slug, ':name' => $name]);
            $existing = $stmt->fetch();

            if ($existing) {
                $upd = $pdo->prepare("
                    UPDATE guests SET
                        name = :name,
                        phone = :phone,
                        email = :email,
                        status = :status,
                        subscribed_updates = :subscribed,
                        riddle_solved = 1,
                        responded_at = CURRENT_TIMESTAMP
                    WHERE id = :id
                ");
                $upd->execute([
                    ':name' => $name,
                    ':phone' => $phone,
                    ':email' => $email,
                    ':status' => $status,
                    ':subscribed' => $subscribed,
                    ':id' => $existing['id'],
                ]);
            }

            $event = $pdo->query("SELECT * FROM event_settings WHERE id = 1")->fetch() ?: [];
            $subject = "Confirmación Registrada — {$event['event_title']}";
            $bodyText = "Tu asistencia para el {$event['event_date']} a las {$event['event_time']} ha quedado anotada en el Grimorio de Ravenswood Bluff.\nTeléfono: {$phone}";
            $html = $mailer->buildVictorianHtml($subject, $name, $bodyText, $event);
            $mailer->send($email, $name, $subject, $html);

            $guests = $pdo->query("SELECT * FROM guests ORDER BY id ASC")->fetchAll();
            echo json_encode([
                'ok' => true,
                'guests' => $guests,
                'message' => "Tu asistencia ha sido anotada en el Grimorio oficial de Ravenswood Bluff, {$name}."
            ]);
            break;
        }

        default:
            http_response_code(404);
            echo json_encode(['ok' => false, 'error' => 'Acción desconocida.']);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
