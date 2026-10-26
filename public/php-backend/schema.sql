-- ============================================================================
-- RAVENSWOOD BLUFF: BLOOD ON THE CLOCKTOWER HALLOWEEN
-- Esquema de Base de Datos SQL (MySQL / MariaDB / SQLite)
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_settings (
    id INT PRIMARY KEY DEFAULT 1,
    event_title VARCHAR(180) NOT NULL DEFAULT 'NOCHE DE JUICIO Y SOMBRAS',
    event_subtitle VARCHAR(180) NOT NULL DEFAULT 'Fiesta de Juegos de Mesa • Blood on the Clocktower',
    event_date VARCHAR(100) NOT NULL DEFAULT '31 de octubre.',
    event_time VARCHAR(100) NOT NULL DEFAULT '6:00pm (a las 8:00pm medianoche en el pueblo).',
    event_location VARCHAR(255) NOT NULL DEFAULT 'Av. Guzman Blanco, Res. La Veguita, Salón de Fiesta Edf. Los Monjes.',
    event_maps_url VARCHAR(255) NOT NULL DEFAULT 'https://maps.app.goo.gl/13u9kLx49EwfpbDT6',
    dress_code TEXT NOT NULL,
    script_edition VARCHAR(100) NOT NULL DEFAULT 'Trouble Brewing & Sects and Violets',
    storyteller_name VARCHAR(120) NOT NULL DEFAULT 'El Narrador del Grimorio',
    max_capacity INT NOT NULL DEFAULT 25,
    riddle_question TEXT NOT NULL,
    riddle_option_a VARCHAR(180) NOT NULL DEFAULT 'A) Un Reloj de la Villa',
    riddle_option_b VARCHAR(180) NOT NULL DEFAULT 'B) La Torre del Reloj',
    riddle_option_c VARCHAR(180) NOT NULL DEFAULT 'C) Una Bruja del Bosque',
    riddle_correct_option CHAR(1) NOT NULL DEFAULT 'B',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(120) NOT NULL UNIQUE,
    invite_code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(60) DEFAULT '',
    email VARCHAR(180) DEFAULT '',
    status ENUM('confirmed', 'pending', 'declined') NOT NULL DEFAULT 'pending',
    plus_ones INT NOT NULL DEFAULT 0,
    assigned_role VARCHAR(100) DEFAULT 'Por revelar en el Grimorio',
    subscribed_updates TINYINT(1) NOT NULL DEFAULT 1,
    riddle_solved TINYINT(1) NOT NULL DEFAULT 0,
    responded_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_broadcasts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject VARCHAR(220) NOT NULL,
    audience VARCHAR(60) NOT NULL DEFAULT 'all_subscribed',
    template_type VARCHAR(60) NOT NULL DEFAULT 'custom',
    body_text TEXT NOT NULL,
    recipients_count INT NOT NULL DEFAULT 0,
    recipients_list TEXT NOT NULL,
    delivery_status VARCHAR(40) NOT NULL DEFAULT 'Enviado',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
