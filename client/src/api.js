// src/api.js
export const apiUrl = process.env.REACT_APP_API_URL;

export const fetchQuestions = async () => {
  const response = await fetch(`${apiUrl}/questions`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};
