// backend/services/ai/gemini-service.js - TRULY UNLIMITED
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required in environment variables');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use gemini-pro with NO TOKEN LIMITS! 💪
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro", // Aapke paas Pro hai!
      generationConfig: {
        temperature: 0.7, // Better creativity
        topK: 40,
        topP: 0.9,
        // ❌ NO maxOutputTokens - Gemini decide karega optimal length
        // ✅ Unlimited content generation
      }
    });
    
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.MIN_INTERVAL = 35000; // 35 seconds between API calls to avoid rate limits
    
    console.log('🚀 Gemini PRO Service initialized with rate limiting (35s between calls)!');
  }

  async generateContent(prompt, options = {}) {
    const maxRetries = 3;
    let lastError;

    // Rate limiting: Wait if needed
    const now = Date.now();
    const timeSinceLastCall = now - this.lastRequestTime;
    if (timeSinceLastCall < this.MIN_INTERVAL) {
      const waitTime = this.MIN_INTERVAL - timeSinceLastCall;
      console.log(`⏳ Rate limiting: Waiting ${Math.round(waitTime / 1000)} seconds before API call...`);
      await this.sleep(waitTime);
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 Generating AI content... (Attempt ${attempt}/${maxRetries})`);
        this.lastRequestTime = Date.now();
        this.requestCount++;

        // Add delay between retries (exponential backoff)
        if (attempt > 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ AI generation successful - Content length:', text.length, 'characters');
        return text;
        
      } catch (error) {
        lastError = error;
        console.error(`❌ AI content generation failed (Attempt ${attempt}/${maxRetries}):`, error.message);
        
        // Check if it's a retryable error
        const isRetryable = 
          error.message.includes('503') ||
          error.message.includes('overloaded') ||
          error.message.includes('Service Unavailable') ||
          error.message.includes('timeout') ||
          error.message.includes('network') ||
          error.message.includes('rate limit') ||
          error.message.includes('429');

        if (!isRetryable || attempt === maxRetries) {
          // Not retryable or max retries reached
          throw new Error(`AI service error: ${error.message}`);
        }

        console.log(`🔄 Retryable error detected, will retry...`);
      }
    }

    throw new Error(`AI service error after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  async generateStructuredContent(prompt, schema, options = {}) {
    try {
      const structuredPrompt = this.createComprehensivePrompt(prompt, schema);
      
      console.log('📋 Sending UNLIMITED structured content request...');
      const response = await this.generateContent(structuredPrompt, {
        ...options,
        temperature: 0.3,
      });
      
      if (!response || response.length === 0) {
        throw new Error('Empty response from AI');
      }
      
      console.log('📄 UNLIMITED response length:', response.length, 'characters');
      
      // Parse JSON
      let parsedData = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const cleaned = this.cleanJsonResponse(response, attempt);
          parsedData = JSON.parse(cleaned);
          console.log(`✅ JSON parsed successfully (attempt ${attempt})`);
          break;
        } catch (parseError) {
          console.warn(`⚠️ JSON parse attempt ${attempt} failed:`, parseError.message);
          if (attempt === 3) {
            // Last attempt - try to fix common JSON issues
            const fixedJson = this.fixCommonJsonIssues(response);
            parsedData = JSON.parse(fixedJson);
          }
        }
      }
      
      return parsedData;
      
    } catch (error) {
      console.error('❌ Structured content failed:', error.message);
      throw error;
    }
  }

  createComprehensivePrompt(prompt, schema) {
    return `
IMPORTANT: Return COMPREHENSIVE, DETAILED content in valid JSON format.

TASK: ${prompt}

Generate EXTENSIVE content with:
- Detailed explanations (as long as needed)
- Comprehensive examples
- Complete coverage of topics
- No length restrictions

STRUCTURE YOUR RESPONSE AS:
${JSON.stringify(schema, null, 2)}

Return ONLY valid JSON with complete, unlimited content.
`;
  }

  cleanJsonResponse(response, attempt) {
    if (!response) return '{}';
    
    let cleaned = response.trim();
    
    switch (attempt) {
      case 1:
        // Remove markdown code blocks
        cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        break;
      case 2:
        // Extract JSON between first { and last }
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}') + 1;
        if (start !== -1 && end !== -1) {
          cleaned = cleaned.substring(start, end);
        }
        break;
      case 3:
        // Aggressive cleaning for malformed JSON
        cleaned = cleaned
          .replace(/^[^{[]*/, '') // Remove everything before first {
          .replace(/[^}\]]*$/, '') // Remove everything after last }
          .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
          .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3') // Add quotes to keys
          .replace(/'/g, '"') // Replace single quotes with double
          .replace(/,\s*}/g, '}') // Remove trailing commas before }
          .replace(/,\s*]/g, ']'); // Remove trailing commas before ]
        break;
    }
    
    return cleaned.trim();
  }

  fixCommonJsonIssues(response) {
    console.log('🔧 Attempting to fix JSON issues...');
    
    let fixed = response
      // Fix unescaped quotes within strings
      .replace(/([^\\])"/g, '$1\\"')
      // Fix missing commas between objects in arrays
      .replace(/\}\s*\{/g, '},{')
      // Fix missing commas between properties
      .replace(/\"\s*\"/g, '","')
      // Ensure proper array formatting
      .replace(/(\w)\s*\[/g, '$1 [');

    // Try to parse the fixed version
    try {
      return JSON.parse(fixed);
    } catch (e) {
      // If still failing, return minimal valid structure
      console.log('⚠️ JSON fixing failed, using minimal structure');
      return this.buildMinimalStructure();
    }
  }

  buildMinimalStructure() {
    return {
      modules: [
        {
          title: "Course Content",
          description: "Generated from your material",
          order: 1,
          lessons: [
            {
              title: "Key Concepts",
              content: "Detailed content will be generated in the next update.",
              order: 1,
              quiz: [],
              flashcards: []
            }
          ]
        }
      ]
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getUsageStats() {
    return {
      totalRequests: this.requestCount,
      lastRequest: new Date(this.lastRequestTime).toISOString(),
      mode: "UNLIMITED_PRO"
    };
  }
}

module.exports = new GeminiService();