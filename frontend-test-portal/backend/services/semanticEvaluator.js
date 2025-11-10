/**
 * Improved Semantic DOM Evaluator
 * Uses role-based matching, fuzzy comparison, and human-friendly feedback
 */

const { JSDOM } = require('jsdom');

class SemanticDOMEvaluator {
  constructor() {
    // Define semantic roles with flexible matching rules
    this.semanticRoles = {
      productImage: {
        tags: ['img', 'picture', 'figure'],
        attributes: ['src', 'alt'],
        classPatterns: ['image', 'img', 'photo', 'picture', 'product'],
        required: true
      },
      productTitle: {
        tags: ['h1', 'h2', 'h3', 'div', 'span', 'p'],
        classPatterns: ['title', 'name', 'heading', 'product'],
        textPatterns: [/headphone/i, /product/i, /wireless/i],
        required: true
      },
      productPrice: {
        tags: ['span', 'div', 'p', 'strong'],
        classPatterns: ['price', 'cost', 'amount'],
        textPatterns: [/\$\d+/, /\d+\.\d{2}/, /price/i],
        required: true
      },
      productButton: {
        tags: ['button', 'a', 'div', 'span'],
        classPatterns: ['button', 'btn', 'cta', 'add', 'cart'],
        textPatterns: [/add.*cart/i, /buy/i, /purchase/i, /add/i],
        required: true
      },
      productDescription: {
        tags: ['p', 'div', 'span'],
        classPatterns: ['description', 'desc', 'bio', 'text'],
        required: false
      },
      container: {
        tags: ['div', 'section', 'article', 'main'],
        classPatterns: ['container', 'card', 'product', 'wrapper'],
        required: false
      }
    };
  }

  /**
   * Calculate fuzzy similarity between two strings
   */
  fuzzyMatch(str1, str2, threshold = 0.6) {
    if (!str1 || !str2) return 0;
    
    str1 = str1.toLowerCase().replace(/[-_]/g, '');
    str2 = str2.toLowerCase().replace(/[-_]/g, '');
    
    if (str1 === str2) return 1;
    
    // Simple similarity: common characters / total unique characters
    const set1 = new Set(str1.split(''));
    const set2 = new Set(str2.split(''));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * Check if element matches any of the class patterns
   */
  matchesClassPattern(element, patterns) {
    const className = element.className || '';
    const classString = className.toString().toLowerCase();
    
    return patterns.some(pattern => {
      // Direct substring match
      if (classString.includes(pattern.toLowerCase())) return true;
      
      // Fuzzy match with threshold
      const words = classString.split(/\s+/);
      return words.some(word => this.fuzzyMatch(word, pattern) >= 0.6);
    });
  }

  /**
   * Check if element's text content matches any pattern
   */
  matchesTextPattern(element, patterns) {
    const text = element.textContent?.trim() || '';
    return patterns.some(pattern => pattern.test(text));
  }

  /**
   * Find elements matching a semantic role
   */
  findRoleElements(dom, role, roleConfig) {
    const elements = [];
    const allElements = Array.from(dom.window.document.querySelectorAll('*'));
    
    for (const element of allElements) {
      let score = 0;
      let matches = {};
      
      // Check tag name
      if (roleConfig.tags.includes(element.tagName.toLowerCase())) {
        score += 2;
        matches.tag = element.tagName.toLowerCase();
      }
      
      // Check class patterns
      if (roleConfig.classPatterns && this.matchesClassPattern(element, roleConfig.classPatterns)) {
        score += 3;
        matches.class = element.className;
      }
      
      // Check text patterns
      if (roleConfig.textPatterns && this.matchesTextPattern(element, roleConfig.textPatterns)) {
        score += 2;
        matches.text = element.textContent?.trim().substring(0, 50);
      }
      
      // Check attributes (for images)
      if (roleConfig.attributes) {
        for (const attr of roleConfig.attributes) {
          if (element.hasAttribute(attr)) {
            score += 1;
            matches[attr] = element.getAttribute(attr);
          }
        }
      }
      
      // If element has some matches, add it
      if (score > 0) {
        elements.push({
          element,
          score,
          matches,
          tag: element.tagName.toLowerCase(),
          classes: element.className,
          text: element.textContent?.trim().substring(0, 100)
        });
      }
    }
    
    // Sort by score descending
    elements.sort((a, b) => b.score - a.score);
    
    return elements;
  }

  /**
   * Evaluate semantic structure
   */
  evaluateStructure(candidateHTML, expectedHTML) {
    const candidateDOM = new JSDOM(candidateHTML);
    const expectedDOM = new JSDOM(expectedHTML);
    
    const results = {
      rolesFound: [],
      rolesMissing: [],
      rolesPartial: [],
      totalRoles: 0,
      foundRoles: 0,
      score: 0
    };
    
    // Check each semantic role
    for (const [roleName, roleConfig] of Object.entries(this.semanticRoles)) {
      if (!roleConfig.required) continue; // Skip optional roles for scoring
      
      results.totalRoles++;
      
      const candidateElements = this.findRoleElements(candidateDOM, roleName, roleConfig);
      const expectedElements = this.findRoleElements(expectedDOM, roleName, roleConfig);
      
      if (candidateElements.length > 0) {
        const topMatch = candidateElements[0];
        
        if (topMatch.score >= 4) {
          // Strong match
          results.foundRoles++;
          results.rolesFound.push({
            role: roleName,
            confidence: 'high',
            element: {
              tag: topMatch.tag,
              classes: topMatch.classes,
              text: topMatch.text
            },
            matches: topMatch.matches
          });
        } else if (topMatch.score >= 2) {
          // Partial match
          results.foundRoles += 0.5;
          results.rolesPartial.push({
            role: roleName,
            confidence: 'medium',
            element: {
              tag: topMatch.tag,
              classes: topMatch.classes,
              text: topMatch.text
            },
            suggestion: this.getSuggestionForRole(roleName, roleConfig, topMatch)
          });
        }
      } else {
        // Missing
        results.rolesMissing.push({
          role: roleName,
          expected: this.getRoleDescription(roleName, roleConfig),
          suggestion: this.getMissingSuggestion(roleName, roleConfig)
        });
      }
    }
    
    // Calculate score
    results.score = Math.round((results.foundRoles / results.totalRoles) * 100);
    
    return results;
  }

  /**
   * Generate suggestion for improving a role match
   */
  getSuggestionForRole(roleName, roleConfig, element) {
    const suggestions = [];
    
    if (!element.matches.class && roleConfig.classPatterns) {
      suggestions.push(`Consider adding a class like "${roleConfig.classPatterns[0]}"`);
    }
    
    if (roleConfig.tags.length > 0 && !roleConfig.tags.includes(element.tag)) {
      suggestions.push(`Try using a more semantic tag like <${roleConfig.tags[0]}>`);
    }
    
    return suggestions.join('. ');
  }

  /**
   * Get description of what's expected for a role
   */
  getRoleDescription(roleName, roleConfig) {
    return `Element with tag ${roleConfig.tags.join('/')} and class matching ${roleConfig.classPatterns?.join('/')}`;
  }

  /**
   * Get suggestion for missing role
   */
  getMissingSuggestion(roleName, roleConfig) {
    const tagSuggestion = roleConfig.tags[0];
    const classSuggestion = roleConfig.classPatterns?.[0];
    
    return `Add a <${tagSuggestion}> element${classSuggestion ? ` with class "${classSuggestion}"` : ''}`;
  }

  /**
   * Generate human-friendly feedback
   */
  generateFeedback(structureResult, visualScore, behaviorScore = 0) {
    const feedback = {
      encouragement: [],
      improvements: [],
      technical: {
        structure: structureResult,
        visual: visualScore,
        behavior: behaviorScore
      },
      categories: {
        matching: [],
        minorDifferences: [],
        missing: []
      }
    };
    
    // Categorize findings
    feedback.categories.matching = structureResult.rolesFound.map(role => ({
      icon: '✅',
      message: `${this.humanizeRoleName(role.role)} detected successfully`,
      details: `Found as <${role.element.tag}>${role.element.classes ? ` with class "${role.element.classes}"` : ''}`
    }));
    
    feedback.categories.minorDifferences = structureResult.rolesPartial.map(role => ({
      icon: '⚠️',
      message: `${this.humanizeRoleName(role.role)} partially matches`,
      suggestion: role.suggestion
    }));
    
    feedback.categories.missing = structureResult.rolesMissing.map(role => ({
      icon: '❌',
      message: `${this.humanizeRoleName(role.role)} not found`,
      suggestion: role.suggestion
    }));
    
    // Generate encouragement based on scores
    const structScore = structureResult.score;
    
    if (structScore >= 90 && visualScore >= 90) {
      feedback.encouragement.push("🎉 Outstanding work! Your solution is nearly perfect!");
      feedback.encouragement.push("Your design matches the expected output beautifully.");
    } else if (structScore >= 75 && visualScore >= 75) {
      feedback.encouragement.push("🌟 Great job! You're on the right track!");
      feedback.encouragement.push("Your design looks good with just a few small improvements needed.");
    } else if (structScore >= 50 || visualScore >= 50) {
      feedback.encouragement.push("💪 Good effort! You've got the basics down.");
      feedback.encouragement.push("With a few adjustments, your solution will be even better!");
    } else {
      feedback.encouragement.push("🚀 Keep going! Every expert was once a beginner.");
      feedback.encouragement.push("Focus on matching the structure and styling more closely.");
    }
    
    // Generate improvement suggestions
    if (structureResult.rolesMissing.length > 0) {
      feedback.improvements.push(`Add missing elements: ${structureResult.rolesMissing.map(r => this.humanizeRoleName(r.role)).join(', ')}`);
    }
    
    if (structureResult.rolesPartial.length > 0) {
      feedback.improvements.push("Refine your semantic HTML structure with more descriptive classes");
    }
    
    if (visualScore < 80) {
      feedback.improvements.push("Adjust styling to match the design more closely (colors, spacing, fonts)");
    }
    
    return feedback;
  }

  /**
   * Convert role name to human-readable format
   */
  humanizeRoleName(roleName) {
    return roleName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}

module.exports = new SemanticDOMEvaluator();
