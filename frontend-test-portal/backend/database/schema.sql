-- Frontend Test Portal Database Schema
-- MySQL Database Setup

-- Drop existing database if exists
DROP DATABASE IF EXISTS frontend_test_portal;

-- Create database
CREATE DATABASE frontend_test_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE frontend_test_portal;

-- Users Table
CREATE TABLE users (
    id VARCHAR(100) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    role ENUM('admin', 'student') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Courses Table
CREATE TABLE courses (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail VARCHAR(255),
    icon VARCHAR(10),
    color VARCHAR(20),
    total_levels INT DEFAULT 1,
    estimated_time VARCHAR(50),
    difficulty ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
    tags JSON,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_difficulty (difficulty),
    INDEX idx_is_locked (is_locked)
);

-- Challenges Table
CREATE TABLE challenges (
    id VARCHAR(100) PRIMARY KEY,
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
    expected_screenshot_url VARCHAR(255),
    course_id VARCHAR(100),
    level INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_difficulty (difficulty),
    INDEX idx_course_level (course_id, level),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- Submissions Table (Enhanced with screenshots)
CREATE TABLE submissions (
    id VARCHAR(100) PRIMARY KEY,
    challenge_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    candidate_name VARCHAR(100),
    html_code TEXT,
    css_code TEXT,
    js_code TEXT,
    status ENUM('pending', 'passed', 'failed') DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    evaluated_at TIMESTAMP NULL,
    structure_score INT DEFAULT 0,
    visual_score INT DEFAULT 0,
    content_score INT DEFAULT 0,
    final_score INT DEFAULT 0,
    passed BOOLEAN DEFAULT FALSE,
    evaluation_result JSON,
    user_screenshot VARCHAR(500),
    expected_screenshot VARCHAR(500),
    course_id VARCHAR(100),
    level INT,
    INDEX idx_challenge (challenge_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_submitted_at (submitted_at),
    INDEX idx_course_level (course_id, level),
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Progress Table
CREATE TABLE user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    course_id VARCHAR(100) NOT NULL,
    current_level INT DEFAULT 1,
    completed_levels JSON,
    total_points INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_course (user_id, course_id),
    INDEX idx_user_course (user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- User Assignments Table (for random question assignment)
CREATE TABLE user_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    course_id VARCHAR(100) NOT NULL,
    level INT NOT NULL,
    challenge_id VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    UNIQUE KEY unique_user_level (user_id, course_id, level),
    INDEX idx_user_course_level (user_id, course_id, level),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
);

-- Assets Table
CREATE TABLE assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    original_name VARCHAR(255) NOT NULL,
    path VARCHAR(500) NOT NULL,
    url VARCHAR(500) NOT NULL,
    type VARCHAR(100),
    size INT,
    category VARCHAR(50) DEFAULT 'general',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_filename (filename)
);

-- Level Completions Table (feedback and scores)
CREATE TABLE level_completions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    course_id VARCHAR(100) NOT NULL,
    level INT NOT NULL,
    total_score DECIMAL(5,2) DEFAULT 0,
    passed BOOLEAN DEFAULT FALSE,
    feedback TEXT,
    question_results JSON,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_course (user_id, course_id),
    INDEX idx_completed_at (completed_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Admin Activity Log (optional but useful)
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    details JSON,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default admin user (password: admin123)
INSERT INTO users (id, username, password, email, full_name, role, created_at) VALUES
('user-admin-1', 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin@example.com', 'Administrator', 'admin', '2024-01-01 00:00:00');

-- Insert demo student (password: 123456)
INSERT INTO users (id, username, password, email, full_name, role, created_at) VALUES
('user-demo-student', 'student1', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student1@example.com', 'Demo Student', 'student', '2024-01-01 00:00:00');
