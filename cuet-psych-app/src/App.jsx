import React, { useState, useEffect } from 'react';
import { db } from './firebase'; 
import { collection, query, orderBy, onSnapshot, doc, setDoc } from "firebase/firestore";
import { questionBank } from './syllabusData';
import './App.css';

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  const [userId] = useState("user_" + Math.random().toString(36).substr(2, 9));
  const [userName, setUserName] = useState(localStorage.getItem('cuet_user') || "");

  useEffect(() => {
    const shuffled = [...questionBank].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);

    const q = query(collection(db, "leaderboard"), orderBy("score", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeaderboard(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleStart = (e) => {
    e.preventDefault();
    if (userName.trim()) {
      localStorage.setItem('cuet_user', userName);
      setIsStarted(true);
    }
  };

  const handleAnswer = async (opt) => {
    if (selectedOpt !== null) return;
    const correct = opt === questions[currentIdx].answer;
    setSelectedOpt(opt);
    setIsCorrect(correct);
    const newScore = correct ? score + 4 : score - 1;
    setScore(newScore);

    try {
      await setDoc(doc(db, "leaderboard", userId), {
        name: userName,
        score: newScore,
        lastUpdated: new Date()
      });
    } catch (e) { console.error(e); }

    setTimeout(() => {
      if (currentIdx + 1 < questions.length) {
        setCurrentIdx(prev => prev + 1);
        setSelectedOpt(null);
        setIsCorrect(null);
      } else {
        setIsFinished(true);
      }
    }, 600);
  };

  if (!isStarted) {
    return (
      <div className="game-wrapper center-content">
        <div className="welcome-card">
          <h2>CUET PG Psychology</h2>
          <p>Set your name for the live ranking</p>
          <form onSubmit={handleStart} className="name-form">
            <input 
              type="text" 
              placeholder="Your Name" 
              value={userName} 
              onChange={(e) => setUserName(e.target.value)}
              required 
              autoFocus
            />
            <button type="submit" className="start-btn">Enter Quiz</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="game-wrapper">
      <div className="main-container">
        <div className="top-score-bar">🎯 Live Marks: {score}</div>

        <main className="quiz-card">
          {!isFinished ? (
            <div className="quiz-inner">
              <h2 className="question-text">{questions[currentIdx]?.question}</h2>
              <div className="options-stack">
                {questions[currentIdx]?.options.map((opt, i) => (
                  <button 
                    key={i} 
                    className={`option-btn ${selectedOpt === opt ? (isCorrect ? 'correct' : 'wrong') : ''}`}
                    onClick={() => handleAnswer(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="results-view">
              <h2>Revision Over!</h2>
              <p>Final Mark: {score}</p>
              <button className="restart-btn" onClick={() => window.location.reload()}>Change Name / Reset</button>
            </div>
          )}
        </main>

        <section className="compact-leaderboard">
          <h3>🏆 Live Ranking</h3>
          <div className="scroll-list">
            {leaderboard.map((player, i) => (
              <div key={player.id} className={`player-item ${player.id === userId ? 'me' : ''}`}>
                <span>{i + 1}. {player.name}</span>
                <strong>{player.score}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;