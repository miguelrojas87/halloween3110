<?php
/**
 * db.php — Conexión PDO para Ravenswood Bluff (MySQL o SQLite automático)
 */

declare(strict_types=1);

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance !== null) {
            return self::$instance;
        }

        // Configuración mediante variables de entorno o fallback local SQLite
        $driver = getenv('DB_DRIVER') ?: 'sqlite'; // 'mysql' o 'sqlite'

        try {
            if ($driver === 'mysql') {
                $host = getenv('DB_HOST') ?: '127.0.0.1';
                $port = getenv('DB_PORT') ?: '3306';
                $dbname = getenv('DB_NAME') ?: 'clocktower_halloween';
                $user = getenv('DB_USER') ?: 'root';
                $pass = getenv('DB_PASS') ?: '';

                $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
                self::$instance = new PDO($dsn, $user, $pass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
            } else {
                $sqlitePath = __DIR__ . '/clocktower.sqlite';
                self::$instance = new PDO("sqlite:" . $sqlitePath, null, null, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]);
                self::initializeSqliteSchema(self::$instance);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'ok' => false,
                'error' => 'Error de conexión a la base de datos del Grimorio: ' . $e->getMessage()
            ]);
            exit;
        }

        return self::$instance;
    }

    private static function initializeSqliteSchema(PDO $pdo): void {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS event_settings (
                id INTEGER PRIMARY KEY,
                event_title TEXT NOT NULL,
                event_subtitle TEXT NOT NULL,
                event_date TEXT NOT NULL,
                event_time TEXT NOT NULL,
                event_location TEXT NOT NULL,
                dress_code TEXT NOT NULL,
                script_edition TEXT NOT NULL,
                storyteller_name TEXT NOT NULL,
                max_capacity INTEGER NOT NULL DEFAULT 15,
                riddle_question TEXT NOT NULL,
                riddle_option_a TEXT NOT NULL,
                riddle_option_b TEXT NOT NULL,
                riddle_option_c TEXT NOT NULL,
                riddle_correct_option TEXT NOT NULL DEFAULT 'B',
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS guests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invite_code TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                plus_ones INTEGER NOT NULL DEFAULT 0,
                preferred_alignment TEXT DEFAULT 'Aldeano (Townsfolk)',
                assigned_role TEXT DEFAULT 'Por revelar en el Grimorio',
                costume_idea TEXT DEFAULT '',
                dietary_notes TEXT DEFAULT '',
                rumor_message TEXT DEFAULT '',
                subscribed_updates INTEGER NOT NULL DEFAULT 1,
                riddle_solved INTEGER NOT NULL DEFAULT 0,
                responded_at TEXT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS email_broadcasts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                subject TEXT NOT NULL,
                audience TEXT NOT NULL DEFAULT 'all_subscribed',
                template_type TEXT NOT NULL DEFAULT 'custom',
                body_text TEXT NOT NULL,
                recipients_count INTEGER NOT NULL DEFAULT 0,
                recipients_list TEXT NOT NULL,
                delivery_status TEXT NOT NULL DEFAULT 'sent',
                sent_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        ");
    }
}
