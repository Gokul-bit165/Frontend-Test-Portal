-- Add test sessions table to track multi-question test attempts
CREATE TABLE IF NOT EXISTS test_sessions (
    id VARCHAR(100) COLLATE utf8mb4_unicode_ci PRIMARY KEY,
    user_id VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    course_id VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    level INT NOT NULL,
    submission_ids JSON NOT NULL,
    total_questions INT DEFAULT 0,
    passed_count INT DEFAULT 0,
    overall_status ENUM('passed', 'failed') COLLATE utf8mb4_unicode_ci DEFAULT 'failed',
    user_feedback TEXT COLLATE utf8mb4_unicode_ci NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_user (user_id),
    INDEX idx_course_level (course_id, level),
    CONSTRAINT fk_test_session_user FOREIGN KEY (user_id) REFERENCES frontend_test_portal.users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add user_feedback column to submissions if not exists
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS user_feedback TEXT NULL AFTER expected_screenshot;
