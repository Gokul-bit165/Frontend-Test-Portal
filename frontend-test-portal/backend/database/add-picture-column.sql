-- Add picture column to users table for Google OAuth profile pictures
-- Run this on TiDB Cloud when connection is established

USE frontend_test_portal;

-- Add picture column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS picture VARCHAR(500) NULL AFTER role;

-- Verify the column was added
DESCRIBE users;
