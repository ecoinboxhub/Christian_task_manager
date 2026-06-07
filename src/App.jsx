import { useState, useEffect, useCallback } from 'react'
import './App.css'

const VERSES = [
  { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
  { text: "For I know the plans I have for you, declares the Lord.", ref: "Jeremiah 29:11" },
  { text: "Be strong and courageous. Do not be afraid; do not be discouraged.", ref: "Joshua 1:9" },
  { text: "Trust in the Lord with all your heart.", ref: "Proverbs 3:5" },
  { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
  { text: "God is our refuge and strength, a very present help in trouble.", ref: "Psalm 46:1" },
  { text: "Delight yourself in the Lord, and he will give you the desires of your heart.", ref: "Psalm 37:4" },
  { text: "The joy of the Lord is your strength.", ref: "Nehemiah 8:10" },
]

function loadState(key, fallback) {
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : fallback
  } catch {
    return fallback
  }
}

function saveState(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

export default function App() {
  const [tasks, setTasks] = useState(() => loadState('btf_tasks', []))
  const [prayerLogs, setPrayerLogs] = useState(() => loadState('btf_prayerLogs', []))
  const [studyPlan, setStudyPlan] = useState(() => loadState('btf_studyPlan', { book: '', chapter: '' }))
  const [apiKey, setApiKey] = useState(() => loadState('btf_apiKey', ''))
  const [currentView, setCurrentView] = useState('tasks')
  const [currentFilter, setCurrentFilter] = useState('all')
  const [verse] = useState(() => VERSES[Math.floor(Math.random() * VERSES.length)])

  const [taskText, setTaskText] = useState('')
  const [taskCategory, setTaskCategory] = useState('spiritual')
  const [prayerMinutes, setPrayerMinutes] = useState('')
  const [studyBook, setStudyBook] = useState('')
  const [studyChapter, setStudyChapter] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState(apiKey)

  useEffect(() => { saveState('btf_tasks', tasks) }, [tasks])
  useEffect(() => { saveState('btf_prayerLogs', prayerLogs) }, [prayerLogs])
  useEffect(() => { saveState('btf_studyPlan', studyPlan) }, [studyPlan])
  useEffect(() => { saveState('btf_apiKey', apiKey) }, [apiKey])

  const addTask = useCallback(() => {
    const text = taskText.trim()
    if (!text) return
    setTasks(prev => [{ id: Date.now(), text, category: taskCategory, completed: false, createdAt: new Date().toISOString() }, ...prev])
    setTaskText('')
  }, [taskText, taskCategory])

  const toggleTask = useCallback((id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }, [])

  const deleteTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const logPrayer = useCallback(() => {
    const minutes = parseInt(prayerMinutes)
    if (!minutes || minutes <= 0) return
    setPrayerLogs(prev => [{ date: new Date().toLocaleDateString(), minutes }, ...prev])
    setPrayerMinutes('')
  }, [prayerMinutes])

  const saveStudyPlan = useCallback(() => {
    setStudyPlan({ book: studyBook, chapter: studyChapter })
  }, [studyBook, studyChapter])

  const saveApiKey = useCallback(() => {
    setApiKey(apiKeyInput)
  }, [apiKeyInput])

  const generateAiSuggestions = useCallback(async () => {
    if (!apiKey) {
      setAiResponse('Please save your GROQ API key first.')
      return
    }
    setAiLoading(true)
    setAiResponse('Thinking and praying for suggestions...')
    const taskNames = tasks.map(t => t.text).join(', ')
    const prompt = `As a Christian mentor, look at these tasks: [${taskNames}]. Suggest 3 specific Christian activities or Bible study topics that would complement this day. Keep it short, encouraging, and include 1 emoji per suggestion.`

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [{ role: 'user', content: prompt }]
        })
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      setAiResponse(data.choices[0].message.content)
    } catch {
      setAiResponse("Couldn't reach the AI. Check your connection or API key.")
    } finally {
      setAiLoading(false)
    }
  }, [apiKey, tasks])

  const totalTasks = tasks.length
  const spiritualCount = tasks.filter(t => t.category === 'spiritual').length
  const spiritualPercent = totalTasks > 0 ? Math.round((spiritualCount / totalTasks) * 100) : 0
  const secularPercent = 100 - spiritualPercent

  const filteredTasks = tasks.filter(t => {
    if (currentFilter === 'active') return !t.completed
    if (currentFilter === 'completed') return t.completed
    return true
  })

  return (
    <div id="app">
      <header>
        <div className="logo">&#x1F64F; Believers Flow</div>
        <div className="verse-container">
          <p id="verse-text">&ldquo;{verse.text}&rdquo;</p>
          <small id="verse-ref">{verse.ref}</small>
        </div>
      </header>

      <nav id="main-nav">
        {['tasks', 'spiritual', 'ai'].map(view => (
          <button
            key={view}
            className={`nav-item${currentView === view ? ' active' : ''}`}
            onClick={() => setCurrentView(view)}
          >
            {view === 'tasks' ? '&#x1F4CB; Tasks' : view === 'spiritual' ? '&#x2728; Spiritual' : '&#x1F916; AI Tips'}
          </button>
        ))}
      </nav>

      <main id="view-container">
        {currentView === 'tasks' && (
          <section className="view">
            <div className="filter-bar">
              {['all', 'active', 'completed'].map(f => (
                <button
                  key={f}
                  className={`filter-btn${currentFilter === f ? ' active' : ''}`}
                  onClick={() => setCurrentFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="input-group">
              <input
                type="text"
                placeholder="What's next for the Kingdom?"
                value={taskText}
                onChange={e => setTaskText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
              />
              <select value={taskCategory} onChange={e => setTaskCategory(e.target.value)}>
                <option value="spiritual">Spiritual &#x2728;</option>
                <option value="personal">Personal &#x1F3E0;</option>
                <option value="service">Service &#x1F91D;</option>
              </select>
              <button onClick={addTask}>Add</button>
            </div>
            <ul id="task-list">
              {filteredTasks.map(t => (
                <li key={t.id} className={`task-item${t.completed ? ' completed' : ''}`}>
                  <input type="checkbox" checked={t.completed} onChange={() => toggleTask(t.id)} />
                  <div className="task-text">
                    <span>{t.text}</span>
                    <div className={`task-cat ${t.category}`}>{t.category}</div>
                  </div>
                  <button className="delete-btn" onClick={() => deleteTask(t.id)}>&#x1F5D1;</button>
                </li>
              ))}
              {filteredTasks.length === 0 && <p className="empty-state">No tasks yet. Add one above!</p>}
            </ul>
          </section>
        )}

        {currentView === 'spiritual' && (
          <section className="view">
            <div className="card">
              <h3>&#x1F56D; Prayer Balance</h3>
              <p>Track your daily prayer minutes.</p>
              <div className="prayer-input">
                <input
                  type="number"
                  placeholder="Minutes"
                  value={prayerMinutes}
                  onChange={e => setPrayerMinutes(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && logPrayer()}
                  min="1"
                />
                <button onClick={logPrayer}>Log</button>
              </div>
              <div id="prayer-history">
                {prayerLogs.slice(0, 5).map((log, i) => (
                  <p key={i} className="prayer-log-item">&#x1F4C5; {log.date}: {log.minutes} mins</p>
                ))}
                {prayerLogs.length === 0 && <p className="empty-state">No prayer logs yet.</p>}
              </div>
            </div>
            <div className="card">
              <h3>&#x1F4D6; Bible Study Planner</h3>
              <input type="text" placeholder="Book (e.g. John)" value={studyBook} onChange={e => setStudyBook(e.target.value)} />
              <input type="number" placeholder="Chapter" value={studyChapter} onChange={e => setStudyChapter(e.target.value)} min="1" />
              <button onClick={saveStudyPlan}>Save Plan</button>
              {studyPlan.book && (
                <p className="study-current">Current Focus: &#x1F4D6; {studyPlan.book} {studyPlan.chapter}</p>
              )}
            </div>
            <div className="card">
              <h3>&#x2696; Task Balancer</h3>
              <div className="balance-viz">
                <div className="balance-bar" style={{ width: `${spiritualPercent}%` }}></div>
              </div>
              <p id="balance-stats">Spiritual: {spiritualPercent}% | Secular: {secularPercent}%</p>
            </div>
          </section>
        )}

        {currentView === 'ai' && (
          <section className="view">
            <div className="card">
              <h3>&#x1F916; AI Believer Tips</h3>
              <p>Get personalized activity recommendations based on your tasks.</p>
              <div className="input-group">
                <input
                  type="password"
                  placeholder="Enter GROQ API Key"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                />
                <button onClick={saveApiKey}>Save Key</button>
              </div>
              <button className="primary-btn" onClick={generateAiSuggestions} disabled={aiLoading}>
                {aiLoading ? 'Thinking...' : 'Get AI Suggestions'}
              </button>
              {aiResponse && (
                <div className="ai-box" style={{ whiteSpace: 'pre-wrap' }}>{aiResponse}</div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer>
        <p>Saved to LocalStorage &#x2022; Offline Ready</p>
      </footer>
    </div>
  )
}
