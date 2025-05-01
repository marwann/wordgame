// Placeholder for WordValidator if not defined elsewhere
console.warn('WordValidator class not found, using placeholder.');
class WordValidator {
  constructor() {
    this.dictionary = new Set();
    this.isReady = false;
    this._loadDefault(); // Load a small default dictionary or indicate loading
  }

  async _loadDefault() {
    // In a real scenario, load from a file or API
    // Using a small set for basic functionality demonstration
    const defaultWords = ["word", "game", "play", "code", "test", "grid", "rack", "tile", "score", "daily", "valid", "setup"];
    defaultWords.forEach(word => this.dictionary.add(word));
    console.log("WordValidator: Using minimal default dictionary.");
    this.isReady = true;
  }

  async loadDictionary(url = 'words_alpha.txt') {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      const words = text.split(/\r?\n/).map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
      this.dictionary = new Set(words);
      this.isReady = true;
      console.log(`WordValidator: Dictionary loaded with ${this.dictionary.size} words.`);
    } catch (error) {
      console.error('WordValidator: Failed to load dictionary:', error);
      // Keep the default dictionary or handle error appropriately
      if (!this.isReady) {
          this._loadDefault(); // Ensure at least the default is loaded on failure
      }
    }
  }

  async isValidWord(word) {
    if (!this.isReady) {
      console.warn("WordValidator: Dictionary not ready, validation might be inaccurate.");
      // Optionally wait or return a default value
      // await new Promise(resolve => setTimeout(resolve, 500)); // Simple wait
    }
    return this.dictionary.has(word.toLowerCase());
  }
}
// Make it globally available if needed, or manage instances properly
window.WordValidator = WordValidator;


class WordOfTheDay {
    constructor() {
      // DOM elements - Add checks
      this.grid = this.getElementByIdSafe('grid');
      this.rack = this.getElementByIdSafe('rack');
      this.scoreElement = this.getElementByIdSafe('score');
      this.lettersLeftElement = this.getElementByIdSafe('letters-left');
      this.wordList = this.getElementByIdSafe('word-list');
      this.leaderboardList = this.getElementByIdSafe('leaderboard-list');
      this.submitButton = this.getElementByIdSafe('submit-word');
      this.cancelButton = this.getElementByIdSafe('cancel-word');
      this.newGameButton = this.getElementByIdSafe('new-game');
      this.currentWordText = this.getElementByIdSafe('current-word-text');
      this.currentWordScore = this.getElementByIdSafe('current-word-score');
      this.containerElement = document.querySelector('.container'); // Needed for notification
      this.endGameButton = this.getElementByIdSafe('end-game');

      // Add Modal Element References
      this.modalOverlay = this.getElementByIdSafe('modal-overlay');
      this.modalContent = this.getElementByIdSafe('modal-content');
      this.modalTitle = this.getElementByIdSafe('modal-title');
      this.modalMessage = this.getElementByIdSafe('modal-message');
      this.modalButtons = this.getElementByIdSafe('modal-buttons');
      this.modalInputContainer = this.getElementByIdSafe('modal-input-container');
      this.modalInput = this.getElementByIdSafe('modal-input');

      if (!this.grid || !this.rack || !this.scoreElement || !this.lettersLeftElement || !this.wordList || !this.leaderboardList || !this.submitButton || !this.cancelButton || !this.newGameButton || !this.currentWordText || !this.currentWordScore || !this.containerElement || !this.endGameButton || !this.modalOverlay || !this.modalContent || !this.modalTitle || !this.modalMessage || !this.modalButtons || !this.modalInputContainer || !this.modalInput) {
          console.error("Initialization failed: One or more required DOM elements not found (including modal elements).");
          // Optionally throw an error or disable functionality
          // throw new Error("Missing required DOM elements");
          this.showNotification("Error: Missing required page elements. Game may not function correctly.", true);
          return; // Stop constructor if critical elements are missing
      }

      // Notification overlay
      this.notificationElement = document.createElement('div');
      this.notificationElement.className = 'notification';
      this.notificationElement.style.display = 'none';
      this.containerElement.appendChild(this.notificationElement);
      this.notificationTimeout = null;

      // Word validator
      this.wordValidator = new WordValidator();
      // Start loading the actual dictionary asynchronously
      this.wordValidator.loadDictionary().catch(err => console.error("Error initiating dictionary load:", err));


      // Scrabble distributions
      this.letterDistribution = {
        'A': { count: 9, value: 1 }, 'B': { count: 2, value: 3 }, 'C': { count: 2, value: 3 },
        'D': { count: 4, value: 2 }, 'E': { count: 12, value: 1 }, 'F': { count: 2, value: 4 },
        'G': { count: 3, value: 2 }, 'H': { count: 2, value: 4 }, 'I': { count: 9, value: 1 },
        'J': { count: 1, value: 8 }, 'K': { count: 1, value: 5 }, 'L': { count: 4, value: 1 },
        'M': { count: 2, value: 3 }, 'N': { count: 6, value: 1 }, 'O': { count: 8, value: 1 },
        'P': { count: 2, value: 3 }, 'Q': { count: 1, value: 10 }, 'R': { count: 6, value: 1 },
        'S': { count: 4, value: 1 }, 'T': { count: 6, value: 1 }, 'U': { count: 4, value: 1 },
        'V': { count: 2, value: 4 }, 'W': { count: 2, value: 4 }, 'X': { count: 1, value: 8 },
        'Y': { count: 2, value: 4 }, 'Z': { count: 1, value: 10 }
      };
      this.letterValues = Object.fromEntries(
        Object.entries(this.letterDistribution).map(([l, d]) => [l, d.value])
      );

      // Special cells
      this.specialCells = {
        'double-letter': { multiplier: 2, description: 'Double letter score' },
        'triple-letter': { multiplier: 3, description: 'Triple letter score' },
        'double-word':   { multiplier: 2, description: 'Double word score'   },
        'triple-word':   { multiplier: 3, description: 'Triple word score'   }
      };

      // Game state
      this.gridSize = 5; // Keep this as 5x5
      this.centerIndex = Math.floor(this.gridSize * this.gridSize / 2); // Calculate center: 12 for 5x5
      this.letterBag = [];
      this.playerRack = [];
      this.totalLetters = 15; // Total letters for this specific game mode
      this.usedLetters = 0;
      this.selectedRackLetterElement = null; // Store the element, not just the letter
      this.placedLetters = new Map(); // Map<index, letter> for all placed letters
      this.currentTurnLetters = new Map(); // Map<index, letter> for letters placed *this turn*
      this.foundWordsData = new Map(); // Map<word, score> to store found words and their scores
      this.score = 0;
      this.firstWordPlaced = false;

      // Initialize
      this.initializeEventListeners();
      this.initialize(); // Start game initialization
      this.fetchLeaderboard(); // Fetch leaderboard data
    }

    // Helper to safely get elements
    getElementByIdSafe(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`DOM element with ID "${id}" not found.`);
        }
        return element;
    }

    // Placeholder for a hashing function if needed elsewhere
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        // Make it positive for seeding random number generator
        return Math.abs(hash);
    }

    // Placeholder for emergency grid creation
    createEmergencyGrid() {
        console.warn("createEmergencyGrid called - emergency fallback needed.");
        // Implement actual fallback grid creation if necessary
        if (!this.grid.children.length) {
            this.startNewGame(); // Attempt a standard new game start
        }
    }

    // Initial game setup
    async initialize() {
      try {
        await this.checkDailyGame();
        // Emergency fallback (check if grid is still empty after a delay)
        setTimeout(() => {
          if (this.grid && !this.grid.children.length) {
            console.warn("Grid not initialized after checkDailyGame, attempting emergency creation.");
            this.createEmergencyGrid();
          }
        }, 1500); // Increased delay slightly
      } catch (error) {
        console.error("Error during initialization:", error);
        this.showNotification("Failed to initialize game. Starting a new default game.", true);
        this.startNewGame(); // Fallback to a completely new game
      }
    }

    initializeEventListeners() {
      // Ensure buttons exist before adding listeners
      if (this.submitButton) this.submitButton.addEventListener('click', () => this.submitWord());
      if (this.cancelButton) this.cancelButton.addEventListener('click', () => this.cancelCurrentWord());
      if (this.newGameButton) this.newGameButton.addEventListener('click', () => this.confirmNewGame()); // Add confirmation
      if (this.endGameButton) this.endGameButton.addEventListener('click', () => this.confirmEndGame());
    }

    confirmNewGame() {
        if (confirm("Are you sure you want to start a new game? Your current progress will be lost.")) {
            // Clear saved game for the day before starting new
            const today = new Date().toDateString();
            const saved = localStorage.getItem('wordOfTheDay');
            if (saved) {
                const gd = JSON.parse(saved);
                if (gd.date === today) {
                    localStorage.removeItem('wordOfTheDay');
                }
            }
            this.startNewGame();
        }
    }

    // Daily game loader
    async checkDailyGame() {
      const today = new Date().toDateString();
      let dailyLetters = null;

      // Try fetching daily letters from API
      try {
        const res = await fetch(`/api/daily-letters/${encodeURIComponent(today)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.letters) && data.letters.length === this.totalLetters) {
            dailyLetters = data.letters;
            console.log("Fetched daily letters from API.");
          } else {
             console.warn("API response for daily letters invalid:", data);
          }
        } else {
            console.warn(`API fetch failed for daily letters: ${res.status}`);
        }
      } catch (error) {
          console.error("Error fetching daily letters from API:", error);
      }

      // Check local storage for saved game *for today*
      const saved = localStorage.getItem('wordOfTheDay');
      if (saved) {
        try {
          const gd = JSON.parse(saved);
          if (gd.date === today) {
            console.log("Loading saved game from localStorage for today.");
            // If we also got daily letters, ensure they match the saved game's bag
            if (dailyLetters && JSON.stringify(dailyLetters) !== JSON.stringify(gd.letterBag)) {
                console.warn("API daily letters differ from saved game letters. Using saved game.");
            }
            this.loadGame(gd);
            return; // Saved game loaded, initialization complete
          } else {
            console.log("Saved game is for a different date. Ignoring.");
            localStorage.removeItem('wordOfTheDay'); // Clean up old save
          }
        } catch (e) {
            console.error("Error parsing saved game data:", e);
            localStorage.removeItem('wordOfTheDay'); // Remove corrupted data
        }
      }

      // If no saved game for today, proceed based on fetched letters
      if (dailyLetters) {
        console.log("Starting new game with API daily letters.");
        this.letterBag = dailyLetters;
        this.startNewGameWithLetters(); // Start game using these letters
      } else {
        console.log("No API letters and no saved game for today. Starting new game with generated letters.");
        this.startNewGame(); // Generate letters locally and start
      }
    }

    resetGameState() {
        this.grid.innerHTML = '';
        this.rack.innerHTML = '';
        this.wordList.innerHTML = '';
        this.placedLetters.clear();
        this.currentTurnLetters.clear();
        this.foundWordsData.clear();
        this.score = 0;
        this.usedLetters = 0;
        this.firstWordPlaced = false;
        if (this.scoreElement) this.scoreElement.textContent = '0';
        if (this.currentWordText) this.currentWordText.textContent = '...';
        if (this.currentWordScore) this.currentWordScore.textContent = '';
        if (this.selectedRackLetterElement) {
            this.selectedRackLetterElement.classList.remove('selected');
            this.selectedRackLetterElement = null;
        }
    }

    // New game from scratch (generates letters)
    startNewGame() {
      this.resetGameState();
      this.initializeLetterBag(); // Generate and store letters
      this.createGrid();
      this.fillRack();
      this.updateLettersLeft();
      this.saveGame();
      this.showNotification("New game started!", false);
    }

    // New game with pre-fetched letters (e.g., from API)
    startNewGameWithLetters() {
      this.resetGameState();
      // Assumes this.letterBag is already set
      if (!this.letterBag || this.letterBag.length !== this.totalLetters) {
          console.error("startNewGameWithLetters called without a valid letterBag. Falling back.");
          this.startNewGame(); // Fallback to generating letters
          return;
      }
      this.createGrid();
      this.fillRack();
      this.updateLettersLeft();
      this.saveGame(); // Save the initial state with these letters
      this.showNotification("Daily game started!", false);
    }

    // Build the letter bag deterministically based on date
    initializeLetterBag() {
      const today = new Date().toDateString();
      const seed = this.hashString(today); // Use the defined hash function

      // Simple pseudo-random number generator based on seed
      const seededRandom = (s) => {
          s = Math.sin(s) * 10000;
          return s - Math.floor(s);
      };

      const shuffle = (arr, seedValue) => {
        const a = [...arr];
        let currentSeed = seedValue;
        for (let i = a.length - 1; i > 0; i--) {
          currentSeed = this.hashString(currentSeed.toString()); // Update seed for next step
          const j = Math.floor(seededRandom(currentSeed) * (i + 1));
          [a[i], a[j]] = [a[j], a[i]]; // Swap
        }
        return a;
      };

      const pool = [];
      for (const [letter, dist] of Object.entries(this.letterDistribution)) {
        for (let i = 0; i < dist.count; i++) {
          pool.push(letter);
        }
      }

      // Shuffle the full pool and take the required number of letters
      this.letterBag = shuffle(pool, seed).slice(0, this.totalLetters);
      console.log("Generated letter bag:", this.letterBag);

      // Attempt to store these letters for the day via API
      this.storeDailyLetters(today, this.letterBag);
    }

    // Store letters via API (best effort)
    async storeDailyLetters(date, letters) {
      try {
        await fetch('/api/daily-letters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, letters })
        });
        console.log("Attempted to store daily letters via API.");
      } catch (error) {
          console.warn("Could not store daily letters via API:", error);
      }
    }

    // Create 5x5 grid with special cells appropriate for the size
    createGrid() {
      if (!this.grid) return;
      this.grid.innerHTML = ''; // Clear previous grid
      this.grid.style.setProperty('--grid-size', this.gridSize); // For CSS styling if needed

      const totalCells = this.gridSize * this.gridSize;
      const specialMap = this.createSpecialCellsMap(); // Get map based on gridSize

      for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;

        // Center cell styling and title
        if (i === this.centerIndex) {
          cell.classList.add('center-cell');
          cell.title = 'First word must use this cell';
        }

        // Apply special cell type and label
        const specialType = specialMap[i];
        if (specialType) {
          cell.classList.add(specialType);
          cell.title = this.specialCells[specialType].description; // Add description as title
          const label = document.createElement('span');
          label.className = 'multiplier-label';
          label.textContent = {
            'double-letter': 'DL', 'triple-letter': 'TL',
            'double-word': 'DW', 'triple-word': 'TW'
          }[specialType] || '';
          cell.appendChild(label);
        }

        // Event Listeners for interaction
        cell.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleCellClick(cell);
        });
        cell.addEventListener('dragover', (e) => {
          e.preventDefault(); // Necessary to allow drop
          cell.classList.add('drag-over');
        });
        cell.addEventListener('dragleave', () => {
          cell.classList.remove('drag-over');
        });
        cell.addEventListener('drop', (e) => {
          e.preventDefault();
          cell.classList.remove('drag-over');
          const letter = e.dataTransfer.getData('text/plain');
          this.handleCellDrop(cell, letter);
        });

        this.grid.appendChild(cell);
      }
    }

    // Define special cells for 5x5 grid
    createSpecialCellsMap() {
        const map = {};
        const size = this.gridSize; // 5
        const center = this.centerIndex; // 12

        // Helper to add type at (r, c) if within bounds
        const add = (r, c, type) => {
            if (r >= 0 && r < size && c >= 0 && c < size) {
                const index = r * size + c;
                if (index !== center) { // Center cell has no bonus
                    map[index] = type;
                }
            }
        };

        // Example 5x5 layout (symmetric) - Adjust as desired
        // TW (Corners)
        add(0, 0, 'triple-word'); add(0, size - 1, 'triple-word');
        add(size - 1, 0, 'triple-word'); add(size - 1, size - 1, 'triple-word');

        // DW (Inner diagonals)
        add(1, 1, 'double-word'); add(1, size - 2, 'double-word');
        add(size - 2, 1, 'double-word'); add(size - 2, size - 2, 'double-word');

        // TL (Middle of edges)
        add(0, Math.floor(size / 2), 'triple-letter');
        add(size - 1, Math.floor(size / 2), 'triple-letter');
        add(Math.floor(size / 2), 0, 'triple-letter');
        add(Math.floor(size / 2), size - 1, 'triple-letter');

        // DL (Adjacent to center cross)
        add(center % size, 1, 'double-letter'); // (2, 1) -> 11
        add(center % size, size - 2, 'double-letter'); // (2, 3) -> 13
        add(1, center % size, 'double-letter'); // (1, 2) -> 7
        add(size - 2, center % size, 'double-letter'); // (3, 2) -> 17

        return map;
    }


    // Fill rack from the initial letter bag
    fillRack() {
      // Take all letters from the bag for this game mode
      this.playerRack = [...this.letterBag];
      this.updateRackDOM();
    }

    // Update the visual rack display
    updateRackDOM() {
      if (!this.rack) return;
      this.rack.innerHTML = ''; // Clear previous rack
      this.playerRack.forEach((letter, rackIndex) => {
        const rackElement = document.createElement('div');
        rackElement.className = 'rack-letter';
        rackElement.dataset.letter = letter;
        rackElement.dataset.rackIndex = rackIndex; // Keep track of original position if needed
        rackElement.draggable = true;

        const value = this.letterValues[letter] || 0;
        rackElement.dataset.value = value;
        rackElement.innerHTML = `${letter}<span class="letter-point-value">${value}</span>`;

        // Drag and Drop events
        rackElement.addEventListener('dragstart', (e) => {
          // Don't select if already placed on board this turn
          if (rackElement.classList.contains('disabled')) {
              e.preventDefault();
              return;
          }
          this.selectRackLetter(rackElement); // Select visually
          e.dataTransfer.setData('text/plain', letter);
          e.dataTransfer.effectAllowed = 'move';
          rackElement.classList.add('dragging');
        });
        rackElement.addEventListener('dragend', () => {
          rackElement.classList.remove('dragging');
          // Deselect if it wasn't dropped successfully? Or handled by drop target.
        });

        // Click event
        rackElement.addEventListener('click', () => {
            // Don't select if already placed on board this turn
            if (rackElement.classList.contains('disabled')) return;
            this.selectRackLetter(rackElement);
        });

        this.rack.appendChild(rackElement);
      });

      // Visually disable rack letters that are currently on the board
      const placedLettersThisTurn = new Set(this.currentTurnLetters.values());
      let placedCount = 0;
      this.rack.querySelectorAll('.rack-letter').forEach(el => {
          if (placedLettersThisTurn.has(el.dataset.letter) && placedCount < this.currentTurnLetters.size) {
              const letter = el.dataset.letter;
              // Check if this specific instance of the letter is used
              let needed = 0;
              this.currentTurnLetters.forEach(l => { if (l === letter) needed++; });
              let disabled = 0;
              this.rack.querySelectorAll('.rack-letter.disabled').forEach(disabledEl => {
                  if (disabledEl.dataset.letter === letter) disabled++;
              });

              if (disabled < needed) {
                  el.classList.add('disabled');
                  placedCount++;
              } else {
                  el.classList.remove('disabled');
              }
          } else {
              el.classList.remove('disabled');
          }
      });
    }

    // Handle selecting a letter from the rack (visually)
    selectRackLetter(rackElement) {
        if (this.selectedRackLetterElement) {
            this.selectedRackLetterElement.classList.remove('selected');
        }
        if (this.selectedRackLetterElement === rackElement) {
            // Clicked the same selected letter again, deselect it
            this.selectedRackLetterElement = null;
        } else {
            this.selectedRackLetterElement = rackElement;
            this.selectedRackLetterElement.classList.add('selected');
        }
    }

    // Handle clicking on a grid cell
    handleCellClick(cell) {
        const index = parseInt(cell.dataset.index, 10);

        // If cell is occupied by a letter placed *this turn*, remove it
        if (this.currentTurnLetters.has(index)) {
            this.removeLetterFromBoard(cell, index);
        }
        // If a rack letter is selected and cell is empty, place the letter
        else if (this.selectedRackLetterElement && !cell.classList.contains('occupied')) {
            this.placeLetterOnBoard(cell, this.selectedRackLetterElement.dataset.letter);
        }
        // If cell is occupied by a previously placed letter, do nothing on click
        else if (cell.classList.contains('occupied')) {
            // Maybe allow selecting placed letters in future? For now, do nothing.
        }
        // If cell is empty and no rack letter selected, do nothing
    }

    // Handle dropping a letter onto a grid cell
    handleCellDrop(cell, letter) {
        const index = parseInt(cell.dataset.index, 10);
        // Allow drop only if the cell is not permanently occupied
        if (!cell.classList.contains('occupied') || this.currentTurnLetters.has(index)) {
             // If occupied by a current turn letter, remove it first
            if (this.currentTurnLetters.has(index)) {
                this.removeLetterFromBoard(cell, index);
            }
            this.placeLetterOnBoard(cell, letter);
        } else {
            this.showNotification("Cell is already occupied.", true);
        }
    }


    // Place a letter from the rack onto the board
    placeLetterOnBoard(cell, letter) {
        if (!letter) return; // Should not happen if called correctly
        const index = parseInt(cell.dataset.index, 10);

        // Basic validation (can be expanded in isPlacementValid)
        // Check if placing adjacent to existing letters if not the first word
        if (this.placedLetters.size > 0 && this.currentTurnLetters.size === 0 && !this.isAdjacentToExistingLetters(index)) {
             this.showNotification("New letters must be placed adjacent to existing ones.", true);
             return;
        }

        // Find the corresponding rack element (first available one)
        const rackElement = [...this.rack.querySelectorAll('.rack-letter:not(.disabled)')] // Keep .disabled check just in case
                            .find(el => el.dataset.letter === letter);

        if (!rackElement) {
            this.showNotification(`Letter "${letter}" not available in your rack.`, true);
            return;
        }

        // Update cell content and state
        const value = this.letterValues[letter] || 0;
        cell.innerHTML = `<div class="letter">${letter}</div><div class="letter-value">${value}</div>`;
        cell.classList.add('occupied', 'current-turn'); // Mark as occupied and part of current turn

        // Update game state
        this.currentTurnLetters.set(index, letter);

        // *** Remove letter from playerRack array ***
        const rackIndex = this.playerRack.indexOf(letter);
        if (rackIndex > -1) {
            this.playerRack.splice(rackIndex, 1);
        } else {
             console.warn(`Letter "${letter}" placed but couldn't find in playerRack array.`);
        }

        // *** Remove the used rack letter element directly from DOM ***
        rackElement.remove();
        if (this.selectedRackLetterElement === rackElement) {
            this.selectedRackLetterElement = null; // Clear selection if it was the removed element
        }


        // Update UI elements (excluding updateRackDOM)
        this.updateLettersLeft();
        this.updateCurrentWordDisplay(); // Update the potential word display
        // REMOVE this.updateRackDOM();
    }

    // Remove a letter placed *this turn* from the board back to the rack
    removeLetterFromBoard(cell, index) {
        if (!this.currentTurnLetters.has(index)) return; // Can only remove current turn's letters

        const letter = this.currentTurnLetters.get(index);

        // Update cell content and state
        cell.innerHTML = ''; // Clear letter display
        cell.classList.remove('occupied', 'current-turn');
        // Restore special cell label if it was there
        const specialMap = this.createSpecialCellsMap();
        const specialType = specialMap[index];
        if (specialType) {
            const label = document.createElement('span');
            label.className = 'multiplier-label';
            label.textContent = {
                'double-letter': 'DL', 'triple-letter': 'TL',
                'double-word': 'DW', 'triple-word': 'TW'
            }[specialType] || '';
            cell.appendChild(label);
        }


        // Update game state
        this.currentTurnLetters.delete(index);

        // *** Add letter back to playerRack array ***
        this.playerRack.push(letter);

        // *** Recreate and add the letter element back to the rack DOM ***
        const newRackElement = document.createElement('div');
        newRackElement.className = 'rack-letter';
        newRackElement.dataset.letter = letter;
        newRackElement.draggable = true;
        const letterValue = this.letterValues[letter] || 0;
        newRackElement.dataset.value = letterValue;
        newRackElement.innerHTML = `
            ${letter}
            <span class="letter-point-value">${letterValue}</span>
        `;
        // Add event listeners back
        newRackElement.addEventListener('dragstart', (e) => {
             this.selectedRackLetterElement = newRackElement; // Select on drag start
             e.dataTransfer.setData('text/plain', letter);
             newRackElement.classList.add('dragging');
         });
        newRackElement.addEventListener('dragend', () => {
            newRackElement.classList.remove('dragging');
            // Consider if selection should persist after drag ends without drop
        });
        newRackElement.addEventListener('click', () => this.selectRackLetter(newRackElement));

        this.rack.appendChild(newRackElement);


        // Update UI elements (excluding updateRackDOM)
        this.updateLettersLeft();
        this.updateCurrentWordDisplay(); // Update the potential word display
        // REMOVE this.updateRackDOM();
    }

    // Cancel all letters placed in the current turn
    cancelCurrentWord() {
        if (this.currentTurnLetters.size === 0) return; // Nothing to cancel

        // Create a copy of indices to iterate over, as removing modifies the map
        const indicesToRemove = [...this.currentTurnLetters.keys()];

        indicesToRemove.forEach(index => {
            const cell = this.grid.children[index];
            if (cell) {
                this.removeLetterFromBoard(cell, index);
            }
        });

        // Ensure state is fully reset after removals
        this.currentTurnLetters.clear();
        this.updateCurrentWordDisplay();
        this.showNotification('Current placement canceled.', false);
    }

    // Check if a cell index is adjacent (horizontally/vertically) to any permanently placed letter
    isAdjacentToExistingLetters(index) {
        const r = Math.floor(index / this.gridSize);
        const c = index % this.gridSize;
        const neighbors = [
            [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
        ];

        for (const [nr, nc] of neighbors) {
            if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize) {
                const neighborIndex = nr * this.gridSize + nc;
                // Check against letters placed in *previous* turns
                if (this.placedLetters.has(neighborIndex)) {
                    return true;
                }
            }
        }
        return false;
    }

    // Update the display showing used/total letters
    updateLettersLeft() {
        if (this.lettersLeftElement) {
            this.lettersLeftElement.textContent = `${this.usedLetters}/${this.totalLetters}`;
        }
    }

    // Update the display for the currently formed word(s) and potential score
    async updateCurrentWordDisplay() {
        if (!this.currentWordText || !this.currentWordScore) return;

        const currentPlacementData = this.getPlacementData();
        const word = currentPlacementData.word;
        const indices = currentPlacementData.indices;

        if (word) {
            const score = this.calculateScoreForWord(word, indices);
            this.currentWordText.textContent = word;
            this.currentWordScore.textContent = `${score} points`;

            // Validate the word asynchronously
            if (this.wordValidator) {
                const isValid = await this.wordValidator.isValidWord(word);
                this.currentWordScore.classList.toggle('valid-word', isValid);
                this.currentWordScore.classList.toggle('invalid-word', !isValid);
            } else {
                this.currentWordScore.classList.remove('valid-word', 'invalid-word');
            }
        } else {
            // Handle cases with multiple letters not forming a single line yet
            if (this.currentTurnLetters.size > 0) {
                 this.currentWordText.textContent = '...'; // Indicate letters placed but not a word
                 this.currentWordScore.textContent = '';
                 this.currentWordScore.classList.remove('valid-word', 'invalid-word');
            } else {
                this.currentWordText.textContent = '...';
                this.currentWordScore.textContent = '';
                this.currentWordScore.classList.remove('valid-word', 'invalid-word');
            }
        }
    }

    // Get the primary word formed by the current turn's letters
    getPlacementData() {
        if (this.currentTurnLetters.size === 0) {
            return { word: '', indices: [] };
        }

        const indices = [...this.currentTurnLetters.keys()].sort((a, b) => a - b);
        const letters = indices.map(idx => this.currentTurnLetters.get(idx));

        if (indices.length === 1) {
             return { word: letters[0], indices: indices };
        }

        // Check if they form a single horizontal or vertical line
        const firstIndex = indices[0];
        const r0 = Math.floor(firstIndex / this.gridSize);
        const c0 = firstIndex % this.gridSize;

        const isHorizontal = indices.every(idx => Math.floor(idx / this.gridSize) === r0);
        const isVertical = indices.every(idx => idx % this.gridSize === c0);

        if (isHorizontal) {
            // Check for gaps
            for (let i = 0; i < indices.length - 1; i++) {
                if (indices[i+1] - indices[i] !== 1) return { word: '', indices: [] }; // Gap detected
            }
            // Include connecting letters from previous turns
            let word = '';
            let fullIndices = [];
            let currentIdx = indices[0];
            // Check left
            while(currentIdx % this.gridSize > 0 && this.placedLetters.has(currentIdx - 1)) {
                currentIdx--;
            }
            // Build word rightwards
            while(currentIdx % this.gridSize < this.gridSize) {
                if (this.currentTurnLetters.has(currentIdx) || this.placedLetters.has(currentIdx)) {
                    word += this.currentTurnLetters.get(currentIdx) || this.placedLetters.get(currentIdx);
                    fullIndices.push(currentIdx);
                    currentIdx++;
                } else {
                    break;
                }
            }
             // Ensure the formed word includes at least one new letter
            if (fullIndices.some(idx => this.currentTurnLetters.has(idx))) {
                 return { word: word, indices: fullIndices };
            }

        } else if (isVertical) {
            // Check for gaps
            for (let i = 0; i < indices.length - 1; i++) {
                if (indices[i+1] - indices[i] !== this.gridSize) return { word: '', indices: [] }; // Gap detected
            }
             // Include connecting letters from previous turns
            let word = '';
            let fullIndices = [];
            let currentIdx = indices[0];
            // Check up
            while(Math.floor(currentIdx / this.gridSize) > 0 && this.placedLetters.has(currentIdx - this.gridSize)) {
                currentIdx -= this.gridSize;
            }
            // Build word downwards
            while(Math.floor(currentIdx / this.gridSize) < this.gridSize) {
                 if (this.currentTurnLetters.has(currentIdx) || this.placedLetters.has(currentIdx)) {
                    word += this.currentTurnLetters.get(currentIdx) || this.placedLetters.get(currentIdx);
                    fullIndices.push(currentIdx);
                    currentIdx += this.gridSize;
                } else {
                    break;
                }
            }
             // Ensure the formed word includes at least one new letter
            if (fullIndices.some(idx => this.currentTurnLetters.has(idx))) {
                 return { word: word, indices: fullIndices };
            }
        }

        // If not a single line or has gaps, return empty
        return { word: '', indices: [] };
    }


    // Submit the word placed in the current turn
    async submitWord() {
        if (this.currentTurnLetters.size === 0) {
            this.showNotification("Place some letters first!", true);
            return;
        }

        const placementValidResult = this.isPlacementValid();
        if (!placementValidResult.isValid) {
            this.showNotification(placementValidResult.message || "Invalid placement.", true);
            return;
        }

        // Get all words formed by this placement
        const allWordsData = this.getAllWordsDataFromPlacement();
        if (!allWordsData || allWordsData.length === 0) {
            this.showNotification("Could not form any words with this placement.", true);
            // This case might indicate an issue in getAllWordsDataFromPlacement or isPlacementValid
            return;
        }

        // Validate all formed words
        const newlyFoundWords = [];
        let totalTurnScore = 0;
        let allWordsAreValid = true;
        let firstInvalidWord = '';

        for (const { word, indices } of allWordsData) {
            if (word.length < 2) continue; // Ignore single letters if they sneak in

            if (this.foundWordsData.has(word)) {
                // Word already found in a previous turn, skip validation and scoring
                continue;
            }

            const isValid = await this.wordValidator.isValidWord(word);
            if (!isValid) {
                allWordsAreValid = false;
                firstInvalidWord = word;
                break; // Stop validation on first invalid word
            }

            // Word is new and valid, calculate score and add to list
            const score = this.calculateScoreForWord(word, indices);
            newlyFoundWords.push({ word, score });
            totalTurnScore += score;
        }

        // If any word was invalid, reject the entire placement
        if (!allWordsAreValid) {
            this.showNotification(`Invalid word: "${firstInvalidWord}". Placement rejected.`, true);
            return;
        }

        // If all words are valid (or previously found)
        if (newlyFoundWords.length === 0 && allWordsData.length > 0) {
             this.showNotification("Placement forms only previously found words.", true);
             // Optionally allow placing even if no new words? For now, reject.
             return;
        }


        // --- Placement Accepted ---

        // Add newly found words to the list and main score
        newlyFoundWords.forEach(({ word, score }) => {
            this.foundWordsData.set(word, score); // Store word and its score
            this.addWordToListDOM(word, score);
        });
        this.score += totalTurnScore;
        if (this.scoreElement) this.scoreElement.textContent = this.score;
        
        // *** ADD THIS: Increment usedLetters for permanently placed letters ***
        const lettersJustPlacedCount = this.currentTurnLetters.size;
        this.usedLetters += lettersJustPlacedCount;
        // *** END ADD ***

        // Make the current turn's letters permanent
        this.currentTurnLetters.forEach((letter, index) => {
            this.placedLetters.set(index, letter); // Add to permanent placed letters
            const cell = this.grid.children[index];
            if (cell) {
                cell.classList.remove('current-turn'); // Remove temporary styling
            }
        });

        // Clear current turn state
        this.currentTurnLetters.clear();
        if (this.selectedRackLetterElement) {
            this.selectedRackLetterElement.classList.remove('selected');
            this.selectedRackLetterElement = null;
        }
        if (!this.firstWordPlaced) {
            this.firstWordPlaced = true; // Mark first word as placed
        }

        // Update UI
        this.updateCurrentWordDisplay(); // Clear current word display
        this.updateLettersLeft(); // *** Ensure this is called AFTER usedLetters is updated ***
        this.showNotification(`Added ${newlyFoundWords.length} new word(s) for ${totalTurnScore} points!`, false);
        this.saveGame(); // Save progress

        // Check for game end condition (e.g., all letters used)
        if (this.usedLetters === this.totalLetters) {
            this.endGame();
        }
    }

    // Get all words (horizontal and vertical) formed by the current placement
    getAllWordsDataFromPlacement() {
        const wordsData = new Map(); // Use Map to avoid duplicates: Map<word, { word: string, indices: number[] }>
        const currentIndices = new Set(this.currentTurnLetters.keys());

        // Iterate through each newly placed letter to check horizontal and vertical words it forms
        for (const index of currentIndices) {
            const r = Math.floor(index / this.gridSize);
            const c = index % this.gridSize;

            // Check Horizontal Word
            let hWord = '';
            let hIndices = [];
            let startC = c;
            // Move left to find the start of the horizontal word
            while (startC >= 0 && (this.placedLetters.has(r * this.gridSize + startC) || this.currentTurnLetters.has(r * this.gridSize + startC))) {
                startC--;
            }
            startC++; // Move back to the first letter of the word

            // Build the word rightwards
            let currentC = startC;
            while (currentC < this.gridSize && (this.placedLetters.has(r * this.gridSize + currentC) || this.currentTurnLetters.has(r * this.gridSize + currentC))) {
                const currentIdx = r * this.gridSize + currentC;
                const letter = this.currentTurnLetters.get(currentIdx) || this.placedLetters.get(currentIdx);
                hWord += letter;
                hIndices.push(currentIdx);
                currentC++;
            }

            if (hWord.length > 1 && hIndices.some(idx => currentIndices.has(idx))) { // Must contain at least one new letter
                 if (!wordsData.has(hWord)) {
                    wordsData.set(hWord, { word: hWord, indices: hIndices });
                 }
            }

            // Check Vertical Word
            let vWord = '';
            let vIndices = [];
            let startR = r;
            // Move up to find the start of the vertical word
            while (startR >= 0 && (this.placedLetters.has(startR * this.gridSize + c) || this.currentTurnLetters.has(startR * this.gridSize + c))) {
                startR--;
            }
            startR++; // Move back to the first letter of the word

            // Build the word downwards
            let currentR = startR;
            while (currentR < this.gridSize && (this.placedLetters.has(currentR * this.gridSize + c) || this.currentTurnLetters.has(currentR * this.gridSize + c))) {
                const currentIdx = currentR * this.gridSize + c;
                const letter = this.currentTurnLetters.get(currentIdx) || this.placedLetters.get(currentIdx);
                vWord += letter;
                vIndices.push(currentIdx);
                currentR++;
            }

            if (vWord.length > 1 && vIndices.some(idx => currentIndices.has(idx))) { // Must contain at least one new letter
                if (!wordsData.has(vWord)) {
                    wordsData.set(vWord, { word: vWord, indices: vIndices });
                }
            }
        }

        return Array.from(wordsData.values());
    }


    // Calculate the score for a specific word given its letters and indices
    calculateScoreForWord(word, indices) {
        let wordScore = 0;
        let wordMultiplier = 1;

        for (const index of indices) {
            const letter = this.currentTurnLetters.get(index) || this.placedLetters.get(index);
            if (!letter) continue; // Should not happen

            const letterValue = this.letterValues[letter] || 0;
            let letterMultiplier = 1;

            // Apply multipliers ONLY if the letter at this index was placed THIS turn
            if (this.currentTurnLetters.has(index)) {
                const cell = this.grid.children[index];
                if (cell) {
                    const specialMap = this.createSpecialCellsMap();
                    const specialType = specialMap[index];

                    if (specialType === 'double-letter') {
                        letterMultiplier = 2;
                    } else if (specialType === 'triple-letter') {
                        letterMultiplier = 3;
                    } else if (specialType === 'double-word') {
                        wordMultiplier *= 2;
                    } else if (specialType === 'triple-word') {
                        wordMultiplier *= 3;
                    }
                }
            }
            wordScore += letterValue * letterMultiplier;
        }

        return wordScore * wordMultiplier;
    }


    // Validate the placement of the current turn's letters
    isPlacementValid() {
        const numNewLetters = this.currentTurnLetters.size;
        if (numNewLetters === 0) {
            return { isValid: false, message: "No letters placed." };
        }

        const newIndices = [...this.currentTurnLetters.keys()].sort((a, b) => a - b);

        // Rule 1: First word must cover the center cell
        if (!this.firstWordPlaced) {
            if (!this.currentTurnLetters.has(this.centerIndex)) {
                return { isValid: false, message: "First word must use the center cell." };
            }
        }
        // Rule 2: Subsequent words must connect to existing letters
        else {
            const touchesExisting = newIndices.some(idx => this.isAdjacentToExistingLetters(idx));
            if (!touchesExisting) {
                return { isValid: false, message: "New letters must connect to existing letters." };
            }
        }

        // Rule 3: All newly placed letters must form a single contiguous line (horizontally or vertically)
        if (numNewLetters > 1) {
            const r0 = Math.floor(newIndices[0] / this.gridSize);
            const c0 = newIndices[0] % this.gridSize;
            const isHorizontal = newIndices.every(idx => Math.floor(idx / this.gridSize) === r0);
            const isVertical = newIndices.every(idx => idx % this.gridSize === c0);

            if (!isHorizontal && !isVertical) {
                return { isValid: false, message: "Letters must form a single horizontal or vertical line." };
            }

            // Check for gaps within the line
            if (isHorizontal) {
                for (let i = 0; i < newIndices.length - 1; i++) {
                    // Check grid index and also check if the intermediate cell is occupied (by old or new letter)
                    const expectedNextIndex = newIndices[i] + 1;
                    if (newIndices[i+1] !== expectedNextIndex) {
                         // Allow gaps ONLY if filled by existing letters
                         let gapFilled = true;
                         for (let gapIdx = newIndices[i] + 1; gapIdx < newIndices[i+1]; gapIdx++) {
                             if (!this.placedLetters.has(gapIdx)) {
                                 gapFilled = false;
                                 break;
                             }
                         }
                         if (!gapFilled) {
                            return { isValid: false, message: "Letters must be contiguous or connect through existing letters." };
                         }
                    }
                }
            } else { // isVertical
                for (let i = 0; i < newIndices.length - 1; i++) {
                     const expectedNextIndex = newIndices[i] + this.gridSize;
                     if (newIndices[i+1] !== expectedNextIndex) {
                         // Allow gaps ONLY if filled by existing letters
                         let gapFilled = true;
                         for (let gapIdx = newIndices[i] + this.gridSize; gapIdx < newIndices[i+1]; gapIdx += this.gridSize) {
                              if (!this.placedLetters.has(gapIdx)) {
                                 gapFilled = false;
                                 break;
                             }
                         }
                         if (!gapFilled) {
                            return { isValid: false, message: "Letters must be contiguous or connect through existing letters." };
                         }
                    }
                }
            }
        }

        // If all checks pass
        return { isValid: true };
    }

    // Add a word and its score to the DOM list
    addWordToListDOM(word, score) {
        if (!this.wordList) return;
        const li = document.createElement('li');
        li.textContent = `${word} (${score} points)`;
        // Prepend new words to the top
        this.wordList.insertBefore(li, this.wordList.firstChild);
    }

    // Save the current game state to localStorage
    saveGame() {
        const data = {
            date: new Date().toDateString(),
            score: this.score,
            // Store found words as an array of [word, score] pairs for accurate reloading
            foundWordsData: [...this.foundWordsData.entries()],
            // playerRack: this.playerRack, // Rack state is implicitly defined by letterBag and placedLetters
            letterBag: this.letterBag, // The original set of letters for the day
            placedLetters: [...this.placedLetters.entries()], // Permanently placed letters
            // currentTurnLetters: [], // Don't save letters in the middle of a turn
            usedLetters: this.usedLetters, // Reflects letters permanently placed
            firstWordPlaced: this.firstWordPlaced
        };
        try {
            localStorage.setItem('wordOfTheDay', JSON.stringify(data));
            console.log("Game saved.");
        } catch (e) {
            console.error("Error saving game state:", e);
            this.showNotification("Could not save game progress.", true);
        }
    }

    // Load game state from saved data object
    loadGame(data) {
        try {
            this.resetGameState(); // Clear current state before loading

            this.score = data.score || 0;
            this.letterBag = data.letterBag || []; // Important for consistency
            this.placedLetters = new Map(data.placedLetters || []);
            this.usedLetters = data.usedLetters || 0; // Recalculate or trust saved? Trust saved for now.
            this.firstWordPlaced = data.firstWordPlaced || false;

            // Restore found words and scores
            this.foundWordsData = new Map(data.foundWordsData || []);

            // Rebuild UI based on loaded state
            if (this.scoreElement) this.scoreElement.textContent = this.score;

            this.createGrid(); // Create empty grid structure first

            // Populate grid with placed letters
            for (const [index, letter] of this.placedLetters.entries()) {
                const cell = this.grid.children[index];
                if (cell) {
                    const value = this.letterValues[letter] || 0;
                    cell.innerHTML = `<div class="letter">${letter}</div><div class="letter-value">${value}</div>`;
                    cell.classList.add('occupied'); // Mark as permanently occupied
                }
            }

            // Populate word list
            if (this.wordList) this.wordList.innerHTML = ''; // Clear list first
            // Add words in reverse order of finding if desired, or sort later
            this.foundWordsData.forEach((score, word) => {
                this.addWordToListDOM(word, score);
            });

            // Determine remaining letters for the rack
            const placedLetterCounts = {};
            this.placedLetters.forEach(l => { placedLetterCounts[l] = (placedLetterCounts[l] || 0) + 1; });

            const initialLetterCounts = {};
            this.letterBag.forEach(l => { initialLetterCounts[l] = (initialLetterCounts[l] || 0) + 1; });

            this.playerRack = [];
            for(const letter in initialLetterCounts) {
                const countPlaced = placedLetterCounts[letter] || 0;
                const countRemaining = initialLetterCounts[letter] - countPlaced;
                for(let i = 0; i < countRemaining; i++) {
                    this.playerRack.push(letter);
                }
            }

            this.updateRackDOM(); // Display the correct remaining letters
            this.updateLettersLeft(); // Update used/total count

            // Fetch and display leaderboard (independent of saved game state)
            // Changed method name from displayLeaderboard to displayGlobalLeaderboard
            // Consider if loading local leaderboard is ever intended. For now, always fetch global.
            this.fetchLeaderboard();

            this.showNotification("Saved game loaded.", false);

        } catch (error) {
            console.error("Failed to load game state:", error);
            this.showNotification("Error loading saved game. Starting a new game.", true);
            localStorage.removeItem('wordOfTheDay'); // Remove corrupted data
            this.startNewGame(); // Fallback to new game
        }
    }

    // Load dictionary (now handled within WordValidator)
    async loadWordIndex() {
        // This method is now effectively a wrapper or can be removed
        // if WordValidator handles its own loading upon instantiation.
        // Keeping it for potential future use or explicit trigger.
        if (this.wordValidator && typeof this.wordValidator.loadDictionary === 'function') {
             console.log("Triggering dictionary load via loadWordIndex...");
             await this.wordValidator.loadDictionary().catch(err => {
                 console.error("Error loading dictionary via loadWordIndex:", err);
                 this.showNotification("Failed to load dictionary.", true);
             });
        } else {
             console.warn("WordValidator or loadDictionary method not available.");
        }
    }

    // Show user notifications
    showNotification(message, isError = false) {
        if (!this.notificationElement) return;

        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout); // Clear previous timeout
        }

        this.notificationElement.textContent = message;
        this.notificationElement.className = 'notification'; // Reset classes
        if (isError) {
            this.notificationElement.classList.add('error');
        } else {
            this.notificationElement.classList.add('success');
        }
        this.notificationElement.style.display = 'block';

        // Auto-hide after a delay
        this.notificationTimeout = setTimeout(() => {
            this.notificationElement.style.display = 'none';
            this.notificationTimeout = null; // Clear timeout reference
        }, 3000);
    }

    // --- Game End and Leaderboard ---

    endGame() {
        this.showNotification(`Game Over! Final Score: ${this.score}`, false);
        // Disable further interaction
        this.submitButton.disabled = true;
        this.cancelButton.disabled = true;
        this.newGameButton.disabled = true; // Also disable new game until page refresh?
        this.endGameButton.disabled = true; // Disable end game button itself
        // Note: promptSubmitScore is called from confirmEndGame now
    }

    confirmEndGame() {
        console.log("confirmEndGame method called");
        this.showModal({
            title: 'End Game?',
            message: `Are you sure you want to end the game? Your final score is ${this.score}.`,
            buttons: [
                { text: 'End Game', class: 'confirm', resolves: true },
                { text: 'Cancel', class: 'cancel', resolves: false }
            ]
        }).then(result => {
            if (result.confirmed) {
                this.endGame();
                this.promptSubmitScoreModal(); // Ask about submitting after ending
            }
        });
    }

    // Renamed from promptSubmitScore
    promptSubmitScoreModal() {
        this.showModal({
            title: 'Submit Score?',
            message: `Submit score (${this.score}) to leaderboard?`,
            buttons: [
                { text: 'Submit', class: 'confirm', resolves: true },
                { text: 'No Thanks', class: 'cancel', resolves: false }
            ]
        }).then(result => {
            if (result.confirmed) {
                this.getPlayerNameAndSubmit(); // Proceed to get name
            }
        });
    }

    // Renamed and refactored from submitScoreToDatabase
    async getPlayerNameAndSubmit() {
        let playerName = localStorage.getItem('playerName');

        const result = await this.showModal({
            title: 'Enter Name',
            message: 'Enter your name for the leaderboard:',
            showInput: true,
            inputValue: playerName || '',
            inputPlaceholder: 'Your Name',
            buttons: [
                { text: 'Save Score', class: 'confirm', resolves: true },
                { text: 'Cancel', class: 'cancel', resolves: false }
            ]
        });

        if (result.confirmed && result.value) {
            playerName = result.value;
            localStorage.setItem('playerName', playerName);
            this._sendScoreToApi(playerName); // Call the private method with the name
        } else if (result.confirmed && !result.value) {
            this.showNotification("Name cannot be empty for leaderboard.", true);
             // Optionally re-prompt or just cancel
             // this.getPlayerNameAndSubmit(); // Re-prompt
        } else {
            this.showNotification("Score submission canceled.", false);
        }
    }

    // Private method containing the actual API call logic
    async _sendScoreToApi(playerName) {
         const payload = {
            player_name: playerName, // Already trimmed/validated
            score: this.score,
            date: new Date().toDateString(),
            word_count: this.foundWordsData.size,
            words: [...this.foundWordsData.keys()]
        };

        try {
            const res = await fetch('/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                this.showNotification('Score submitted successfully!', false);
                this.fetchLeaderboard();
            } else {
                 const errorData = await res.text();
                 throw new Error(`Score submission failed: ${res.status} - ${errorData}`);
            }
        } catch (error) {
            console.error("Error submitting score:", error);
            this.showNotification(`Error submitting score: ${error.message}`, true);
        }
    }

    // Method to fetch leaderboard scores from the backend API
    async fetchLeaderboard() {
        if (!this.leaderboardList) return; // Don't fetch if element doesn't exist

        try {
            const res = await fetch('/api/scores'); // Assuming API endpoint for scores
            if (res.ok) {
                const scores = await res.json();
                // Sort scores descending by score, then maybe alphabetically or by date
                scores.sort((a, b) => b.score - a.score || new Date(b.date) - new Date(a.date));
                this.displayGlobalLeaderboard(scores);
            } else {
                 throw new Error(`Failed to fetch leaderboard: ${res.status}`);
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            this.leaderboardList.innerHTML = '<li>Error loading leaderboard.</li>'; // Show error in list
        }
    }

    // Method to display the fetched leaderboard scores in the DOM
    displayGlobalLeaderboard(scores) {
        if (!this.leaderboardList) return;
        this.leaderboardList.innerHTML = ''; // Clear previous entries

        // Add Header
        const header = document.createElement('li');
        header.className = 'leaderboard-header';
        header.innerHTML = `<span><strong>Rank</strong></span><span><strong>Player</strong></span><span><strong>Score</strong></span><span><strong>Date</strong></span>`;
        this.leaderboardList.appendChild(header);

        if (!scores || scores.length === 0) {
            const noScores = document.createElement('li');
            noScores.textContent = 'No scores yet.';
            noScores.style.textAlign = 'center';
            this.leaderboardList.appendChild(noScores);
            return;
        }

        const currentPlayerName = localStorage.getItem('playerName');

        // Add Score Entries
        scores.forEach((entry, index) => {
            const li = document.createElement('li');
            li.className = 'leaderboard-entry';
            if (currentPlayerName && entry.player_name === currentPlayerName) {
                li.classList.add('current-player'); // Highlight current player
            }
            // Format date for better readability
            const dateStr = entry.date ? new Date(entry.date).toLocaleDateString() : 'N/A';
            li.innerHTML = `
                <span>${index + 1}.</span>
                <span>${entry.player_name || 'Anonymous'}</span>
                <span>${entry.score || 0}</span>
                <span>${dateStr}</span>`;
            this.leaderboardList.appendChild(li);
        });
    }

    // --- Modal Helper Functions ---
    showModal(config) {
        return new Promise((resolve) => {
            this.modalTitle.textContent = config.title || 'Confirm Action';
            this.modalMessage.textContent = config.message || '';
            this.modalButtons.innerHTML = ''; // Clear previous buttons

            // Handle input field
            if (config.showInput) {
                this.modalInputContainer.style.display = 'block';
                this.modalInput.value = config.inputValue || '';
                this.modalInput.placeholder = config.inputPlaceholder || 'Enter value';
            } else {
                this.modalInputContainer.style.display = 'none';
            }

            // Add buttons
            config.buttons.forEach(btnConfig => {
                const button = document.createElement('button');
                button.textContent = btnConfig.text;
                button.className = btnConfig.class || 'secondary'; // Default class
                button.onclick = () => {
                    const inputValue = config.showInput ? this.modalInput.value.trim() : null;
                    this.hideModal();
                    resolve({ confirmed: btnConfig.resolves, value: inputValue });
                };
                this.modalButtons.appendChild(button);
            });

            this.modalOverlay.style.display = 'flex';
        });
    }

    hideModal() {
        this.modalOverlay.style.display = 'none';
    }
}

// Remove the DOMContentLoaded event listener at the bottom of the file
// and replace it with:
window.game = new WordOfTheDay();
