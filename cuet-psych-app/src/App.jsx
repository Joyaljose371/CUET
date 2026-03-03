import React, { useState, useEffect } from 'react';
import { db } from './firebase'; 
import { collection, query, orderBy, onSnapshot, doc, setDoc, getDoc } from "firebase/firestore";
import { questionBank } from './syllabusData';
import './App.css';

function App() {
  const [level, setLevel] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  const [isAdmin] = useState(window.location.search.includes('admin=true'));
  const [userId] = useState(localStorage.getItem('cuet_userId') || "user_" + Math.random().toString(36).substr(2, 9));
  const [userName, setUserName] = useState(localStorage.getItem('cuet_user') || "");

  const QUESTIONS_PER_LEVEL = 5;

  useEffect(() => {
    localStorage.setItem('cuet_userId', userId);
    const q = query(collection(db, "leaderboard"), orderBy("score", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeaderboard(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    setQuestions([...questionBank]);
    return () => unsubscribe();
  }, [userId]);

  const handleStart = async (e, isNewGame = false) => {
    e.preventDefault();
    if (!userName.trim()) return;
    localStorage.setItem('cuet_user', userName);

    if (isNewGame) {
      setCurrentIdx(0); setLevel(1); setScore(0); setIsFinished(false);
    } else {
      const userDoc = await getDoc(doc(db, "leaderboard", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const savedIdx = data.currentIdx || 0;
        if (savedIdx >= questionBank.length) {
          setIsFinished(true);
        } else {
          setCurrentIdx(savedIdx);
          setLevel(data.level || 1);
          setScore(data.score || 0);
        }
      }
    }
    setIsStarted(true);
  };

  const handleAnswer = async (opt) => {
    if (selectedOpt !== null || showLevelUp) return;
    const correct = opt === questions[currentIdx].answer;
    setSelectedOpt(opt);
    setIsCorrect(correct);
    const newScore = correct ? score + 4 : score - 1;
    setScore(newScore);

    try {
      await setDoc(doc(db, "leaderboard", userId), { 
        name: userName, score: newScore,
        currentIdx: currentIdx + 1,
        level: Math.floor((currentIdx + 1) / QUESTIONS_PER_LEVEL) + 1
      }, { merge: true });
    } catch (e) { console.error(e); }

    setTimeout(() => {
      const nextIndex = currentIdx + 1;
      if (nextIndex >= questions.length) {
        setIsFinished(true);
        setSelectedOpt(null);
        return;
      }
      const isEndOfLevel = nextIndex % QUESTIONS_PER_LEVEL === 0;
      setSelectedOpt(null);
      setIsCorrect(null);
      if (isEndOfLevel) {
        setShowLevelUp(true);
        setTimeout(() => {
          setShowLevelUp(false);
          setLevel(prev => prev + 1);
          setCurrentIdx(nextIndex);
        }, 1500);
      } else {
        setCurrentIdx(nextIndex);
      }
    }, 1200);
  };

  return (
    <div className="game-wrapper">
      {isAdmin ? (
        <div className="admin-container">
          <h2>Admin Leaderboard</h2>
          <table className="admin-table">
            <thead>
              <tr><th>Rank</th><th>Name</th><th>Score</th><th>Stage</th></tr>
            </thead>
            <tbody>
              {leaderboard.map((p, i) => (
                <tr key={p.id} className={p.id === userId ? 'admin-me' : ''}>
                  <td>{i+1}</td><td>{p.name} {p.id === userId && "(You)"}</td><td>{p.score}</td><td>{p.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="restart-link" onClick={() => window.location.search = ''}>Back to Quiz</button>
        </div>
      ) : (
        <>
          {!isStarted ? (
            <div className="welcome-card animate-in">
              <h2>CUET Psychology</h2>
              <form className="name-form">
                <input type="text" placeholder="Enter Name" value={userName} onChange={(e) => setUserName(e.target.value)} required />
                <button onClick={(e) => handleStart(e, false)} className="start-btn">Resume Progress</button>
                <button onClick={(e) => handleStart(e, true)} className="restart-link">Start Fresh Session</button>
              </form>
            </div>
          ) : isFinished ? (
            <div className="welcome-card animate-in">
              <h2 style={{ color: '#6366f1' }}>Quiz Complete! 🎉</h2>
              <div className="score-box">
                <h3>{score}</h3>
                <p>FINAL SCORE</p>
              </div>
              <button className="start-btn" onClick={() => window.location.reload()}>Restart Session</button>
            </div>
          ) : (
            <div className="main-container">
              {showLevelUp && <div className="level-up-overlay"><h1>STAGE {level + 1} 🚀</h1></div>}
              <div className="top-score-bar">🏆 Stage {level} | Score: {score}</div>
              <main className="quiz-card">
                <div className="quiz-inner">
                  <h2 className="question-text">{questions[currentIdx]?.question}</h2>
                  <div className="options-stack">
                    {questions[currentIdx]?.options.map((opt, i) => (
                      <button 
                        key={i} 
                        className={`option-btn ${selectedOpt === opt ? (isCorrect ? 'correct' : 'wrong') : (selectedOpt && opt === questions[currentIdx].answer ? 'correct' : '')}`}
                        onClick={() => handleAnswer(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </main>
              <section className="compact-leaderboard">
                <h3 className="leaderboard-title">Live Leaderboard</h3>
                <div className="scroll-list">
                  {leaderboard.map((p, i) => (
                    <div key={p.id} className={`player-item ${p.id === userId ? 'me' : ''}`}>
                      <span>{i+1}. {p.name} {p.id === userId ? ' (You)' : ''}</span>
                      <strong>{p.score}</strong>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </>
      )}

      <div className="developer-watermark">
        <p><strong>Developed by: Joyal Jose</strong></p>
        <p>Frontend Developer | Psychology Aspirant</p>
        <p>Joyaljosepallivathukkal371@gmail.com</p>
      </div>
    </div>
  );
}

export default App;