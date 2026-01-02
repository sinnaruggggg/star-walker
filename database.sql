-- Solar Explorer 멀티플레이어 테이블
-- 닷홈 phpMyAdmin에서 실행하세요

-- 1. 회원 테이블
CREATE TABLE IF NOT EXISTS `solar_users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(30) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `nickname` VARCHAR(30) NOT NULL,
    `email` VARCHAR(100) DEFAULT NULL,
    `ship_type` INT NOT NULL DEFAULT 0,
    `total_distance` DOUBLE DEFAULT 0,
    `planets_visited` INT DEFAULT 0,
    `play_time` INT DEFAULT 0,
    `created_at` DATETIME NOT NULL,
    `last_login` DATETIME DEFAULT NULL,
    INDEX `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 플레이어 위치 테이블
CREATE TABLE IF NOT EXISTS `solar_players` (
    `user_id` VARCHAR(50) NOT NULL,
    `nickname` VARCHAR(30) NOT NULL DEFAULT '익명',
    `pos_x` DOUBLE NOT NULL DEFAULT 0,
    `pos_y` DOUBLE NOT NULL DEFAULT 0,
    `pos_z` DOUBLE NOT NULL DEFAULT 0,
    `rot_x` DOUBLE NOT NULL DEFAULT 0,
    `rot_y` DOUBLE NOT NULL DEFAULT 0,
    `rot_z` DOUBLE NOT NULL DEFAULT 0,
    `ship_type` INT NOT NULL DEFAULT 0,
    `current_location` VARCHAR(50) DEFAULT '',
    `last_update` DATETIME NOT NULL,
    PRIMARY KEY (`user_id`),
    INDEX `idx_last_update` (`last_update`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 채팅 테이블
CREATE TABLE IF NOT EXISTS `solar_chat` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` VARCHAR(50) NOT NULL,
    `nickname` VARCHAR(30) NOT NULL,
    `message` VARCHAR(200) NOT NULL,
    `created_at` DATETIME NOT NULL,
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 오래된 채팅 자동 삭제 (선택사항 - 1시간 지난 메시지)
-- 주기적으로 실행하거나 크론잡 설정
-- DELETE FROM solar_chat WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR);
