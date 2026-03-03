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

  // Persistent User ID to track progress
  const [userId] = useState(localStorage.getItem('cuet_userId') || "user_" + Math.random().toString(36).substr(2, 9));
  const [userName, setUserName] = useState(localStorage.getItem('cuet_user') || "");

  const QUESTIONS_PER_LEVEL = 5;

  useEffect(() => {
    localStorage.setItem('cuet_userId', userId);
    
    // Load leaderboard
    const q = query(collection(db, "leaderboard"), orderBy("score", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeaderboard(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    const shuffled = [...questionBank]; // Remove random shuffle to keep "Stages" consistent for progress
    setQuestions(shuffled);

    return () => unsubscribe();
  }, [userId]);

  const handleStart = async (e, isNewGame = false) => {
    e.preventDefault();
    if (!userName.trim()) return;

    localStorage.setItem('cuet_user', userName);

    if (isNewGame) {
      // RESET ALL DATA
      setCurrentIdx(0);
      setLevel(1);
      setScore(0);
      setIsFinished(false);
    } else {
      // TRY TO RESUME FROM FIREBASE
      const userDoc = await getDoc(doc(db, "leaderboard", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setCurrentIdx(data.currentIdx || 0);
        setLevel(data.level || 1);
        setScore(data.score || 0);
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

    // SAVE PROGRESS LIVE
    await setDoc(doc(db, "leaderboard", userId), { 
      name: userName, 
      score: newScore,
      currentIdx: currentIdx + 1, // Prepare next index
      level: Math.floor((currentIdx + 1) / QUESTIONS_PER_LEVEL) + 1
    }, { merge: true });

    setTimeout(() => {
      const nextIdx = currentIdx + 1;
      const isEndOfLevel = nextIdx % QUESTIONS_PER_LEVEL === 0;
      const isLastQuestion = nextIdx === questions.length;

      setSelectedOpt(null);
      setIsCorrect(null);

      if (isLastQuestion) {
        setIsFinished(true);
      } else if (isEndOfLevel) {
        setShowLevelUp(true);
        setTimeout(() => {
          setShowLevelUp(false);
          setLevel(prev => prev + 1);
          setCurrentIdx(nextIdx);
        }, 1500);
      } else {
        setCurrentIdx(nextIdx);
      }
    }, 1200);
  };

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
      </div>
    );
  }

  // ... (Rest of your return JSX remains the same as previous)
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
                return <button key={i} className={btnClass} onClick={() => handleAnswer(opt)}>{opt}</button>;
              })}
            </div>
          </div>
        </main>
        <section className="compact-leaderboard">
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