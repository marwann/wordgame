PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_name TEXT NOT NULL,
      score INTEGER NOT NULL,
      date TEXT NOT NULL,
      word_count INTEGER NOT NULL,
      words TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
INSERT INTO scores VALUES(1,'John',3,'Thu May 01 2025',1,'["TEN"]','2025-05-01 12:48:53');
INSERT INTO scores VALUES(2,'Paul',8,'Thu May 01 2025',2,'["TEN","TENSE"]','2025-05-01 12:49:00');
INSERT INTO scores VALUES(3,'Jane',5,'Thu May 01 2025',1,'["TENSE"]','2025-05-01 12:51:39');
INSERT INTO scores VALUES(4,'Dana',3,'Thu May 01 2025',1,'["TEN"]','2025-05-01 12:52:27');
INSERT INTO scores VALUES(5,'Roldan',3,'Thu May 01 2025',1,'["TEN"]','2025-05-01 12:54:12');
INSERT INTO scores VALUES(6,'Apple',3,'Thu May 01 2025',1,'["TEN"]','2025-05-01 12:55:36');
INSERT INTO scores VALUES(7,'Pom',3,'Thu May 01 2025',1,'["TEN"]','2025-05-01 13:02:59');
INSERT INTO scores VALUES(8,'Alice',5,'Thu May 01 2025',1,'["TENSE"]','2025-05-01 13:06:35');
INSERT INTO scores VALUES(9,'Donald',77,'Thu May 01 2025',9,'["TEN","LET","TENGU","DUE","DUEL","KOL","AT","AL","EAT"]','2025-05-01 14:10:29');
INSERT INTO scores VALUES(10,'Marwann',77,'Thu May 01 2025',9,'["TEN","LET","TENGU","DUE","DUEL","KOL","AT","AL","EAT"]','2025-05-01 14:10:32');
INSERT INTO scores VALUES(11,'Mark',84,'Thu May 01 2025',10,'["TEN","TENGU","GOD","AT","AL","LE","ALE","ATE","KATE","KA"]','2025-05-01 14:16:25');
INSERT INTO scores VALUES(12,'Amelia',6,'Thu May 01 2025',1,'["LET"]','2025-05-01 14:21:53');
INSERT INTO scores VALUES(13,'Jane',6,'Thu May 01 2025',1,'["LET"]','2025-05-01 14:22:46');
CREATE TABLE daily_letters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      letters TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
INSERT INTO daily_letters VALUES(10,'Wed Apr 30 2025','["A","A","A","A","O","P","U","I","K","M","R","T","A","W","A"]','2025-04-30 16:14:00');
INSERT INTO daily_letters VALUES(49,'Thu May 01 2025','["K","E","E","A","L","T","U","L","U","D","G","O","A","E","N"]','2025-05-01 14:22:10');
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('daily_letters',49);
INSERT INTO sqlite_sequence VALUES('scores',13);
COMMIT;
