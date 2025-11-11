-- Add Test Restrictions and Question Bank Features
USE frontend_test_portal;

-- Add restrictions to courses table
ALTER TABLE courses 
ADD COLUMN copy_paste_disabled BOOLEAN DEFAULT FALSE,
ADD COLUMN fullscreen_required BOOLEAN DEFAULT FALSE,
ADD COLUMN max_violations INT DEFAULT 3,
ADD COLUMN tab_switch_detection BOOLEAN DEFAULT TRUE,
ADD COLUMN randomize_questions BOOLEAN DEFAULT FALSE,
ADD COLUMN questions_per_test INT DEFAULT 2;

-- Question Bank Table
CREATE TABLE IF NOT EXISTS question_bank (
    id VARCHAR(100) PRIMARY KEY,
    course_id VARCHAR(100) NOT NULL,
    level INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Medium',
    description TEXT,
    instructions TEXT,
    tags JSON,
    time_limit INT DEFAULT 30,
    passing_threshold JSON,
    expected_html TEXT,
    expected_css TEXT,
    expected_js TEXT,
    expected_screenshot_url VARCHAR(500),
    points INT DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course_level (course_id, level),
    INDEX idx_is_active (is_active)
);

-- Test Violations Table
CREATE TABLE IF NOT EXISTS test_violations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    course_id VARCHAR(100) NOT NULL,
    level INT NOT NULL,
    violation_type ENUM('tab_switch', 'exit_fullscreen', 'copy_paste', 'esc_key') NOT NULL,
    violation_count INT DEFAULT 1,
    test_session_id VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_user_session (user_id, test_session_id),
    INDEX idx_timestamp (timestamp)
);

-- Test Sessions Table
CREATE TABLE IF NOT EXISTS test_sessions (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    course_id VARCHAR(100) NOT NULL,
    level INT NOT NULL,
    assigned_questions JSON,
    status ENUM('active', 'completed', 'terminated') DEFAULT 'active',
    violation_count INT DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    terminated_reason VARCHAR(255) NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_user_status (user_id, status),
    INDEX idx_started_at (started_at)
);

-- Update challenges table to link with question bank
ALTER TABLE challenges
ADD COLUMN is_from_bank BOOLEAN DEFAULT FALSE,
ADD COLUMN bank_question_id VARCHAR(100) NULL;
