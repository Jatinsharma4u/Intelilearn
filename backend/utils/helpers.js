// utils/helpers.js
class Helpers {
  // Sleep function for delays
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Validate email format
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Generate unique ID
  static generateId(prefix = '') {
    return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Calculate progress percentage
  static calculateProgress(completed, total) {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }

  // Format time in minutes to readable string
  static formatTime(minutes) {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  // Sanitize text for AI processing
  static sanitizeText(text) {
    return text
      .replace(/[^\w\s.,!?;:()\-–—\n\r\u0900-\u097F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Extract keywords from text
  static extractKeywords(text, maxKeywords = 10) {
    const words = text.toLowerCase().split(/\s+/);
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did'
    ]);
    
    const wordFreq = {};
    words.forEach(word => {
      if (word.length > 3 && !commonWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  // Calculate reading time
  static estimateReadingTime(text, wordsPerMinute = 200) {
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  // Format file size
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Validate JSON and parse safely
  static safeJsonParse(str, defaultValue = null) {
    try {
      return JSON.parse(str);
    } catch (error) {
      console.error('JSON parse error:', error);
      return defaultValue;
    }
  }

  // Deep clone object
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Debounce function
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Calculate average
  static calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  // Generate color from string (for avatars, etc.)
  static stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
  }

  // Format date for display
  static formatDate(date, includeTime = false) {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return new Date(date).toLocaleDateString('en-IN', options);
  }

  // Check if value is empty
  static isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  // Capitalize first letter
  static capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Generate random number in range
  static randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Truncate text with ellipsis
  static truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  }
}

module.exports = Helpers;