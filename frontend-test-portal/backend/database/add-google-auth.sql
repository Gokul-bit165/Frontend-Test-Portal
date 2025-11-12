-- Add Google OAuth columns to users table
-- Run this to support Google Sign-In

USE frontend_test_portal;

-- Add google_id column (unique Google account identifier)
ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) NULL AFTER password,
ADD UNIQUE INDEX idx_google_id (google_id);

-- Add oauth_provider column (e.g., 'google', 'local')
ALTER TABLE users 
ADD COLUMN oauth_provider VARCHAR(50) NULL DEFAULT 'local' AFTER google_id;

-- Add profile_picture column (Google profile picture URL)
ALTER TABLE users 
ADD COLUMN profile_picture TEXT NULL AFTER oauth_provider;

-- Make password nullable (for Google OAuth users)
ALTER TABLE users 
MODIFY COLUMN password VARCHAR(255) NULL;

-- Verify changes
DESCRIBE users;

SELECT 'Google Auth columns added successfully!' AS message;
