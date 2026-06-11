import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import { HYMNS } from './hymns.js'
import { DEVOTIONALS } from './devotional.js'
import { getNow, getDayOfYear, formatDateTime, formatTimeShort, getAllTimezones, getGreeting as getTzGreeting, getTodaySeed, getTodayISO, TIMEZONES } from './dateUtils.js'
import { playHymn, stopHymn } from './hymnMusic.js'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const API_URL = import.meta.env.VITE_API_URL || ''
const AI_READY = (GROQ_API_KEY && GROQ_API_KEY !== 'YOUR_GROQ_API_KEY_HERE') || Boolean(API_URL)

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
  { id: "ASV", name: "American Standard Version" },
  { id: "RSV", name: "Revised Standard Version" },
  { id: "GNB", name: "Good News Bible" },
  { id: "WEB", name: "World English Bible" },
]

const MOODS = [
  { emoji: "😊", label: "Joyful" },
  { emoji: "🙂", label: "Grateful" },
  { emoji: "😐", label: "Peaceful" },
  { emoji: "😢", label: "Anxious" },
  { emoji: "😭", label: "Struggling" },
]

const TIMEZONE_LIST = TIMEZONES
const HYMN_WITH_TUNES = new Set([1,2,3,4,5,6,7,8,9,10,11,15,19,20,21,22,23,35,36,39,40,41,44,47,48,49])

const BIBLE_BOOKS = [
  { id: "Genesis", chapters: 50, testament: "OT" },
  { id: "Exodus", chapters: 40, testament: "OT" },
  { id: "Leviticus", chapters: 27, testament: "OT" },
  { id: "Numbers", chapters: 36, testament: "OT" },
  { id: "Deuteronomy", chapters: 34, testament: "OT" },
  { id: "Joshua", chapters: 24, testament: "OT" },
  { id: "Judges", chapters: 21, testament: "OT" },
  { id: "Ruth", chapters: 4, testament: "OT" },
  { id: "1 Samuel", chapters: 31, testament: "OT" },
  { id: "2 Samuel", chapters: 24, testament: "OT" },
  { id: "1 Kings", chapters: 22, testament: "OT" },
  { id: "2 Kings", chapters: 25, testament: "OT" },
  { id: "1 Chronicles", chapters: 29, testament: "OT" },
  { id: "2 Chronicles", chapters: 36, testament: "OT" },
  { id: "Ezra", chapters: 10, testament: "OT" },
  { id: "Nehemiah", chapters: 13, testament: "OT" },
  { id: "Esther", chapters: 10, testament: "OT" },
  { id: "Job", chapters: 42, testament: "OT" },
  { id: "Psalm", chapters: 150, testament: "OT" },
  { id: "Proverbs", chapters: 31, testament: "OT" },
  { id: "Ecclesiastes", chapters: 12, testament: "OT" },
  { id: "Song of Solomon", chapters: 8, testament: "OT" },
  { id: "Isaiah", chapters: 66, testament: "OT" },
  { id: "Jeremiah", chapters: 52, testament: "OT" },
  { id: "Lamentations", chapters: 5, testament: "OT" },
  { id: "Ezekiel", chapters: 48, testament: "OT" },
  { id: "Daniel", chapters: 12, testament: "OT" },
  { id: "Hosea", chapters: 14, testament: "OT" },
  { id: "Joel", chapters: 3, testament: "OT" },
  { id: "Amos", chapters: 9, testament: "OT" },
  { id: "Obadiah", chapters: 1, testament: "OT" },
  { id: "Jonah", chapters: 4, testament: "OT" },
  { id: "Micah", chapters: 7, testament: "OT" },
  { id: "Nahum", chapters: 3, testament: "OT" },
  { id: "Habakkuk", chapters: 3, testament: "OT" },
  { id: "Zephaniah", chapters: 3, testament: "OT" },
  { id: "Haggai", chapters: 2, testament: "OT" },
  { id: "Zechariah", chapters: 14, testament: "OT" },
  { id: "Malachi", chapters: 4, testament: "OT" },
  { id: "Matthew", chapters: 28, testament: "NT" },
  { id: "Mark", chapters: 16, testament: "NT" },
  { id: "Luke", chapters: 24, testament: "NT" },
  { id: "John", chapters: 21, testament: "NT" },
  { id: "Acts", chapters: 28, testament: "NT" },
  { id: "Romans", chapters: 16, testament: "NT" },
  { id: "1 Corinthians", chapters: 16, testament: "NT" },
  { id: "2 Corinthians", chapters: 13, testament: "NT" },
  { id: "Galatians", chapters: 6, testament: "NT" },
  { id: "Ephesians", chapters: 6, testament: "NT" },
  { id: "Philippians", chapters: 4, testament: "NT" },
  { id: "Colossians", chapters: 4, testament: "NT" },
  { id: "1 Thessalonians", chapters: 5, testament: "NT" },
  { id: "2 Thessalonians", chapters: 3, testament: "NT" },
  { id: "1 Timothy", chapters: 6, testament: "NT" },
  { id: "2 Timothy", chapters: 4, testament: "NT" },
  { id: "Titus", chapters: 3, testament: "NT" },
  { id: "Philemon", chapters: 1, testament: "NT" },
  { id: "Hebrews", chapters: 13, testament: "NT" },
  { id: "James", chapters: 5, testament: "NT" },
  { id: "1 Peter", chapters: 5, testament: "NT" },
  { id: "2 Peter", chapters: 3, testament: "NT" },
  { id: "1 John", chapters: 5, testament: "NT" },
  { id: "2 John", chapters: 1, testament: "NT" },
  { id: "3 John", chapters: 1, testament: "NT" },
  { id: "Jude", chapters: 1, testament: "NT" },
  { id: "Revelation", chapters: 22, testament: "NT" },
]

const COLOR_THEMES = {
  believersflow: { name: 'BelieversFlow', bg: ['#0a0a1a','#1a0a2e','#16213e','#0f1a2e'], header: ['rgba(26,10,46,0.95)','rgba(123,45,142,0.35)','rgba(58,123,213,0.15)'], gold: '#f2c94c', blue: '#3a7bd5', purple: '#7b2d8e' },
  royal: { name: 'Royal', bg: ['#1a0a0a','#2e0a0a','#3e1515','#2e0f0f'], header: ['rgba(46,10,10,0.95)','rgba(142,45,45,0.35)','rgba(213,58,58,0.15)'], gold: '#ffd700', blue: '#d54a3a', purple: '#8e2d2d' },
  emerald: { name: 'Emerald', bg: ['#0a1a0f','#0a2e15','#153e20','#0f2e18'], header: ['rgba(10,46,21,0.95)','rgba(45,142,69,0.35)','rgba(58,213,99,0.15)'], gold: '#c9f24c', blue: '#3ad57b', purple: '#2d8e4a' },
  ocean: { name: 'Ocean', bg: ['#0a0f1a','#0a152e','#15203e','#0f182e'], header: ['rgba(10,21,46,0.95)','rgba(45,69,142,0.35)','rgba(58,99,213,0.15)'], gold: '#4cf2e8', blue: '#3a7bd5', purple: '#2d4a8e' },
  sunset: { name: 'Sunset', bg: ['#1a0f0a','#2e150a','#3e2015','#2e180f'], header: ['rgba(46,21,10,0.95)','rgba(142,69,45,0.35)','rgba(213,139,58,0.15)'], gold: '#f2a84c', blue: '#d58b3a', purple: '#8e5a2d' },
}

const FONT_SIZES = { small: '13px', medium: '15px', large: '17px' }

const DEFAULT_SETTINGS = {
  theme: 'believersflow', mode: 'dark', fontSize: 'medium', readingLayout: 'standard',
  notifications: { prayerReminder: true, dailyVerse: true, taskReminders: true },
  language: 'en', profileName: '', profileEmail: '', backupEnabled: false,
}

const DEFAULT_CUSTOM_COLORS = { primary: '#3a7bd5', accent: '#f2c94c', background: '#0a0a1a' }

const THEME_OPTIONS = [
  { id: 'believersflow', name: 'BelieversFlow', colors: ['#7b2d8e', '#f2c94c', '#3a7bd5'] },
  { id: 'royal', name: 'Royal', colors: ['#8e2d2d', '#ffd700', '#d54a3a'] },
  { id: 'emerald', name: 'Emerald', colors: ['#2d8e4a', '#c9f24c', '#3ad57b'] },
  { id: 'ocean', name: 'Ocean', colors: ['#2d4a8e', '#4cf2e8', '#3a7bd5'] },
  { id: 'sunset', name: 'Sunset', colors: ['#8e5a2d', '#f2a84c', '#d58b3a'] },
]

function loadState(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function saveState(key, val) { localStorage.setItem(key, JSON.stringify(val)) }

function getStreak(logs) {
  if (!logs.length) return 0
  let streak = 0
  const today = getNow()
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
    const today = getNow().toDateString()
    const saved = loadState('btf_verseDate', '')
    if (saved === today) return loadState('btf_verseIndex', 0)
    const idx = Math.floor(Math.random() * VERSES.length)
    saveState('btf_verseDate', today); saveState('btf_verseIndex', idx)
    return idx
  })
  const [greeting, setGreeting] = useState(getTzGreeting)
  const [clockTick, setClockTick] = useState(0)
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
  const [todayPrayer] = useState(() => DAILY_PRAYERS[getNow().getDate() % DAILY_PRAYERS.length])
  const [undoStack, setUndoStack] = useState([])
  const [showGuide, setShowGuide] = useState(false)
  const [diaryTitle, setDiaryTitle] = useState('')
  const [diaryContent, setDiaryContent] = useState('')
  const [diaryMood, setDiaryMood] = useState('😊')
  const [editingDiary, setEditingDiary] = useState(null)
  const [bibleBook, setBibleBook] = useState('Genesis')
  const [bibleChapter, setBibleChapter] = useState(1)
  const [bibleText, setBibleText] = useState(null)
  const [bibleLoading, setBibleLoading] = useState(false)
  const [bibleError, setBibleError] = useState(null)
  const [bibleTestament, setBibleTestament] = useState('OT')
  const [recentReads, setRecentReads] = useState(() => loadState('btf_recentReads', []))
  const [bibleStudyTab, setBibleStudyTab] = useState('read')
  const [explanation, setExplanation] = useState(null)
  const [explanationLoading, setExplanationLoading] = useState(false)
  const [commentary, setCommentary] = useState(null)
  const [commentaryLoading, setCommentaryLoading] = useState(false)
  const [concordanceQuery, setConcordanceQuery] = useState('')
  const [concordanceResults, setConcordanceResults] = useState(null)
  const [concordanceLoading, setConcordanceLoading] = useState(false)
  const [comparison, setComparison] = useState(null)
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const chatEnd = useRef(null)
  const chatInput = useRef(null)
  const [settings, setSettings] = useState(() => loadState('btf_settings', DEFAULT_SETTINGS))
  const [customColors, setCustomColors] = useState(() => loadState('btf_customColors', DEFAULT_CUSTOM_COLORS))
  const [settingsSection, setSettingsSection] = useState('appearance')
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const done = loadState('btf_onboardingDone', false)
    return !done
  })
  const [onboardingStep, setOnboardingStep] = useState(0)

  // Hymns state
  const [hymnSearch, setHymnSearch] = useState('')
  const [selectedHymn, setSelectedHymn] = useState(null)
  const [hymnCategory, setHymnCategory] = useState('all')
  const [hymnFavorites, setHymnFavorites] = useState(() => loadState('btf_hymnFavorites', []))
  const [hymnPlaying, setHymnPlaying] = useState(false)
  const [hymnRecentlyViewed, setHymnRecentlyViewed] = useState(() => loadState('btf_recentHymns', []))
  const [todaysHymn, setTodaysHymn] = useState(() => HYMNS[getNow().getDate() % HYMNS.length])
  const [selectedTimezone, setSelectedTimezone] = useState('WAT')
  const [navOrder, setNavOrder] = useState(() => loadState('btf_navOrder', ['tasks', 'spiritual', 'diary', 'bible', 'hymns', 'devotional', 'settings']))
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragTarget, setDragTarget] = useState(null)
  const navRef = useRef(null)
  const touchDragItem = useRef(null)

  // Devotional state
  const [devotionalDay, setDevotionalDay] = useState(() => {
    const saved = loadState('btf_devotionalDay', 0)
    return saved || (getDayOfYear() % 365)
  })
  const [devotionalFontSize, setDevotionalFontSize] = useState(() => loadState('btf_devFontSize', 'medium'))

  const completeOnboarding = useCallback(() => {
    setShowOnboarding(false)
    saveState('btf_onboardingDone', true)
  }, [])

  const streak = getStreak(prayerLogs)
  const verse = VERSES[verseIndex]
  const currentBook = BIBLE_BOOKS.find(b => b.id === bibleBook)
  const chapterCount = currentBook ? currentBook.chapters : 1

  useEffect(() => { saveState('btf_tasks', tasks) }, [tasks])
  useEffect(() => { saveState('btf_prayerLogs', prayerLogs) }, [prayerLogs])
  useEffect(() => { saveState('btf_studyPlan', studyPlan) }, [studyPlan])
  useEffect(() => { saveState('btf_chat', chatHistory) }, [chatHistory])
  useEffect(() => { saveState('btf_diary', diaryEntries) }, [diaryEntries])
  useEffect(() => { saveState('btf_bibleVersion', bibleVersion) }, [bibleVersion])
  useEffect(() => { saveState('btf_recentReads', recentReads) }, [recentReads])
  useEffect(() => { saveState('btf_hymnFavorites', hymnFavorites) }, [hymnFavorites])
  useEffect(() => { saveState('btf_recentHymns', hymnRecentlyViewed) }, [hymnRecentlyViewed])
  useEffect(() => { saveState('btf_devotionalDay', devotionalDay) }, [devotionalDay])
  useEffect(() => { saveState('btf_devFontSize', devotionalFontSize) }, [devotionalFontSize])
  useEffect(() => { saveState('btf_navOrder', navOrder) }, [navOrder])
  useEffect(() => { if (chatOpen && chatInput.current) chatInput.current.focus() }, [chatOpen])
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatHistory])


  useEffect(() => {
    setGreeting(getTzGreeting())
    const id = setInterval(() => { setClockTick(t => t + 1); setGreeting(getTzGreeting()) }, 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const el = document.querySelector('.fab-group')
    if (!el) return
    let x = 0, y = 0, startX = 0, startY = 0, dragging = false

    function onStart(e) {
      const t = e.touches ? e.touches[0] : e
      startX = t.clientX - el.offsetLeft
      startY = t.clientY - el.offsetTop
      dragging = true
      el.style.transition = 'none'
    }
    function onMove(e) {
      if (!dragging) return
      e.preventDefault()
      const t = e.touches ? e.touches[0] : e
      x = t.clientX - startX
      y = t.clientY - startY
      x = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, x))
      y = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, y))
      el.style.left = x + 'px'
      el.style.right = 'auto'
      el.style.top = y + 'px'
      el.style.bottom = 'auto'
    }
    function onEnd() {
      dragging = false
      el.style.transition = 'all 0.2s'
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('mousedown', onStart)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onEnd)

    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('mousedown', onStart)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onEnd)
    }
  }, [])

  useEffect(() => {
    const app = document.getElementById('app')
    if (!app) return
    const theme = COLOR_THEMES[settings.theme] || COLOR_THEMES.believersflow
    const isLight = settings.mode === 'light'
    app.setAttribute('data-theme', isLight ? 'light' : settings.theme)
    app.setAttribute('data-mode', settings.mode)
    app.style.fontSize = FONT_SIZES[settings.fontSize] || '15px'
    app.setAttribute('data-reading-layout', settings.readingLayout)
    if (settings.theme === 'custom') {
      Object.entries(customColors).forEach(([k, v]) => app.style.setProperty(`--custom-${k}`, v))
    }
    saveState('btf_settings', settings)
    saveState('btf_customColors', customColors)
  }, [settings, customColors])

  useEffect(() => {
    if (currentView !== 'bible') return
    fetchChapter(bibleBook, bibleChapter, bibleVersion)
  }, [bibleBook, bibleChapter, bibleVersion, currentView])

  const fetchChapter = useCallback(async (book, chapter, version) => {
    const ver = version || bibleVersion
    const cacheKey = `btf_bible_${ver}_${book}_${chapter}`
    const cached = loadState(cacheKey, null)
    if (cached) { setBibleText(cached); setBibleError(null); setBibleLoading(false); return }

    setBibleLoading(true); setBibleError(null)
    try {
      let data
      if (ver === 'KJV') {
        const res = await fetch(`https://bible-api.com/${encodeURIComponent(book)}+${chapter}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        data = await res.json()
      } else if (API_URL) {
        const res = await fetch(`${API_URL}/api/bible?book=${encodeURIComponent(book)}&chapter=${chapter}&version=${ver}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        data = await res.json()
      } else {
        throw new Error('Backend API required for non-KJV versions')
      }
      if (!data.verses) data = { reference: `${book} ${chapter}`, verses: [], version: ver }
      setBibleText(data)
      saveState(cacheKey, data)
      setRecentReads(prev => {
        const filtered = prev.filter(r => !(r.book === book && r.chapter === chapter))
        return [{ book, chapter, ref: `${book} ${chapter}`, time: Date.now() }, ...filtered].slice(0, 15)
      })
    } catch (e) {
      setBibleError(e.message === 'Failed to fetch' ? 'Connect to the internet to read this chapter.' : `Could not load chapter. ${e.message}`)
      setBibleText(null)
    } finally { setBibleLoading(false) }
  }, [recentReads, bibleVersion])

  const showToast = useCallback((msg, type = 'success', action = null) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message: msg, type, action })
    toastTimer.current = setTimeout(() => setToast(null), 4500)
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
        setTimeout(() => setUndoStack(s => s.filter(u => u.id !== undoId)), 6000)
        showToast('Task deleted', 'info', { label: '↩ Undo', cb: () => {
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
    goToBibleChapter(s.book, s.chapter)
    showToast(`📖 ${s.book} ${s.chapter}`)
  }, [showToast, goToBibleChapter])

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
        setTimeout(() => setUndoStack(s => s.filter(u => u.id !== undoId)), 6000)
        showToast('Entry removed', 'info', { label: '↩ Undo', cb: () => {
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
    if (!AI_READY && !API_URL) { showToast('Set VITE_GROQ_API_KEY in .env or deploy backend', 'warning'); return }

    const userEntry = { role: 'user', content: msg }
    setChatHistory(prev => [...prev, userEntry])
    setChatMsg(''); setChatLoading(true)

    const taskContext = tasks.length ? `The user's current tasks are: ${tasks.map(t => t.text).join(', ')}` : ''

    try {
      let reply = ''
      if (API_URL) {
        const res = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...chatHistory.slice(-6), userEntry],
            taskContext,
          })
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        reply = data.message
      } else {
        const systemPrompt = `You are a compassionate Christian mentor and life coach. Respond with warmth, scripture wisdom, and practical advice. Keep responses concise (2-4 sentences). Write in plain natural language. Do not use emojis, asterisks, hash symbols, tildes, or any markdown formatting. Use only plain English sentences. ${taskContext ? `\nContext: ${taskContext}` : ''}`
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'mixtral-8x7b-32768',
            messages: [{ role: 'system', content: systemPrompt }, ...chatHistory.slice(-6), userEntry],
          })
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        reply = data.choices[0].message.content
      }
      setChatHistory(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting. Please check your connection and try again. 🙏" }])
    } finally { setChatLoading(false) }
  }, [chatMsg, chatLoading, chatHistory, tasks])

  const goToBibleChapter = useCallback((book, chapter) => {
    setBibleBook(book); setBibleChapter(chapter)
    setCurrentView('bible')
  }, [])

  const swapNavItems = useCallback((from, to) => {
    setNavOrder(prev => {
      const arr = [...prev]
      const fromIdx = arr.indexOf(from)
      const toIdx = arr.indexOf(to)
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev
      arr.splice(fromIdx, 1)
      arr.splice(toIdx, 0, from)
      return arr
    })
  }, [])

  const handleDragStart = useCallback((e, view) => {
    setDraggedItem(view)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', view)
  }, [])

  const handleDragOver = useCallback((e, view) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (view !== draggedItem) setDragTarget(view)
  }, [draggedItem])

  const handleDrop = useCallback((e, view) => {
    e.preventDefault()
    if (draggedItem && view !== draggedItem) swapNavItems(draggedItem, view)
    setDraggedItem(null)
    setDragTarget(null)
  }, [draggedItem, swapNavItems])

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null)
    setDragTarget(null)
  }, [])

  const handleTouchStart = useCallback((e, view) => {
    touchDragItem.current = view
    setDraggedItem(view)
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!touchDragItem.current || !navRef.current) return
    const touch = e.touches[0]
    const children = [...navRef.current.children]
    for (const child of children) {
      const rect = child.getBoundingClientRect()
      if (touch.clientX >= rect.left && touch.clientX <= rect.right) {
        const childView = child.getAttribute('data-view')
        if (childView && childView !== touchDragItem.current) {
          setDragTarget(childView)
        }
        break
      }
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (touchDragItem.current && dragTarget && dragTarget !== touchDragItem.current) {
      swapNavItems(touchDragItem.current, dragTarget)
    }
    touchDragItem.current = null
    setDraggedItem(null)
    setDragTarget(null)
  }, [dragTarget, swapNavItems])

  const apiPost = useCallback(async (path, body) => {
    if (!API_URL) { showToast('Backend API not configured', 'warning'); return null }
    try {
      const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (e) {
      showToast(`Request failed: ${e.message}`, 'warning')
      return null
    }
  }, [showToast])

  const explainVerse = useCallback(async (reference, text) => {
    setExplanationLoading(true); setExplanation(null); setBibleStudyTab('explain')
    const data = await apiPost('/api/bible/explain', { reference, text, version: bibleVersion })
    if (data) setExplanation(data)
    setExplanationLoading(false)
  }, [apiPost, bibleVersion])

  const getCommentary = useCallback(async () => {
    if (!bibleText) return
    setCommentaryLoading(true); setCommentary(null); setBibleStudyTab('commentary')
    const verses = (bibleText.verses || []).map(v => ({ verse: v.verse, text: v.text }))
    const data = await apiPost('/api/bible/commentary', { book: bibleBook, chapter: bibleChapter, verses })
    if (data) setCommentary(data)
    setCommentaryLoading(false)
  }, [apiPost, bibleText, bibleBook, bibleChapter])

  const searchConcordance = useCallback(async () => {
    const q = concordanceQuery.trim()
    if (!q) return
    setConcordanceLoading(true); setConcordanceResults(null); setBibleStudyTab('concordance')
    const data = await apiPost('/api/bible/concordance', { query: q, version: bibleVersion })
    if (data) setConcordanceResults(data)
    setConcordanceLoading(false)
  }, [apiPost, concordanceQuery, bibleVersion])

  const compareVersions = useCallback(async () => {
    setComparisonLoading(true); setComparison(null); setBibleStudyTab('compare')
    const data = await apiPost('/api/bible/compare', { book: bibleBook, chapter: bibleChapter })
    if (data) setComparison(data)
    setComparisonLoading(false)
  }, [apiPost, bibleBook, bibleChapter])

  // Hymns
  const openHymn = useCallback((hymn) => {
    setSelectedHymn(hymn)
    setHymnRecentlyViewed(prev => {
      const filtered = prev.filter(h => h.id !== hymn.id)
      return [{ id: hymn.id, title: hymn.title, author: hymn.author }, ...filtered].slice(0, 15)
    })
  }, [])

  const closeHymn = useCallback(() => {
    if (hymnPlaying) { stopHymn(); setHymnPlaying(false) }
    setSelectedHymn(null)
  }, [hymnPlaying])

  const toggleHymnFavorite = useCallback((id) => {
    setHymnFavorites(prev => {
      const isFav = prev.includes(id)
      showToast(isFav ? 'Removed from favorites' : 'Added to favorites!')
      return isFav ? prev.filter(f => f !== id) : [...prev, id]
    })
  }, [showToast])

  const toggleHymnPlay = useCallback(async (hymnId) => {
    if (hymnPlaying) {
      stopHymn()
      setHymnPlaying(false)
    } else {
      setHymnPlaying(true)
      await playHymn(hymnId, () => setHymnPlaying(false))
    }
  }, [hymnPlaying])

  const searchHymns = useCallback(() => {
    const q = hymnSearch.trim().toLowerCase()
    if (!q) return HYMNS
    return HYMNS.filter(h =>
      h.title.toLowerCase().includes(q) ||
      (h.author && h.author.toLowerCase().includes(q)) ||
      (h.category && h.category.toLowerCase().includes(q))
    )
  }, [hymnSearch])

  const getFilteredHymns = useCallback(() => {
    let list = hymnSearch.trim() ? searchHymns() : HYMNS
    if (hymnCategory !== 'all') {
      list = list.filter(h => h.category === hymnCategory)
    }
    return list
  }, [hymnSearch, hymnCategory, searchHymns])

  const getDailyHymn = useCallback(() => {
    return HYMNS[getDayOfYear() % HYMNS.length]
  }, [])

  const categories = ['all', ...new Set(HYMNS.map(h => h.category).filter(Boolean))]

  // Devotional
  const currentDevotional = DEVOTIONALS[devotionalDay % 365]

  const nextDevotional = useCallback(() => {
    setDevotionalDay(prev => (prev + 1) % 365)
  }, [])

  const prevDevotional = useCallback(() => {
    setDevotionalDay(prev => (prev - 1 + 365) % 365)
  }, [])

  const goToTodaysDevotional = useCallback(() => {
    const today = getDayOfYear() - 1
    setDevotionalDay(Math.max(0, today % 365))
    showToast("Today's devotional")
  }, [showToast])

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateNotification = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, [key]: value } }))
  }, [])

  const updateCustomColor = useCallback((key, value) => {
    setCustomColors(prev => ({ ...prev, [key]: value }))
  }, [])

  const exportData = useCallback(() => {
    const data = { tasks, prayerLogs, studyPlan, diaryEntries, bibleVersion, chatHistory, settings, customColors, recentReads }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `believersflow-backup-${getNow().toISOString().slice(0, 10)}.json`
    a.click(); URL.revokeObjectURL(url)
    showToast('Backup exported! 📦')
  }, [tasks, prayerLogs, studyPlan, diaryEntries, bibleVersion, chatHistory, settings, customColors, recentReads, showToast])

  const importData = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json'
    input.onchange = e => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result)
          if (data.tasks) setTasks(data.tasks)
          if (data.prayerLogs) setPrayerLogs(data.prayerLogs)
          if (data.studyPlan) setStudyPlan(data.studyPlan)
          if (data.diaryEntries) setDiaryEntries(data.diaryEntries)
          if (data.bibleVersion) setBibleVersion(data.bibleVersion)
          if (data.chatHistory) setChatHistory(data.chatHistory)
          if (data.settings) setSettings(data.settings)
          if (data.customColors) setCustomColors(data.customColors)
          showToast('Backup restored! 📦')
        } catch { showToast('Invalid backup file', 'warning') }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [showToast])

  const resetAllData = useCallback(() => {
    if (confirm('Delete all data? This cannot be undone.')) {
      localStorage.clear()
      setTasks([]); setPrayerLogs([]); setStudyPlan({ book: '', chapter: '' })
      setDiaryEntries([]); setChatHistory([]); setRecentReads([])
      setSettings(DEFAULT_SETTINGS); setCustomColors(DEFAULT_CUSTOM_COLORS)
      showToast('All data reset 🔄')
    }
  }, [showToast])

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const spiritualCount = tasks.filter(t => t.category === 'spiritual').length
  const spiritualPercent = totalTasks > 0 ? Math.round((spiritualCount / totalTasks) * 100) : 0
  const secularPercent = 100 - spiritualPercent
  const todayStr = getNow().toLocaleDateString()
  const prayedToday = prayerLogs.some(l => l.date === todayStr)
  const todaySuggestion = STUDY_SUGGESTIONS[getNow().getDate() % STUDY_SUGGESTIONS.length]
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
          {toast.action && <button className="toast-action" onClick={toast.action.cb}>{toast.action.label}</button>}
        </div>
      )}

      <header>
        <div className="greeting">{greeting.icon} {greeting.msg} <span className="live-clock-badge">{formatTimeShort()}</span></div>
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

        <nav id="main-nav" ref={navRef} aria-label="Main navigation"
          onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
          {navOrder.map(view => (
            <div key={view} data-view={view}
              className={`nav-item-wrap${draggedItem === view ? ' dragging' : ''}${dragTarget === view ? ' drag-target' : ''}${!draggedItem ? ' drag-hint' : ''}`}
              draggable
              onDragStart={e => handleDragStart(e, view)}
              onDragOver={e => handleDragOver(e, view)}
              onDrop={e => handleDrop(e, view)}
              onDragEnd={handleDragEnd}
              onTouchStart={e => handleTouchStart(e, view)}>
              <button className={`nav-item${currentView === view ? ' active' : ''}`} onClick={() => setCurrentView(view)}
                aria-label={view === 'tasks' ? 'Tasks' : view === 'spiritual' ? 'Faith' : view === 'diary' ? 'Diary' : view === 'bible' ? 'Bible' : view === 'hymns' ? 'Hymns' : view === 'devotional' ? 'Daily Devotional' : 'Settings'}
                aria-current={currentView === view ? 'page' : undefined}>
                {view === 'tasks' ? '📋 Tasks' : view === 'spiritual' ? '✨ Faith' : view === 'diary' ? '📓 Diary' : view === 'bible' ? '📖 Bible' : view === 'hymns' ? '🎵 Hymns' : view === 'devotional' ? '🙏 Daily' : '⚙️'}
              </button>
            </div>
          ))}
        </nav>

      <main id="view-container">
        {currentView === 'tasks' && (
          <section className="view fade-in">
            <div className="grid-2col">
              <div className="progress-card hover-lift slide-up">
                <div className="progress-header"><span>Progress</span><span className="progress-pct">{completionPercent}%</span></div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${completionPercent}%` }} /></div>
                <p className="progress-sub">{completedTasks} of {totalTasks} done</p>
              </div>
              <div className="prayer-mini-card hover-lift slide-up">
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
                  <button className="task-delete-btn" onClick={() => deleteTask(t.id)} title="Delete task">🗑</button>
                </li>
              ))}
              {filteredTasks.length === 0 && (
                <div className="empty-state meaningful">
                  <div className="empty-icon-wrap">🙏</div>
                  <h4 className="empty-title">You are all caught up today</h4>
                  <p className="empty-verse">"Commit to the Lord whatever you do, and He will establish your plans."</p>
                  <p className="empty-ref">— Proverbs 16:3</p>
                  <p className="empty-hint">Add your first task above to begin your day with purpose.</p>
                </div>
              )}
            </ul>
          </section>
        )}

        {currentView === 'spiritual' && (
          <section className="view fade-in">
            <div className="daily-prayer-card slide-up">
              <div className="dp-icon">🕯</div>
              <div className="dp-content">
                <h4>Today's Prayer</h4>
                <p>&ldquo;{todayPrayer}&rdquo;</p>
              </div>
            </div>

            <div className="card hover-lift slide-up">
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
                {!prayerLogs.length && (
                  <div className="empty-small meaningful">
                    <p className="empty-mini-title">Your prayer journey starts here</p>
                    <p className="empty-mini-text">Record prayers, reflections, and God's faithfulness in your life.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card hover-lift slide-up">
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

            <div className="card hover-lift slide-up">
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

            <div className="card hover-lift slide-up">
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
          <section className="view fade-in">
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
                <div className="empty-state meaningful">
                  <div className="empty-icon-wrap">📓</div>
                  <h4 className="empty-title">No notes yet</h4>
                  <p className="empty-hint">Highlight verses and write your personal reflections. Your journal is a safe place to grow in faith.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {currentView === 'bible' && (
          <section className="view fade-in">
            <div className="bible-study-tabs">
              {[
                { id: 'read', label: '📖 Read' },
                { id: 'explain', label: '💡 Explain' },
                { id: 'commentary', label: '📚 Commentary' },
                { id: 'concordance', label: '🔍 Concordance' },
                { id: 'compare', label: '⚖️ Compare' },
              ].map(t => (
                <button key={t.id} className={`bs-tab${bibleStudyTab === t.id ? ' active' : ''}`}
                  onClick={() => setBibleStudyTab(t.id)}>{t.label}</button>
              ))}
            </div>

            {bibleStudyTab === 'read' && (
              <>
                <div className="card">
                  <div className="card-icon">📖</div>
                  <h3>Holy Bible Reader</h3>
                  <p>Read all 66 books of the Bible. Chapters cached for offline reading.</p>

                  <div className="bible-nav">
                    <div className="bn-testaments">
                      <button className={`bn-test-btn${bibleTestament === 'OT' ? ' active' : ''}`} onClick={() => setBibleTestament('OT')}>Old Testament</button>
                      <button className={`bn-test-btn${bibleTestament === 'NT' ? ' active' : ''}`} onClick={() => setBibleTestament('NT')}>New Testament</button>
                    </div>
                    <div className="bn-book-row">
                      <div className="bn-book-select">
                        <select value={bibleBook} onChange={e => setBibleBook(e.target.value)}>
                          {BIBLE_BOOKS.filter(b => b.testament === bibleTestament).map(b => (
                            <option key={b.id} value={b.id}>{b.id} ({b.chapters} ch)</option>
                          ))}
                        </select>
                      </div>
                      <div className="bn-chapter-select">
                        <select value={bibleChapter} onChange={e => setBibleChapter(Number(e.target.value))}>
                          {Array.from({ length: chapterCount }, (_, i) => (
                            <option key={i + 1} value={i + 1}>Chapter {i + 1}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="bn-version-select">
                      <label className="bv-label">Translation</label>
                      <select value={bibleVersion} onChange={e => setBibleVersion(e.target.value)}>
                        {BIBLE_VERSIONS.map(bv => (
                          <option key={bv.id} value={bv.id}>{bv.id} — {bv.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="bn-chapter-nav">
                      <button className="bn-nav-btn" onClick={() => setBibleChapter(p => Math.max(1, p - 1))} disabled={bibleChapter <= 1}>◀ Prev</button>
                      <span className="bn-nav-ref">{bibleBook} {bibleChapter}</span>
                      <button className="bn-nav-btn" onClick={() => setBibleChapter(p => Math.min(chapterCount, p + 1))} disabled={bibleChapter >= chapterCount}>Next ▶</button>
                    </div>
                  </div>
                </div>

                <div className="bible-content-card">
                  {bibleLoading && (
                    <div className="bible-loading">
                      <span className="bible-loading-icon">📖</span>
                      <p>Loading {bibleBook} {bibleChapter}...</p>
                      <div className="bible-loading-bar"><div className="bible-loading-fill" /></div>
                    </div>
                  )}
                  {bibleError && (
                    <div className="bible-error">
                      <span className="bible-error-icon">⚠️</span>
                      <p>{bibleError}</p>
                      <button className="bn-nav-btn" onClick={() => fetchChapter(bibleBook, bibleChapter, bibleVersion)}>Retry</button>
                    </div>
                  )}
                  {bibleText && !bibleLoading && (
                    <div className="bible-text-container">
                      <div className="bible-text-header">
                        <h2 className="bible-text-ref">{bibleText.reference || `${bibleBook} ${bibleChapter}`}</h2>
                        <span className="bv-badge">{bibleVersion}</span>
                      </div>
                      <div className="bible-verses">
                        {(bibleText.verses || []).map((v, i) => (
                          <p key={i} className="bible-verse">
                            <sup className="bible-verse-num">{v.verse}</sup>
                            <span className="bible-verse-text">{v.text}</span>
                            {bibleText.verses.length <= 30 && (
                              <button className="verse-explain-btn" onClick={() => explainVerse(`${bibleBook} ${bibleChapter}:${v.verse}`, v.text)}
                                title="Explain this verse">💡</button>
                            )}
                          </p>
                        ))}
                      </div>
                      <div className="bible-text-actions">
                        <button className="btn-sm" onClick={getCommentary}>📚 Get Commentary</button>
                        <button className="btn-sm" onClick={compareVersions}>⚖️ Compare Versions</button>
                      </div>
                    </div>
                  )}
                  {!bibleText && !bibleLoading && !bibleError && (
                    <div className="bible-empty">
                      <span className="bible-empty-icon">📖</span>
                      <p>Select a book and chapter above to start reading.</p>
                    </div>
                  )}
                </div>

                {recentReads.length > 0 && (
                  <div className="card">
                    <h3>🕐 Recent Reads</h3>
                    <div className="recent-reads">
                      {recentReads.slice(0, 5).map((r, i) => (
                        <button key={i} className="recent-read-btn" onClick={() => goToBibleChapter(r.book, r.chapter)}>
                          📄 {r.book} {r.chapter}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {bibleStudyTab === 'explain' && (
              <div className="card bs-panel">
                <div className="card-icon">💡</div>
                <h3>AI Verse Explanation</h3>
                <p>Select a 💡 button next to any verse in the Read tab, or click a verse below.</p>
                {bibleText && (
                  <div className="explain-quick-verses">
                    {(bibleText.verses || []).slice(0, 10).map((v, i) => (
                      <button key={i} className="explain-verse-chip" onClick={() => explainVerse(`${bibleBook} ${bibleChapter}:${v.verse}`, v.text)}>
                        <sup>{v.verse}</sup> {v.text.slice(0, 60)}...
                      </button>
                    ))}
                  </div>
                )}
                {explanationLoading && (
                  <div className="skeleton-block">
                    <div className="skeleton-line w-75" />
                    <div className="skeleton-line w-50" />
                    <div className="skeleton-line w-90" />
                    <div className="skeleton-line w-60" />
                  </div>
                )}
                {explanation && !explanationLoading && (
                  <div className="explanation-content">
                    <h4 className="explanation-ref">{explanation.reference}</h4>
                    <div className="explanation-text">{explanation.explanation}</div>
                  </div>
                )}
                {!explanation && !explanationLoading && !bibleText && (
                  <p className="bs-hint">Open a chapter first, then tap 💡 on any verse.</p>
                )}
              </div>
            )}

            {bibleStudyTab === 'commentary' && (
              <div className="card bs-panel">
                <div className="card-icon">📚</div>
                <h3>AI Bible Commentary</h3>
                <p>Get verse-by-verse commentary and theological insights.</p>
                {bibleText && !commentary && !commentaryLoading && (
                  <button className="btn-primary" onClick={getCommentary}>📚 Generate Commentary</button>
                )}
                {commentaryLoading && (
                  <div className="skeleton-block">
                    <div className="skeleton-line w-85" />
                    <div className="skeleton-line w-60" />
                    <div className="skeleton-line w-70" />
                    <div className="skeleton-line w-55" />
                    <div className="skeleton-line w-80" />
                  </div>
                )}
                {commentary && !commentaryLoading && (
                  <div className="commentary-content">
                    <h4>{commentary.book} {commentary.chapter}</h4>
                    <div className="commentary-text">{commentary.commentary}</div>
                  </div>
                )}
                {!bibleText && !commentary && (
                  <p className="bs-hint">Open a chapter first, then generate commentary.</p>
                )}
              </div>
            )}

            {bibleStudyTab === 'concordance' && (
              <div className="card bs-panel">
                <div className="card-icon">🔍</div>
                <h3>Bible Concordance</h3>
                <p>Search for any word or topic across Scripture.</p>
                <div className="concordance-input">
                  <input type="text" placeholder="Search word or topic (e.g., faith, love, prayer)" value={concordanceQuery}
                    onChange={e => setConcordanceQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchConcordance()} />
                  <button onClick={searchConcordance} disabled={concordanceLoading || !concordanceQuery.trim()}>Search</button>
                </div>
                {concordanceLoading && (
                  <div className="skeleton-block">
                    <div className="skeleton-line w-60" />
                    <div className="skeleton-line w-80" />
                    <div className="skeleton-line w-45" />
                    <div className="skeleton-line w-70" />
                  </div>
                )}
                {concordanceResults && !concordanceLoading && (
                  <div className="concordance-results">
                    <h4>Results for: "{concordanceResults.query}"</h4>
                    <div className="concordance-text">{concordanceResults.results}</div>
                  </div>
                )}
              </div>
            )}

            {bibleStudyTab === 'compare' && (
              <div className="card bs-panel">
                <div className="card-icon">⚖️</div>
                <h3>Bible Comparison Tool</h3>
                <p>Compare how different translations render the same passage.</p>
                {bibleText && !comparison && !comparisonLoading && (
                  <button className="btn-primary" onClick={compareVersions}>⚖️ Compare {bibleBook} {bibleChapter}</button>
                )}
                {comparisonLoading && (
                  <div className="skeleton-block">
                    <div className="skeleton-line w-70" />
                    <div className="skeleton-line w-90" />
                    <div className="skeleton-line w-50" />
                    <div className="skeleton-line w-75" />
                  </div>
                )}
                {comparison && !comparisonLoading && (
                  <div className="comparison-content">
                    <h4>{comparison.book} {comparison.chapter}</h4>
                    <div className="comparison-text">{comparison.comparison}</div>
                  </div>
                )}
                {!bibleText && !comparison && (
                  <p className="bs-hint">Open a chapter first, then compare translations.</p>
                )}
              </div>
            )}
          </section>
        )}

        {currentView === 'hymns' && (
          <section className="view fade-in">
            {!selectedHymn ? (
              <>
                <div className="card">
                  <div className="card-icon">🎵</div>
                  <h3>Hymn Book</h3>
                  <p>Over 1,000 classic hymns of faith. Sing, search, and explore hymns from every tradition.</p>

                  <div className="hymn-daily-card" tabIndex={0} role="button" aria-label="Open today's hymn"
                    onClick={() => { const h = getDailyHymn(); openHymn(h) }}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const h = getDailyHymn(); openHymn(h) } }}>
                    <div className="hymn-daily-icon">🎶</div>
                    <div className="hymn-daily-info">
                      <span className="hymn-daily-label">Today's Hymn</span>
                      <span className="hymn-daily-title">#{getDailyHymn().id} {getDailyHymn().title}</span>
                      <span className="hymn-daily-author">{getDailyHymn().author}</span>
                    </div>
                    <span className="hymn-daily-arrow">→</span>
                  </div>

                  <div className="hymn-search-box">
                    <input type="text" placeholder="Search hymns by title, author, or category..." value={hymnSearch}
                      onChange={e => setHymnSearch(e.target.value)} />
                    {hymnSearch && <button className="hymn-search-clear" onClick={() => setHymnSearch('')}>✕</button>}
                  </div>

                  <div className="hymn-categories-scroll">
                    {categories.map(cat => (
                      <button key={cat} className={`hymn-cat-btn${hymnCategory === cat ? ' active' : ''}`}
                        onClick={() => setHymnCategory(cat)}>
                        {cat === 'all' ? 'All' : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {hymnRecentlyViewed.length > 0 && !hymnSearch && hymnCategory === 'all' && (
                  <div className="card">
                    <h3>🕐 Recently Viewed</h3>
                    <div className="hymn-fav-list">
                      {hymnRecentlyViewed.slice(0, 5).map(r => {
                        const h = HYMNS.find(x => x.id === r.id)
                        if (!h) return null
                        return (
                          <div key={h.id} className="hymn-list-item" onClick={() => openHymn(h)}
                            tabIndex={0} role="button" aria-label={`Open ${h.title} by ${h.author || 'Unknown'}`}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openHymn(h) } }}>
                            <div className="hymn-item-info">
                              <span className="hymn-item-title">#{h.id} {h.title}</span>
                              <span className="hymn-item-author">{h.author || 'Unknown'}</span>
                            </div>
                            {HYMN_WITH_TUNES.has(h.id) && <span className="hymn-has-tune">🎵</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="hymn-list">
                  {getFilteredHymns().map(h => (
                    <div key={h.id} className="hymn-list-item" onClick={() => openHymn(h)}
                    tabIndex={0} role="button" aria-label={`Open ${h.title} by ${h.author || 'Unknown'}`}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openHymn(h) } }}>
                      <div className="hymn-item-info">
                        <span className="hymn-item-title">#{h.id} {h.title}</span>
                        <span className="hymn-item-author">{h.author || 'Unknown'}</span>
                        <span className="hymn-item-cat">{h.category}</span>
                      </div>
                      <div className="hymn-item-actions">
                        {HYMN_WITH_TUNES.has(h.id) && <span className="hymn-has-tune" title="Has audio">🎵</span>}
                        <button className={`hymn-fav-btn${hymnFavorites.includes(h.id) ? ' active' : ''}`}
                          onClick={e => { e.stopPropagation(); toggleHymnFavorite(h.id) }}
                          title={hymnFavorites.includes(h.id) ? 'Remove from favorites' : 'Add to favorites'}>
                          {hymnFavorites.includes(h.id) ? '❤️' : '🤍'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {getFilteredHymns().length === 0 && (
                    <div className="empty-state">
                      <div className="empty-icon-wrap">🎵</div>
                      <h4 className="empty-title">No hymns found</h4>
                      <p className="empty-hint">Try a different search term or category.</p>
                    </div>
                  )}
                </div>

                {hymnFavorites.length > 0 && (
                  <div className="card">
                    <h3>❤️ Favorite Hymns</h3>
                    <div className="hymn-fav-list">
                      {hymnFavorites.map(id => {
                        const h = HYMNS.find(x => x.id === id)
                        if (!h) return null
                        return (
                          <div key={h.id} className="hymn-list-item" onClick={() => openHymn(h)}
                            tabIndex={0} role="button" aria-label={`Open ${h.title} by ${h.author || 'Unknown'}`}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openHymn(h) } }}>
                            <div className="hymn-item-info">
                              <span className="hymn-item-title">#{h.id} {h.title}</span>
                              <span className="hymn-item-author">{h.author || 'Unknown'}</span>
                            </div>
                            {HYMN_WITH_TUNES.has(h.id) && <span className="hymn-has-tune">🎵</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="hymn-detail-view">
                <div className="hymn-detail-header">
                  <button className="hymn-back-btn" onClick={closeHymn}>← Back</button>
                  <div className="hymn-detail-header-right">
                    {HYMN_WITH_TUNES.has(selectedHymn.id) && (
                      <button className={`hymn-play-btn${hymnPlaying ? ' playing' : ''}`}
                        onClick={() => toggleHymnPlay(selectedHymn.id)}
                        title={hymnPlaying ? 'Stop' : 'Play melody'}>
                        {hymnPlaying ? '⏹' : '▶'}
                      </button>
                    )}
                    <button className={`hymn-fav-btn${hymnFavorites.includes(selectedHymn.id) ? ' active' : ''}`}
                      onClick={() => toggleHymnFavorite(selectedHymn.id)}>
                      {hymnFavorites.includes(selectedHymn.id) ? '❤️' : '🤍'}
                    </button>
                  </div>
                </div>
                <div className="hymn-detail-card">
                  <h2 className="hymn-detail-title">#{selectedHymn.id} {selectedHymn.title}</h2>
                  <p className="hymn-detail-author">{selectedHymn.author || 'Unknown'}</p>
                  {selectedHymn.category && <span className="hymn-detail-cat">{selectedHymn.category}</span>}
                </div>
                {HYMN_WITH_TUNES.has(selectedHymn.id) && (
                  <div className="hymn-player-bar">
                    <button className={`hymn-player-btn${hymnPlaying ? ' playing' : ''}`}
                      onClick={() => toggleHymnPlay(selectedHymn.id)}>
                      {hymnPlaying ? '⏹ Stop' : '▶ Play Melody'}
                    </button>
                    <span className="hymn-player-hint">Church organ tune</span>
                  </div>
                )}
                <div className="hymn-detail-lyrics">
                  {(selectedHymn.lyrics || selectedHymn.first_verse || '').split('\n').map((line, i) => (
                    <p key={i} className="hymn-lyric-line">{line || '\u00A0'}</p>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {currentView === 'devotional' && (
          <section className="view fade-in">
            <div className="card">
              <div className="card-icon">🙏</div>
              <h3>Daily Devotional</h3>
              <p>Start your day with scripture, reflection, and prayer.</p>
              <div className="devotional-nav">
                <button className="devotional-nav-btn" onClick={prevDevotional}>◀ Previous</button>
                <span className="devotional-day-label">Day {currentDevotional.day} of 365</span>
                <button className="devotional-nav-btn" onClick={nextDevotional}>Next ▶</button>
              </div>
              <button className="btn-sm devotional-today-btn" onClick={goToTodaysDevotional}>📅 Today's Devotional</button>
            </div>

            <div className="devotional-content-card">
              <div className="devotional-header">
                <span className="devotional-day-badge">Day {currentDevotional.day}</span>
                <div className="devotional-font-controls">
                  <button className={`dev-font-btn${devotionalFontSize === 'small' ? ' active' : ''}`}
                    onClick={() => setDevotionalFontSize('small')}>S</button>
                  <button className={`dev-font-btn${devotionalFontSize === 'medium' ? ' active' : ''}`}
                    onClick={() => setDevotionalFontSize('medium')}>M</button>
                  <button className={`dev-font-btn${devotionalFontSize === 'large' ? ' active' : ''}`}
                    onClick={() => setDevotionalFontSize('large')}>L</button>
                </div>
              </div>
              <h2 className="devotional-title">{currentDevotional.title}</h2>
              <div className="devotional-verse-block">
                <p className="devotional-verse-text" style={{ fontSize: devotionalFontSize === 'small' ? '0.88rem' : devotionalFontSize === 'large' ? '1.08rem' : '0.95rem' }}>
                  &ldquo;{currentDevotional.verse_text}&rdquo;
                </p>
                <p className="devotional-verse-ref">&mdash; {currentDevotional.verse}</p>
              </div>
              <div className="devotional-text" style={{ fontSize: devotionalFontSize === 'small' ? '0.85rem' : devotionalFontSize === 'large' ? '1.05rem' : '0.92rem' }}>
                {currentDevotional.text}
              </div>
              <div className="devotional-prayer-block">
                <h4 className="devotional-prayer-title">🙏 Prayer</h4>
                <p className="devotional-prayer-text">{currentDevotional.prayer}</p>
              </div>
            </div>

            <div className="devotional-progress">
              <div className="devotional-progress-label">
                <span>Reading through the Word</span>
                <span>{Math.round((devotionalDay / 365) * 100)}%</span>
              </div>
              <div className="devotional-progress-track">
                <div className="devotional-progress-fill" style={{ width: `${(devotionalDay / 365) * 100}%` }} />
              </div>
            </div>
          </section>
        )}

        {currentView === 'settings' && (
          <section className="view settings-view fade-in">
            <div className="settings-nav">
              {[{ id: 'appearance', label: '🎨 Appearance' }, { id: 'profile', label: '👤 Profile' }, { id: 'notifications', label: '🔔 Notifications' }, { id: 'backup', label: '💾 Backup' }, { id: 'about', label: 'ℹ️ About' }].map(s => (
                <button key={s.id} className={`settings-nav-btn${settingsSection === s.id ? ' active' : ''}`} onClick={() => setSettingsSection(s.id)}>{s.label}</button>
              ))}
            </div>

            {settingsSection === 'appearance' && (
              <div className="settings-content">
                <div className="card">
                  <div className="card-icon">🎨</div>
                  <h3>Color Theme</h3>
                  <p>Choose your preferred color scheme.</p>
                  <div className="theme-grid">
                    {THEME_OPTIONS.map(t => (
                      <button key={t.id} className={`theme-btn${settings.theme === t.id ? ' active' : ''}`} onClick={() => updateSetting('theme', t.id)}>
                        <div className="theme-swatches">
                          {t.colors.map((c, i) => <span key={i} className="theme-swatch" style={{ background: c }} />)}
                        </div>
                        <span className="theme-name">{t.name}</span>
                      </button>
                    ))}
                    <button className={`theme-btn${settings.theme === 'custom' ? ' active' : ''}`} onClick={() => updateSetting('theme', 'custom')}>
                      <div className="theme-swatches">
                        <span className="theme-swatch" style={{ background: customColors.primary }} />
                        <span className="theme-swatch" style={{ background: customColors.accent }} />
                        <span className="theme-swatch" style={{ background: customColors.background }} />
                      </div>
                      <span className="theme-name">Custom</span>
                    </button>
                  </div>
                  {settings.theme === 'custom' && (
                    <div className="custom-color-picker">
                      {[{ key: 'primary', label: 'Primary' }, { key: 'accent', label: 'Accent' }, { key: 'background', label: 'Background' }].map(c => (
                        <div key={c.key} className="color-picker-row">
                          <label>{c.label}</label>
                          <div className="color-input-wrap">
                            <input type="color" value={customColors[c.key]} onChange={e => updateCustomColor(c.key, e.target.value)} className="color-input-native" />
                            <span className="color-hex">{customColors[c.key]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card">
                  <div className="card-icon">☀️</div>
                  <h3>Display Mode</h3>
                  <p>Switch between dark and light mode.</p>
                  <div className="mode-toggle">
                    <button className={`mode-btn${settings.mode === 'dark' ? ' active' : ''}`} onClick={() => updateSetting('mode', 'dark')}>🌙 Dark</button>
                    <button className={`mode-btn${settings.mode === 'light' ? ' active' : ''}`} onClick={() => updateSetting('mode', 'light')}>☀️ Light</button>
                  </div>
                </div>

                <div className="card">
                  <div className="card-icon">🔤</div>
                  <h3>Font Size</h3>
                  <p>Adjust text size across the app.</p>
                  <div className="font-size-options">
                    {[{ id: 'small', label: 'S' }, { id: 'medium', label: 'M' }, { id: 'large', label: 'L' }].map(f => (
                      <button key={f.id} className={`font-size-btn${settings.fontSize === f.id ? ' active' : ''}`} onClick={() => updateSetting('fontSize', f.id)}>{f.label}</button>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-icon">📐</div>
                  <h3>Reading Layout</h3>
                  <p>Choose your Bible reading layout preference.</p>
                  <div className="layout-options">
                    {[{ id: 'standard', label: 'Standard', desc: 'Default spacing' }, { id: 'wide', label: 'Wide', desc: 'More padding & larger text' }, { id: 'compact', label: 'Compact', desc: 'Tighter spacing' }].map(l => (
                      <button key={l.id} className={`layout-btn${settings.readingLayout === l.id ? ' active' : ''}`} onClick={() => updateSetting('readingLayout', l.id)}>
                        <span className="layout-name">{l.label}</span>
                        <span className="layout-desc">{l.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-icon">🕐</div>
                  <h3>World Clock</h3>
                  <p>Current time across timezones (your timezone: WAT+1).</p>
                  <div className="world-clock-list">
                    {(() => {
                      const times = getAllTimezones()
                      return times.map(tz => (
                        <div key={tz.id} className={`world-clock-row${tz.id === 'WAT' ? ' primary' : ''}`}>
                          <span className="world-clock-tz">{tz.label}</span>
                          <span className="world-clock-time">{tz.hours}:{tz.minutes}</span>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              </div>
            )}

            {settingsSection === 'profile' && (
              <div className="settings-content">
                <div className="card">
                  <div className="card-icon">👤</div>
                  <h3>Profile</h3>
                  <p>Manage your personal information.</p>
                  <div className="profile-fields">
                    <label className="settings-label">Your Name</label>
                    <input type="text" placeholder="Enter your name" value={settings.profileName} onChange={e => updateSetting('profileName', e.target.value)} />
                    <label className="settings-label">Email</label>
                    <input type="email" placeholder="Enter your email" value={settings.profileEmail} onChange={e => updateSetting('profileEmail', e.target.value)} />
                  </div>
                </div>
                <div className="card">
                  <div className="card-icon">🌐</div>
                  <h3>Language</h3>
                  <p>Select your preferred language.</p>
                  <select value={settings.language} onChange={e => updateSetting('language', e.target.value)}>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="pt">Português</option>
                  </select>
                  <p className="settings-hint">More translations coming soon.</p>
                </div>
              </div>
            )}

            {settingsSection === 'notifications' && (
              <div className="settings-content">
                <div className="card">
                  <div className="card-icon">🔔</div>
                  <h3>Notification Preferences</h3>
                  <p>Choose which reminders you'd like to receive.</p>
                  <div className="toggle-list">
                    {[
                      { key: 'prayerReminder', label: '🙏 Prayer Reminder', desc: 'Get reminded to log your daily prayer' },
                      { key: 'dailyVerse', label: '📖 Daily Verse', desc: 'Receive a daily Bible verse notification' },
                      { key: 'taskReminders', label: '📋 Task Reminders', desc: 'Get notified about pending tasks' },
                    ].map(n => (
                      <div key={n.key} className="toggle-row">
                        <div className="toggle-info">
                          <span className="toggle-label">{n.label}</span>
                          <span className="toggle-desc">{n.desc}</span>
                        </div>
                        <label className="toggle-switch">
                          <input type="checkbox" checked={settings.notifications[n.key]} onChange={e => updateNotification(n.key, e.target.checked)} />
                          <span className="toggle-slider" />
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="settings-hint">Notifications require browser permission.</p>
                </div>
              </div>
            )}

            {settingsSection === 'backup' && (
              <div className="settings-content">
                <div className="card">
                  <div className="card-icon">💾</div>
                  <h3>Backup & Restore</h3>
                  <p>Export your data to a file or restore from a previous backup.</p>
                  <div className="backup-actions">
                    <button className="btn-primary" onClick={exportData}>📤 Export Backup</button>
                    <button className="btn-outline" onClick={importData}>📥 Import Backup</button>
                  </div>
                </div>
                <div className="card">
                  <div className="card-icon">⚠️</div>
                  <h3>Danger Zone</h3>
                  <p>Permanently delete all data stored on this device.</p>
                  <button className="btn-danger" onClick={resetAllData}>🗑 Reset All Data</button>
                </div>
              </div>
            )}

            {settingsSection === 'about' && (
              <div className="settings-content">
                <div className="card about-card">
                  <div className="about-logo">
                    <span className="about-cross">✝</span>
                  </div>
                  <h3>BelieversFlow</h3>
                  <div className="about-info">
                    <div className="about-row"><span>Version</span><span>3.1.0</span></div>
                    <div className="about-row"><span>Current Time</span><span>{formatDateTime()}</span></div>
                    <div className="about-row"><span>Timezone</span><span>WAT (UTC+1)</span></div>
                    <div className="about-row"><span>Backend</span><span>{API_URL || 'GROQ (direct)'}</span></div>
                    <div className="about-row"><span>Storage</span><span>localStorage</span></div>
                    <div className="about-row"><span>AI Model</span><span>llama-3.3-70b-versatile</span></div>
                  </div>
                  <p className="about-desc">A Christian task manager and spiritual growth tracker. Built with faith, for believers.</p>
                  <div className="about-links">
                    <a href="https://github.com/ecoinboxhub/Christian_task_manager" target="_blank" rel="noopener">📘 GitHub</a>
                    <a href="https://believers-flow-frontend.vercel.app" target="_blank" rel="noopener">🌐 Web App</a>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <footer>
        <p>Saved locally ✦ Offline ready ✦ Faith driven</p>
      </footer>

      <div className="fab-group">
        {AI_READY && (
          <button className="fab-guide" onClick={() => setShowGuide(true)} title="AI Guide" aria-label="AI Guide">❓</button>
        )}
        {AI_READY && (
          <button className={`chat-fab ${chatOpen ? ' open' : ''}`} onClick={() => setChatOpen(o => !o)}>
            {chatOpen ? '✕' : '💬'}
          </button>
        )}
      </div>

      {showGuide && (
        <div className="guide-overlay" onClick={() => setShowGuide(false)}>
          <div className="guide-panel" onClick={e => e.stopPropagation()}>
            <div className="guide-header">
              <span className="guide-title">Faith Assistant User Guide</span>
              <button className="guide-close" onClick={() => setShowGuide(false)}>✕</button>
            </div>
            <div className="guide-body">
              <div className="guide-section">
                <h4>What is the AI Assistant?</h4>
                <p>The Faith Assistant is a conversational AI designed to provide scripture-based guidance, prayer support, and life advice from a Christian perspective. It can help you reflect on your faith, explore scripture, and receive encouragement in daily life.</p>
              </div>
              <div className="guide-section">
                <h4>What It Can Do</h4>
                <ul>
                  <li>Share inspirational Bible verses and words of encouragement.</li>
                  <li>Answer questions about faith, scripture, and spiritual practices.</li>
                  <li>Offer prayer guidance and support.</li>
                  <li>Provide life advice and practical guidance from a Christian perspective.</li>
                  <li>Assist with personal tasks and spiritual goals.</li>
                </ul>
              </div>
              <div className="guide-section">
                <h4>Privacy and Data Handling</h4>
                <p>Your conversations are stored locally within the app. No personal chats are shared externally, except for generating AI responses. The AI operates securely and privately, respecting your data at all times.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {AI_READY && chatOpen && (
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
                <div key={i} className={`chat-msg ${m.role} fade-in`}>
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

      {showOnboarding && (
        <div className="onboarding-overlay">
          <div className="onboarding-panel">
            <div className="onboarding-slide">
              {onboardingStep === 0 && (
                <>
                  <div className="onboarding-icon">📖</div>
                  <h2 className="onboarding-title">Bible Reader</h2>
                  <p className="onboarding-desc">Read and study scripture across 12 translations. Get AI-powered explanations, commentary, and concordance at your fingertips.</p>
                </>
              )}
              {onboardingStep === 1 && (
                <>
                  <div className="onboarding-icon">🤖</div>
                  <h2 className="onboarding-title">Faith Assistant</h2>
                  <p className="onboarding-desc">Ask questions and receive guidance from an AI rooted in Christian wisdom. Get scripture-based advice, prayer support, and encouragement.</p>
                </>
              )}
              {onboardingStep === 2 && (
                <>
                  <div className="onboarding-icon">🙏</div>
                  <h2 className="onboarding-title">Prayer Tracker</h2>
                  <p className="onboarding-desc">Track prayer requests and answers. Build a daily prayer habit with streak tracking and reflection logs.</p>
                </>
              )}
              {onboardingStep === 3 && (
                <>
                  <div className="onboarding-icon">✅</div>
                  <h2 className="onboarding-title">Tasks & Goals</h2>
                  <p className="onboarding-desc">Organize your day with faith-centered productivity. Categorize tasks as spiritual, personal, or service, and track your progress.</p>
                </>
              )}
            </div>
            <div className="onboarding-dots">
              {[0, 1, 2, 3].map(i => (
                <span key={i} className={`onboarding-dot${onboardingStep === i ? ' active' : ''}`} />
              ))}
            </div>
            <div className="onboarding-actions">
              {onboardingStep < 3 ? (
                <>
                  <button className="onboarding-skip" onClick={completeOnboarding}>Skip</button>
                  <button className="onboarding-next" onClick={() => setOnboardingStep(s => s + 1)}>Next</button>
                </>
              ) : (
                <button className="onboarding-start" onClick={completeOnboarding}>Start Using BelieversFlow</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
