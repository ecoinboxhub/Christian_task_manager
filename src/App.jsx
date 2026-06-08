import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_READY = GROQ_API_KEY && GROQ_API_KEY !== 'YOUR_GROQ_API_KEY_HERE'

const VERSES = [
  { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
  { text: "For I know the plans I have for you, declares the Lord.", ref: "Jeremiah 29:11" },
  { text: "Be strong and courageous. Do not be afraid; do not be discouraged.", ref: "Joshua 1:9" },
  { text: "Trust in the Lord with all your heart.", ref: "Proverbs 3:5" },
  { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
  { text: "God is our refuge and strength, a very present help in trouble.", ref: "Psalm 46:1" },
  { text: "Delight yourself in the Lord, and he will give you the desires of your heart.", ref: "Psalm 37:4" },
  { text: "The joy of the Lord is your strength.", ref: "Nehemiah 8:10" },
  { text: "Cast all your anxiety on him because he cares for you.", ref: "1 Peter 5:7" },
  { text: "The Lord is my light and my salvation; whom shall I fear?", ref: "Psalm 27:1" },
  { text: "Be still, and know that I am God.", ref: "Psalm 46:10" },
  { text: "Your word is a lamp to my feet and a light to my path.", ref: "Psalm 119:105" },
]

const DAILY_PRAYERS = [
  "Lord, thank You for this new day. Guide my thoughts, words, and actions. Let me be a light to someone today. Amen.",
  "Heavenly Father, I surrender this day to You. Give me wisdom in my decisions and peace in my heart. In Jesus' name, Amen.",
  "Dear God, help me to see Your hand in every situation today. Grant me patience, kindness, and strength. Amen.",
  "Lord Jesus, I lift up my family, friends, and even my enemies before You. Bless them and draw them close to Your heart. Amen.",
  "Father, I thank You for Your unfailing love. Help me to love others the way You love me — unconditionally and without reservation. Amen.",
]

const STUDY_SUGGESTIONS = [
  { book: "Psalm", chapter: 23, title: "The Lord is My Shepherd" },
  { book: "Proverbs", chapter: 3, title: "Trust in the Lord" },
  { book: "Matthew", chapter: 5, title: "The Beatitudes" },
  { book: "John", chapter: 14, title: "I Am the Way" },
  { book: "Romans", chapter: 8, title: "Life in the Spirit" },
  { book: "Philippians", chapter: 4, title: "Rejoice in the Lord" },
  { book: "Ephesians", chapter: 6, title: "Armor of God" },
]

const GREETINGS = [
  { hour: 5, msg: "Good morning! Rise and shine for the Lord!", icon: "🌅" },
  { hour: 12, msg: "Good afternoon! Keep walking in faith.", icon: "☀️" },
  { hour: 17, msg: "Good evening! Rest in His presence.", icon: "🌆" },
  { hour: 21, msg: "Good night! May the Lord watch over you.", icon: "🌙" },
]

function loadState(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function saveState(key, val) { localStorage.setItem(key, JSON.stringify(val)) }

function getGreeting() {
  const h = new Date().getHours()
  for (let i = GREETINGS.length - 1; i >= 0; i--) if (h >= GREETINGS[i].hour) return GREETINGS[i]
  return GREETINGS[0]
}

function getStreak(logs) {
  if (!logs.length) return 0
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    if (logs.some(l => l.date === d.toLocaleDateString())) streak++
    else if (i > 0) break
  }
  return streak
}

export default function App() {
  const [tasks, setTasks] = useState(() => loadState('btf_tasks', []))
  const [prayerLogs, setPrayerLogs] = useState(() => loadState('btf_prayerLogs', []))
  const [studyPlan, setStudyPlan] = useState(() => loadState('btf_studyPlan', { book: '', chapter: '' }))
  const [currentView, setCurrentView] = useState('tasks')
  const [currentFilter, setCurrentFilter] = useState('all')
  const [verseIndex, setVerseIndex] = useState(() => {
    const today = new Date().toDateString()
    const saved = loadState('btf_verseDate', '')
    if (saved === today) return loadState('btf_verseIndex', 0)
    const idx = Math.floor(Math.random() * VERSES.length)
    saveState('btf_verseDate', today); saveState('btf_verseIndex', idx)
    return idx
  })
  const [greeting] = useState(getGreeting)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const [taskText, setTaskText] = useState('')
  const [taskCategory, setTaskCategory] = useState('spiritual')
  const [prayerMinutes, setPrayerMinutes] = useState('')
  const [studyBook, setStudyBook] = useState('')
  const [studyChapter, setStudyChapter] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  const [chatHistory, setChatHistory] = useState(() => loadState('btf_chat', []))
  const [chatLoading, setChatLoading] = useState(false)
  const [todayPrayer] = useState(() => DAILY_PRAYERS[new Date().getDate() % DAILY_PRAYERS.length])
  const chatEnd = useRef(null)
  const chatInput = useRef(null)

  const streak = getStreak(prayerLogs)
  const verse = VERSES[verseIndex]

  useEffect(() => { saveState('btf_tasks', tasks) }, [tasks])
  useEffect(() => { saveState('btf_prayerLogs', prayerLogs) }, [prayerLogs])
  useEffect(() => { saveState('btf_studyPlan', studyPlan) }, [studyPlan])
  useEffect(() => { saveState('btf_chat', chatHistory) }, [chatHistory])
  useEffect(() => { if (chatOpen && chatInput.current) chatInput.current.focus() }, [chatOpen])
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatHistory])

  const showToast = useCallback((msg, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message: msg, type })
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }, [])

  const nextVerse = useCallback(() => {
    setVerseIndex(i => {
      const n = (i + 1) % VERSES.length
      saveState('btf_verseIndex', n)
      return n
    })
  }, [])

  const addTask = useCallback(() => {
    const text = taskText.trim()
    if (!text) return
    setTasks(prev => [{ id: Date.now(), text, category: taskCategory, completed: false, createdAt: new Date().toISOString() }, ...prev])
    setTaskText(''); showToast('Task added! ✨')
    if (navigator.vibrate) navigator.vibrate(10)
  }, [taskText, taskCategory, showToast])

  const toggleTask = useCallback((id) => {
    setTasks(prev => {
      const t = prev.find(x => x.id === id)
      if (t && !t.completed) { showToast('Well done! 🙌'); if (navigator.vibrate) navigator.vibrate(20) }
      return prev.map(x => x.id === id ? { ...x, completed: !x.completed } : x)
    })
  }, [showToast])

  const deleteTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id)); showToast('Removed', 'info')
  }, [showToast])

  const logPrayer = useCallback(() => {
    const m = parseInt(prayerMinutes)
    if (!m || m <= 0) return
    const today = new Date().toLocaleDateString()
    if (prayerLogs.some(l => l.date === today)) { showToast('Already logged today! 🔥', 'warning'); return }
    setPrayerLogs(prev => [{ date: today, minutes: m }, ...prev]); setPrayerMinutes('')
    showToast(`🙏 ${m} min of prayer!`); if (navigator.vibrate) navigator.vibrate(15)
  }, [prayerMinutes, prayerLogs, showToast])

  const saveStudyPlan = useCallback(() => {
    if (!studyBook.trim()) return
    setStudyPlan({ book: studyBook.trim(), chapter: studyChapter })
    showToast(`📖 Studying ${studyBook.trim()} ${studyChapter || ''}`)
  }, [studyBook, studyChapter, showToast])

  const useSuggestion = useCallback((s) => {
    setStudyBook(s.book); setStudyChapter(String(s.chapter))
    showToast(`📖 Suggested: ${s.book} ${s.chapter}`)
  }, [showToast])

  const sendChat = useCallback(async () => {
    const msg = chatMsg.trim()
    if (!msg || chatLoading) return
    if (!GROQ_READY) { showToast('Set VITE_GROQ_API_KEY in .env first', 'warning'); return }

    const userEntry = { role: 'user', content: msg }
    setChatHistory(prev => [...prev, userEntry])
    setChatMsg(''); setChatLoading(true)

    const taskContext = tasks.length ? `The user's current tasks are: ${tasks.map(t => t.text).join(', ')}` : ''
    const systemPrompt = `You are a compassionate Christian mentor and life coach. Respond with warmth, scripture wisdom, and practical advice. Keep responses concise (2-4 sentences). Use 1 relevant emoji. ${taskContext ? `\nContext: ${taskContext}` : ''}`

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [
            { role: 'system', content: systemPrompt },
            ...chatHistory.slice(-6),
            userEntry,
          ],
        })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }])
    } catch {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting. Please check your connection and try again. 🙏" }])
    } finally { setChatLoading(false) }
  }, [chatMsg, chatLoading, chatHistory, tasks])

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const spiritualCount = tasks.filter(t => t.category === 'spiritual').length
  const spiritualPercent = totalTasks > 0 ? Math.round((spiritualCount / totalTasks) * 100) : 0
  const secularPercent = 100 - spiritualPercent
  const todayStr = new Date().toLocaleDateString()
  const prayedToday = prayerLogs.some(l => l.date === todayStr)
  const todaySuggestion = STUDY_SUGGESTIONS[new Date().getDate() % STUDY_SUGGESTIONS.length]
  const filteredTasks = tasks.filter(t => {
    if (currentFilter === 'active') return !t.completed
    if (currentFilter === 'completed') return t.completed
    return true
  })

  return (
    <div id="app">
      {toast && <div className={`toast toast-${toast.type}`}><span>{toast.message}</span></div>}

      <header>
        <div className="greeting">{greeting.icon} {greeting.msg}</div>
        <div className="logo">
          <span className="logo-cross">✝</span>
          <span>Believers Flow</span>
        </div>
        <div className="verse-container" onClick={nextVerse}>
          <p className="verse-text">&ldquo;{verse.text}&rdquo;</p>
          <div className="verse-meta">
            <small className="verse-ref">{verse.ref}</small>
            <span className="verse-tap">Tap for more</span>
          </div>
        </div>
      </header>

      <div className="stats-bar">
        <div className="stat"><span className="stat-value">{tasks.length}</span><span className="stat-label">Tasks</span></div>
        <div className="stat"><span className="stat-value">{streak}</span><span className="stat-label">Streak</span></div>
        <div className="stat"><span className="stat-value">{prayerLogs.reduce((a, b) => a + b.minutes, 0)}</span><span className="stat-label">Prayer Min</span></div>
        <div className="stat"><span className="stat-value">{completedTasks}/{totalTasks}</span><span className="stat-label">Done</span></div>
      </div>

      <nav id="main-nav">
        {['tasks', 'spiritual'].map(view => (
          <button key={view} className={`nav-item${currentView === view ? ' active' : ''}`} onClick={() => setCurrentView(view)}>
            {view === 'tasks' ? '📋 Tasks' : '✨ Spiritual'}
          </button>
        ))}
      </nav>

      <main id="view-container">
        {currentView === 'tasks' && (
          <section className="view">
            <div className="grid-2col">
              <div className="progress-card">
                <div className="progress-header"><span>Progress</span><span className="progress-pct">{completionPercent}%</span></div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${completionPercent}%` }} /></div>
                <p className="progress-sub">{completedTasks} of {totalTasks} done</p>
              </div>
              <div className="prayer-mini-card">
                <div className="prayer-mini-icon">🕯</div>
                <div className="prayer-mini-info">
                  <span className="prayer-mini-label">Today's Prayer</span>
                  <span className="prayer-mini-status">{prayedToday ? '✅ Prayed' : 'Not yet'}</span>
                </div>
              </div>
            </div>

            <div className="filter-bar">
              {['all', 'active', 'completed'].map(f => (
                <button key={f} className={`filter-btn${currentFilter === f ? ' active' : ''}`} onClick={() => setCurrentFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div className="input-group">
              <input type="text" placeholder="What's next for the Kingdom?" value={taskText}
                onChange={e => setTaskText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} />
              <select value={taskCategory} onChange={e => setTaskCategory(e.target.value)}>
                <option value="spiritual">Spiritual ✨</option>
                <option value="personal">Personal 🏠</option>
                <option value="service">Service 🤝</option>
              </select>
              <button onClick={addTask}>+ Add</button>
            </div>

            <ul id="task-list">
              {filteredTasks.map(t => (
                <li key={t.id} className={`task-item${t.completed ? ' completed' : ''}`}>
                  <label className="checkbox-wrap">
                    <input type="checkbox" checked={t.completed} onChange={() => toggleTask(t.id)} />
                    <span className="checkmark" />
                  </label>
                  <div className="task-text">
                    <span>{t.text}</span>
                    <div className={`task-cat ${t.category}`}>{t.category}</div>
                  </div>
                  <button className="delete-btn" onClick={() => deleteTask(t.id)}>✕</button>
                </li>
              ))}
              {filteredTasks.length === 0 && (
                <div className="empty-state"><span className="empty-icon">📝</span><p>No tasks yet. Add one above!</p></div>
              )}
            </ul>
          </section>
        )}

        {currentView === 'spiritual' && (
          <section className="view">
            <div className="daily-prayer-card">
              <div className="dp-icon">🕯</div>
              <div className="dp-content">
                <h4>Today's Prayer</h4>
                <p>&ldquo;{todayPrayer}&rdquo;</p>
              </div>
            </div>

            <div className="card">
              <div className="card-icon">🙏</div>
              <h3>Prayer Tracker</h3>
              <p>Log your daily quiet time and build a streak.</p>
              {prayedToday ? (
                <div className="prayed-today-badge">✅ Prayed today! Come back tomorrow.</div>
              ) : (
                <div className="prayer-input">
                  <input type="number" placeholder="Minutes in prayer" value={prayerMinutes}
                    onChange={e => setPrayerMinutes(e.target.value)} onKeyDown={e => e.key === 'Enter' && logPrayer()} min="1" />
                  <button onClick={logPrayer}>Log Prayer</button>
                </div>
              )}
              {streak > 0 && (
                <div className="streak-badge"><span className="flame">🔥</span><span>{streak} day streak!</span></div>
              )}
              <div className="prayer-history">
                <h4>Recent</h4>
                {prayerLogs.slice(0, 5).map((log, i) => (
                  <div key={i} className="prayer-log-item"><span className="log-date">{log.date}</span><span className="log-mins">{log.minutes} min</span></div>
                ))}
                {!prayerLogs.length && <p className="empty-small">No logs yet.</p>}
              </div>
            </div>

            <div className="card">
              <div className="card-icon">📖</div>
              <h3>Bible Study Planner</h3>
              <p>Plan your scripture reading. Today's suggestion: <strong>{todaySuggestion.book} {todaySuggestion.chapter}</strong> &mdash; <em>{todaySuggestion.title}</em></p>
              <div className="study-inputs">
                <input type="text" placeholder="Book" value={studyBook} onChange={e => setStudyBook(e.target.value)} />
                <input type="number" placeholder="Ch" value={studyChapter} onChange={e => setStudyChapter(e.target.value)} min="1" />
              </div>
              <div className="study-actions">
                <button onClick={saveStudyPlan}>Save Plan</button>
                <button className="btn-outline" onClick={() => useSuggestion(todaySuggestion)}>📌 Use Suggestion</button>
              </div>
              {studyPlan.book && (
                <div className="study-current"><span className="study-icon">📖</span><span>Studying: {studyPlan.book} {studyPlan.chapter}</span></div>
              )}
            </div>

            <div className="card">
              <div className="card-icon">⚖</div>
              <h3>Spiritual Balance</h3>
              <p>How your tasks balance between spiritual and everyday life.</p>
              <div className="balance-viz">
                <div className="balance-bar" style={{ width: `${spiritualPercent}%` }} />
                <div className="balance-glow" />
              </div>
              <div className="balance-labels">
                <span className="balance-spiritual">✝ Spiritual {spiritualPercent}%</span>
                <span className="balance-secular">Secular {secularPercent}%</span>
              </div>
              {spiritualPercent < 25 && totalTasks > 0 && (
                <div className="balance-tip">💡 Try adding a spiritual task to balance your day!</div>
              )}
            </div>

            <div className="card">
              <div className="card-icon">📅</div>
              <h3>Today's Suggested Reading</h3>
              <div className="suggestion-card">
                <span className="suggestion-book">{todaySuggestion.book}</span>
                <span className="suggestion-ch">Chapter {todaySuggestion.chapter}</span>
                <span className="suggestion-title">&ldquo;{todaySuggestion.title}&rdquo;</span>
                <button className="btn-sm" onClick={() => useSuggestion(todaySuggestion)}>Study This</button>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer>
        <p>Saved locally ✦ Offline ready ✦ Faith driven</p>
      </footer>

      {GROQ_READY && (
        <>
          <button className={`chat-fab ${chatOpen ? ' open' : ''}`} onClick={() => setChatOpen(o => !o)}>
            {chatOpen ? '✕' : '💬'}
          </button>

          {chatOpen && (
            <div className="chat-overlay">
              <div className="chat-panel">
                <div className="chat-header">
                  <span className="chat-title">🤖 Faith Assistant</span>
                  <button className="chat-close" onClick={() => setChatOpen(false)}>✕</button>
                </div>
                <div className="chat-body">
                  {!chatHistory.length && (
                    <div className="chat-welcome">
                      <span className="chat-welcome-icon">🙏</span>
                      <p>Hi! I'm your faith assistant. Ask me anything about scripture, prayer, life advice, or your tasks.</p>
                      <div className="chat-suggestions">
                        {["Give me a Bible verse for today", "How can I improve my prayer life?", "What does the Bible say about patience?", "Encourage me based on my tasks"].map((s, i) => (
                          <button key={i} className="chat-suggestion-chip" onClick={() => { setChatMsg(s); setTimeout(() => chatInput.current?.focus(), 50) }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {chatHistory.map((m, i) => (
                    <div key={i} className={`chat-msg ${m.role}`}>
                      <span className="chat-avatar">{m.role === 'user' ? '👤' : '🤖'}</span>
                      <div className="chat-bubble">{m.content}</div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="chat-msg assistant">
                      <span className="chat-avatar">🤖</span>
                      <div className="chat-bubble typing">
                        <span className="dot-pulse" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEnd} />
                </div>
                <div className="chat-input-area">
                  <input ref={chatInput} type="text" placeholder="Ask anything..." value={chatMsg}
                    onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} />
                  <button onClick={sendChat} disabled={chatLoading || !chatMsg.trim()}>Send</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
