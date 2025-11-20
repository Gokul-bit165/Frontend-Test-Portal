# Image Storage in Database - Implementation Guide

## Overview
All images (screenshots, assets, and expected screenshots) are now stored in the MySQL database as BLOBs with filesystem backup for redundancy.

## Features Implemented

### 1. Database Schema Updates
- **Assets Table**: Added `file_data LONGBLOB` column
- **Submissions Table**: Added `user_screenshot_data`, `expected_screenshot_data`, `diff_screenshot_data` LONGBLOB columns
- **Challenges Table**: Added `expected_screenshot_data LONGBLOB` column

### 2. Image Storage Service (`backend/services/imageStorage.js`)
A unified service for storing and retrieving images:

**Methods:**
- `storeSubmissionScreenshot(submissionId, filePath, type)` - Store user/expected/diff screenshots
- `getSubmissionScreenshot(submissionId, type)` - Retrieve screenshots from DB or filesystem
- `storeAsset(assetInfo, filePath)` - Store uploaded assets
- `getAsset(filename)` - Retrieve asset from DB or filesystem
- `getAllAssets()` - Get all assets metadata
- `deleteAsset(filename)` - Delete asset from DB
- `storeChallengeScreenshot(challengeId, filePath)` - Store expected screenshots for challenges
- `getChallengeScreenshot(challengeId)` - Retrieve challenge screenshots

### 3. Updated Routes

#### Assets Routes (`backend/routes/assets.js`)
- `GET /api/assets` - Fetch from database first, fallback to JSON
- `POST /api/assets/upload` - Store in both database and filesystem
- `GET /api/assets/file/:filename` - Serve files directly from database
- `DELETE /api/assets/:filename` - Remove from database and filesystem

#### Submissions Routes (`backend/routes/submissions.js`)
- `GET /api/submissions/:id/screenshot/:type` - Serve screenshots (user/expected/diff) from database
  - Example: `/api/submissions/sub-123/screenshot/user`

#### Challenges Routes (`backend/routes/challenges.js`)
- `GET /api/challenges/:id/screenshot` - Serve expected screenshot from database

### 4. PixelMatch Service Updates (`backend/services/pixelMatch.js`)
- Automatically stores all generated screenshots (user, expected, diff) in database
- Returns database URLs instead of filesystem paths

### 5. Migration Script (`backend/database/migrate-images.js`)
Migrates existing screenshots and assets from filesystem to database:

```bash
npm run migrate-images
```

## How It Works

### Upload Flow
1. File uploaded via multer to filesystem (temporary storage)
2. File buffer read and stored in database BLOB column
3. Metadata saved to database tables
4. Filesystem copy retained as backup

### Retrieval Flow
1. Request received for image
2. Service checks database first
3. If found in DB, returns buffer directly
4. If not in DB, checks filesystem as fallback
5. Returns image with appropriate Content-Type header

### Screenshot Generation Flow
1. PixelMatch service generates screenshots
2. Saves to filesystem temporarily
3. Immediately stores in database via imageStorage service
4. Returns database URLs for frontend access

## Benefits

1. **Database Centralization**: All data including images in one place
2. **Backup Redundancy**: Files exist in both DB and filesystem
3. **Easy Migration**: Docker volumes persist database, no separate file volume needed
4. **Consistent URLs**: All images served via API routes
5. **Better Control**: Easy to implement access control, compression, or transformations

## API Endpoints for Images

### Assets
```
GET  /api/assets              - List all assets
POST /api/assets/upload       - Upload new asset
GET  /api/assets/file/:filename - Retrieve asset file
DELETE /api/assets/:filename  - Delete asset
```

### Submission Screenshots
```
GET /api/submissions/:id/screenshot/user      - User's rendered output
GET /api/submissions/:id/screenshot/expected  - Expected output
GET /api/submissions/:id/screenshot/diff      - Pixel difference
```

### Challenge Screenshots
```
GET /api/challenges/:id/screenshot - Expected screenshot for challenge
```

## Database Columns

### Assets Table
```sql
file_data LONGBLOB  -- Stores actual file binary data
```

### Submissions Table
```sql
user_screenshot_data LONGBLOB       -- User's submission screenshot
expected_screenshot_data LONGBLOB   -- Expected result screenshot
diff_screenshot_data LONGBLOB       -- Difference visualization
```

### Challenges Table
```sql
expected_screenshot_data LONGBLOB   -- Expected output screenshot
```

## Migration Steps

1. **Update Database Schema**
   ```bash
   # Run migration to add BLOB columns
   npm run migrate
   ```

2. **Migrate Existing Images**
   ```bash
   # Move existing files to database
   npm run migrate-images
   ```

3. **Verify Migration**
   - Check database for populated BLOB columns
   - Test image retrieval via API endpoints

## Frontend Integration

Update frontend code to use new API endpoints:

```javascript
// Old
<img src="/screenshots/sub-123-candidate.png" />

// New
<img src="/api/submissions/sub-123/screenshot/user" />
```

```javascript
// Old
<img src="/assets/images/logo.png" />

// New
<img src="/api/assets/file/logo.png" />
```

## Troubleshooting

### Images Not Loading
1. Check if database migration ran successfully
2. Verify BLOB columns exist in database
3. Check image storage service logs
4. Test direct API endpoint in browser

### Migration Errors
1. Ensure database connection is active
2. Check file permissions in screenshot/assets directories
3. Verify MySQL max_allowed_packet size for large images

### Performance Issues
1. Consider adding database indexes for filename lookups
2. Implement caching layer for frequently accessed images
3. Use CDN for static assets in production

## Security Considerations

1. **Access Control**: Implement authentication checks in image routes
2. **File Validation**: Validate MIME types and file sizes
3. **SQL Injection**: Use parameterized queries (already implemented)
4. **DOS Prevention**: Limit upload sizes and rate limiting

## Future Enhancements

1. **Image Compression**: Compress images before storing in database
2. **Thumbnails**: Generate and store thumbnails for large images
3. **CDN Integration**: Sync database images to CDN for production
4. **Lazy Loading**: Implement pagination for asset lists
5. **Image Transformations**: On-the-fly resizing and format conversion
