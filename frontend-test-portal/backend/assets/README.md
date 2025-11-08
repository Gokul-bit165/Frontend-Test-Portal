# Assets Directory Structure

This directory contains all assets (images, icons, references) used in the challenges.

## Directory Structure

```
assets/
├── images/          # Images used in challenge questions
│   ├── avatar-1.png
│   ├── product-1.png
│   ├── hero-bg-1.jpg
│   ├── plus-icon.png
│   ├── minus-icon.png
│   ├── form-icon.png
│   └── ...
├── references/      # Reference screenshots showing expected output
│   ├── html-css-l1-q1-ref.png
│   ├── html-css-l1-q2-ref.png
│   ├── html-css-l2-q1-ref.png
│   └── ...
└── courses/         # Course thumbnail images
    ├── html-css-thumb.png
    ├── javascript-thumb.png
    ├── responsive-thumb.png
    └── fullstack-thumb.png
```

## Image Requirements

### Profile/Avatar Images
- **Size**: 120x120px minimum
- **Format**: PNG with transparency
- **Example**: avatar-1.png, avatar-2.png

### Product Images
- **Size**: 300x300px minimum
- **Format**: PNG or JPG
- **Example**: product-1.png

### Hero Background Images
- **Size**: 1920x1080px minimum
- **Format**: JPG (optimized for web)
- **Example**: hero-bg-1.jpg

### Icons
- **Size**: 48x48px or 64x64px
- **Format**: PNG with transparency
- **Example**: plus-icon.png, minus-icon.png, form-icon.png

### Course Thumbnails
- **Size**: 400x300px
- **Format**: PNG or JPG
- **Example**: html-css-thumb.png

### Reference Screenshots
- **Size**: 1280x720px
- **Format**: PNG
- **Purpose**: Show expected output for comparison
- **Example**: html-css-l1-q1-ref.png

## Adding New Assets

1. Place image in appropriate subdirectory
2. Use descriptive, lowercase filenames with hyphens
3. Reference in challenge JSON with path: `/assets/images/filename.png`
4. Update challenge's `assets` object with image details

## Placeholder Images

If you don't have actual images yet, you can:
1. Use placeholder services like https://placeholder.com/
2. Create simple colored rectangles in image editor
3. Use royalty-free images from:
   - Unsplash (https://unsplash.com/)
   - Pexels (https://pexels.com/)
   - Pixabay (https://pixabay.com/)

## Example Usage in Challenge

```json
{
  "assets": {
    "images": [
      {
        "name": "avatar-1.png",
        "path": "/assets/images/avatar-1.png",
        "description": "Profile avatar image"
      }
    ],
    "reference": "/assets/references/html-css-l1-q1-ref.png"
  }
}
```

## Serving Assets

Assets are served statically by Express:
```javascript
app.use('/assets', express.static(path.join(__dirname, 'assets')));
```

Access in HTML:
```html
<img src="/assets/images/avatar-1.png" alt="Profile">
```
