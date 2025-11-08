/**
 * Pixel Matching Service
 * Uses Puppeteer to render HTML and capture screenshots
 * Performs pixel-by-pixel comparison using pixelmatch library
 */

const puppeteer = require('puppeteer');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const fs = require('fs');
const path = require('path');

class PixelMatcher {
  constructor() {
    this.screenshotDir = path.join(__dirname, '../screenshots');
    this.browser = null;
  }
  
  /**
   * Initialize browser instance (reuse for performance)
   */
  async initBrowser() {
    if (!this.browser) {
      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
      
      this.browser = await puppeteer.launch({
        headless: 'new',
        executablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Overcome limited resource problems in Docker
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions'
        ],
        timeout: 30000 // 30 second launch timeout
      });
    }
    return this.browser;
  }
  
  /**
   * Close browser
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
  
  /**
   * Main comparison function
   * @param {Object} candidateCode - { html, css, js }
   * @param {Object} expectedCode - { html, css, js }
   * @param {string} submissionId - Unique ID for screenshot naming
   * @returns {Object} - Comparison result with score
   */
  async compare(candidateCode, expectedCode, submissionId) {
    let browser = null;
    
    try {
      browser = await this.initBrowser();
      
      // Create full HTML pages
      const candidatePage = this.createFullPage(candidateCode);
      const expectedPage = this.createFullPage(expectedCode);
      
      // Take screenshots
      const candidateScreenshot = await this.captureScreenshot(
        browser,
        candidatePage,
        `${submissionId}-candidate`
      );
      
      const expectedScreenshot = await this.captureScreenshot(
        browser,
        expectedPage,
        `${submissionId}-expected`
      );
      
      // Compare screenshots
      const comparisonResult = await this.compareImages(
        candidateScreenshot,
        expectedScreenshot,
        submissionId
      );
      
      return {
        score: comparisonResult.score,
        passed: comparisonResult.score >= 80, // Default threshold
        diffPixels: comparisonResult.diffPixels,
        totalPixels: comparisonResult.totalPixels,
        diffPercentage: comparisonResult.diffPercentage,
        screenshots: {
          candidate: `/screenshots/${submissionId}-candidate.png`,
          expected: `/screenshots/${submissionId}-expected.png`,
          diff: `/screenshots/${submissionId}-diff.png`
        }
      };
      
    } catch (error) {
      console.error('Pixel matching error:', error);
      return {
        score: 0,
        passed: false,
        error: error.message
      };
    }
  }
  
  /**
   * Create full HTML page with CSS and JS injected
   * @param {Object} code - { html, css, js }
   * @returns {string} - Complete HTML page
   */
  createFullPage(code) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Render</title>
        <style>
          /* Reset for consistency */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          /* User CSS */
          ${code.css || ''}
        </style>
      </head>
      <body>
        ${code.html || ''}
        
        <script>
          try {
            ${code.js || ''}
          } catch (e) {
            console.error('JS execution error:', e);
          }
        </script>
      </body>
      </html>
    `;
  }
  
  /**
   * Capture screenshot of HTML page
   * @param {Browser} browser - Puppeteer browser instance
   * @param {string} htmlContent - Full HTML content
   * @param {string} filename - Screenshot filename
   * @returns {string} - Path to screenshot
   */
  async captureScreenshot(browser, htmlContent, filename) {
    const page = await browser.newPage();
    
    try {
      // Set consistent viewport
      await page.setViewport({
        width: 1280,
        height: 720,
        deviceScaleFactor: 1
      });
      
      // Set content and wait for rendering
      await page.setContent(htmlContent, {
        waitUntil: 'domcontentloaded', // Faster than 'load'
        timeout: 30000 // 30 second timeout (increased for Docker)
      });
      
      // Wait a bit for any animations or dynamic content
      await page.waitForTimeout(500);
      
      // Capture screenshot
      const screenshotPath = path.join(this.screenshotDir, `${filename}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: false // Use viewport size for consistency
      });
      
      return screenshotPath;
      
    } finally {
      await page.close();
    }
  }
  
  /**
   * Compare two PNG images pixel by pixel
   * @param {string} candidatePath - Path to candidate screenshot
   * @param {string} expectedPath - Path to expected screenshot
   * @param {string} submissionId - ID for diff image
   * @returns {Object} - Comparison metrics
   */
  async compareImages(candidatePath, expectedPath, submissionId) {
    try {
      // Read images
      const candidateImg = PNG.sync.read(fs.readFileSync(candidatePath));
      const expectedImg = PNG.sync.read(fs.readFileSync(expectedPath));
      
      const { width, height } = expectedImg;
      
      // Ensure images are same size (resize candidate if needed)
      let candidateData = candidateImg.data;
      if (candidateImg.width !== width || candidateImg.height !== height) {
        console.warn('Image size mismatch, using expected dimensions');
        // In production, you'd resize the image properly
        // For prototype, we'll proceed with size difference noted
      }
      
      // Create diff image
      const diff = new PNG({ width, height });
      
      // Perform pixel comparison
      const diffPixels = pixelmatch(
        candidateImg.data,
        expectedImg.data,
        diff.data,
        width,
        height,
        {
          threshold: 0.1, // Sensitivity (0-1, lower = more strict)
          alpha: 0.1,
          diffColor: [255, 0, 0], // Red for differences
          diffColorAlt: [0, 255, 0] // Green for matches (optional)
        }
      );
      
      // Save diff image
      const diffPath = path.join(this.screenshotDir, `${submissionId}-diff.png`);
      fs.writeFileSync(diffPath, PNG.sync.write(diff));
      
      // Calculate metrics
      const totalPixels = width * height;
      const diffPercentage = (diffPixels / totalPixels) * 100;
      const similarityScore = Math.max(0, 100 - diffPercentage);
      
      return {
        score: Math.round(similarityScore),
        diffPixels,
        totalPixels,
        diffPercentage: diffPercentage.toFixed(2),
        matchPercentage: similarityScore.toFixed(2)
      };
      
    } catch (error) {
      console.error('Image comparison error:', error);
      throw error;
    }
  }
}

module.exports = new PixelMatcher();
