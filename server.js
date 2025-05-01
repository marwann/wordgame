const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = 3001;

// Middleware
app.use(express.static('.'));
app.use(express.json());

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

// Initialize SQLite database
const db = new sqlite3.Database(path.join(dbDir, 'wordgame.db'));

// Create scores table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_name TEXT NOT NULL,
      score INTEGER NOT NULL,
      date TEXT NOT NULL,
      word_count INTEGER NOT NULL,
      words TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS daily_letters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      letters TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  console.log('Database initialized');
});

// API Endpoints

// Get top scores
app.get('/api/scores', (req, res) => {
  const limit = req.query.limit || 10;
  db.all(`SELECT * FROM scores ORDER BY score DESC LIMIT ?`, [limit], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get scores for a specific date
app.get('/api/scores/date/:date', (req, res) => {
  const { date } = req.params;
  db.all(`SELECT * FROM scores WHERE date = ? ORDER BY score DESC`, [date], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Submit a new score
app.post('/api/scores', (req, res) => {
  const { player_name, score, date, word_count, words } = req.body;
  
  if (!player_name || !score || !date || !word_count) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const wordsJson = words ? JSON.stringify(words) : null;
  
  db.run(
    `INSERT INTO scores (player_name, score, date, word_count, words) VALUES (?, ?, ?, ?, ?)`,
    [player_name, score, date, word_count, wordsJson],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.status(201).json({
        id: this.lastID,
        player_name,
        score,
        date,
        word_count,
        words
      });
    }
  );
});

// Store daily letters
app.post('/api/daily-letters', (req, res) => {
  const { date, letters } = req.body;
  
  if (!date || !letters) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  db.run(
    `INSERT OR REPLACE INTO daily_letters (date, letters) VALUES (?, ?)`,
    [date, JSON.stringify(letters)],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.status(201).json({
        id: this.lastID,
        date,
        letters
      });
    }
  );
});

// Get daily letters for a specific date
app.get('/api/daily-letters/:date', (req, res) => {
  const { date } = req.params;
  db.get(`SELECT * FROM daily_letters WHERE date = ?`, [date], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'No letters found for this date' });
    }
    
    try {
      const letters = JSON.parse(row.letters);
      res.json({ date, letters });
    } catch (e) {
      res.status(500).json({ error: 'Error parsing letters data' });
    }
  });
});

// Word validation endpoint (keep this from your existing server)
app.get('/api/validate', (req, res) => {
  const word = req.query.word;
  if (!word) {
    return res.status(400).json({ error: 'Word parameter is required' });
  }
  
  // Check if the word is in the dictionary
  const wordPath = path.join(__dirname, 'words_alpha.txt');
  const wordToCheck = word.toLowerCase().trim();
  
  try {
    // Read the file and normalize line endings
    const fileContent = fs.readFileSync(wordPath, 'utf8')
      .replace(/\r\n/g, '\n')  // Convert Windows line endings
      .replace(/\r/g, '\n');   // Convert old Mac line endings
    
    // Split into array of words and check for exact match
    const words = fileContent.split('\n').map(w => w.trim());
    const isValid = words.includes(wordToCheck);
    
    res.json({ valid: isValid });
  } catch (error) {
    console.error('Error validating word:', error);
    res.status(500).json({ error: 'Error validating word' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 