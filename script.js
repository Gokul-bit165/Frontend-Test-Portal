// Test Configuration
const tests = [
    {
        id: 0,
        title: "Build a Button",
        description: `
            <p>Create a button with the following requirements:</p>
            <ul>
                <li>Button text should be "Click Me"</li>
                <li>Button should have a class "primary-btn"</li>
                <li>Background color should be blue (#007bff)</li>
                <li>Text color should be white</li>
                <li>On click, it should display an alert saying "Hello!"</li>
            </ul>
        `,
        evaluationCriteria: [
            {
                name: "Button exists",
                test: (doc) => {
                    const button = doc.querySelector('button');
                    return button !== null;
                },
                points: 20
            },
            {
                name: "Button text is 'Click Me'",
                test: (doc) => {
                    const button = doc.querySelector('button');
                    return button && button.textContent.trim() === 'Click Me';
                },
                points: 15
            },
            {
                name: "Button has class 'primary-btn'",
                test: (doc) => {
                    const button = doc.querySelector('button');
                    return button && button.classList.contains('primary-btn');
                },
                points: 15
            },
            {
                name: "Background color is blue (#007bff)",
                test: (doc) => {
                    const button = doc.querySelector('button');
                    if (!button) return false;
                    const bgColor = window.getComputedStyle(button).backgroundColor;
                    return bgColor === 'rgb(0, 123, 255)' || bgColor === '#007bff';
                },
                points: 20
            },
            {
                name: "Text color is white",
                test: (doc) => {
                    const button = doc.querySelector('button');
                    if (!button) return false;
                    const color = window.getComputedStyle(button).color;
                    return color === 'rgb(255, 255, 255)' || color === '#ffffff' || color === 'white';
                },
                points: 15
            },
            {
                name: "Button has click event handler",
                test: (doc) => {
                    const button = doc.querySelector('button');
                    return button && button.onclick !== null;
                },
                points: 15
            }
        ]
    },
    {
        id: 1,
        title: "Responsive Card",
        description: `
            <p>Create a card component with the following requirements:</p>
            <ul>
                <li>A div with class "card"</li>
                <li>Card should have a heading with text "Card Title"</li>
                <li>Card should have a paragraph with any text</li>
                <li>Card width should be 300px</li>
                <li>Card should have padding of 20px</li>
                <li>Card should have a border with border-radius of 10px</li>
                <li>Card should have a shadow (box-shadow)</li>
            </ul>
        `,
        evaluationCriteria: [
            {
                name: "Card element exists with class 'card'",
                test: (doc) => {
                    return doc.querySelector('.card') !== null;
                },
                points: 15
            },
            {
                name: "Card has a heading",
                test: (doc) => {
                    const card = doc.querySelector('.card');
                    return card && (card.querySelector('h1') || card.querySelector('h2') || card.querySelector('h3'));
                },
                points: 15
            },
            {
                name: "Heading text is 'Card Title'",
                test: (doc) => {
                    const card = doc.querySelector('.card');
                    const heading = card && (card.querySelector('h1') || card.querySelector('h2') || card.querySelector('h3'));
                    return heading && heading.textContent.trim() === 'Card Title';
                },
                points: 10
            },
            {
                name: "Card has a paragraph",
                test: (doc) => {
                    const card = doc.querySelector('.card');
                    return card && card.querySelector('p') !== null;
                },
                points: 10
            },
            {
                name: "Card width is 300px",
                test: (doc) => {
                    const card = doc.querySelector('.card');
                    if (!card) return false;
                    const width = window.getComputedStyle(card).width;
                    return width === '300px';
                },
                points: 15
            },
            {
                name: "Card has padding of 20px",
                test: (doc) => {
                    const card = doc.querySelector('.card');
                    if (!card) return false;
                    const padding = window.getComputedStyle(card).padding;
                    return padding === '20px' || padding === '20px 20px 20px 20px';
                },
                points: 15
            },
            {
                name: "Card has border-radius",
                test: (doc) => {
                    const card = doc.querySelector('.card');
                    if (!card) return false;
                    const borderRadius = window.getComputedStyle(card).borderRadius;
                    return borderRadius && borderRadius !== '0px';
                },
                points: 10
            },
            {
                name: "Card has box-shadow",
                test: (doc) => {
                    const card = doc.querySelector('.card');
                    if (!card) return false;
                    const boxShadow = window.getComputedStyle(card).boxShadow;
                    return boxShadow && boxShadow !== 'none';
                },
                points: 10
            }
        ]
    },
    {
        id: 2,
        title: "Form Validation",
        description: `
            <p>Create a form with validation:</p>
            <ul>
                <li>A form with id "user-form"</li>
                <li>An input field with id "email" and type "email"</li>
                <li>A submit button</li>
                <li>When submitted, prevent default and validate email is not empty</li>
                <li>Display "Valid!" in a div with id "message" if email is not empty</li>
                <li>Display "Email required!" if email is empty</li>
            </ul>
        `,
        evaluationCriteria: [
            {
                name: "Form exists with id 'user-form'",
                test: (doc) => {
                    return doc.querySelector('#user-form') !== null;
                },
                points: 15
            },
            {
                name: "Email input exists with correct id and type",
                test: (doc) => {
                    const input = doc.querySelector('#email');
                    return input && input.type === 'email';
                },
                points: 20
            },
            {
                name: "Submit button exists",
                test: (doc) => {
                    const form = doc.querySelector('#user-form');
                    return form && (form.querySelector('button[type="submit"]') || form.querySelector('input[type="submit"]'));
                },
                points: 15
            },
            {
                name: "Message div exists with id 'message'",
                test: (doc) => {
                    return doc.querySelector('#message') !== null;
                },
                points: 15
            },
            {
                name: "Form has submit event handler",
                test: (doc) => {
                    const form = doc.querySelector('#user-form');
                    return form && form.onsubmit !== null;
                },
                points: 20
            },
            {
                name: "Email input has proper styling",
                test: (doc) => {
                    const input = doc.querySelector('#email');
                    if (!input) return false;
                    const padding = window.getComputedStyle(input).padding;
                    return padding && padding !== '0px';
                },
                points: 15
            }
        ]
    },
    {
        id: 3,
        title: "Navigation Menu",
        description: `
            <p>Create a navigation menu:</p>
            <ul>
                <li>A nav element with class "navbar"</li>
                <li>A ul with class "nav-list" inside the nav</li>
                <li>At least 3 li elements with class "nav-item"</li>
                <li>Each li should contain an anchor tag</li>
                <li>Nav should have flexbox display</li>
                <li>Nav items should be evenly spaced</li>
                <li>Nav should have a background color</li>
            </ul>
        `,
        evaluationCriteria: [
            {
                name: "Nav element exists with class 'navbar'",
                test: (doc) => {
                    return doc.querySelector('nav.navbar') !== null;
                },
                points: 15
            },
            {
                name: "UL exists with class 'nav-list'",
                test: (doc) => {
                    const nav = doc.querySelector('nav.navbar');
                    return nav && nav.querySelector('ul.nav-list') !== null;
                },
                points: 15
            },
            {
                name: "At least 3 nav items exist",
                test: (doc) => {
                    const navItems = doc.querySelectorAll('.nav-item');
                    return navItems.length >= 3;
                },
                points: 20
            },
            {
                name: "Nav items contain anchor tags",
                test: (doc) => {
                    const navItems = doc.querySelectorAll('.nav-item');
                    if (navItems.length === 0) return false;
                    return Array.from(navItems).every(item => item.querySelector('a') !== null);
                },
                points: 15
            },
            {
                name: "Nav uses flexbox",
                test: (doc) => {
                    const nav = doc.querySelector('nav.navbar');
                    if (!nav) return false;
                    const display = window.getComputedStyle(nav).display;
                    return display === 'flex';
                },
                points: 15
            },
            {
                name: "Nav has background color",
                test: (doc) => {
                    const nav = doc.querySelector('nav.navbar');
                    if (!nav) return false;
                    const bgColor = window.getComputedStyle(nav).backgroundColor;
                    return bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent';
                },
                points: 10
            },
            {
                name: "Nav has padding or height",
                test: (doc) => {
                    const nav = doc.querySelector('nav.navbar');
                    if (!nav) return false;
                    const padding = window.getComputedStyle(nav).padding;
                    const height = window.getComputedStyle(nav).height;
                    return (padding && padding !== '0px') || (height && height !== '0px');
                },
                points: 10
            }
        ]
    }
];

// Global variables
let currentTest = 0;
let timerInterval = null;
let startTime = null;

// Initialize the platform
function init() {
    loadTest(0);
    setupAutoSave();
}

// Load a specific test
function loadTest(testIndex) {
    currentTest = testIndex;
    const test = tests[testIndex];
    
    // Update UI
    document.getElementById('test-title').textContent = test.title;
    document.getElementById('test-description').innerHTML = test.description;
    
    // Update active test button
    document.querySelectorAll('.test-item').forEach((item, index) => {
        if (index === testIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Load saved code if exists
    loadSavedCode(testIndex);
    
    // Hide results
    document.getElementById('results-section').style.display = 'none';
    
    // Reset timer
    resetTimer();
    startTimer();
}

// Clear editor
function clearEditor(type) {
    document.getElementById(`${type}-editor`).value = '';
    saveCode();
}

// Run code in preview
function runCode() {
    const html = document.getElementById('html-editor').value;
    const css = document.getElementById('css-editor').value;
    const js = document.getElementById('js-editor').value;
    
    const iframe = document.getElementById('preview-frame');
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    
    const fullHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>${css}</style>
        </head>
        <body>
            ${html}
            <script>${js}<\/script>
        </body>
        </html>
    `;
    
    iframeDoc.open();
    iframeDoc.write(fullHTML);
    iframeDoc.close();
    
    document.getElementById('preview-status').textContent = 'Updated';
    document.getElementById('preview-status').style.background = '#28a745';
    
    setTimeout(() => {
        document.getElementById('preview-status').textContent = 'Ready';
    }, 2000);
    
    saveCode();
}

// Submit and evaluate test
function submitTest() {
    const test = tests[currentTest];
    const iframe = document.getElementById('preview-frame');
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    const iframeWindow = iframe.contentWindow;
    
    let totalScore = 0;
    let maxScore = 0;
    const results = [];
    
    // Run all evaluation criteria
    test.evaluationCriteria.forEach(criteria => {
        maxScore += criteria.points;
        let passed = false;
        let error = null;
        
        try {
            // Create a window proxy with computed style access
            const windowProxy = new Proxy(iframeWindow, {
                get(target, prop) {
                    if (prop === 'getComputedStyle') {
                        return target.getComputedStyle.bind(target);
                    }
                    return target[prop];
                }
            });
            
            // Pass both document and window
            passed = criteria.test.call(windowProxy, iframeDoc);
            
            if (passed) {
                totalScore += criteria.points;
            }
        } catch (e) {
            error = e.message;
            passed = false;
        }
        
        results.push({
            name: criteria.name,
            passed: passed,
            points: criteria.points,
            error: error
        });
    });
    
    // Display results
    displayResults(totalScore, maxScore, results);
    
    // Stop timer
    stopTimer();
}

// Display test results
function displayResults(score, maxScore, results) {
    const resultsSection = document.getElementById('results-section');
    const scoreValue = document.getElementById('score-value');
    const testCases = document.getElementById('test-cases');
    
    scoreValue.textContent = `${score}/${maxScore}`;
    
    // Clear previous results
    testCases.innerHTML = '';
    
    // Add test case results
    results.forEach(result => {
        const testCase = document.createElement('div');
        testCase.className = `test-case ${result.passed ? 'passed' : 'failed'}`;
        
        testCase.innerHTML = `
            <div>
                <div class="test-case-name">${result.name}</div>
                ${result.error ? `<div class="test-case-details">Error: ${result.error}</div>` : ''}
            </div>
            <div class="test-case-status">${result.passed ? 'PASSED' : 'FAILED'} (${result.points} pts)</div>
        `;
        
        testCases.appendChild(testCase);
    });
    
    resultsSection.style.display = 'block';
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Reset test
function resetTest() {
    if (confirm('Are you sure you want to reset? All code will be cleared.')) {
        document.getElementById('html-editor').value = '';
        document.getElementById('css-editor').value = '';
        document.getElementById('js-editor').value = '';
        
        const iframe = document.getElementById('preview-frame');
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write('');
        iframeDoc.close();
        
        document.getElementById('results-section').style.display = 'none';
        
        localStorage.removeItem(`test_${currentTest}_code`);
        
        resetTimer();
        startTimer();
    }
}

// Timer functions
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    document.getElementById('timer').textContent = '00:00';
    startTime = null;
}

function updateTimer() {
    if (!startTime) return;
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    document.getElementById('timer').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Auto-save functionality
function setupAutoSave() {
    ['html-editor', 'css-editor', 'js-editor'].forEach(id => {
        document.getElementById(id).addEventListener('input', saveCode);
    });
}

function saveCode() {
    const code = {
        html: document.getElementById('html-editor').value,
        css: document.getElementById('css-editor').value,
        js: document.getElementById('js-editor').value
    };
    
    localStorage.setItem(`test_${currentTest}_code`, JSON.stringify(code));
}

function loadSavedCode(testIndex) {
    const saved = localStorage.getItem(`test_${testIndex}_code`);
    
    if (saved) {
        const code = JSON.parse(saved);
        document.getElementById('html-editor').value = code.html || '';
        document.getElementById('css-editor').value = code.css || '';
        document.getElementById('js-editor').value = code.js || '';
    } else {
        document.getElementById('html-editor').value = '';
        document.getElementById('css-editor').value = '';
        document.getElementById('js-editor').value = '';
    }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', init);
