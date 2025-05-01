# Word of the Day - Daily Word Game

This is a web-based daily word game inspired by Scrabble, where players use a fixed set of 15 letters each day to form words on a 5x5 grid.

## Context

This is an attempt at vibe coding a simple game using Cursor and other AI tools, to understand the underlying mechanics of the AI and not turn crazy when it does sh!t. And it did.

Game is using an English dictionary (words_alpha.txt) but you can change the language easily using any other txt.

## Features

*   **Daily Challenge:** Everyone gets the same 15 letters and grid layout each day.
*   **5x5 Grid:** A compact grid for focused gameplay.
*   **Scrabble Scoring:** Standard letter values and bonus cells (Double/Triple Letter, Double/Triple Word).
*   **Word Validation:** Uses a dictionary (`words_alpha.txt`) to check if submitted words are valid.
*   **Persistent State:** Game progress (score, placed letters, found words) for the current day is saved in `localStorage`.
*   **Player Rack:** Displays available letters.
*   **Interactive Placement:** Click or drag letters from the rack to the board.
*   **Adjacent Placement Rules:** Letters must be placed adjacent to existing ones (after the first word).
*   **First Word Rule:** The first word must cover the center cell (marked with a star).
*   **Leaderboard:** Saves scores to a backend (via `/api/scores` and `/api/daily-letters` endpoints) and displays top scores.
*   **Custom Modals:** User-friendly prompts for ending the game and submitting scores.

## How to Play

1.  The game loads with 15 letters for the day in your rack.
2.  Place letters on the 5x5 grid to form words horizontally or vertically.
3.  The first word must use the center cell (marked with ★).
4.  Subsequent letters must be placed adjacent to already placed letters.
5.  Click "Submit Word" to validate your placement and score points for newly formed valid words.
6.  Bonus squares multiply letter or word scores for the turn they are used.
7.  Use "Cancel Word" to return letters placed *this turn* back to your rack.
8.  Use "End Game" when you can no longer place words or wish to finish.
9.  Submit your final score to the leaderboard!

## Setup and Running Locally

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd wordgame
    ```
2.  **Backend Setup:** This frontend requires a backend server to handle API requests for daily letters (`/api/daily-letters`) and score submission/retrieval (`/api/scores`). Ensure the backend server is running (refer to its specific setup instructions if separate).
3. **Database Setup:**
```
sqlite3 db/wordgame.db < db/schema.sql
sqlite3 db/wordgame.db < db/seed_data.sql
```
3.  **Serve Frontend:** You need a simple HTTP server to serve the `index.html`, `script.js`, `styles.css`, and `words_alpha.txt` files. Python's built-in server is an easy option:
    ```bash
    python3 -m http.server
    # Or for Python 2:
    # python -m SimpleHTTPServer
    ```
    Alternatively, use Node.js packages like `http-server`:
    ```bash
    npm install -g http-server
    http-server .
    ```
4.  **Access the Game:** Open your web browser and navigate to the address provided by your HTTP server (e.g., `http://localhost:8000` or `http://localhost:8080`).

## Technology

*   HTML5
*   CSS3
*   Vanilla JavaScript (ES6+)
*   (Assumed) Node.js/Express backend for API endpoints.