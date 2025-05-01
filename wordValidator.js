class WordValidator {
    constructor() {
        this.cache = new Map();
        this.apiUrl = '/api/validate';
    }

    /**
     * Normalize a word by converting to lowercase and trimming whitespace
     * @param {string} str - The word to normalize
     * @returns {string} The normalized word
     */
    normalizeWord(str) {
        return str.trim().toLowerCase();
    }

    /**
     * Check if a word is valid using the server API
     * @param {string} word - The word to check
     * @returns {Promise<boolean>} True if the word is valid
     */
    async isValidWord(word) {
        if (!word) return false;
        
        // Normalize the word
        const normalizedWord = this.normalizeWord(word);
        console.log('Validating word:', normalizedWord);
        
        // Check cache first
        if (this.cache.has(normalizedWord)) {
            console.log('Using cached result for:', normalizedWord);
            return this.cache.get(normalizedWord);
        }
        
        try {
            console.log('Making API request for:', normalizedWord);
            const response = await fetch(`${this.apiUrl}?word=${encodeURIComponent(normalizedWord)}`);
            if (!response.ok) {
                console.error('Validation request failed:', response.status);
                return false;
            }
            
            const data = await response.json();
            console.log('Validation result for', normalizedWord + ':', data.valid);
            
            // Cache the result
            this.cache.set(normalizedWord, data.valid);
            
            return data.valid;
        } catch (error) {
            console.error('Error validating word:', error);
            return false;
        }
    }
}

// Export for use in the game
window.WordValidator = WordValidator; 