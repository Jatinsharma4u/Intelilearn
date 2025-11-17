// services/nlp/text-cleaner.js - IMPROVED VERSION
class TextCleaner {
  async cleanText(rawText) {
    try {
      console.log('🧹 Cleaning extracted text (COMPREHENSIVE)...');
      
      let cleanedText = rawText;
      
      // Step 1: Preserve ALL meaningful characters
      // Keep Hindi, English, numbers, punctuation, symbols
      cleanedText = cleanedText.replace(/[^\w\s.,!?;:()\-–—\n\r\u0900-\u097F@#$%&*+=<>[\]{}]/g, ' ');
      
      // Step 2: Smart whitespace handling
      cleanedText = cleanedText.replace(/\s+/g, ' '); // Multiple spaces to single
      cleanedText = cleanedText.replace(/\n\s*\n/g, '\n\n'); // Preserve paragraph breaks
      
      // Step 3: Fix encoding issues comprehensively
      cleanedText = this.fixEncodingComprehensive(cleanedText);
      
      // Step 4: Smart heading detection and structuring
      cleanedText = this.structureContentIntelligently(cleanedText);
      
      // Step 5: Remove artifacts while preserving content
      cleanedText = this.removeArtifactsSmartly(cleanedText);
      
      // Step 6: Final normalization
      cleanedText = cleanedText.trim();
      
      const quality = this.analyzeTextQuality(cleanedText);
      console.log(`✅ Text cleaned: ${cleanedText.length} characters | Quality: ${quality.quality}`);
      
      if (quality.quality === 'poor') {
        console.warn(`⚠️ Text quality issues: ${quality.reason}`);
      }
      
      return cleanedText;
      
    } catch (error) {
      console.error('❌ Text cleaning failed:', error);
      // Return original text if cleaning fails
      return rawText;
    }
  }

  fixEncodingComprehensive(text) {
    return text
      // Common encoding fixes
      .replace(/â€“/g, '–')
      .replace(/â€”/g, '—')
      .replace(/â€˜/g, "'")
      .replace(/â€™/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€/g, '"')
      .replace(/â€¦/g, '…')
      .replace(/â€°/g, '°')
      .replace(/â€¹/g, '‹')
      .replace(/â€º/g, '›')
      .replace(/\u00A0/g, ' ') // Non-breaking space
      .replace(/\u2013/g, '–') // En dash
      .replace(/\u2014/g, '—') // Em dash
      .replace(/\u2018/g, "'") // Left single quote
      .replace(/\u2019/g, "'") // Right single quote
      .replace(/\u201C/g, '"') // Left double quote
      .replace(/\u201D/g, '"') // Right double quote
      .replace(/\u2026/g, '…') // Ellipsis
      .replace(/\u00B0/g, '°'); // Degree symbol
  }

  structureContentIntelligently(text) {
    const lines = text.split('\n');
    const structuredLines = [];
    let inParagraph = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const prevLine = i > 0 ? lines[i-1].trim() : '';
      const nextLine = i < lines.length - 1 ? lines[i+1].trim() : '';
      
      if (this.isMajorHeading(line, prevLine, nextLine)) {
        structuredLines.push(`\n# ${line.toUpperCase()}\n`);
        inParagraph = false;
      } else if (this.isSubheading(line, prevLine, nextLine)) {
        structuredLines.push(`\n## ${line}\n`);
        inParagraph = false;
      } else if (this.isContentLine(line)) {
        if (!inParagraph && structuredLines.length > 0) {
          structuredLines.push('\n'); // Start new paragraph
        }
        structuredLines.push(line);
        inParagraph = true;
      }
      // Skip empty lines between paragraphs
    }
    
    return structuredLines.join('\n');
  }

  isMajorHeading(line, prevLine, nextLine) {
    if (!line || line.length > 150) return false;
    
    const headingPatterns = [
      /^(chapter|unit|module|part|lecture|section)\s+\d+/i,
      /^\d+\.\s+[A-Z]/,
      /^[IVX]+\.\s+[A-Z]/,
      /^[A-Z][A-Z\s]{10,80}$/,
      /^.*:\s*$/ // Ends with colon
    ];
    
    return headingPatterns.some(pattern => pattern.test(line)) ||
           (line.length < 100 && !line.endsWith('.') && 
            prevLine === '' && nextLine === '');
  }

  isSubheading(line, prevLine, nextLine) {
    if (!line || line.length > 120) return false;
    
    const subheadingPatterns = [
      /^\d+\.\d+/,
      /^[a-z]\)/i,
      /^[•\-*]\s/,
      /^\d+\.\s+[a-z]/i,
      /^[A-Z][A-Za-z\s]{5,60}:?$/
    ];
    
    return subheadingPatterns.some(pattern => pattern.test(line));
  }

  isContentLine(line) {
    return line && line.length > 10 && !this.isArtifact(line);
  }

  removeArtifactsSmartly(text) {
    return text
      // Remove page numbers but preserve actual numbers in content
      .replace(/\bpage\s+\d+\b/gi, '')
      .replace(/\b\d+\s+of\s+\d+\b/gi, '')
      .replace(/^\d{1,3}$\n/gm, '') // Standalone page numbers
      // Remove repeated headers but be careful with actual content
      .replace(/(\b(?:chapter|unit|module)\s+\d+\s+.+?\n){2,}/gi, '')
      // Remove isolated single characters (likely artifacts)
      .replace(/\b[a-zA-Z]\b/g, '')
      // Remove multiple consecutive special characters
      .replace(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]{2,}/g, '');
  }

  isArtifact(line) {
    return (
      /^\d{1,3}$/.test(line) || // Page numbers
      /^page\s+\d+/i.test(line) || // Page headers
      /^\w\s*$/.test(line) || // Single characters
      line.length < 3 // Very short lines
    );
  }

  analyzeTextQuality(text) {
    if (!text || text.length === 0) {
      return { quality: 'poor', reason: 'Empty text' };
    }
    
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    if (words.length === 0) {
      return { quality: 'poor', reason: 'No words found' };
    }
    
    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / wordCount;
    const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    
    let quality = 'good';
    let reason = '';
    
    if (wordCount < 200) {
      quality = 'poor';
      reason = `Only ${wordCount} words (need 200+)`;
    } else if (avgSentenceLength > 100) {
      quality = 'fair';
      reason = 'Very long sentences detected';
    } else if (avgWordLength < 2.5) {
      quality = 'fair';
      reason = 'Short average word length';
    } else if (sentenceCount < 10) {
      quality = 'fair';
      reason = 'Few complete sentences';
    }
    
    return {
      quality,
      reason,
      wordCount,
      sentenceCount,
      avgWordLength: avgWordLength.toFixed(2),
      avgSentenceLength: avgSentenceLength.toFixed(2)
    };
  }

  extractKeyTopics(text, maxTopics = 15) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const words = text.toLowerCase().split(/\s+/);
    
    // Enhanced frequency analysis
    const wordFreq = {};
    words.forEach(word => {
      const cleanWord = word.replace(/[^a-z0-9]/g, '');
      if (cleanWord.length > 4 && !this.isCommonWord(cleanWord)) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
      }
    });
    
    // Get top topics with context
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxTopics)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
  }

  isCommonWord(word) {
    const commonWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'your', 'has', 'had', 'how',
      'was', 'her', 'his', 'she', 'will', 'one', 'our', 'out', 'may', 'who', 'its', 'now', 'than',
      'then', 'also', 'into', 'more', 'about', 'other', 'which', 'their', 'these', 'would', 'there',
      'what', 'them', 'were', 'some', 'from', 'have', 'that', 'with', 'this', 'they', 'been', 'were',
      'when', 'where', 'why', 'how', 'should', 'could', 'would', 'them', 'then', 'than', 'such', 'each'
    ]);
    
    return commonWords.has(word.toLowerCase());
  }
}

module.exports = new TextCleaner();