// src/components/Quiz.js
import React, { useEffect, useState } from 'react';
import { fetchQuestions } from '../api';

const Quiz = () => {
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const data = await fetchQuestions();
        setQuestions(data);
      } catch (error) {
        setError(error.message);
      }
    };

    loadQuestions();
  }, []);

  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Quiz Questions</h1>
      {questions.length === 0 ? (
        <p>Loading...</p>
      ) : (
        questions.map((question) => (
          <div key={question.question_id} className="question">
            <h2>{question.question_text}</h2>
            <div>
              <button>{question.choice_a}</button>
              <button>{question.choice_b}</button>
              <button>{question.choice_c}</button>
              <button>{question.choice_d}</button>
              {question.choice_e && <button>{question.choice_e}</button>}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Quiz;
