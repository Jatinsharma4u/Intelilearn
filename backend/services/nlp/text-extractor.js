// services/nlp/text-extractor.js - SIMPLE WORKING VERSION
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

class TextExtractor {
  async extractText(fileBuffer, mimeType, fileName = '') {
    try {
      console.log(`🔍 Extracting text from: ${fileName} (${mimeType})`);
      
      if (mimeType === 'application/pdf') {
        return await this.extractFromPDFSimple(fileBuffer);
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await this.extractFromDOCXComplete(fileBuffer);
      } else if (mimeType === 'text/plain') {
        return fileBuffer.toString('utf8');
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      console.error('❌ Text extraction failed:', error);
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  // ✅ SIMPLE PDF EXTRACTION - No external tools
  async extractFromPDFSimple(fileBuffer) {
    try {
      console.log('📄 Using simple PDF extraction...');
      
      // Method 1: pdf-parse with optimized settings
      try {
        const data = await pdfParse(fileBuffer, {
          max: 0, // No page limit
          pagerender: this.simplePageRender,
          version: 'v1.10.100'
        });
        
        if (!data.text || data.text.trim().length === 0) {
          throw new Error('No text extracted');
        }
        
        console.log(`✅ PDF extraction: ${data.numpages} pages, ${data.text.length} chars`);
        
        // Analyze extraction quality
        this.analyzeExtractionQuality(data);
        
        return data.text;
        
      } catch (error) {
        console.log('Method 1 failed:', error.message);
      }
      
      // Method 2: Try different pdf-parse configuration
      try {
        const data = await pdfParse(fileBuffer, {
          max: 100, // High page limit
          pagerender: this.enhancedPageRender
        });
        
        if (data.text && data.text.length > 0) {
          console.log(`✅ PDF extraction (method 2): ${data.text.length} chars`);
          return data.text;
        }
      } catch (error) {
        console.log('Method 2 failed:', error.message);
      }
      
      // Method 3: Emergency text extraction from buffer
      try {
        const emergencyText = this.emergencyTextExtraction(fileBuffer);
        if (emergencyText && emergencyText.length > 100) {
          console.log(`✅ Emergency extraction: ${emergencyText.length} chars`);
          return emergencyText;
        }
      } catch (error) {
        console.log('Emergency extraction failed:', error.message);
      }
      
      throw new Error('All PDF extraction methods failed');
      
    } catch (error) {
      console.error('PDF extraction failed:', error);
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }

  // Simple page renderer
  simplePageRender(pageData) {
    return pageData.getTextContent().then(textContent => 
      textContent.items.map(item => item.str).join(' ')
    );
  }

  // Enhanced page renderer
  enhancedPageRender(pageData) {
    return pageData.getTextContent({
      normalizeWhitespace: false,
      disableCombineTextItems: false
    })
    .then(textContent => {
      if (!textContent.items || textContent.items.length === 0) {
        return '';
      }
      
      // Group by lines for better formatting
      const lines = {};
      textContent.items.forEach(item => {
        const y = Math.round(item.transform[5]);
        if (!lines[y]) lines[y] = [];
        lines[y].push({ x: item.transform[4], text: item.str });
      });
      
      // Build text line by line
      let text = '';
      Object.keys(lines)
        .sort((a, b) => b - a) // Top to bottom
        .forEach(y => {
          lines[y]
            .sort((a, b) => a.x - b.x) // Left to right
            .forEach(item => text += item.text + ' ');
          text += '\n';
        });
      
      return text.trim();
    });
  }

  // Emergency text extraction from buffer
  emergencyTextExtraction(fileBuffer) {
    try {
      console.log('🔄 Trying emergency text extraction...');
      
      const bufferStr = fileBuffer.toString('latin1');
      let extractedText = '';
      
      // Look for text patterns in the buffer
      const patterns = [
        /\(([^)]+)\)/g, // Text in parentheses
        /\/FlateDecode.*?>>\s*stream([\s\S]*?)endstream/gi, // Stream content
        /\/Text\s*\(([^)]+)\)/g, // Direct text
      ];
      
      patterns.forEach(pattern => {
        const matches = bufferStr.match(pattern);
        if (matches) {
          matches.forEach(match => {
            let text = match;
            // Clean the text
            if (pattern.source.includes('\\(([^)]+)')) {
              text = text.slice(1, -1); // Remove parentheses
            }
            // Basic cleaning
            text = text.replace(/[^\w\s.,!?;:()\-–—\n\r]/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim();
            if (text.length > 10 && this.looksLikeRealText(text)) {
              extractedText += text + ' ';
            }
          });
        }
      });
      
      return extractedText.trim();
    } catch (error) {
      console.error('Emergency extraction failed:', error);
      return '';
    }
  }

  // Check if text looks like real content
  looksLikeRealText(text) {
    if (!text || text.length < 20) return false;
    
    // Check for reasonable word lengths and English patterns
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (words.length < 3) return false;
    
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    if (avgWordLength < 2 || avgWordLength > 15) return false;
    
    // Check for vowels (basic English text check)
    const hasVowels = /[aeiouAEIOU]/.test(text);
    if (!hasVowels) return false;
    
    return true;
  }

  // Analyze extraction quality
  analyzeExtractionQuality(data) {
    if (!data.text) return;
    
    const wordCount = data.text.split(/\s+/).length;
    const pages = data.numpages || 1;
    const avgWordsPerPage = wordCount / pages;
    
    console.log(`   📊 Extraction Analysis:`);
    console.log(`      - Pages: ${pages}`);
    console.log(`      - Words: ${wordCount}`);
    console.log(`      - Characters: ${data.text.length}`);
    console.log(`      - Avg words/page: ${avgWordsPerPage.toFixed(1)}`);
    
    let quality = 'GOOD';
    if (avgWordsPerPage < 10) quality = 'POOR';
    else if (avgWordsPerPage < 50) quality = 'FAIR';
    
    console.log(`      - Quality: ${quality}`);
    
    if (quality === 'POOR') {
      console.warn('      ⚠️  PDF might be scanned/image-based');
    }
  }

  // DOCX extraction
  async extractFromDOCXComplete(fileBuffer) {
    try {
      console.log('📝 Processing DOCX file...');
      
      const result = await mammoth.extractRawText({ 
        buffer: fileBuffer 
      });
      
      if (!result.value || result.value.trim().length === 0) {
        throw new Error('DOCX contains no extractable text');
      }
      
      console.log(`✅ DOCX extraction: ${result.value.length} characters`);
      
      if (result.messages && result.messages.length > 0) {
        console.warn('DOCX extraction warnings:', result.messages);
      }
      
      return result.value;
      
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw new Error(`DOCX processing failed: ${error.message}`);
    }
  }

  // Content validation
  hasSubstantialContent(text) {
    if (!text || text.trim().length === 0) return false;
    
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (words.length < 50) return false;
    
    // Check for readable text
    const readableChars = text.replace(/[^a-zA-Z0-9\s.,!?;:()\-]/g, '').length;
    const readability = readableChars / text.length;
    
    return readability > 0.5 && words.length >= 50;
  }
}

module.exports = new TextExtractor();