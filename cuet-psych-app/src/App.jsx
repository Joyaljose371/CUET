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

  const [userId] = useState(localStorage.getItem('cuet_userId') || "user_" + Math.random().toString(36).substr(2, 9));
  const [userName, setUserName] = useState(localStorage.getItem('cuet_user') || "");

  const QUESTIONS_PER_LEVEL = 5;

  useEffect(() => {
    localStorage.setItem('cuet_userId', userId);
    
    // Real-time Leaderboard Sync
    const q = query(collection(db, "leaderboard"), orderBy("score", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeaderboard(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    // Load Question Bank
    setQuestions([...questionBank]);

    return () => unsubscribe();
  }, [userId]);

  const handleStart = async (e, isNewGame = false) => {
    e.preventDefault();
    if (!userName.trim()) return;

    localStorage.setItem('cuet_user', userName);

    if (isNewGame) {
      
      setCurrentIdx(0);
      setLevel(1);
      setScore(0);
      setIsFinished(false);
    } else {

      const userDoc = await getDoc(doc(db, "leaderboard", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const savedIdx = data.currentIdx || 0;
        
        // CHECK: If saved index is at or beyond the total questions, show finished screen
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

    // Save Live Progress to Firebase
    try {
      await setDoc(doc(db, "leaderboard", userId), { 
        name: userName, 
        score: newScore,
        currentIdx: currentIdx + 1,
        level: Math.floor((currentIdx + 1) / QUESTIONS_PER_LEVEL) + 1
      }, { merge: true });
    } catch (e) {
      console.error("Sync Error:", e);
    }

    // Transition Logic
    setTimeout(() => {
      const nextIndex = currentIdx + 1;
      
      // Check if finished
      if (nextIndex >= questions.length) {
        setSelectedOpt(null);
        setIsCorrect(null);
        setIsFinished(true);
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

  // Welcome Screen
  if (!isStarted) {
    return (
      <div className="game-wrapper">
        <div className="welcome-card">
          <h2>CUET Psychology</h2>
          <form className="name-form">
            <input type="text" placeholder="Enter Name" value={userName} onChange={(e) => setUserName(e.target.value)} required />
            <button onClick={(e) => handleStart(e, false)} className="start-btn">Resume Progress</button>
            <button onClick={(e) => handleStart(e, true)} className="restart-link">Start Fresh Session</button>
          </form>
        </div>
        <div className="developer-watermark">
          <p><strong>Developed by: Joyal Jose</strong></p>
          <p>Frontend Developer | Psychology Aspirant</p>
          <p>Joyaljosepallivathukkal371@gmail.com</p>
        </div>
      </div>
    );
  }

  // Final Finished Screen
  if (isFinished) {
    return (
      <div className="game-wrapper">
        <div className="welcome-card">
          <h2 style={{ color: '#6366f1' }}>Quiz Complete! 🎉</h2>
          <p>You have mastered the question bank.</p>
          <div style={{ margin: '20px 0', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
            <h3 style={{ margin: '0', fontSize: '1.8rem' }}>{score}</h3>
            <p style={{ margin: '5px 0 0', fontSize: '0.75rem', opacity: 0.6, letterSpacing: '1px' }}>FINAL SCORE</p>
          </div>
          <p>Stages Mastered: <strong>{level}</strong></p>
          <button className="start-btn" style={{ width: '100%', marginTop: '10px' }} onClick={() => window.location.reload()}>Restart Session</button>
        </div>
        <div className="developer-watermark">
          <p><strong>Developed by: Joyal Jose</strong></p>
          <p>Frontend Developer | Psychology Aspirant</p>
          <p>Joyaljosepallivathukkal371@gmail.com</p>
        </div>
      </div>
    );
  }

  // Active Quiz Screen
  return (
    <div className="game-wrapper">
      {showLevelUp && <div className="level-up-overlay"><h1>STAGE {level + 1} 🚀</h1></div>}
      
      <div className="main-container">
        <div className="top-score-bar">🏆 Stage {level} | Score: {score}</div>

        <main className="quiz-card">
          <div className="quiz-inner">
            <h2 className="question-text">{questions[currentIdx]?.question}</h2>
            <div className="options-stack">
              {questions[currentIdx]?.options.map((opt, i) => {
                const isThisCorrect = opt === questions[currentIdx].answer;
                const isThisSelected = selectedOpt === opt;
                let btnClass = "option-btn";
                if (selectedOpt) {
                  if (isThisCorrect) btnClass += " correct";
                  if (isThisSelected && !isCorrect) btnClass += " wrong";
                }
                return (
                  <button key={i} className={btnClass} onClick={() => handleAnswer(opt)}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        <section className="compact-leaderboard">
          <h3 className="leaderboard-title">Live Leaderboard</h3>
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

      <div className="developer-watermark">
        <p><strong>Developed by: Joyal Jose</strong></p>
        <p>Frontend Developer | Psychology Aspirant</p>
        <p>Joyaljosepallivathukkal371@gmail.com</p>
      </div>
    </div>
  );
}

export default App;