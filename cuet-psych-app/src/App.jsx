import React, { useState, useEffect } from 'react';
import { db } from './firebase'; 
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { questionBank } from './syllabusData';
import './App.css';

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  // Fetch Leaderboard once on load
  useEffect(() => {
    const shuffled = [...questionBank].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);

    const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeaderboard(snapshot.docs.map(doc => doc.data()));
    });
    return () => unsubscribe();
  }, []);

  const handleAnswer = async (opt) => {
    if (selectedOpt !== null) return;

    const correct = opt === questions[currentIdx].answer;
    setSelectedOpt(opt);
    setIsCorrect(correct);

    // CUET Marking Scheme: +4 for Correct, -1 for Wrong
    const newScore = correct ? score + 4 : score - 1;
    setScore(newScore);

    setTimeout(async () => {
      if (currentIdx + 1 < questions.length) {
        setCurrentIdx(prev => prev + 1);
        setSelectedOpt(null);
        setIsCorrect(null);
      } else {
        setIsFinished(true);
        // Save to Firebase
        try {
          await addDoc(collection(db, "leaderboard"), {
            name: localStorage.getItem('cuet_user') || "Anonymous",
            score: newScore,
            timestamp: new Date()
          });
        } catch (e) {
          console.error("Save failed:", e);
        }
      }
    }, 800);
  };

  if (questions.length === 0) return <div className="game-wrapper">Loading...</div>;

  return (
    <div className="game-wrapper">
      <header className="stats-bar">
        <div className="stat-box">🎯 Marks: {score}</div>
      </header>

      <main className="quiz-card">
        {!isFinished ? (
          <>
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
            <h2>Results Saved!</h2>
            <div className="leaderboard-view">
              <h3>🏆 Global Top 5</h3>
              {leaderboard.map((user, i) => (
                <div key={i} className="rank-row">
                  <span>{i+1}. {user.name}</span>
                  <strong>{user.score}</strong>
                </div>
              ))}
            </div>
            <button className="restart-btn" onClick={() => window.location.reload()}>Try Again</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;