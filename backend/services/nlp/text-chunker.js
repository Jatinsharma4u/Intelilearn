// services/nlp/text-chunker.js
class TextChunker {
  async chunkText(text, options = {}) {
    const {
      maxChunkSize = 1500,
      overlap = 100,
      strategy = 'semantic'
    } = options;

    try {
      console.log(`📦 Chunking text (${text.length} chars) with ${strategy} strategy...`);
      
      let chunks = [];
      
      switch (strategy) {
        case 'semantic':
          chunks = this.semanticChunking(text, maxChunkSize, overlap);
          break;
        case 'fixed':
          chunks = this.fixedSizeChunking(text, maxChunkSize, overlap);
          break;
        case 'paragraph':
          chunks = this.paragraphChunking(text, maxChunkSize);
          break;
        default:
          chunks = this.semanticChunking(text, maxChunkSize, overlap);
      }
      
      console.log(`✅ Created ${chunks.length} chunks`);
      return chunks;
    } catch (error) {
      console.error('❌ Text chunking failed:', error);
      throw new Error(`Text chunking failed: ${error.message}`);
    }
  }

  semanticChunking(text, maxChunkSize, overlap) {
    const sentences = this.splitIntoSentences(text);
    const chunks = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      // If adding this sentence exceeds max size (and we have content), save current chunk
      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        
        // Start new chunk with overlap from previous chunk
        const overlapText = this.getOverlapText(currentChunk, overlap);
        currentChunk = overlapText + ' ' + sentence;
      } else {
        currentChunk += ' ' + sentence;
      }
    }
    
    // Add the last chunk if it has content
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.filter(chunk => chunk.length > 50); // Remove very small chunks
  }

  fixedSizeChunking(text, chunkSize, overlap) {
    const chunks = [];
    
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      const chunk = text.slice(i, i + chunkSize);
      if (chunk.trim().length > 0) {
        chunks.push(chunk.trim());
      }
    }
    
    return chunks;
  }

  paragraphChunking(text, maxChunkSize) {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const chunks = [];
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      const trimmedPara = paragraph.trim();
      
      if (currentChunk.length + trimmedPara.length <= maxChunkSize) {
        currentChunk += (currentChunk ? '\n\n' : '') + trimmedPara;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        
        // If single paragraph is larger than max size, split it
        if (trimmedPara.length > maxChunkSize) {
          const subChunks = this.fixedSizeChunking(trimmedPara, maxChunkSize, 0);
          chunks.push(...subChunks);
          currentChunk = '';
        } else {
          currentChunk = trimmedPara;
        }
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  splitIntoSentences(text) {
    // Improved sentence splitting for educational content
    return text
      .replace(/([.!?])\s*(?=[A-Z])/g, '$1|')
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  getOverlapText(text, overlapSize) {
    if (text.length <= overlapSize) {
      return text;
    }
    
    // Get last 'overlapSize' characters and find the last sentence boundary
    const overlapArea = text.slice(-overlapSize);
    const lastSentenceEnd = Math.max(
      overlapArea.lastIndexOf('.'),
      overlapArea.lastIndexOf('!'),
      overlapArea.lastIndexOf('?'),
      overlapArea.lastIndexOf('\n')
    );
    
    if (lastSentenceEnd > 0) {
      return overlapArea.slice(lastSentenceEnd + 1).trim();
    }
    
    // If no sentence boundary found, return the last few words
    const words = overlapArea.split(' ');
    return words.slice(-5).join(' '); // Last 5 words
  }

  // Analyze chunk quality
  analyzeChunks(chunks) {
    return chunks.map((chunk, index) => ({
      index,
      length: chunk.length,
      wordCount: chunk.split(/\s+/).length,
      sentenceCount: this.splitIntoSentences(chunk).length,
      hasHeadings: /^#+\s+/.test(chunk),
      readabilityScore: this.calculateReadability(chunk)
    }));
  }

  calculateReadability(text) {
    // Simple readability score based on average word length and sentence length
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = this.splitIntoSentences(text);
    
    if (words.length === 0 || sentences.length === 0) return 0;
    
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const avgSentenceLength = words.length / sentences.length;
    
    // Lower score = easier to read
    return (avgWordLength * 0.5) + (avgSentenceLength * 0.5);
  }
}

module.exports = new TextChunker();