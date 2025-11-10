/**
 * Strict Content-Aware Evaluator
 * Validates specific text content, attributes, and styles per question
 */

const { JSDOM } = require('jsdom');

class StrictContentEvaluator {
  
  /**
   * Evaluate with strict content checking
   */
  async evaluate(candidateHTML, candidateCSS, expectedHTML, expectedCSS, challengeId) {
    try {
      // Parse both DOMs
      const candidateDOM = new JSDOM(`<html><head><style>${candidateCSS}</style></head><body>${candidateHTML}</body></html>`);
      const expectedDOM = new JSDOM(`<html><head><style>${expectedCSS}</style></head><body>${expectedHTML}</body></html>`);
      
      const candidateDoc = candidateDOM.window.document;
      const expectedDoc = expectedDOM.window.document;
      
      // Extract specific requirements from expected solution
      const requirements = this.extractRequirements(expectedDoc, expectedCSS, challengeId);
      
      // Check each requirement
      const results = this.checkRequirements(candidateDoc, candidateCSS, requirements);
      
      // Calculate scores
      const score = this.calculateScore(results);
      
      return {
        score: score.percentage,
        passed: score.percentage >= 70,
        details: results,
        feedback: this.generateFeedback(results, score),
        requirements: requirements
      };
    } catch (error) {
      console.error('Strict evaluation error:', error);
      return {
        score: 0,
        passed: false,
        error: error.message
      };
    }
  }
  
  /**
   * Extract specific requirements from expected solution
   */
  extractRequirements(expectedDoc, expectedCSS, challengeId) {
    const requirements = [];
    
    // Get all text content
    const allText = expectedDoc.body.textContent.trim();
    const textNodes = this.getTextNodes(expectedDoc.body);
    
    // Extract specific texts (case-insensitive, trimmed)
    const specificTexts = textNodes
      .map(node => node.textContent.trim())
      .filter(text => text.length > 2 && text.length < 100)
      .map(text => text.toLowerCase());
    
    // Requirement 1: Specific text content must appear
    if (specificTexts.length > 0) {
      requirements.push({
        type: 'text_content',
        description: 'Required text content',
        required: specificTexts.slice(0, 5), // Top 5 important texts
        weight: 30
      });
    }
    
    // Requirement 2: Specific HTML structure
    const structureMap = this.getStructureMap(expectedDoc.body);
    requirements.push({
      type: 'html_structure',
      description: 'Required HTML elements',
      required: structureMap,
      weight: 20
    });
    
    // Requirement 3: Images with specific src
    const images = Array.from(expectedDoc.querySelectorAll('img'));
    if (images.length > 0) {
      requirements.push({
        type: 'images',
        description: 'Required images',
        required: images.map(img => ({
          src: img.getAttribute('src'),
          alt: img.getAttribute('alt')
        })),
        weight: 15
      });
    }
    
    // Requirement 4: Specific CSS properties
    const cssRequirements = this.extractCSSRequirements(expectedCSS);
    if (cssRequirements.length > 0) {
      requirements.push({
        type: 'css_properties',
        description: 'Required CSS styles',
        required: cssRequirements,
        weight: 20
      });
    }
    
    // Requirement 5: Class names (some should match)
    const classNames = this.extractClassNames(expectedDoc.body);
    if (classNames.length > 0) {
      requirements.push({
        type: 'class_names',
        description: 'CSS class names',
        required: classNames,
        weight: 15
      });
    }
    
    return requirements;
  }
  
  /**
   * Check if candidate meets requirements
   */
  checkRequirements(candidateDoc, candidateCSS, requirements) {
    const results = [];
    
    for (const req of requirements) {
      let passed = false;
      let score = 0;
      let details = '';
      
      switch (req.type) {
        case 'text_content':
          const result = this.checkTextContent(candidateDoc, req.required);
          passed = result.score >= 0.6; // At least 60% of texts should match
          score = result.score;
          details = result.details;
          break;
          
        case 'html_structure':
          const structResult = this.checkStructure(candidateDoc, req.required);
          passed = structResult.score >= 0.7;
          score = structResult.score;
          details = structResult.details;
          break;
          
        case 'images':
          const imgResult = this.checkImages(candidateDoc, req.required);
          passed = imgResult.score >= 0.5;
          score = imgResult.score;
          details = imgResult.details;
          break;
          
        case 'css_properties':
          const cssResult = this.checkCSSProperties(candidateCSS, req.required);
          passed = cssResult.score >= 0.5;
          score = cssResult.score;
          details = cssResult.details;
          break;
          
        case 'class_names':
          const classResult = this.checkClassNames(candidateDoc, req.required);
          passed = classResult.score >= 0.3; // More lenient for class names
          score = classResult.score;
          details = classResult.details;
          break;
      }
      
      results.push({
        type: req.type,
        description: req.description,
        passed,
        score: score * 100,
        weight: req.weight,
        details
      });
    }
    
    return results;
  }
  
  /**
   * Check text content matching
   */
  checkTextContent(candidateDoc, requiredTexts) {
    const candidateText = candidateDoc.body.textContent.toLowerCase();
    const candidateTexts = this.getTextNodes(candidateDoc.body)
      .map(node => node.textContent.trim().toLowerCase())
      .filter(text => text.length > 2);
    
    let matchCount = 0;
    const missing = [];
    const found = [];
    
    for (const required of requiredTexts) {
      // Check if the required text appears anywhere
      const isFound = candidateTexts.some(text => 
        text.includes(required) || required.includes(text) || this.similarText(text, required) > 0.7
      );
      
      if (isFound) {
        matchCount++;
        found.push(required);
      } else {
        missing.push(required);
      }
    }
    
    const score = matchCount / requiredTexts.length;
    
    return {
      score,
      details: `Found ${matchCount}/${requiredTexts.length} required texts. ${missing.length > 0 ? 'Missing: ' + missing.join(', ') : 'All texts found!'}`
    };
  }
  
  /**
   * Check HTML structure
   */
  checkStructure(candidateDoc, requiredStructure) {
    let matchCount = 0;
    let totalRequired = 0;
    const details = [];
    
    for (const [tag, count] of Object.entries(requiredStructure)) {
      totalRequired++;
      const candidateCount = candidateDoc.querySelectorAll(tag).length;
      
      if (candidateCount >= count) {
        matchCount++;
        details.push(`✓ ${tag}: ${candidateCount} (required: ${count})`);
      } else {
        details.push(`✗ ${tag}: ${candidateCount} (required: ${count})`);
      }
    }
    
    return {
      score: totalRequired > 0 ? matchCount / totalRequired : 1,
      details: details.join(', ')
    };
  }
  
  /**
   * Check images
   */
  checkImages(candidateDoc, requiredImages) {
    const candidateImages = Array.from(candidateDoc.querySelectorAll('img'));
    let matchCount = 0;
    
    for (const reqImg of requiredImages) {
      const found = candidateImages.some(img => 
        img.getAttribute('src')?.includes(reqImg.src) || 
        img.getAttribute('alt')?.toLowerCase() === reqImg.alt?.toLowerCase()
      );
      if (found) matchCount++;
    }
    
    return {
      score: requiredImages.length > 0 ? matchCount / requiredImages.length : 1,
      details: `Found ${matchCount}/${requiredImages.length} required images`
    };
  }
  
  /**
   * Check CSS properties
   */
  checkCSSProperties(candidateCSS, requiredProps) {
    const lowerCSS = candidateCSS.toLowerCase();
    let matchCount = 0;
    
    for (const prop of requiredProps) {
      if (lowerCSS.includes(prop.toLowerCase())) {
        matchCount++;
      }
    }
    
    return {
      score: requiredProps.length > 0 ? matchCount / requiredProps.length : 1,
      details: `Found ${matchCount}/${requiredProps.length} required CSS properties`
    };
  }
  
  /**
   * Check class names
   */
  checkClassNames(candidateDoc, requiredClasses) {
    const candidateClasses = this.extractClassNames(candidateDoc.body);
    let matchCount = 0;
    
    for (const reqClass of requiredClasses) {
      if (candidateClasses.includes(reqClass)) {
        matchCount++;
      }
    }
    
    return {
      score: requiredClasses.length > 0 ? matchCount / requiredClasses.length : 1,
      details: `Matched ${matchCount}/${requiredClasses.length} class names`
    };
  }
  
  /**
   * Calculate overall score
   */
  calculateScore(results) {
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    for (const result of results) {
      totalWeightedScore += (result.score / 100) * result.weight;
      totalWeight += result.weight;
    }
    
    const percentage = totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 100) : 0;
    
    return {
      percentage,
      passed: percentage >= 70
    };
  }
  
  /**
   * Generate feedback
   */
  generateFeedback(results, score) {
    const passed = results.filter(r => r.passed);
    const failed = results.filter(r => !r.passed);
    
    let feedback = `Overall Score: ${score.percentage}%\n\n`;
    
    if (score.passed) {
      feedback += '✓ PASSED - Well done!\n\n';
    } else {
      feedback += '✗ FAILED - Needs improvement\n\n';
    }
    
    feedback += 'Requirements:\n';
    for (const result of results) {
      feedback += `${result.passed ? '✓' : '✗'} ${result.description}: ${Math.round(result.score)}%\n`;
      feedback += `   ${result.details}\n`;
    }
    
    if (failed.length > 0) {
      feedback += `\n⚠️ ${failed.length} requirement(s) need attention`;
    }
    
    return feedback;
  }
  
  // Helper methods
  
  getTextNodes(element) {
    const textNodes = [];
    const walker = element.ownerDocument.createTreeWalker(
      element,
      4, // NodeFilter.SHOW_TEXT
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.trim()) {
        textNodes.push(node);
      }
    }
    return textNodes;
  }
  
  getStructureMap(element) {
    const map = {};
    const elements = element.querySelectorAll('*');
    
    elements.forEach(el => {
      const tag = el.tagName.toLowerCase();
      map[tag] = (map[tag] || 0) + 1;
    });
    
    return map;
  }
  
  extractClassNames(element) {
    const classes = new Set();
    const elements = element.querySelectorAll('[class]');
    
    elements.forEach(el => {
      el.className.split(' ').forEach(cls => {
        if (cls.trim()) classes.add(cls.trim());
      });
    });
    
    return Array.from(classes);
  }
  
  extractCSSRequirements(css) {
    const important = [
      'border-radius', 'box-shadow', 'background', 'width', 'height',
      'padding', 'margin', 'display', 'flex', 'grid', 'color', 'font'
    ];
    
    const found = [];
    for (const prop of important) {
      if (css.toLowerCase().includes(prop)) {
        found.push(prop);
      }
    }
    
    return found;
  }
  
  similarText(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshtein(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }
  
  levenshtein(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

module.exports = new StrictContentEvaluator();
