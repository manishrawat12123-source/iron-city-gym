import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Progress = ({ user }) => {
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all'); // 7d, 30d, 90d, all

  const fetchProgress = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/user/progress?email=${user.email}`);
      const data = await res.json();
      if (data.success) setProgressData(data.progress);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) fetchProgress();
  }, [user]);

  const getFilteredData = () => {
    if (timeFilter === 'all') return progressData;
    const now = new Date();
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const limitDate = new Date(now.setDate(now.getDate() - daysMap[timeFilter]));
    return progressData.filter(d => new Date(d.date) >= limitDate);
  };

  const filteredData = getFilteredData();
  
  // Calculate Summaries
  let startWeight = 0;
  let currWeight = 0;
  let weightDiff = 0;
  if (progressData.length > 0) {
    const weights = progressData.filter(d => d.weight).map(d => d.weight);
    if (weights.length > 0) {
      startWeight = weights[0];
      currWeight = weights[weights.length - 1];
      weightDiff = (currWeight - startWeight).toFixed(1);
    }
  }

  if (loading) return <div className="loading-screen">Loading Progress...</div>;

  return (
    <div className="progress-container animate-fade">
      <header className="progress-header">
        <h1 className="neon-text-blue">YOUR PROGRESS</h1>
        <p className="trainer-msg"><i>Your progress is updated weekly by your trainer 💪</i></p>
      </header>

      {progressData.length === 0 ? (
        <div className="empty-state glass">
          <div className="empty-icon">🏋️‍♂️</div>
          <h3>Your trainer hasn't logged your progress yet.</h3>
          <p>Check back soon to see your gains!</p>
        </div>
      ) : (
        <>
          <div className="summary-cards">
            <div className="glass summary-card">
              <label>Starting Weight</label>
              <div className="val">{startWeight ? `${startWeight} kg` : '--'}</div>
            </div>
            <div className="glass summary-card">
              <label>Current Weight</label>
              <div className="val">{currWeight ? `${currWeight} kg` : '--'}</div>
            </div>
            <div className="glass summary-card highlight">
              <label>Net Change</label>
              <div className={`val ${weightDiff > 0 ? 'gain' : weightDiff < 0 ? 'loss' : ''}`}>
                {weightDiff > 0 ? '↑' : weightDiff < 0 ? '↓' : ''} {Math.abs(weightDiff)} kg
              </div>
            </div>
            <div className="glass summary-card">
              <label>Total Logs</label>
              <div className="val">{progressData.length}</div>
            </div>
          </div>

          <div className="progress-grid">
            <div className="glass history-card-list">
              <h3 className="neon-text-red">PROGRESS HISTORY</h3>
              <div className="history-entries">
                {[...progressData].reverse().map(entry => (
                  <div key={entry.id} className="history-entry">
                    <div className="entry-date">📅 {entry.date}</div>
                    <div className="entry-stats">
                      <span className="stat">⚖️ {entry.weight} kg</span>
                      {entry.bodyFat && <span className="stat">💪 {entry.bodyFat}% BF</span>}
                    </div>
                    {entry.note && (
                      <div className="entry-note">
                        <span className="note-label">Trainer note:</span> "{entry.note}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

        <div className="charts-section">
          <div className="charts-header">
            <h3>ANALYTICS</h3>
            <div className="time-filters">
              {['7d', '30d', '90d', 'all'].map(t => (
                <button key={t} className={`filter-btn ${timeFilter === t ? 'active' : ''}`} onClick={() => setTimeFilter(t)}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="glass chart-card">
            <h4>Weight Tracking</h4>
            <div className="chart-wrapper">
              {filteredData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="#666" tick={{fill: '#666'}} />
                    <YAxis stroke="#666" tick={{fill: '#666'}} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333'}} />
                    <Line type="monotone" dataKey="weight" stroke="#00f5ff" strokeWidth={3} dot={{r: 4, fill: '#00f5ff'}} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p className="no-data">Not enough data to display chart.</p>}
            </div>
          </div>

          <div className="chart-row">
            <div className="glass chart-card half">
              <h4>Body Fat %</h4>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" hide />
                    <YAxis stroke="#666" domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333'}} />
                    <Line type="monotone" dataKey="bodyFat" stroke="#ff2d6b" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass chart-card half">
              <h4>Measurements (cm)</h4>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" hide />
                    <YAxis stroke="#666" domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333'}} />
                    <Bar dataKey="chest" fill="#ffd700" stackId="a" />
                    <Bar dataKey="waist" fill="#00f5ff" stackId="a" />
                    <Bar dataKey="arms" fill="#ff2d6b" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      <style>{`
        .progress-container { padding: 40px 0; max-width: 1200px; margin: 0 auto; }
        .progress-header { text-align: center; margin-bottom: 40px; }
        .progress-header h1 { font-family: 'Bebas Neue', sans-serif; font-size: 3rem; margin-bottom: 10px; }
        
        .trainer-msg { color: #888; font-size: 1.1rem; margin-top: 10px; }
        
        .empty-state { text-align: center; padding: 60px 20px; border-radius: 15px; margin-top: 30px; }
        .empty-icon { font-size: 4rem; margin-bottom: 20px; }
        .empty-state h3 { font-family: 'Bebas Neue', sans-serif; font-size: 2rem; color: var(--accent-primary); margin-bottom: 10px; }
        .empty-state p { color: var(--text-muted); }

        .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .summary-card { padding: 25px; text-align: center; border-radius: 12px; border: 1px solid var(--glass-border); }
        .summary-card label { color: var(--text-muted); font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        .summary-card .val { font-family: 'Bebas Neue', sans-serif; font-size: 2.5rem; color: white; margin-top: 10px; }
        .summary-card.highlight .val { text-shadow: 0 0 10px rgba(255,255,255,0.2); }
        .val.gain { color: #ff2d6b; }
        .val.loss { color: #00ff7f; }

        .progress-grid { display: grid; grid-template-columns: 350px 1fr; gap: 30px; margin-bottom: 40px; }
        
        .history-card-list { padding: 30px; border-radius: 15px; height: 600px; overflow-y: auto; }
        .history-card-list h3 { font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem; margin-bottom: 25px; }
        .history-entries { display: flex; flex-direction: column; gap: 20px; }
        .history-entry { background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); padding: 15px; border-radius: 10px; }
        .entry-date { font-weight: 800; color: white; margin-bottom: 10px; font-size: 0.95rem; }
        .entry-stats { display: flex; gap: 15px; margin-bottom: 10px; }
        .stat { background: rgba(0, 245, 255, 0.1); color: var(--accent-primary); padding: 4px 10px; border-radius: 4px; font-size: 0.85rem; font-weight: 700; }
        .entry-note { border-left: 3px solid var(--accent-primary); padding-left: 12px; font-style: italic; color: #888; font-size: 0.9rem; margin-top: 10px; background: rgba(0,0,0,0.2); padding-top: 8px; padding-bottom: 8px; border-radius: 0 4px 4px 0; }
        .note-label { color: var(--accent-primary); font-weight: 600; font-style: normal; margin-right: 5px; }

        .charts-section { display: flex; flex-direction: column; gap: 20px; }
        .charts-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .charts-header h3 { font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem; color: white; }
        .time-filters { display: flex; gap: 10px; background: rgba(255,255,255,0.05); padding: 5px; border-radius: 8px; }
        .filter-btn { background: transparent; border: none; color: var(--text-muted); padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 700; transition: all 0.3s; }
        .filter-btn.active { background: var(--accent-primary); color: black; }
        
        .chart-card { padding: 25px; border-radius: 15px; }
        .chart-card h4 { color: var(--text-muted); margin-bottom: 20px; font-size: 1rem; }
        .chart-wrapper { height: 300px; width: 100%; }
        .chart-row { display: flex; gap: 20px; }
        .chart-card.half { flex: 1; }
        .chart-card.half .chart-wrapper { height: 200px; }
        .no-data { color: var(--text-muted); text-align: center; padding: 40px; font-style: italic; }

        @media (max-width: 900px) {
          .progress-grid { grid-template-columns: 1fr; }
          .chart-row { flex-direction: column; }
          .history-card-list { height: 400px; }
        }
      `}</style>
    </div>
  );
};

export default Progress;
