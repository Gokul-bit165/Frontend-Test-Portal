/**
 * DOM Comparison Service
 * Compares DOM tree structure between candidate and expected solutions
 * Returns similarity score based on tag matching, hierarchy, and attributes
 */

const { JSDOM } = require('jsdom');

class DOMComparer {
  /**
   * Main comparison function
   * @param {string} candidateHTML - Candidate's HTML code
   * @param {string} expectedHTML - Expected HTML solution
   * @returns {Object} - Comparison result with score and details
   */
  compare(candidateHTML, expectedHTML) {
    try {
      // Parse HTML into DOM trees
      const candidateDOM = new JSDOM(candidateHTML);
      const expectedDOM = new JSDOM(expectedHTML);
      
      const candidateDoc = candidateDOM.window.document;
      const expectedDoc = expectedDOM.window.document;
      
      // Extract body content for comparison (ignore head differences for now)
      const candidateBody = candidateDoc.body;
      const expectedBody = expectedDoc.body;
      
      // Build normalized DOM trees
      const candidateTree = this.buildDOMTree(candidateBody);
      const expectedTree = this.buildDOMTree(expectedBody);
      
      // Compare trees
      const comparisonResult = this.compareTrees(candidateTree, expectedTree);
      
      return {
        score: comparisonResult.score,
        passed: comparisonResult.score >= 70, // Default threshold
        details: comparisonResult.details,
        candidateTree: candidateTree,
        expectedTree: expectedTree
      };
      
    } catch (error) {
      console.error('DOM comparison error:', error);
      return {
        score: 0,
        passed: false,
        error: error.message,
        details: {
          error: 'Failed to parse or compare DOM structure'
        }
      };
    }
  }
  
  /**
   * Build normalized DOM tree representation
   * @param {Element} element - Root element to build tree from
   * @param {number} depth - Current depth in tree
   * @returns {Object} - Tree representation
   */
  buildDOMTree(element, depth = 0) {
    if (!element) return null;
    
    const tree = {
      tag: element.tagName ? element.tagName.toLowerCase() : 'text',
      depth: depth,
      attributes: {},
      classes: [],
      id: null,
      text: '',
      children: []
    };
    
    // Extract attributes
    if (element.attributes) {
      for (let attr of element.attributes) {
        if (attr.name === 'class') {
          tree.classes = attr.value.split(' ').filter(c => c.trim());
        } else if (attr.name === 'id') {
          tree.id = attr.value;
        } else {
          tree.attributes[attr.name] = attr.value;
        }
      }
    }
    
    // Extract text content (direct text only, not from children)
    if (element.childNodes) {
      for (let node of element.childNodes) {
        if (node.nodeType === 3) { // Text node
          const text = node.textContent.trim();
          if (text) {
            tree.text += text + ' ';
          }
        }
      }
      tree.text = tree.text.trim();
    }
    
    // Build children
    if (element.children) {
      for (let child of element.children) {
        const childTree = this.buildDOMTree(child, depth + 1);
        if (childTree) {
          tree.children.push(childTree);
        }
      }
    }
    
    return tree;
  }
  
  /**
   * Compare two DOM trees and calculate similarity
   * @param {Object} candidateTree - Candidate's DOM tree
   * @param {Object} expectedTree - Expected DOM tree
   * @returns {Object} - Comparison result with score
   */
  compareTrees(candidateTree, expectedTree) {
    const details = {
      tagMatches: [],
      tagMismatches: [],
      attributeMatches: [],
      attributeMismatches: [],
      classMatches: [],
      classMismatches: [],
      structureMatches: [],
      structureMismatches: []
    };
    
    let totalChecks = 0;
    let passedChecks = 0;
    
    // Compare recursively
    const compare = (candidate, expected, path = 'root') => {
      if (!expected) return;
      
      // Check tag name
      totalChecks++;
      if (candidate && candidate.tag === expected.tag) {
        passedChecks++;
        details.tagMatches.push(`${path}: <${expected.tag}>`);
      } else {
        details.tagMismatches.push(
          `${path}: Expected <${expected.tag}>, got <${candidate ? candidate.tag : 'missing'}>`
        );
      }
      
      if (!candidate) return;
      
      // Check ID
      if (expected.id) {
        totalChecks++;
        if (candidate.id === expected.id) {
          passedChecks++;
          details.attributeMatches.push(`${path}: id="${expected.id}"`);
        } else {
          details.attributeMismatches.push(
            `${path}: Expected id="${expected.id}", got id="${candidate.id || 'none'}"`
          );
        }
      }
      
      // Check classes
      expected.classes.forEach(className => {
        totalChecks++;
        if (candidate.classes.includes(className)) {
          passedChecks++;
          details.classMatches.push(`${path}: class="${className}"`);
        } else {
          details.classMismatches.push(`${path}: Missing class="${className}"`);
        }
      });
      
      // Check important attributes (type, href, src, etc.)
      const importantAttrs = ['type', 'href', 'src', 'placeholder', 'for'];
      importantAttrs.forEach(attr => {
        if (expected.attributes[attr]) {
          totalChecks++;
          if (candidate.attributes[attr] === expected.attributes[attr]) {
            passedChecks++;
            details.attributeMatches.push(`${path}: ${attr}="${expected.attributes[attr]}"`);
          } else {
            details.attributeMismatches.push(
              `${path}: Expected ${attr}="${expected.attributes[attr]}", got "${candidate.attributes[attr] || 'none'}"`
            );
          }
        }
      });
      
      // Check text content (loose matching)
      if (expected.text) {
        totalChecks++;
        const candidateText = (candidate.text || '').toLowerCase().trim();
        const expectedText = expected.text.toLowerCase().trim();
        
        if (candidateText.includes(expectedText) || expectedText.includes(candidateText)) {
          passedChecks++;
        } else if (this.calculateTextSimilarity(candidateText, expectedText) > 0.7) {
          passedChecks++;
        }
      }
      
      // Check children count
      totalChecks++;
      if (candidate.children.length === expected.children.length) {
        passedChecks++;
        details.structureMatches.push(
          `${path}: Correct number of children (${expected.children.length})`
        );
      } else {
        details.structureMismatches.push(
          `${path}: Expected ${expected.children.length} children, got ${candidate.children.length}`
        );
      }
      
      // Recursively compare children
      const minChildren = Math.min(candidate.children.length, expected.children.length);
      for (let i = 0; i < minChildren; i++) {
        compare(
          candidate.children[i],
          expected.children[i],
          `${path} > ${expected.children[i].tag}[${i}]`
        );
      }
    };
    
    compare(candidateTree, expectedTree);
    
    // Calculate score
    const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
    
    return {
      score,
      totalChecks,
      passedChecks,
      details
    };
  }
  
  /**
   * Calculate text similarity using simple matching
   * @param {string} text1 
   * @param {string} text2 
   * @returns {number} - Similarity score 0-1
   */
  calculateTextSimilarity(text1, text2) {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    let matches = 0;
    words1.forEach(word => {
      if (words2.includes(word)) matches++;
    });
    
    return matches / Math.max(words1.length, words2.length);
  }
}

module.exports = new DOMComparer();
