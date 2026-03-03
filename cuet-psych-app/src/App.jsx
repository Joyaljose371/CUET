import React, { useState, useEffect } from 'react';
import { db } from './firebase'; 
import { collection, addDoc } from "firebase/firestore";
import { questionBank } from './syllabusData';
import './App.css';

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  // Feedback States (The Red/Green colors)
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  useEffect(() => {
    const shuffled = [...questionBank].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
  }, []);

  const handleAnswer = async (opt) => {
    if (selectedOpt !== null) return; // Prevent double clicking

    const correct = opt === questions[currentIdx].answer;
    setSelectedOpt(opt);
    setIsCorrect(correct);

    // Scoring Logic
    const newScore = correct ? score + 4 : score - 1;
    setScore(newScore);
    setStreak(correct ? streak + 1 : 0);

    setTimeout(async () => {
      if (currentIdx + 1 < questions.length) {
        setCurrentIdx(prev => prev + 1);
        setSelectedOpt(null);
        setIsCorrect(null);
      } else {
        setIsFinished(true);
        // SEND TO FIREBASE
        try {
          await addDoc(collection(db, "leaderboard"), {
            name: localStorage.getItem('cuet_user') || "New Learner",
            score: newScore,
            timestamp: new Date()
          });
          console.log("Success! Check Firebase now.");
        } catch (err) {
          console.error("Firebase Error:", err);
        }
      }
    }, 800);
  };

  if (questions.length === 0) return <div className="game-wrapper">Loading...</div>;

  return (
    <div className="game-wrapper">
      <header className="stats-bar">
        <div className="stat-box">🎯 Marks: {score}</div>
        <div className={`stat-box ${streak > 2 ? 'flame-active' : ''}`}>🔥 {streak}</div>
      </header>

      <main className="quiz-card">
        {!isFinished ? (
          <>
            <div className="progress-container">
              <div className="progress-fill" style={{ width: `${(currentIdx / questions.length) * 100}%` }}></div>
            </div>
            <h2 className="question-text">{questions[currentIdx].question}</h2>
            <div className="options-grid">
              {questions[currentIdx].options.map((opt, i) => (
                <button 
                  key={i} 
                  className={`option-btn ${selectedOpt === opt ? (isCorrect ? 'correct' : 'wrong') : ''}`}
                  onClick={() => handleAnswer(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div style={{textAlign: 'center'}}>
            <h2>Revision Done!</h2>
            <p>Final Score: {score}</p>
            <button className="restart-btn" onClick={() => window.location.reload()}>Restart</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;