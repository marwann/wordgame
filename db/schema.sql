CREATE TABLE scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_name TEXT NOT NULL,
      score INTEGER NOT NULL,
      date TEXT NOT NULL,
      word_count INTEGER NOT NULL,
      words TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE daily_letters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      letters TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
