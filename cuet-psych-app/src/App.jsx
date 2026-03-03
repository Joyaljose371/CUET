import React, { useState, useEffect } from 'react';
import { db } from './firebase'; // Ensure your firebaseConfig is in firebase.js
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { questionBank } from './syllabusData';
import './App.css';

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userName, setUserName] = useState(localStorage.getItem('cuet_user') || "");

  // 1. Initialize Questions & Fetch Leaderboard
  useEffect(() => {
    const shuffled = [...questionBank].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);

    // Real-time leaderboard listener
    const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeaderboard(snapshot.docs.map(doc => doc.data()));
    });
    return () => unsubscribe();
  }, []);

  // 2. Handle the CUET Scoring Logic
  const handleAnswer = (selected) => {
    const isCorrect = selected === questions[currentIdx].answer;
    
    if (isCorrect) {
      setScore(prev => prev + 4); // CUET Correct: +4
      setStreak(st => st + 1);
    } else {
      setScore(prev => prev - 1); // CUET Wrong: -1
      setStreak(0);
    }

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setIsFinished(true);
      submitScore(score + (isCorrect ? 4 : -1));
    }
  };

  const submitScore = async (finalScore) => {
    if (!userName) return;
    try {
      await addDoc(collection(db, "leaderboard"), {
        name: userName,
        score: finalScore,
        date: new Date()
      });
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const name = e.target.nameInput.value;
    if (name) {
      setUserName(name);
      localStorage.setItem('cuet_user', name);
    }
  };

  // --- UI SCREENS ---

  if (!userName) {
    return (
      <div className="game-wrapper">
        <div className="quiz-card center-text">
          <h2>Enter Your Name to Compete</h2>
          <form onSubmit={handleLogin}>
            <input name="nameInput" type="text" className="option-btn" placeholder="Ex: Rahul" required />
            <button type="submit" className="restart-btn">Start Revision</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="game-wrapper">
      <div className="layout-container">
        {/* Main Quiz Section */}
        <section className="main-content">
          <header className="stats-bar">
            <div className="stat-box">🎯 Marks: {score}</div>
            <div className={`stat-box ${streak > 2 ? 'flame-active' : ''}`}>🔥 Streak: {streak}</div>
          </header>

          {!isFinished ? (
            <div className="quiz-card">
              <div className="progress-container">
                <div className="progress-fill" style={{ width: `${(currentIdx / questions.length) * 100}%` }}></div>
              </div>
              <p className="topic-tag">{questions[currentIdx]?.topic}</p>
              <h2 className="question-text">{questions[currentIdx]?.question}</h2>
              <div className="options-grid">
                {questions[currentIdx]?.options.map((opt, i) => (
                  <button key={i} className="option-btn" onClick={() => handleAnswer(opt)}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="quiz-card center-text">
              <h2>Revision Complete!</h2>
              <p>Your Final Score: {score}</p>
              <button className="restart-btn" onClick={() => window.location.reload()}>Try Again</button>
            </div>
          )}
        </section>

        {/* Global Leaderboard Section */}
        <aside className="leaderboard-panel">
          <h3>🏆 Global Rankings</h3>
          <div className="rank-list">
            {leaderboard.map((entry, idx) => (
              <div key={idx} className={`rank-item ${entry.name === userName ? 'me' : ''}`}>
                <span>{idx + 1}. {entry.name}</span>
                <strong>{entry.score}</strong>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;