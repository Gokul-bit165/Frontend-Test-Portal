/**
 * Main Evaluator Service
 * Orchestrates hybrid evaluation: DOM Comparison + Pixel Matching
 * Combines both scores into final result
 */

const domCompare = require('./domCompare');
const pixelMatch = require('./pixelMatch');

class Evaluator {
  /**
   * Main evaluation function
   * @param {Object} candidateCode - { html, css, js }
   * @param {Object} expectedCode - { html, css, js }
   * @param {Object} thresholds - { structure, visual, overall }
   * @param {string} submissionId - Unique identifier
   * @returns {Object} - Complete evaluation result
   */
  async evaluate(candidateCode, expectedCode, thresholds, submissionId) {
    console.log(`\n🔍 Starting Hybrid Evaluation`);
    console.log(`   Submission ID: ${submissionId}`);
    
    const result = {
      submissionId,
      timestamp: new Date().toISOString(),
      structureScore: 0,
      visualScore: 0,
      finalScore: 0,
      passed: false,
      thresholds,
      dom: null,
      pixel: null,
      feedback: []
    };
    
    try {
      // Step 1: DOM Structure Comparison
      console.log(`   ⚙️  Running DOM structure comparison...`);
      const domResult = domCompare.compare(
        candidateCode.html,
        expectedCode.html
      );
      
      result.structureScore = domResult.score;
      result.dom = {
        score: domResult.score,
        passed: domResult.score >= thresholds.structure,
        details: domResult.details,
        checks: {
          total: domResult.totalChecks,
          passed: domResult.passedChecks
        }
      };
      
      console.log(`   ✓ DOM Score: ${domResult.score}%`);
      
      // Step 2: Pixel-level Visual Comparison
      console.log(`   📸 Running pixel matching (screenshot comparison)...`);
      const pixelResult = await pixelMatch.compare(
        candidateCode,
        expectedCode,
        submissionId
      );
      
      result.visualScore = pixelResult.score;
      result.pixel = {
        score: pixelResult.score,
        passed: pixelResult.score >= thresholds.visual,
        diffPixels: pixelResult.diffPixels,
        totalPixels: pixelResult.totalPixels,
        diffPercentage: pixelResult.diffPercentage,
        screenshots: pixelResult.screenshots
      };
      
      console.log(`   ✓ Visual Score: ${pixelResult.score}%`);
      
      // Step 3: Calculate Final Score (Weighted Average)
      // DOM structure: 40%, Visual: 60%
      result.finalScore = Math.round(
        (result.structureScore * 0.4) + (result.visualScore * 0.6)
      );
      
      console.log(`   📊 Final Score: ${result.finalScore}%`);
      
      // Step 4: Determine Pass/Fail
      result.passed = 
        result.structureScore >= thresholds.structure &&
        result.visualScore >= thresholds.visual &&
        result.finalScore >= thresholds.overall;
      
      // Step 5: Generate Feedback
      result.feedback = this.generateFeedback(result, thresholds);
      
      console.log(`   ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Evaluation error:', error.message);
      console.error('   Stack:', error.stack);
      
      // Return a failed result with error info instead of throwing
      return {
        submissionId,
        timestamp: new Date().toISOString(),
        structureScore: 0,
        visualScore: 0,
        finalScore: 0,
        passed: false,
        error: error.message,
        feedback: [{
          type: 'error',
          message: `Evaluation failed: ${error.message}. Please contact administrator.`
        }]
      };
    }
  }
  
  /**
   * Generate human-readable feedback based on results
   * @param {Object} result - Evaluation result
   * @param {Object} thresholds - Pass thresholds
   * @returns {Array} - Feedback messages
   */
  generateFeedback(result, thresholds) {
    const feedback = [];
    
    // Overall result
    if (result.passed) {
      feedback.push({
        type: 'success',
        category: 'overall',
        message: `Excellent work! You passed all requirements with a final score of ${result.finalScore}%.`
      });
    } else {
      feedback.push({
        type: 'error',
        category: 'overall',
        message: `Your solution did not meet the passing criteria. Final score: ${result.finalScore}% (required: ${thresholds.overall}%).`
      });
    }
    
    // DOM Structure Feedback
    if (result.dom) {
      if (result.dom.passed) {
        feedback.push({
          type: 'success',
          category: 'structure',
          message: `✓ DOM structure is correct (${result.structureScore}%). Your HTML hierarchy matches the requirements.`
        });
      } else {
        feedback.push({
          type: 'warning',
          category: 'structure',
          message: `⚠ DOM structure needs improvement (${result.structureScore}%, required: ${thresholds.structure}%). Check your HTML tags, attributes, and nesting.`
        });
        
        // Add specific DOM issues
        if (result.dom.details.tagMismatches.length > 0) {
          feedback.push({
            type: 'info',
            category: 'structure',
            message: `Missing or incorrect tags: ${result.dom.details.tagMismatches.slice(0, 3).join('; ')}`
          });
        }
        
        if (result.dom.details.classMismatches.length > 0) {
          feedback.push({
            type: 'info',
            category: 'structure',
            message: `Missing CSS classes: ${result.dom.details.classMismatches.slice(0, 3).join('; ')}`
          });
        }
      }
    }
    
    // Visual/Pixel Feedback
    if (result.pixel) {
      if (result.pixel.passed) {
        feedback.push({
          type: 'success',
          category: 'visual',
          message: `✓ Visual appearance is accurate (${result.visualScore}%). Your styling matches the expected design.`
        });
      } else {
        feedback.push({
          type: 'warning',
          category: 'visual',
          message: `⚠ Visual appearance differs from expected (${result.visualScore}%, required: ${thresholds.visual}%). Review your CSS styling, colors, spacing, and layout.`
        });
        
        if (result.pixel.diffPercentage > 30) {
          feedback.push({
            type: 'info',
            category: 'visual',
            message: `Significant visual differences detected (${result.pixel.diffPercentage}% of pixels differ). Check layout, colors, fonts, and positioning.`
          });
        } else if (result.pixel.diffPercentage > 15) {
          feedback.push({
            type: 'info',
            category: 'visual',
            message: `Minor visual differences detected (${result.pixel.diffPercentage}% of pixels differ). Fine-tune spacing, colors, or font sizes.`
          });
        }
      }
    }
    
    // Actionable suggestions
    if (!result.passed) {
      feedback.push({
        type: 'info',
        category: 'suggestion',
        message: 'Suggestions: Review the challenge instructions, check console for errors, compare your output with expected behavior, and verify all CSS properties.'
      });
    }
    
    return feedback;
  }
  
  /**
   * Clean up resources (screenshots, browser instances)
   * @param {string} submissionId 
   */
  async cleanup(submissionId) {
    // In production, implement cleanup logic
    // For prototype, we keep screenshots for review
    console.log(`Cleanup for ${submissionId} - keeping screenshots for review`);
  }
}

module.exports = new Evaluator();
