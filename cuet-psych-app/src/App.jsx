import React, { useState, useEffect } from 'react';
import { questionBank } from './syllabusData'; 
import './App.css';

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(() => Number(localStorage.getItem('psych-score')) || 0);
  const [streak, setStreak] = useState(() => Number(localStorage.getItem('psych-streak')) || 0);
  const [bestStreak, setBestStreak] = useState(() => Number(localStorage.getItem('psych-best')) || 0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  useEffect(() => {
    // Shuffle all 200+ questions on load
    const shuffled = [...questionBank].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
  }, []);

  useEffect(() => {
    localStorage.setItem('psych-score', score);
    localStorage.setItem('psych-streak', streak);
    if (streak > bestStreak) {
      setBestStreak(streak);
      localStorage.setItem('psych-best', streak);
    }
  }, [score, streak, bestStreak]);

  const handleAnswer = (option) => {
    if (selectedAnswer) return; 

    const correct = option === questions[currentIdx].answer;
    setSelectedAnswer(option);
    setIsCorrect(correct);

    setTimeout(() => {
      if (correct) {
        setScore(s => s + 10);
        setStreak(st => st + 1);
      } else {
        setStreak(0);
      }

      if (currentIdx + 1 < questions.length) {
        setCurrentIdx(prev => prev + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        setIsFinished(true);
      }
    }, 800); 
  };

  if (questions.length === 0) return <div className="loading">Loading Syllabus...</div>;

  return (
    <div className="game-wrapper">
      <header className="stats-bar">
        <div className="stat-box">🏆 {score}</div>
        <div className={`stat-box ${streak > 2 ? 'flame-active' : ''}`}>
          {streak > 0 ? `🔥 ${streak}` : '❄️ 0'}
        </div>
        <div className="stat-box">⭐ Best: {bestStreak}</div>
      </header>

      {!isFinished ? (
        <main className="quiz-card">
          <div className="progress-container">
            <div className="progress-fill" style={{ width: `${(currentIdx / questions.length) * 100}%` }}></div>
          </div>

          <div className="meta-info">
            <span className="topic-tag">{questions[currentIdx].topic}</span>
            <span className="q-count">Question {currentIdx + 1} of {questions.length}</span>
          </div>

          <h2 className="question-text">{questions[currentIdx].question}</h2>

          <div className="options-grid">
            {questions[currentIdx].options.map((opt, i) => (
              <button 
                key={i} 
                className={`option-btn ${selectedAnswer === opt ? (isCorrect ? 'correct' : 'wrong') : ''}`}
                onClick={() => handleAnswer(opt)}
                disabled={selectedAnswer !== null}
              >
                {opt}
              </button>
            ))}
          </div>
        </main>
      ) : (
        <div className="quiz-card end-screen">
          <h2 className="congrats">Syllabus Mastered!</h2>
          <div className="final-stats">
            <p>Final Score: <strong>{score}</strong></p>
            <p>Best Streak: <strong>{bestStreak}</strong></p>
          </div>
          <button className="restart-btn" onClick={() => window.location.reload()}>
            New Shuffle Session
          </button>
        </div>
      )}
    </div>
  );
}

export default App;