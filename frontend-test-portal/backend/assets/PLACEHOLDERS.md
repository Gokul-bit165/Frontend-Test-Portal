# Placeholder Images to Create

Create these images and place them in the respective directories:

## /assets/images/

1. **avatar-1.png** (120x120px)
   - Simple circular avatar
   - Can use: https://ui-avatars.com/api/?name=John+Doe&size=120&background=667eea&color=fff

2. **product-1.png** (300x300px)
   - Wireless headphones image
   - Use: https://via.placeholder.com/300x300/3498db/ffffff?text=Headphones

3. **hero-bg-1.jpg** (1920x1080px)
   - Abstract tech/modern background
   - Use: https://via.placeholder.com/1920x1080/667eea/ffffff?text=Hero+Background

4. **plus-icon.png** (48x48px)
   - Plus symbol
   - Use: https://via.placeholder.com/48x48/4CAF50/ffffff?text=+

5. **minus-icon.png** (48x48px)
   - Minus symbol  
   - Use: https://via.placeholder.com/48x48/f44336/ffffff?text=-

6. **form-icon.png** (64x64px)
   - Envelope/mail icon
   - Use: https://via.placeholder.com/64x64/4CAF50/ffffff?text=📧

## /assets/courses/

1. **html-css-thumb.png** (400x300px)
   - HTML/CSS related graphic
   - Use: https://via.placeholder.com/400x300/FF6B6B/ffffff?text=HTML+CSS

2. **javascript-thumb.png** (400x300px)
   - JavaScript logo or related
   - Use: https://via.placeholder.com/400x300/FFD93D/000000?text=JavaScript

3. **responsive-thumb.png** (400x300px)
   - Multiple devices graphic
   - Use: https://via.placeholder.com/400x300/6BCB77/ffffff?text=Responsive

4. **fullstack-thumb.png** (400x300px)
   - Full stack development graphic
   - Use: https://via.placeholder.com/400x300/4D96FF/ffffff?text=Full+Stack

## /assets/references/

1. **html-css-l1-q1-ref.png** (1280x720px)
   - Screenshot of completed profile card
   
2. **html-css-l1-q2-ref.png** (1280x720px)
   - Screenshot of completed product card
   
3. **html-css-l2-q1-ref.png** (1280x720px)
   - Screenshot of completed hero section
   
4. **javascript-l1-q1-ref.png** (1280x720px)
   - Screenshot of completed counter app
   
5. **fullstack-l1-q1-ref.png** (1280x720px)
   - Screenshot of completed contact form

## Quick Setup Script

You can download placeholder images using curl or wget:

```bash
# Navigate to backend directory
cd backend/assets/images

# Download placeholders (using placehold.co - reliable service)
curl "https://ui-avatars.com/api/?name=John+Doe&size=120&background=667eea&color=fff" -o avatar-1.png
curl "https://placehold.co/300x300/3498db/ffffff/png?text=Headphones" -o product-1.png
curl "https://placehold.co/1920x1080/667eea/ffffff/jpg?text=Hero+Background" -o hero-bg-1.jpg
curl "https://placehold.co/48x48/4CAF50/ffffff/png?text=%2B" -o plus-icon.png
curl "https://placehold.co/48x48/f44336/ffffff/png?text=-" -o minus-icon.png
curl "https://placehold.co/64x64/4CAF50/ffffff/png?text=Mail" -o form-icon.png

cd ../courses
curl "https://ui-avatars.com/api/?name=HTML+CSS&size=400&background=FF6B6B&color=fff&font-size=0.4" -o html-css-thumb.png
curl "https://ui-avatars.com/api/?name=JavaScript&size=400&background=FFD93D&color=000&font-size=0.4" -o javascript-thumb.png
curl "https://ui-avatars.com/api/?name=Responsive&size=400&background=6BCB77&color=fff&font-size=0.4" -o responsive-thumb.png
curl "https://ui-avatars.com/api/?name=Full+Stack&size=400&background=4D96FF&color=fff&font-size=0.4" -o fullstack-thumb.png
```

Or use PowerShell:

```powershell
# Navigate to images directory
cd backend\assets\images

# Download placeholders (using placehold.co - reliable service)
Invoke-WebRequest -Uri "https://ui-avatars.com/api/?name=John+Doe&size=120&background=667eea&color=fff" -OutFile "avatar-1.png"
Invoke-WebRequest -Uri "https://placehold.co/300x300/3498db/ffffff/png?text=Headphones" -OutFile "product-1.png"
Invoke-WebRequest -Uri "https://placehold.co/1920x1080/667eea/ffffff/jpg?text=Hero+Background" -OutFile "hero-bg-1.jpg"
Invoke-WebRequest -Uri "https://placehold.co/48x48/4CAF50/ffffff/png?text=%2B" -OutFile "plus-icon.png"
Invoke-WebRequest -Uri "https://placehold.co/48x48/f44336/ffffff/png?text=-" -OutFile "minus-icon.png"
Invoke-WebRequest -Uri "https://placehold.co/64x64/4CAF50/ffffff/png?text=Mail" -OutFile "form-icon.png"

cd ..\courses
Invoke-WebRequest -Uri "https://ui-avatars.com/api/?name=HTML+CSS&size=400&background=FF6B6B&color=fff&font-size=0.4" -OutFile "html-css-thumb.png"
Invoke-WebRequest -Uri "https://ui-avatars.com/api/?name=JavaScript&size=400&background=FFD93D&color=000&font-size=0.4" -OutFile "javascript-thumb.png"
Invoke-WebRequest -Uri "https://ui-avatars.com/api/?name=Responsive&size=400&background=6BCB77&color=fff&font-size=0.4" -OutFile "responsive-thumb.png"
Invoke-WebRequest -Uri "https://ui-avatars.com/api/?name=Full+Stack&size=400&background=4D96FF&color=fff&font-size=0.4" -OutFile "fullstack-thumb.png"
```

**Note:** All placeholder images have been downloaded and are ready to use! ✅
