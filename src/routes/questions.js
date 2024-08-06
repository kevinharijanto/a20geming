const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:'); // In-memory database for simplicity
const questionsRouter = express.Router()

// Initialize the database schema
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS Questions (
      question_id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_text TEXT,
      question_image TEXT,
      choice_a TEXT,
      choice_b TEXT,
      choice_c TEXT,
      choice_d TEXT,
      choice_e TEXT,
      correct_choice TEXT,
      difficulty TEXT,
      category TEXT,
      date_created TEXT
    )`);
  
    db.run(`CREATE TABLE IF NOT EXISTS Solutions (
      solution_id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER,
      solution_text TEXT,
      solution_image TEXT,
      explanation TEXT,
      FOREIGN KEY (question_id) REFERENCES Questions (question_id)
    )`);
  
    db.run(`CREATE TABLE IF NOT EXISTS Tags (
      tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag_name TEXT
    )`);
  
    db.run(`CREATE TABLE IF NOT EXISTS QuestionTags (
      question_id INTEGER,
      tag_id INTEGER,
      FOREIGN KEY (question_id) REFERENCES Questions (question_id),
      FOREIGN KEY (tag_id) REFERENCES Tags (tag_id)
    )`);
  
    // Function to insert dummy data
    function seedData() {
      const questions = [
        {
          question_text: "What is the integral of x^2?",
          choice_a: "x^3/3 + C",
          choice_b: "x^2/2 + C",
          choice_c: "x^3 + C",
          choice_d: "2x + C",
          choice_e: "x^2 + C",
          correct_choice: "A",
          difficulty: "Easy",
          category: "Calculus",
          date_created: "2024-08-06"
        },
        {
          question_text: "What is the derivative of sin(x)?",
          choice_a: "cos(x)",
          choice_b: "sin(x)",
          choice_c: "-cos(x)",
          choice_d: "-sin(x)",
          choice_e: "1",
          correct_choice: "A",
          difficulty: "Medium",
          category: "Calculus",
          date_created: "2024-08-06"
        }
      ];
  
      questions.forEach(question => {
        db.run(`INSERT INTO Questions (question_text, question_image, choice_a, choice_b, choice_c, choice_d, choice_e, correct_choice, difficulty, category, date_created)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
          [question.question_text, question.question_image, question.choice_a, question.choice_b, question.choice_c, question.choice_d, question.choice_e, question.correct_choice, question.difficulty, question.category, question.date_created]);
      });
    }
  
    seedData();
  });

// Route to get all questions
questionsRouter.get('/questions', (req, res) => {
    db.all(`SELECT * FROM Questions`, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });

questionsRouter.get('/questions/:id', async (req, res) => {
    let questionId = req.params.id
    db.all(`SELECT * FROM Questions WHERE question_id = ${questionId}`, [], (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});
  
// Route to post a new question along with solutions and tags
questionsRouter.post('/questions', (req, res) => {
    const { question_text, question_image, choice_a, choice_b, choice_c, choice_d, choice_e, correct_choice, difficulty, category, date_created, solutions, tags } = req.body;
  
    db.run(`INSERT INTO Questions (question_text, question_image, choice_a, choice_b, choice_c, choice_d, choice_e, correct_choice, difficulty, category, date_created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [question_text, question_image, choice_a, choice_b, choice_c, choice_d, choice_e, correct_choice, difficulty, category, date_created], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        const question_id = this.lastID;
  
        solutions.forEach(solution => {
          db.run(`INSERT INTO Solutions (question_id, solution_text, solution_image, explanation) VALUES (?, ?, ?, ?)`,
            [question_id, solution.solution_text, solution.solution_image, solution.explanation], (err) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
            });
        });
  
        tags.forEach(tag_name => {
          db.get(`SELECT tag_id FROM Tags WHERE tag_name = ?`, [tag_name], (err, row) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
  
            const tag_id = row ? row.tag_id : null;
            if (tag_id) {
              db.run(`INSERT INTO QuestionTags (question_id, tag_id) VALUES (?, ?)`, [question_id, tag_id], (err) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
              });
            } else {
              db.run(`INSERT INTO Tags (tag_name) VALUES (?)`, [tag_name], function(err) {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
                const new_tag_id = this.lastID;
                db.run(`INSERT INTO QuestionTags (question_id, tag_id) VALUES (?, ?)`, [question_id, new_tag_id], (err) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }
                });
              });
            }
          });
        });
  
        res.status(201).json({ question_id });
      });
  });


module.exports = questionsRouter 