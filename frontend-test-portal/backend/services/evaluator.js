/**
 * Main Evaluator Service
 * Orchestrates hybrid evaluation: Strict Content + Semantic DOM + Pixel Matching
 * Uses content-specific validation and human-friendly feedback
 * Scoring: Content 35%, Structure 15%, Visual 40%, Behavior 10%
 */

const strictContentEvaluator = require('./strictContentEvaluator');
const semanticEvaluator = require('./semanticEvaluator');
const pixelMatch = require('./pixelMatch');

class Evaluator {
  /**
   * Main evaluation function
   * @param {Object} candidateCode - { html, css, js }
   * @param {Object} expectedCode - { html, css, js }
   * @param {Object} thresholds - { structure, visual, overall }
   * @param {string} submissionId - Unique identifier
   * @param {string} challengeId - Challenge identifier for content validation
   * @returns {Object} - Complete evaluation result
   */
  async evaluate(candidateCode, expectedCode, thresholds, submissionId, challengeId = '') {
    console.log(`\n🔍 Starting Strict Content + Hybrid Evaluation`);
    console.log(`   Submission ID: ${submissionId}`);
    console.log(`   Challenge ID: ${challengeId}`);
    
    const result = {
      submissionId,
      timestamp: new Date().toISOString(),
      contentScore: 0,
      structureScore: 0,
      visualScore: 0,
      behaviorScore: 0,
      finalScore: 0,
      passed: false,
      thresholds,
      content: null,
      structure: null,
      visual: null,
      feedback: null
    };
    
    try {
      // Step 1: STRICT CONTENT VALIDATION (NEW!)
      console.log(`   📝 Running strict content validation...`);
      const contentResult = await strictContentEvaluator.evaluate(
        candidateCode.html,
        candidateCode.css || '',
        expectedCode.html,
        expectedCode.css || '',
        challengeId
      );
      
      result.contentScore = contentResult.score;
      result.content = {
        score: contentResult.score,
        passed: contentResult.passed,
        details: contentResult.details,
        feedback: contentResult.feedback,
        requirements: contentResult.requirements
      };
      
      console.log(`   ✓ Content Score: ${contentResult.score}%`);
      
      // Step 2: Semantic DOM Structure Evaluation
      console.log(`   ⚙️  Running semantic structure evaluation...`);
      const structureResult = semanticEvaluator.evaluateStructure(
        candidateCode.html,
        expectedCode.html
      );
      
      result.structureScore = structureResult.score;
      result.structure = {
        score: structureResult.score,
        passed: structureResult.score >= thresholds.structure,
        rolesFound: structureResult.rolesFound,
        rolesPartial: structureResult.rolesPartial,
        rolesMissing: structureResult.rolesMissing,
        totalRoles: structureResult.totalRoles,
        foundRoles: structureResult.foundRoles
      };
      
      console.log(`   ✓ Structure Score: ${structureResult.score}%`);
      console.log(`   ✓ Roles Found: ${structureResult.rolesFound.length}/${structureResult.totalRoles}`);
      
      // Step 3: Pixel-level Visual Comparison
      console.log(`   📸 Running pixel matching (screenshot comparison)...`);
      const pixelResult = await pixelMatch.compare(
        candidateCode,
        expectedCode,
        submissionId
      );
      
      result.visualScore = pixelResult.score;
      result.visual = {
        score: pixelResult.score,
        passed: pixelResult.score >= thresholds.visual,
        diffPixels: pixelResult.diffPixels,
        totalPixels: pixelResult.totalPixels,
        diffPercentage: pixelResult.diffPercentage,
        screenshots: pixelResult.screenshots
      };
      
      console.log(`   ✓ Visual Score: ${pixelResult.score}%`);
      
      // Step 4: Behavior Score (placeholder for future interactivity tests)
      result.behaviorScore = 0;
      console.log(`   ⚡ Behavior Score: ${result.behaviorScore}% (not yet implemented)`);
      
      // Step 5: Calculate Final Score (UPDATED WEIGHTED AVERAGE)
      // Content: 50%, Structure: 0%, Visual: 50%, Behavior: 0%
      // Structure disabled because semantic evaluator is not question-aware
      result.finalScore = Math.round(
        (result.contentScore * 0.50) + 
        (result.structureScore * 0.00) + 
        (result.visualScore * 0.50) + 
        (result.behaviorScore * 0.00)
      );
      
      console.log(`   📊 Final Score: ${result.finalScore}%`);
      
      // Step 6: Generate Human-Friendly Feedback (ENHANCED with content feedback)
      const semanticFeedback = semanticEvaluator.generateFeedback(
        structureResult,
        result.visualScore,
        result.behaviorScore
      );
      
      // Combine content feedback with semantic feedback
      result.feedback = {
        ...semanticFeedback,
        contentValidation: contentResult.feedback,
        contentDetails: contentResult.details
      };
      
      console.log(`   💬 Generated feedback with ${contentResult.details.length} content checks`);
      
      // Step 7: Determine Pass/Fail (SIMPLIFIED - Only Content + Visual)
      result.passed = 
        result.contentScore >= 70 && // Must pass content validation
        result.visualScore >= 70 && // Must pass visual
        result.finalScore >= 70; // Overall must be 70%+
      
      console.log(`   ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`   Content: ${result.contentScore}% | Structure: ${result.structureScore}% | Visual: ${result.visualScore}%`);
      
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
