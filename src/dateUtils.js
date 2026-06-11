const PRIMARY_TZ = 'Africa/Lagos'
const TIMEZONES = [
  { id: 'WAT', label: 'WAT (UTC+1)', tz: 'Africa/Lagos', offset: 1 },
  { id: 'UTC', label: 'UTC', tz: 'UTC', offset: 0 },
  { id: 'EST', label: 'EST (UTC-5)', tz: 'America/New_York', offset: -5 },
  { id: 'CST', label: 'CST (UTC-6)', tz: 'America/Chicago', offset: -6 },
  { id: 'MST', label: 'MST (UTC-7)', tz: 'America/Denver', offset: -7 },
  { id: 'PST', label: 'PST (UTC-8)', tz: 'America/Los_Angeles', offset: -8 },
  { id: 'GMT', label: 'GMT (UTC+0)', tz: 'Europe/London', offset: 0 },
  { id: 'CET', label: 'CET (UTC+1)', tz: 'Europe/Paris', offset: 1 },
  { id: 'EET', label: 'EET (UTC+2)', tz: 'Europe/Helsinki', offset: 2 },
  { id: 'IST', label: 'IST (UTC+2)', tz: 'Asia/Jerusalem', offset: 2 },
  { id: 'MSK', label: 'MSK (UTC+3)', tz: 'Europe/Moscow', offset: 3 },
  { id: 'GST', label: 'GST (UTC+4)', tz: 'Asia/Dubai', offset: 4 },
  { id: 'PKT', label: 'PKT (UTC+5)', tz: 'Asia/Karachi', offset: 5 },
  { id: 'IST5', label: 'IST (UTC+5:30)', tz: 'Asia/Kolkata', offset: 5.5 },
  { id: 'BJT', label: 'CST (UTC+8)', tz: 'Asia/Shanghai', offset: 8 },
  { id: 'JST', label: 'JST (UTC+9)', tz: 'Asia/Tokyo', offset: 9 },
  { id: 'AEST', label: 'AEST (UTC+10)', tz: 'Australia/Sydney', offset: 10 },
  { id: 'NZST', label: 'NZST (UTC+12)', tz: 'Pacific/Auckland', offset: 12 },
]

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getDateInTz(tz) {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const tzOffset = TIMEZONES.find(t => t.id === tz || t.tz === tz)
  if (tzOffset) {
    return new Date(utc + tzOffset.offset * 3600000)
  }
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false }).formatToParts(now)
    const getVal = (type) => parseInt(parts.find(p => p.type === type)?.value || '0')
    return new Date(getVal('year'), getVal('month') - 1, getVal('day'), getVal('hour'), getVal('minute'), getVal('second'))
  } catch {
    return now
  }
}

function getNow() {
  return getDateInTz('WAT')
}

function getDayOfYear(date) {
  const d = date || getNow()
  const start = new Date(d.getFullYear(), 0, 0)
  const diff = d - start
  return Math.floor(diff / 86400000)
}

function formatDateFull(date) {
  const d = date || getNow()
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function formatDateTime(date) {
  const d = date || getNow()
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${h12}:${m} ${ampm}`
}

function formatTimeShort(date) {
  const d = date || getNow()
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function getAllTimezones() {
  const now = getNow()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  return TIMEZONES.map(tz => {
    const t = new Date(utc + tz.offset * 3600000)
    return {
      ...tz,
      time: formatDateTime(t),
      hours: t.getHours().toString().padStart(2, '0'),
      minutes: t.getMinutes().toString().padStart(2, '0'),
    }
  })
}

function getGreeting() {
  const h = getNow().getHours()
  if (h >= 5 && h < 12) return { msg: 'Good morning! Rise and shine for the Lord!', icon: '\uD83C\uDF05' }
  if (h >= 12 && h < 17) return { msg: 'Good afternoon! Keep walking in faith.', icon: '\u2600\uFE0F' }
  if (h >= 17 && h < 21) return { msg: 'Good evening! Rest in His presence.', icon: '\uD83C\uDF06' }
  return { msg: 'Good night! May the Lord watch over you.', icon: '\uD83C\uDF19' }
}

function getTodayISO() {
  const d = getNow()
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

function getTodayDateString() {
  return getNow().toLocaleDateString()
}

function getTodaySeed() {
  const d = getNow()
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

export {
  TIMEZONES,
  PRIMARY_TZ,
  MONTHS,
  DAYS,
  getDateInTz,
  getNow,
  getDayOfYear,
  formatDateFull,
  formatDateTime,
  formatTimeShort,
  getAllTimezones,
  getGreeting,
  getTodayISO,
  getTodayDateString,
  getTodaySeed,
}
