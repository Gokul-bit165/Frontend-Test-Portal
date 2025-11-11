-- Import Users
INSERT INTO users (id, username, password, email, full_name, role, created_at) VALUES
('user-001', 'admin', '123456', 'admin@example.com', 'Administrator', 'admin', NOW()),
('user-002', 'student1', '123456', 'student1@example.com', 'Student One', 'student', NOW()),
('user-003', 'testuser1', '123456', 'testuser1@example.com', 'Test User', 'student', NOW()),
('user-004', 'gokul', '123456', 'gokul@example.com', 'Gokul', 'admin', NOW())
ON DUPLICATE KEY UPDATE username=username;

-- Import Courses
INSERT INTO courses (id, title, description, thumbnail, icon, color, total_levels, estimated_time, difficulty, tags, is_locked) VALUES
('html-css', 'HTML & CSS Fundamentals', 'Master the building blocks of web development', '/thumbnails/html-css.jpg', 'Code', 'blue', 6, '2 hours', 'Beginner', '["html", "css", "fundamentals"]', 0),
('javascript', 'JavaScript Basics', 'Learn JavaScript programming essentials', '/thumbnails/javascript.jpg', 'Code', 'yellow', 6, '3 hours', 'Intermediate', '["javascript", "programming"]', 0),
('responsive', 'Responsive Design', 'Create mobile-friendly websites', '/thumbnails/responsive.jpg', 'Layout', 'green', 6, '2 hours', 'Intermediate', '["responsive", "css", "design"]', 0),
('full-stack', 'Full Stack Projects', 'Build complete web applications', '/thumbnails/full-stack.jpg', 'Zap', 'purple', 6, '4 hours', 'Advanced', '["full-stack", "projects"]', 0)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Import Challenges (30 questions - 5 per level × 6 levels)
-- Level 1 - HTML & CSS
INSERT INTO challenges (id, title, difficulty, description, instructions, expected_output, html_template, css_template, js_template, test_cases, hints, tags, points, time_limit, course_id, level) VALUES
('chal-001', 'Simple Profile Card', 'Medium', 'Create a simple profile card with basic HTML structure', 'Build a profile card with image, name, and description', '<div class="profile-card">\n  <img src="/avatar.jpg" alt="Profile" />\n  <h2>John Doe</h2>\n  <p>Web Developer</p>\n</div>', '<div class="profile-card">\n  <!-- Your code here -->\n</div>', '.profile-card {\n  /* Your styles here */\n}', '', '[]', '["Use flexbox for centering", "Add border-radius for rounded corners"]', '["html", "css", "basics"]', 100, 30, 'html-css', 1),
('chal-002', 'Product Card with Image', 'Medium', 'Design a product card with image and details', 'Create a card showcasing a product with image, title, price', '<div class="product-card">\n  <img src="/product.jpg" alt="Product" />\n  <h3>Product Name</h3>\n  <p class="price">$29.99</p>\n</div>', '<div class="product-card">\n  <!-- Your code here -->\n</div>', '.product-card {\n  /* Your styles here */\n}', '', '[]', '["Add box-shadow for depth", "Use padding for spacing"]', '["html", "css"]', 100, 30, 'html-css', 1),
('chal-003', 'Hero Section with Background', 'Medium', 'Create a hero section with background image', 'Build a hero section with background image and call-to-action', '<section class="hero">\n  <h1>Welcome</h1>\n  <p>Your journey starts here</p>\n  <button>Get Started</button>\n</section>', '<section class="hero">\n  <!-- Your code here -->\n</section>', '.hero {\n  /* Your styles here */\n}', '', '[]', '["Use background-size: cover", "Add text-shadow for readability"]', '["html", "css", "hero"]', 100, 30, 'html-css', 1),
('chal-004', 'Interactive Counter', 'Medium', 'Build a simple counter with increment/decrement buttons', 'Create interactive buttons to increase and decrease a number', '<div class="counter">\n  <button onclick="decrement()">-</button>\n  <span id="count">0</span>\n  <button onclick="increment()">+</button>\n</div>', '<div class="counter">\n  <!-- Your code here -->\n</div>', '.counter {\n  /* Your styles here */\n}', 'let count = 0;\nfunction increment() { count++; document.getElementById("count").textContent = count; }\nfunction decrement() { count--; document.getElementById("count").textContent = count; }', '[]', '["Use onclick events", "Store count in a variable"]', '["html", "css", "javascript"]', 100, 30, 'html-css', 1),
('chal-005', 'Contact Form with Validation', 'Medium', 'Create a contact form with basic validation', 'Build a form with name, email, and message fields', '<form id="contactForm">\n  <input type="text" placeholder="Name" required />\n  <input type="email" placeholder="Email" required />\n  <textarea placeholder="Message"></textarea>\n  <button type="submit">Send</button>\n</form>', '<form id="contactForm">\n  <!-- Your code here -->\n</form>', 'form {\n  /* Your styles here */\n}', '', '[]', '["Use required attribute", "Style focus states"]', '["html", "forms"]', 100, 30, 'html-css', 1)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Level 2
INSERT INTO challenges (id, title, difficulty, description, instructions, expected_output, html_template, css_template, js_template, test_cases, hints, tags, points, time_limit, course_id, level) VALUES
('chal-006', 'Basic HTML Structure', 'Easy', 'Create basic HTML document structure', 'Build a complete HTML page with proper structure', '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>', '<!DOCTYPE html>\n<html>\n<head>\n  <!-- Your code here -->\n</head>\n<body>\n  <!-- Your code here -->\n</body>\n</html>', '', '', '[]', '["Include DOCTYPE", "Add meta viewport tag"]', '["html", "basics"]', 100, 30, 'html-css', 2),
('chal-007', 'Text Formatting Elements', 'Easy', 'Use various HTML text formatting tags', 'Create a page with bold, italic, underline, and other text styles', '<p><strong>Bold</strong> <em>Italic</em> <u>Underline</u></p>', '<p>\n  <!-- Your code here -->\n</p>', '', '', '[]', '["Use semantic tags", "Combine multiple styles"]', '["html", "text"]', 100, 30, 'html-css', 2),
('chal-008', 'Lists in HTML', 'Easy', 'Create ordered and unordered lists', 'Build both numbered and bulleted lists', '<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>\n<ol>\n  <li>First</li>\n  <li>Second</li>\n</ol>', '<div>\n  <!-- Your code here -->\n</div>', '', '', '[]', '["Use <ul> for bullets", "Use <ol> for numbers"]', '["html", "lists"]', 100, 30, 'html-css', 2),
('chal-009', 'Links and Navigation', 'Easy', 'Create navigation with links', 'Build a simple navigation menu', '<nav>\n  <a href="#home">Home</a>\n  <a href="#about">About</a>\n  <a href="#contact">Contact</a>\n</nav>', '<nav>\n  <!-- Your code here -->\n</nav>', 'nav a {\n  /* Your styles here */\n}', '', '[]', '["Use anchor tags", "Add hover effects"]', '["html", "navigation"]', 100, 30, 'html-css', 2),
('chal-010', 'Basic HTML Table', 'Easy', 'Create a data table', 'Build a table with headers and data rows', '<table>\n  <thead>\n    <tr><th>Name</th><th>Age</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>John</td><td>25</td></tr>\n  </tbody>\n</table>', '<table>\n  <!-- Your code here -->\n</table>', 'table { /* Your styles here */ }', '', '[]', '["Use thead and tbody", "Add borders"]', '["html", "table"]', 100, 30, 'html-css', 2)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Continue for other levels...
-- (You would add similar INSERT statements for levels 3, 4, 5, and 6)

SELECT 'Data import completed!' as message;
