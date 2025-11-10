# 📁 Asset Manager - Quick Guide

## Overview
The Asset Manager is a new tab in the admin dashboard that allows you to upload, manage, and organize files for use in challenges and courses.

**Access**: Admin Dashboard → **📁 Assets** tab

---

## 🚀 Features

### 1. **Upload Assets**
- Click the **"📤 Upload Asset"** button
- Select one or multiple files
- Supports:
  - **Images**: JPG, PNG, GIF, WebP, SVG
  - **Code Files**: HTML, CSS, JavaScript
  - **Data Files**: JSON
- Maximum file size: **10MB per file**
- Multiple files can be uploaded at once

### 2. **View Assets**
Each asset is displayed in a card showing:
- **Preview** (for images) or file type icon
- **Filename**
- **File size** (in KB)
- **Upload date**
- **Path** (for use in code)
- **Action buttons**

### 3. **Search Assets**
- Use the search bar at the top
- Search by filename
- Case-insensitive
- Real-time filtering

### 4. **Copy Paths**
Two copy options for each asset:
- **📋 Copy Path**: Copies the relative path (e.g., `/assets/images/logo-123456.png`)
- **🔗 Copy URL**: Copies the full URL (e.g., `http://localhost:5000/assets/images/logo-123456.png`)

### 5. **Delete Assets**
- Click the **🗑️** button
- Confirmation dialog appears
- Permanently deletes the file and metadata

---

## 💡 How to Use Assets in Challenges

### Step 1: Upload Your Asset
1. Go to **Assets** tab
2. Click **"Upload Asset"**
3. Select your image/file
4. Wait for upload confirmation

### Step 2: Copy the Path
1. Find your uploaded asset in the grid
2. Click **"📋 Copy Path"** or **"🔗 Copy URL"**
3. Path is copied to clipboard

### Step 3: Use in Challenge
When creating/editing a challenge:

**For Images:**
```javascript
// In Expected HTML field:
<img src="/assets/images/logo-1699123456.png" alt="Logo">

// Or in Expected CSS:
.hero {
  background-image: url('/assets/images/banner-1699123456.png');
}
```

**For Reference Screenshots:**
```javascript
// In Expected Screenshot URL field:
/assets/references/navbar-expected-1699123456.png
```

**For Course Materials:**
```javascript
// Link to HTML template:
<a href="/assets/courses/template-1699123456.html">Download Template</a>
```

---

## 📂 Asset Organization

Assets are automatically organized by type:

### Directory Structure:
```
backend/assets/
├── images/          # All uploaded images
├── references/      # Reference screenshots
└── courses/         # Course materials
```

### Metadata Tracking:
All assets are tracked in `backend/data/assets-metadata.json`:
```json
{
  "filename": "logo-1699123456.png",
  "originalName": "logo.png",
  "path": "/assets/images/logo-1699123456.png",
  "url": "http://localhost:5000/assets/images/logo-1699123456.png",
  "type": "image/png",
  "size": 45678,
  "category": "general",
  "uploadedAt": "2025-11-10T13:25:00.000Z"
}
```

---

## 🎯 Common Use Cases

### 1. **Logo for Navbar Challenge**
```html
<!-- Upload logo.png, then use in challenge: -->
<nav>
  <img src="/assets/images/logo-1699123456.png" alt="Company Logo">
</nav>
```

### 2. **Background Image**
```css
/* Upload background.jpg, then use: */
.header {
  background-image: url('/assets/images/background-1699123456.jpg');
}
```

### 3. **Product Images for E-commerce Challenge**
```html
<!-- Upload product1.jpg, product2.jpg, product3.jpg -->
<div class="product">
  <img src="/assets/images/product1-1699123456.jpg" alt="Product 1">
</div>
```

### 4. **Reference Screenshot**
```javascript
// When creating challenge, in "Expected Screenshot URL":
/assets/references/navbar-solution-1699123456.png
```

### 5. **Starter Template**
```html
<!-- Upload starter.html for students to download -->
<a href="/assets/courses/starter-1699123456.html" download>
  Download Starter Code
</a>
```

---

## 🎨 Asset Preview

### Images:
- Full preview shown in card
- Click to view larger (browser default)
- Shows actual image

### Other Files:
- Icon based on file type:
  - 📄 HTML files
  - 🎨 CSS files
  - ⚡ JavaScript files
  - 📋 JSON files
  - 📁 Other files

---

## ⚠️ Best Practices

### 1. **Naming Conventions**
- Use descriptive names: `navbar-logo.png` instead of `img1.png`
- Use hyphens, not spaces: `product-image.jpg` not `product image.jpg`
- Keep names short and clear

### 2. **File Organization**
- Upload similar assets together
- Use consistent naming patterns
- Delete unused assets regularly

### 3. **Image Optimization**
- Compress images before upload
- Use appropriate formats:
  - JPG for photos
  - PNG for graphics with transparency
  - SVG for icons and logos
  - WebP for modern web (smaller size)

### 4. **File Sizes**
- Keep images under 500KB when possible
- Optimize for web before uploading
- 10MB limit per file (enforce smaller sizes)

### 5. **Testing**
- After uploading, test the asset URL
- Verify it displays correctly
- Check in actual challenge preview

---

## 🔧 Technical Details

### Upload Process:
1. File selected via input
2. Uploaded to backend via `multer`
3. Saved to appropriate directory
4. Metadata stored in JSON
5. Unique filename with timestamp generated
6. Path and URL returned to frontend

### Security:
- Only allowed file types accepted
- File size limits enforced
- Unique filenames prevent overwriting
- Admin-only access

### Performance:
- Static file serving via Express
- Efficient file storage
- Quick metadata retrieval
- Minimal database overhead

---

## 📊 Asset Statistics

View in Overview tab:
- Total assets uploaded
- Storage used
- Recent uploads
- Popular file types

---

## 🐛 Troubleshooting

### Upload Fails:
- Check file size (must be under 10MB)
- Verify file type is supported
- Ensure backend is running
- Check browser console for errors

### Asset Not Showing:
- Verify URL is correct
- Check backend `/assets` route is working
- Test direct URL access: `http://localhost:5000/assets/images/filename.png`
- Ensure file was actually uploaded

### Path Not Working in Challenge:
- Use relative path: `/assets/images/file.png`
- NOT absolute: `http://localhost:5000/assets/...`
- NOT file system: `C:\Users\...`
- Verify path was copied correctly

### Delete Not Working:
- Check if file is in use by challenge
- Verify admin permissions
- Check backend logs
- Ensure metadata is in sync

---

## 🎓 Example Workflow

### Creating a Product Card Challenge:

1. **Prepare Assets**:
   - product-image.jpg (500x500px)
   - company-logo.png (200x60px)
   - expected-result.png (screenshot)

2. **Upload Assets**:
   - Go to Assets tab
   - Upload all 3 files
   - Wait for confirmation

3. **Copy Paths**:
   - product-image.jpg → Copy Path → `/assets/images/product-image-1699123456.jpg`
   - company-logo.png → Copy Path → `/assets/images/company-logo-1699123456.png`
   - expected-result.png → Copy Path → `/assets/references/expected-result-1699123456.png`

4. **Create Challenge**:
   - Go to Challenges tab
   - Click "Add New Challenge"
   - Fill in details
   - In Expected HTML:
     ```html
     <div class="product-card">
       <img src="/assets/images/product-image-1699123456.jpg" alt="Product">
       <img src="/assets/images/company-logo-1699123456.png" alt="Logo" class="logo">
     </div>
     ```
   - In Expected Screenshot URL:
     ```
     /assets/references/expected-result-1699123456.png
     ```

5. **Save & Test**:
   - Save challenge
   - Test as student
   - Verify images load correctly

---

## 🚀 Future Enhancements

Potential features:
- Categories/folders for organization
- Bulk upload/delete
- Image editing (crop, resize)
- Asset usage tracking
- Storage quota management
- CDN integration
- Version control for assets

---

## ✅ Summary

The Asset Manager provides:
✅ Easy file uploads
✅ Visual asset preview
✅ Quick path copying
✅ Search functionality
✅ Organized storage
✅ Metadata tracking
✅ Admin-only access
✅ Multiple file type support

**Result**: Seamless asset integration in challenges and courses!

---

**Need Help?**
- Check file type is supported
- Verify file size under 10MB
- Use search to find assets
- Copy exact path from manager
- Test URL before using in challenge
