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

const BIBLE_VERSIONS = [
  { id: "KJV", name: "King James Version" },
  { id: "NKJV", name: "New King James Version" },
  { id: "NIV", name: "New International Version" },
  { id: "ESV", name: "English Standard Version" },
  { id: "NASB", name: "New American Standard Bible" },
  { id: "NLT", name: "New Living Translation" },
  { id: "CSB", name: "Christian Standard Bible" },
  { id: "AMP", name: "Amplified Bible" },
]

const MOODS = [
  { emoji: "😊", label: "Joyful" },
  { emoji: "🙂", label: "Grateful" },
  { emoji: "😐", label: "Peaceful" },
  { emoji: "😢", label: "Anxious" },
  { emoji: "😭", label: "Struggling" },
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

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function App() {
  const [tasks, setTasks] = useState(() => loadState('btf_tasks', []))
  const [prayerLogs, setPrayerLogs] = useState(() => loadState('btf_prayerLogs', []))
  const [studyPlan, setStudyPlan] = useState(() => loadState('btf_studyPlan', { book: '', chapter: '' }))
  const [diaryEntries, setDiaryEntries] = useState(() => loadState('btf_diary', []))
  const [bibleVersion, setBibleVersion] = useState(() => loadState('btf_bibleVersion', 'KJV'))
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
  const [taskTime, setTaskTime] = useState('')
  const [taskCategory, setTaskCategory] = useState('spiritual')
  const [prayerMinutes, setPrayerMinutes] = useState('')
  const [studyBook, setStudyBook] = useState('')
  const [studyChapter, setStudyChapter] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  const [chatHistory, setChatHistory] = useState(() => loadState('btf_chat', []))
  const [chatLoading, setChatLoading] = useState(false)
  const [todayPrayer] = useState(() => DAILY_PRAYERS[new Date().getDate() % DAILY_PRAYERS.length])
  const [undoStack, setUndoStack] = useState([])
  const [showGuide, setShowGuide] = useState(false)
  const [diaryTitle, setDiaryTitle] = useState('')
  const [diaryContent, setDiaryContent] = useState('')
  const [diaryMood, setDiaryMood] = useState('😊')
  const [editingDiary, setEditingDiary] = useState(null)
  const chatEnd = useRef(null)
  const chatInput = useRef(null)

  const streak = getStreak(prayerLogs)
  const verse = VERSES[verseIndex]

  useEffect(() => { saveState('btf_tasks', tasks) }, [tasks])
  useEffect(() => { saveState('btf_prayerLogs', prayerLogs) }, [prayerLogs])
  useEffect(() => { saveState('btf_studyPlan', studyPlan) }, [studyPlan])
  useEffect(() => { saveState('btf_chat', chatHistory) }, [chatHistory])
  useEffect(() => { saveState('btf_diary', diaryEntries) }, [diaryEntries])
  useEffect(() => { saveState('btf_bibleVersion', bibleVersion) }, [bibleVersion])
  useEffect(() => { if (chatOpen && chatInput.current) chatInput.current.focus() }, [chatOpen])
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatHistory])

  const showToast = useCallback((msg, type = 'success', action = null) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message: msg, type, action })
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }, [])

  const dismissToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(null)
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
    setTasks(prev => [{ id: Date.now(), text, time: taskTime, category: taskCategory, completed: false, createdAt: new Date().toISOString() }, ...prev])
    setTaskText(''); setTaskTime(''); showToast('Task added! ✨')
    if (navigator.vibrate) navigator.vibrate(10)
  }, [taskText, taskTime, taskCategory, showToast])

  const toggleTask = useCallback((id) => {
    setTasks(prev => {
      const t = prev.find(x => x.id === id)
      if (t && !t.completed) { showToast('Well done! 🙌'); if (navigator.vibrate) navigator.vibrate(20) }
      return prev.map(x => x.id === id ? { ...x, completed: !x.completed } : x)
    })
  }, [showToast])

  const deleteTask = useCallback((id) => {
    setTasks(prev => {
      const item = prev.find(t => t.id === id)
      if (item) {
        const undoId = Date.now()
        setUndoStack(s => [...s, { id: undoId, action: 'delete-task', data: item }])
        setTimeout(() => setUndoStack(s => s.filter(u => u.id !== undoId)), 5000)
        showToast('Task removed', 'info', { label: 'Undo', cb: () => {
          setUndoStack(s => { const u = s.find(x => x.id === undoId); if (u) { setTasks(p => [...p, u.data]); return s.filter(x => x.id !== undoId) } return s })
          dismissToast()
        }})
      }
      return prev.filter(t => t.id !== id)
    })
  }, [showToast, dismissToast])

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

  const addDiaryEntry = useCallback(() => {
    if (!diaryContent.trim()) return
    if (editingDiary) {
      setDiaryEntries(prev => prev.map(e => e.id === editingDiary.id ? { ...e, title: diaryTitle.trim(), content: diaryContent.trim(), mood: diaryMood } : e))
      showToast('Diary updated! 📓')
    } else {
      setDiaryEntries(prev => [{ id: Date.now(), title: diaryTitle.trim(), content: diaryContent.trim(), mood: diaryMood, date: new Date().toISOString() }, ...prev])
      showToast('Diary entry saved! 📓')
    }
    setDiaryTitle(''); setDiaryContent(''); setDiaryMood('😊'); setEditingDiary(null)
  }, [diaryTitle, diaryContent, diaryMood, editingDiary, showToast])

  const editDiaryEntry = useCallback((entry) => {
    setEditingDiary(entry); setDiaryTitle(entry.title); setDiaryContent(entry.content); setDiaryMood(entry.mood)
    setCurrentView('diary')
  }, [])

  const deleteDiaryEntry = useCallback((id) => {
    setDiaryEntries(prev => {
      const item = prev.find(e => e.id === id)
      if (item) {
        const undoId = Date.now()
        setUndoStack(s => [...s, { id: undoId, action: 'delete-diary', data: item }])
        setTimeout(() => setUndoStack(s => s.filter(u => u.id !== undoId)), 5000)
        showToast('Entry removed', 'info', { label: 'Undo', cb: () => {
          setUndoStack(s => { const u = s.find(x => x.id === undoId); if (u) { setDiaryEntries(p => [...p, u.data]); return s.filter(x => x.id !== undoId) } return s })
          dismissToast()
        }})
      }
      return prev.filter(e => e.id !== id)
    })
  }, [showToast, dismissToast])

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
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
          {toast.action && (
            <button className="toast-action" onClick={toast.action.cb}>{toast.action.label}</button>
          )}
        </div>
      )}

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
        {['tasks', 'spiritual', 'diary'].map(view => (
          <button key={view} className={`nav-item${currentView === view ? ' active' : ''}`} onClick={() => setCurrentView(view)}>
            {view === 'tasks' ? '📋 Tasks' : view === 'spiritual' ? '✨ Spiritual' : '📓 Diary'}
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
              <input type="time" className="time-input" value={taskTime} onChange={e => setTaskTime(e.target.value)} />
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
                    <span className="task-title">{t.text}</span>
                    <div className="task-meta">
                      {t.time && <span className="task-time">🕐 {t.time}</span>}
                      <span className={`task-cat ${t.category}`}>{t.category}</span>
                    </div>
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
              <p>Plan your scripture reading.</p>

              <div className="bible-version-select">
                <label className="bv-label">Bible Version</label>
                <select value={bibleVersion} onChange={e => setBibleVersion(e.target.value)}>
                  {BIBLE_VERSIONS.map(bv => (
                    <option key={bv.id} value={bv.id}>{bv.id} — {bv.name}</option>
                  ))}
                </select>
              </div>

              <div className="today-suggestion">
                Today's suggestion: <strong>{todaySuggestion.book} {todaySuggestion.chapter}</strong> &mdash; <em>{todaySuggestion.title}</em>
                <span className="bv-badge">{bibleVersion}</span>
              </div>

              <div className="study-inputs">
                <input type="text" placeholder="Book (e.g. Genesis)" value={studyBook} onChange={e => setStudyBook(e.target.value)} />
                <input type="number" placeholder="Ch" value={studyChapter} onChange={e => setStudyChapter(e.target.value)} min="1" />
              </div>
              <div className="study-actions">
                <button onClick={saveStudyPlan}>Save Plan</button>
                <button className="btn-outline" onClick={() => useSuggestion(todaySuggestion)}>📌 Use Suggestion</button>
              </div>
              {studyPlan.book && (
                <div className="study-current"><span className="study-icon">📖</span><span>Studying: {studyPlan.book} {studyPlan.chapter} <span className="bv-badge">{bibleVersion}</span></span></div>
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
                <div className="suggestion-footer">
                  <span className="bv-badge">{bibleVersion}</span>
                  <button className="btn-sm" onClick={() => useSuggestion(todaySuggestion)}>Study This</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {currentView === 'diary' && (
          <section className="view">
            <div className="card">
              <div className="card-icon">📓</div>
              <h3>{editingDiary ? 'Edit Entry' : 'New Diary Entry'}</h3>
              <p>Record your thoughts, prayers, and reflections.</p>

              <div className="diary-mood-select">
                <label className="diary-label">How are you feeling?</label>
                <div className="mood-picker">
                  {MOODS.map(m => (
                    <button key={m.emoji} className={`mood-btn${diaryMood === m.emoji ? ' active' : ''}`}
                      onClick={() => setDiaryMood(m.emoji)} title={m.label}>
                      {m.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <input type="text" placeholder="Title (optional)" value={diaryTitle}
                onChange={e => setDiaryTitle(e.target.value)} />

              <textarea className="diary-textarea" placeholder="Write your heart out..." value={diaryContent}
                onChange={e => setDiaryContent(e.target.value)} rows={5} />

              <div className="diary-actions">
                <button onClick={addDiaryEntry}>{editingDiary ? '✏️ Update Entry' : '💾 Save Entry'}</button>
                {editingDiary && (
                  <button className="btn-outline" onClick={() => { setEditingDiary(null); setDiaryTitle(''); setDiaryContent(''); setDiaryMood('😊') }}>Cancel</button>
                )}
              </div>
            </div>

            <div className="diary-list">
              <h3 className="section-title">📖 My Journal</h3>
              {diaryEntries.map(entry => (
                <div key={entry.id} className="diary-entry-card">
                  <div className="diary-entry-header">
                    <span className="diary-entry-mood">{entry.mood}</span>
                    <div className="diary-entry-info">
                      <span className="diary-entry-title">{entry.title || 'Untitled'}</span>
                      <span className="diary-entry-date">{formatDate(entry.date)}{entry.date && ` at ${formatTime(entry.date)}`}</span>
                    </div>
                  </div>
                  <p className="diary-entry-content">{entry.content}</p>
                  <div className="diary-entry-actions">
                    <button className="diary-edit-btn" onClick={() => editDiaryEntry(entry)}>✏️ Edit</button>
                    <button className="diary-delete-btn" onClick={() => deleteDiaryEntry(entry.id)}>🗑 Delete</button>
                  </div>
                </div>
              ))}
              {diaryEntries.length === 0 && (
                <div className="empty-state"><span className="empty-icon">📓</span><p>No journal entries yet. Start writing!</p></div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer>
        <p>Saved locally ✦ Offline ready ✦ Faith driven</p>
      </footer>

      <div className="fab-group">
        {GROQ_READY && (
          <button className="fab-guide" onClick={() => setShowGuide(true)} title="AI Guide" aria-label="AI Guide">
            ❓
          </button>
        )}
        {GROQ_READY && (
          <button className={`chat-fab ${chatOpen ? ' open' : ''}`} onClick={() => setChatOpen(o => !o)}>
            {chatOpen ? '✕' : '💬'}
          </button>
        )}
      </div>

      {showGuide && (
        <div className="guide-overlay" onClick={() => setShowGuide(false)}>
          <div className="guide-panel" onClick={e => e.stopPropagation()}>
            <div className="guide-header">
              <span className="guide-title">🤖 AI Service Guide</span>
              <button className="guide-close" onClick={() => setShowGuide(false)}>✕</button>
            </div>
            <div className="guide-body">
              <div className="guide-section">
                <h4>What is the AI Assistant?</h4>
                <p>The Faith Assistant is a conversational AI powered by <strong>GROQ's mixtral-8x7b-32768</strong> model. It provides scripture-based guidance, prayer support, and life advice.</p>
              </div>

              <div className="guide-section">
                <h4>How to Set Up</h4>
                <ol>
                  <li>Get a free API key from <a href="https://console.groq.com" target="_blank" rel="noopener">console.groq.com</a></li>
                  <li>Create a <code>.env</code> file in the project root (or edit the existing one)</li>
                  <li>Add: <code>VITE_GROQ_API_KEY=your_key_here</code></li>
                  <li>Restart the dev server or rebuild the APK</li>
                </ol>
              </div>

              <div className="guide-section">
                <h4>What It Can Do</h4>
                <ul>
                  <li>Share Bible verses and encouragement</li>
                  <li>Answer questions about faith and scripture</li>
                  <li>Provide prayer guidance</li>
                  <li>Offer life advice from a Christian perspective</li>
                  <li>Help with your tasks and spiritual goals</li>
                </ul>
              </div>

              <div className="guide-section">
                <h4>Privacy</h4>
                <p>Your chats are stored locally in your browser's localStorage. They are <strong>never sent to any server</strong> except to GROQ's API for AI responses. The API key stays in your <code>.env</code> file and is never shared.</p>
              </div>

              <div className="guide-section">
                <h4>Tips</h4>
                <ul>
                  <li>Be specific in your questions for better answers</li>
                  <li>The AI remembers the last 6 messages of context</li>
                  <li>You can ask about your current tasks</li>
                  <li>All data persists offline via localStorage</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {GROQ_READY && chatOpen && (
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
    </div>
  )
}
