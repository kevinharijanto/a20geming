const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS Questions (
      question_id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_text TEXT NOT NULL,
      question_image BLOB,
      choice_a TEXT NOT NULL,
      choice_b TEXT NOT NULL,
      choice_c TEXT NOT NULL,
      choice_d TEXT NOT NULL,
      choice_e TEXT NOT NULL,
      correct_choice TEXT NOT NULL CHECK (correct_choice IN ('A', 'B', 'C', 'D', 'E')),
      difficulty INTEGER,
      category TEXT,
      date_created DATE NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Solutions (
      solution_id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER,
      solution_text TEXT NOT NULL,
      solution_image BLOB,
      explanation TEXT,
      FOREIGN KEY (question_id) REFERENCES Questions(question_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Tags (
      tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag_name TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS QuestionTags (
      question_id INTEGER,
      tag_id INTEGER,
      FOREIGN KEY (question_id) REFERENCES Questions(question_id),
      FOREIGN KEY (tag_id) REFERENCES Tags(tag_id),
      PRIMARY KEY (question_id, tag_id)
    )
  `);
});

module.exports = db;
