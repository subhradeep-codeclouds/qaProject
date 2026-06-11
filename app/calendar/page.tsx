'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '@/components/Header'
import {
  Calendar, Video, Clock, Users, ChevronLeft, ChevronRight,
  AlertCircle, Plus, CheckSquare, X, Phone, Briefcase, Home,
  Building2, StickyNote, Trash2, ExternalLink, Pencil, Camera, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  format, addDays, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval,
  isSameDay, isToday, addMonths, subMonths, isSameMonth
} from 'date-fns'

type CalEvent = {
  id: string; title: string; start: string; end: string
  meetLink?: string; attendees?: number; description?: string
  type?: 'event' | 'schedule'
}
type Todo       = { id: string; text: string; completed: boolean; date: string }
type WorkStatus = Record<string, 'wfo' | 'planned_wfo'>
type NoteColor  = 'blue' | 'pink' | 'amber' | 'green' | 'purple'
type DayNote    = { id: string; date: string; text: string; color: NoteColor }

/* ── Color palette: light + dark variants for every note colour ── */
const NOTE_COLORS: Record<NoteColor, { chip: string; border: string; swatch: string; label: string }> = {
  blue:   {
    chip:   'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200',
    border: 'border-blue-300 dark:border-blue-400/50',
    swatch: 'bg-blue-500', label: 'Blue',
  },
  pink:   {
    chip:   'bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-200',
    border: 'border-pink-300 dark:border-pink-400/50',
    swatch: 'bg-pink-500', label: 'Pink',
  },
  amber:  {
    chip:   'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
    border: 'border-amber-300 dark:border-amber-400/50',
    swatch: 'bg-amber-500', label: 'Amber',
  },
  green:  {
    chip:   'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
    border: 'border-emerald-300 dark:border-emerald-400/50',
    swatch: 'bg-emerald-500', label: 'Green',
  },
  purple: {
    chip:   'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200',
    border: 'border-violet-300 dark:border-violet-400/50',
    swatch: 'bg-violet-500', label: 'Purple',
  },
}

/* Event / Todo chips — readable in both modes */
const EVENT_CHIP = 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-400/40'
const TODO_CHIP  = 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/40'

/* Shared button-inside-glass-card base */
const OPT_BASE  = 'w-full flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] transition-all text-left group'

const NOTE_COLOR_KEYS: NoteColor[] = ['blue', 'pink', 'amber', 'green', 'purple']

const MOCK_EVENTS: CalEvent[] = []

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function isWeekend(day: Date) { return [0, 6].includes(day.getDay()) }
function isPastOrToday(day: Date) {
  return format(day, 'yyyy-MM-dd') <= format(new Date(), 'yyyy-MM-dd')
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [userEvents, setUserEvents]     = useState<CalEvent[]>([])
  const [todos, setTodos]               = useState<Todo[]>([])
  const [notes, setNotes]               = useState<DayNote[]>([])
  const [selectedDay, setSelectedDay]   = useState(new Date())
  const [googleConnected]               = useState(false)

  const calendarRef                     = useRef<HTMLDivElement>(null)
  const [snapping, setSnapping]         = useState(false)
  const [syncStatus, setSyncStatus]     = useState<'idle' | 'syncing' | 'ok' | 'error'>('idle')

  async function takeSnapshot() {
    if (!calendarRef.current || snapping) return
    setSnapping(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(calendarRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: null,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `calendar-${format(currentMonth, 'yyyy-MM')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setSnapping(false)
    }
  }
  const [workStatus, setWorkStatus]     = useState<WorkStatus>({})

  const [showModal, setShowModal] = useState(false)
  const [modalDate, setModalDate] = useState<Date>(new Date())
  const [modalView, setModalView] = useState<'options' | 'add-schedule' | 'add-todo' | 'add-note' | 'edit-note' | 'edit-event' | 'view-note' | 'view-event' | 'view-todos'>('options')

  const [viewingNote, setViewingNote]   = useState<DayNote | null>(null)
  const [viewingEvent, setViewingEvent] = useState<CalEvent | null>(null)

  const [newTodoText, setNewTodoText]     = useState('')
  const [scheduleTitle, setScheduleTitle] = useState('')
  const [scheduleStart, setScheduleStart] = useState('09:00')
  const [scheduleEnd, setScheduleEnd]     = useState('10:00')
  const [noteText, setNoteText]           = useState('')
  const [noteColor, setNoteColor]         = useState<NoteColor>('blue')

  const [editNoteId, setEditNoteId]         = useState('')
  const [editNoteText, setEditNoteText]     = useState('')
  const [editNoteColor, setEditNoteColor]   = useState<NoteColor>('blue')
  const [editEventId, setEditEventId]       = useState('')
  const [editEventTitle, setEditEventTitle] = useState('')
  const [editEventStart, setEditEventStart] = useState('09:00')
  const [editEventEnd, setEditEventEnd]     = useState('10:00')

  const [editingTodoId, setEditingTodoId]     = useState<string | null>(null)
  const [editingTodoText, setEditingTodoText] = useState('')
  const [newTodoForView, setNewTodoForView]   = useState('')

  useEffect(() => {
    // Step 1: load localStorage immediately so the page isn't blank
    const fromLocal = <T,>(key: string, fallback: T): T => {
      try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
    }
    const localStatus = fromLocal<WorkStatus>('qa_portal_work_status', {})
    const localTodos  = fromLocal<Todo[]>('qa_portal_todos', [])
    const localEvents = fromLocal<CalEvent[]>('qa_portal_user_events', [])
    const localNotes  = fromLocal<DayNote[]>('qa_portal_notes', [])
    if (Object.keys(localStatus).length) setWorkStatus(localStatus)
    if (localTodos.length)               setTodos(localTodos)
    if (localEvents.length)              setUserEvents(localEvents)
    if (localNotes.length)               setNotes(localNotes)

    // Step 2: fetch from API for cross-device sync — only override when API has real data
    async function syncFromApi() {
      try {
        const res = await fetch('/api/calendar/data')
        if (!res.ok) return
        const data = await res.json()
        if (Object.keys(data.workStatus ?? {}).length) {
          setWorkStatus(data.workStatus)
          localStorage.setItem('qa_portal_work_status', JSON.stringify(data.workStatus))
        }
        if (data.todos?.length) {
          setTodos(data.todos)
          localStorage.setItem('qa_portal_todos', JSON.stringify(data.todos))
        }
        if (data.userEvents?.length) {
          setUserEvents(data.userEvents)
          localStorage.setItem('qa_portal_user_events', JSON.stringify(data.userEvents))
        }
        if (data.notes?.length) {
          setNotes(data.notes)
          localStorage.setItem('qa_portal_notes', JSON.stringify(data.notes))
        }
      } catch { /* silent — localStorage data already loaded above */ }
    }
    syncFromApi()
  }, [])

  const allEvents = [...MOCK_EVENTS, ...userEvents]

  function syncToDb(patch: { workStatus?: WorkStatus; notes?: DayNote[]; userEvents?: CalEvent[]; todos?: Todo[] }) {
    setSyncStatus('syncing')
    fetch('/api/calendar/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
      .then(res => {
        setSyncStatus(res.ok ? 'ok' : 'error')
        setTimeout(() => setSyncStatus('idle'), 3000)
      })
      .catch(() => {
        setSyncStatus('error')
        setTimeout(() => setSyncStatus('idle'), 4000)
      })
  }

  function saveTodos(u: Todo[]) {
    setTodos(u)
    localStorage.setItem('qa_portal_todos', JSON.stringify(u))
    syncToDb({ workStatus, notes, userEvents, todos: u })
  }
  function saveUserEvents(u: CalEvent[]) {
    setUserEvents(u)
    localStorage.setItem('qa_portal_user_events', JSON.stringify(u))
    syncToDb({ workStatus, notes, userEvents: u, todos })
  }
  function saveWorkStatus(u: WorkStatus) {
    setWorkStatus(u)
    localStorage.setItem('qa_portal_work_status', JSON.stringify(u))
    syncToDb({ workStatus: u, notes, userEvents, todos })
  }
  function saveNotes(u: DayNote[]) {
    setNotes(u)
    localStorage.setItem('qa_portal_notes', JSON.stringify(u))
    syncToDb({ workStatus, notes: u, userEvents, todos })
  }

  function toggleWFO(dateKey: string) {
    const u = { ...workStatus }
    if (u[dateKey] === 'wfo') delete u[dateKey]; else u[dateKey] = 'wfo'
    saveWorkStatus(u)
  }
  function togglePlannedWFO(dateKey: string) {
    const u = { ...workStatus }
    if (u[dateKey] === 'planned_wfo') delete u[dateKey]; else u[dateKey] = 'planned_wfo'
    saveWorkStatus(u)
  }

  function toggleTodo(id: string) { saveTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)) }
  function deleteTodo(id: string) { saveTodos(todos.filter(t => t.id !== id)) }
  function deleteNote(id: string) { saveNotes(notes.filter(n => n.id !== id)) }

  function addTodo() {
    if (!newTodoText.trim()) return
    saveTodos([...todos, { id: Date.now().toString(), text: newTodoText.trim(), completed: false, date: format(modalDate, 'yyyy-MM-dd') }])
    setNewTodoText(''); setShowModal(false)
  }

  function addSchedule() {
    if (!scheduleTitle.trim()) return
    const dateStr = format(modalDate, 'yyyy-MM-dd')
    saveUserEvents([...userEvents, {
      id: Date.now().toString(), title: scheduleTitle.trim(),
      start: `${dateStr}T${scheduleStart}:00`, end: `${dateStr}T${scheduleEnd}:00`, type: 'schedule',
    }])
    setScheduleTitle(''); setScheduleStart('09:00'); setScheduleEnd('10:00'); setShowModal(false)
  }

  function addNote() {
    if (!noteText.trim()) return
    saveNotes([...notes, { id: Date.now().toString(), date: format(modalDate, 'yyyy-MM-dd'), text: noteText.trim(), color: noteColor }])
    setNoteText(''); setNoteColor('blue'); setShowModal(false)
  }

  function openEditNote(note: DayNote) {
    setEditNoteId(note.id); setEditNoteText(note.text); setEditNoteColor(note.color)
    setModalDate(new Date(note.date + 'T12:00:00'))
    setModalView('edit-note'); setShowModal(true)
  }
  function saveEditNote() {
    if (!editNoteText.trim()) return
    saveNotes(notes.map(n => n.id === editNoteId ? { ...n, text: editNoteText.trim(), color: editNoteColor } : n))
    setShowModal(false)
  }
  function deleteEditNote() {
    saveNotes(notes.filter(n => n.id !== editNoteId))
    setShowModal(false)
  }

  function openEditEvent(ev: CalEvent) {
    setEditEventId(ev.id); setEditEventTitle(ev.title)
    setEditEventStart(format(new Date(ev.start), 'HH:mm'))
    setEditEventEnd(format(new Date(ev.end), 'HH:mm'))
    setModalDate(new Date(ev.start))
    setModalView('edit-event'); setShowModal(true)
  }
  function saveEditEvent() {
    if (!editEventTitle.trim()) return
    const dateStr = format(modalDate, 'yyyy-MM-dd')
    saveUserEvents(userEvents.map(e => e.id === editEventId
      ? { ...e, title: editEventTitle.trim(), start: `${dateStr}T${editEventStart}:00`, end: `${dateStr}T${editEventEnd}:00` }
      : e
    ))
    setShowModal(false)
  }
  function deleteEditEvent() {
    saveUserEvents(userEvents.filter(e => e.id !== editEventId))
    setShowModal(false)
  }

  function openViewNote(note: DayNote) {
    setViewingNote(note)
    setModalDate(new Date(note.date + 'T12:00:00'))
    setModalView('view-note'); setShowModal(true)
  }
  function openViewEvent(ev: CalEvent) {
    setViewingEvent(ev)
    setModalDate(new Date(ev.start))
    setModalView('view-event'); setShowModal(true)
  }
  function openViewTodos(e: React.MouseEvent, day: Date) {
    e.stopPropagation()
    setSelectedDay(day); setModalDate(day)
    setEditingTodoId(null); setNewTodoForView('')
    setModalView('view-todos'); setShowModal(true)
  }
  function saveTodoEdit(id: string) {
    if (!editingTodoText.trim()) return
    saveTodos(todos.map(t => t.id === id ? { ...t, text: editingTodoText.trim() } : t))
    setEditingTodoId(null)
  }
  function addTodoFromView() {
    if (!newTodoForView.trim()) return
    saveTodos([...todos, { id: Date.now().toString(), text: newTodoForView.trim(), completed: false, date: format(modalDate, 'yyyy-MM-dd') }])
    setNewTodoForView('')
  }

  function handleChipClick(e: React.MouseEvent, id: string, kind: 'note' | 'event') {
    e.stopPropagation()
    if (kind === 'note') {
      const note = notes.find(n => n.id === id)
      if (note) openViewNote(note)
    } else {
      const ev = allEvents.find(ev => ev.id === id)
      if (ev) openViewEvent(ev)
    }
  }

  function openModalForDate(day: Date) {
    setSelectedDay(day); setModalDate(day)
    setModalView('options'); setNewTodoText(''); setScheduleTitle(''); setNoteText('')
    setShowModal(true)
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd   = endOfMonth(currentMonth)
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd     = endOfWeek(monthEnd,   { weekStartsOn: 1 })
  const allDays    = eachDayOfInterval({ start: calStart, end: calEnd })

  // Monthly WFO stats
  const allMonthWeekdays = eachDayOfInterval({ start: monthStart, end: monthEnd }).filter(d => !isWeekend(d))
  const doneWeekdays     = allMonthWeekdays.filter(d => isPastOrToday(d))
  const futureWeekdays   = allMonthWeekdays.filter(d => !isPastOrToday(d))
  const wfoDoneCount     = doneWeekdays.filter(d => workStatus[format(d, 'yyyy-MM-dd')] === 'wfo').length
  const wfhDoneCount     = doneWeekdays.length - wfoDoneCount
  const plannedWFOCount  = futureWeekdays.filter(d => workStatus[format(d, 'yyyy-MM-dd')] === 'planned_wfo').length

  const selectedDateKey = format(selectedDay, 'yyyy-MM-dd')
  const dayEvents = allEvents.filter(e => isSameDay(new Date(e.start), selectedDay))
  const dayTodos  = todos.filter(t => t.date === selectedDateKey)
  const dayNotes  = notes.filter(n => n.date === selectedDateKey)

  function formatTime(iso: string) { return format(new Date(iso), 'h:mm a') }
  function eventDuration(start: string, end: string) {
    const mins = (new Date(end).getTime() - new Date(start).getTime()) / 60000
    return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ''}`
  }

  const modalDateKey    = format(modalDate, 'yyyy-MM-dd')
  const modalIsWeekend  = isWeekend(modalDate)
  const modalIsPast     = isPastOrToday(modalDate)
  const modalWorkStatus = workStatus[modalDateKey]

  return (
    <div>
      <Header title="Calendar" />
      <div className="p-6 space-y-6 animate-fade-in">

        {/* Google Calendar banner */}
        {!googleConnected && (
          <div className="glass-card p-4 flex items-start gap-3" style={{ borderColor: 'rgba(59,130,246,0.3)' }}>
            <AlertCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-300">Connect Google Calendar</p>
              <p className="text-xs text-slate-400 mt-0.5">Add your Google OAuth credentials to .env to see real meetings.</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button className="btn-primary text-xs"><Calendar size={13} /> Connect Google</button>
              <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer">
                <button className="btn-secondary text-xs"><ExternalLink size={13} /> Open Google Calendar</button>
              </a>
            </div>
          </div>
        )}

        {/* ── Month calendar ── */}
        <div className="glass-card p-5" ref={calendarRef}>

          {/* Month navigator */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-white text-lg tracking-tight">{format(currentMonth, 'MMMM yyyy')}</h3>
              {syncStatus === 'syncing' && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                  <Loader2 size={10} className="animate-spin" /> Syncing...
                </span>
              )}
              {syncStatus === 'ok' && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" /> Synced
                </span>
              )}
              {syncStatus === 'error' && (
                <span
                  title="Sync failed — run the user_calendar_data SQL in Supabase dashboard to enable cross-browser sync"
                  className="flex items-center gap-1 text-[10px] font-semibold text-red-400 cursor-help"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Sync failed
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={takeSnapshot}
                disabled={snapping}
                title="Take calendar snapshot"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border
                  bg-violet-50 hover:bg-violet-100 text-violet-600 border-violet-200/80
                  dark:bg-violet-500/10 dark:hover:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/25
                  disabled:opacity-60"
              >
                {snapping
                  ? <><Loader2 size={13} className="animate-spin" />Capturing...</>
                  : <><Camera size={13} />Snapshot</>
                }
              </button>
              <button
                onClick={() => setCurrentMonth(m => subMonths(m, 1))}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] flex items-center justify-center transition-colors border border-slate-200 dark:border-white/[0.08]"
              >
                <ChevronLeft size={15} className="text-slate-500 dark:text-slate-400" />
              </button>
              <button
                onClick={() => { setCurrentMonth(new Date()); setSelectedDay(new Date()) }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-xs text-slate-600 dark:text-slate-300 font-semibold transition-colors border border-slate-200 dark:border-white/[0.08]"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth(m => addMonths(m, 1))}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] flex items-center justify-center transition-colors border border-slate-200 dark:border-white/[0.08]"
              >
                <ChevronRight size={15} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-1">
            {DAY_LABELS.map((d, i) => (
              <div key={d} className={cn(
                'text-center text-[10px] font-bold uppercase tracking-widest py-1.5',
                i >= 5 ? 'text-rose-400 dark:text-rose-500/80' : 'text-slate-400 dark:text-slate-500'
              )}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {allDays.map(day => {
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isSelected     = isSameDay(day, selectedDay)
              const isTodays       = isToday(day)
              const dateKey        = format(day, 'yyyy-MM-dd')
              const dayWorkStatus  = workStatus[dateKey]
              const weekend        = isWeekend(day)
              const pastOrToday    = isPastOrToday(day)

              // WFO/WFH status label + colour
              let statusLabel = ''; let statusCls = ''; let statusIsPill = false
              if (weekend && isCurrentMonth) {
                statusLabel  = 'LEAVE'
                statusCls    = 'text-rose-500 dark:text-rose-400'
              } else if (!weekend && isCurrentMonth) {
                if (dayWorkStatus === 'wfo') {
                  statusLabel  = 'WFO'
                  statusCls    = 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/25 dark:text-amber-300 dark:border-amber-500/50'
                  statusIsPill = true
                } else if (dayWorkStatus === 'planned_wfo') {
                  statusLabel = 'NEED TO GO OFFICE'
                  statusCls   = 'text-orange-700 dark:text-orange-400 dark:drop-shadow-[0_0_5px_rgba(251,146,60,0.8)]'
                } else if (pastOrToday) {
                  statusLabel = 'WFH'
                  statusCls   = 'text-emerald-700 dark:text-emerald-400'
                } else {
                  statusLabel = 'WFH'
                  statusCls   = 'text-emerald-500/50 dark:text-emerald-400/35'
                }
              }

              // Build chip list for this cell
              const cellNotes  = notes.filter(n => n.date === dateKey)
              const cellEvents = allEvents.filter(e => isSameDay(new Date(e.start), day))
              const todoCnt    = todos.filter(t => t.date === dateKey).length

              type Chip = { id: string; label: string; cls: string; kind: 'note' | 'event' }
              const chips: Chip[] = [
                ...cellNotes.map(n  => ({ id: n.id, label: n.text,  cls: `${NOTE_COLORS[n.color].chip} ${NOTE_COLORS[n.color].border}`, kind: 'note' as const })),
                ...cellEvents.map(e => ({ id: e.id, label: e.title, cls: EVENT_CHIP, kind: 'event' as const })),
              ]
              const visible  = chips.slice(0, 2)
              const overflow = chips.length - 2 + (todoCnt > 0 && chips.length >= 2 ? 1 : 0)

              const cellBgCls = dayWorkStatus === 'wfo' && isCurrentMonth
                ? 'bg-amber-100 dark:bg-amber-500/20 border-2 border-amber-400 dark:border-amber-500/60 shadow-sm shadow-amber-200/60 dark:shadow-amber-500/10'
                : dayWorkStatus === 'planned_wfo' && isCurrentMonth
                  ? 'bg-orange-50 dark:bg-orange-500/[0.10] border border-orange-300/80 dark:border-orange-500/35'
                  : isSelected
                    ? 'bg-violet-100 dark:bg-violet-600/25 border border-violet-400/70 dark:border-violet-400/50'
                    : isTodays
                      ? 'bg-violet-50/90 dark:bg-violet-500/[0.12] border border-violet-300/80 dark:border-violet-400/40'
                      : weekend && isCurrentMonth
                        ? 'bg-rose-50 dark:bg-rose-500/[0.08] border border-rose-200/80 dark:border-rose-500/20 hover:bg-rose-100/70 dark:hover:bg-rose-500/[0.13]'
                        : !weekend && isCurrentMonth && pastOrToday
                          ? 'bg-emerald-50 dark:bg-emerald-500/[0.09] border border-emerald-200 dark:border-emerald-500/25 hover:bg-emerald-100/70 dark:hover:bg-emerald-500/[0.13]'
                          : !weekend && isCurrentMonth && !pastOrToday
                            ? 'bg-emerald-50/50 dark:bg-emerald-500/[0.04] border border-emerald-200/50 dark:border-emerald-500/15 hover:bg-emerald-50/80 dark:hover:bg-emerald-500/[0.08]'
                            : 'hover:bg-slate-50 dark:hover:bg-white/[0.05] border border-transparent hover:border-slate-200 dark:hover:border-white/[0.08]'

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => openModalForDate(day)}
                  className={cn(
                    'rounded-xl transition-all min-h-[132px] flex flex-col items-stretch p-2 relative group text-left',
                    !isCurrentMonth && 'opacity-30',
                    cellBgCls,
                    isSelected && dayWorkStatus && isCurrentMonth && 'ring-2 ring-violet-400/70 dark:ring-violet-400/60',
                  )}
                >
                  {/* Top row: date number + WFO/WFH badge */}
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex flex-col items-start gap-0.5">
                      <span className={cn(
                        'text-sm font-bold leading-none',
                        dayWorkStatus === 'wfo' && isCurrentMonth                      ? 'text-amber-800 dark:text-amber-300'
                        : dayWorkStatus === 'planned_wfo' && isCurrentMonth              ? 'text-orange-700 dark:text-orange-300'
                        : isSelected                                                     ? 'text-violet-700 dark:text-violet-300'
                        : isTodays                                                       ? 'text-violet-900 dark:text-violet-200'
                        : weekend && isCurrentMonth                                      ? 'text-rose-600 dark:text-rose-400'
                        : !weekend && isCurrentMonth && pastOrToday                      ? 'text-emerald-800 dark:text-emerald-400'
                        : !weekend && isCurrentMonth && !pastOrToday                     ? 'text-emerald-700/70 dark:text-emerald-400/60'
                        :                                                                  'text-slate-700 dark:text-slate-300'
                      )}>
                        {format(day, 'd')}
                      </span>
                    </div>
                    {statusLabel && (
                      statusIsPill ? (
                        <span className={cn('text-[7px] font-black uppercase tracking-widest leading-none px-1.5 py-0.5 rounded-full', statusCls)}>
                          {statusLabel}
                        </span>
                      ) : statusLabel.length > 8 ? (
                        <span className={cn('text-[7px] font-black uppercase tracking-tight leading-tight mt-0.5 text-right max-w-[48px]', statusCls)}>
                          {statusLabel}
                        </span>
                      ) : (
                        <span className={cn('text-[8px] font-black uppercase tracking-widest leading-none mt-0.5', statusCls)}>
                          {statusLabel}
                        </span>
                      )
                    )}
                  </div>

                  {/* Note / event chips */}
                  <div className="flex flex-col gap-1 flex-1">
                    {visible.map(chip => (
                      <button
                        key={chip.id}
                        onClick={e => handleChipClick(e, chip.id, chip.kind)}
                        className={cn('text-[10px] font-semibold px-1.5 py-1 rounded-md truncate border leading-tight text-left w-full hover:opacity-75 transition-opacity', chip.cls)}
                      >
                        {chip.label}
                      </button>
                    ))}
                    {/* Show todo chip only if there's room */}
                    {todoCnt > 0 && chips.length < 2 && (
                      <button
                        onClick={e => openViewTodos(e, day)}
                        className={cn('text-[10px] font-semibold px-1.5 py-1 rounded-md truncate border leading-tight text-left w-full hover:opacity-75 transition-opacity', TODO_CHIP)}
                      >
                        {todoCnt} todo{todoCnt > 1 ? 's' : ''}
                      </button>
                    )}
                    {overflow > 0 && (
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold px-0.5 leading-none">
                        +{overflow} more
                      </span>
                    )}
                  </div>

                  {/* Hover add hint */}
                  <span className="absolute bottom-1.5 right-2 text-[8px] text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    + add
                  </span>
                </button>
              )
            })}
          </div>

          {/* Monthly WFO Stats */}
          <div className="mt-4 pt-4 border-t border-slate-200/70 dark:border-white/[0.06]">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-3">
              {format(currentMonth, 'MMMM yyyy')} — Work Summary
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3 text-center">
                <Building2 size={14} className="text-amber-600 dark:text-amber-400 mx-auto mb-1" />
                <p className="text-2xl font-black text-amber-700 dark:text-amber-400 leading-none dark:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">{wfoDoneCount}</p>
                <p className="text-[9px] font-bold text-amber-600/70 dark:text-amber-400/60 uppercase tracking-widest mt-1">WFO Done</p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3 text-center">
                <Home size={14} className="text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 leading-none dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">{wfhDoneCount}</p>
                <p className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-400/60 uppercase tracking-widest mt-1">WFH Done</p>
              </div>
              <div className="rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 p-3 text-center">
                <Briefcase size={14} className="text-orange-600 dark:text-orange-400 mx-auto mb-1" />
                <p className="text-2xl font-black text-orange-700 dark:text-orange-400 leading-none dark:drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]">{plannedWFOCount}</p>
                <p className="text-[9px] font-bold text-orange-600/70 dark:text-orange-400/60 uppercase tracking-widest mt-1">Need WFO</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Selected day panel ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">
              {isToday(selectedDay) ? 'Today' : format(selectedDay, 'EEEE, MMMM do')}
              <span className="ml-2 text-sm font-normal text-slate-500 dark:text-[#2d6a3e]">
                · {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''},
                {' '}{dayNotes.length} note{dayNotes.length !== 1 ? 's' : ''},
                {' '}{dayTodos.length} todo{dayTodos.length !== 1 ? 's' : ''}
              </span>
            </h3>
            <button onClick={() => { setModalDate(selectedDay); setModalView('options'); setShowModal(true) }} className="btn-primary text-xs">
              <Plus size={13} /> Add
            </button>
          </div>

          {/* Notes */}
          {dayNotes.length > 0 && (
            <div className="glass-card p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <StickyNote size={14} className="text-sky-500 flex-shrink-0" />
                <h4 className="text-sm font-bold text-white">Notes & Events</h4>
                <span className="text-xs text-slate-500 ml-1">{dayNotes.length}</span>
              </div>
              <div className="space-y-2">
                {dayNotes.map(note => (
                  <div key={note.id}
                    className={cn('flex items-start gap-3 p-3 rounded-xl border group', NOTE_COLORS[note.color].chip, NOTE_COLORS[note.color].border)}>
                    <div className={cn('w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0', NOTE_COLORS[note.color].swatch)} />
                    <p className="flex-1 text-sm font-semibold leading-snug break-words">{note.text}</p>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg"
                    >
                      <Trash2 size={12} className="text-red-500 dark:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events / calls */}
          {dayEvents.length > 0 && (
            <div className="space-y-3 mb-4">
              {dayEvents.map(ev => (
                <div key={ev.id} className="glass-card-hover p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center text-center w-16 flex-shrink-0">
                      <span className="text-sm font-bold text-white">{formatTime(ev.start)}</span>
                      <div className="w-px h-4 bg-violet-500/40 my-1" />
                      <span className="text-xs text-slate-500">{formatTime(ev.end)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white">{ev.title}</p>
                            {ev.type === 'schedule' && (
                              <span className="text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30 rounded-full px-1.5 py-0.5 font-bold">Call</span>
                            )}
                          </div>
                          {ev.description && <p className="text-sm text-slate-400 mt-0.5">{ev.description}</p>}
                        </div>
                        {ev.meetLink && ev.meetLink !== '#' && (
                          <a href={ev.meetLink} target="_blank" rel="noopener noreferrer">
                            <button className="btn-primary flex-shrink-0 ml-3 text-xs"><Video size={12} /> Join</button>
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="flex items-center gap-1.5 text-xs text-slate-500"><Clock size={11} /> {eventDuration(ev.start, ev.end)}</span>
                        {ev.attendees && (
                          <span className="flex items-center gap-1.5 text-xs text-slate-500"><Users size={11} /> {ev.attendees} attendees</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Todos */}
          {dayTodos.length > 0 && (
            <div className="glass-card p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckSquare size={14} className="text-emerald-500 flex-shrink-0" />
                <h4 className="text-sm font-bold text-white">Todo Checklist</h4>
                <span className="text-xs text-slate-500 ml-1">{dayTodos.filter(t => t.completed).length}/{dayTodos.length} done</span>
              </div>
              <div className="space-y-1">
                {dayTodos.map(todo => (
                  <label key={todo.id} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                    <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo.id)}
                      className="accent-emerald-500 w-4 h-4 cursor-pointer flex-shrink-0" />
                    <span className={cn('flex-1 text-sm', todo.completed ? 'line-through text-slate-400' : 'text-white')}>{todo.text}</span>
                    <button onClick={e => { e.preventDefault(); deleteTodo(todo.id) }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg">
                      <X size={12} className="text-red-500 dark:text-red-400" />
                    </button>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {dayEvents.length === 0 && dayTodos.length === 0 && dayNotes.length === 0 && (
            <div className="glass-card p-12 text-center">
              <Calendar size={36} className="text-slate-400 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">Nothing scheduled for this day.</p>
              <button onClick={() => { setModalDate(selectedDay); setModalView('options'); setShowModal(true) }} className="btn-primary mx-auto">
                <Plus size={14} /> Add Something
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Day action modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-sm mx-4 animate-slide-up rounded-2xl shadow-2xl shadow-indigo-300/30 dark:shadow-black/60"
            style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(24px)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Dark mode override for modal background */}
            <div className="hidden dark:block absolute inset-0 rounded-2xl -z-10" style={{ background: '#0d1b0d', border: '1px solid #1e4a24' }} />
            <div className="p-5">

              {/* Modal header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] font-bold text-indigo-400 dark:text-slate-500 uppercase tracking-widest">
                    {format(modalDate, 'EEEE')}
                  </p>
                  <h3 className="font-black text-indigo-900 dark:text-white text-lg leading-tight">
                    {format(modalDate, 'MMMM do, yyyy')}
                  </h3>
                  {modalIsWeekend && (
                    <div className="mt-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40">
                        ● Leave Day
                      </span>
                    </div>
                  )}
                  {!modalIsWeekend && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={cn(
                        'text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border',
                        modalWorkStatus === 'wfo'
                          ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
                          : modalWorkStatus === 'planned_wfo'
                            ? 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/40'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
                      )}>
                        {modalWorkStatus === 'wfo' ? '● WFO' : modalWorkStatus === 'planned_wfo' ? '● NEED TO GO OFFICE' : '● WFH'}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] flex items-center justify-center transition-colors border border-slate-200 dark:border-white/[0.08] flex-shrink-0"
                >
                  <X size={15} className="text-slate-500 dark:text-slate-400" />
                </button>
              </div>

              {/* ── Options ── */}
              {modalView === 'options' && (
                <div className="space-y-2">

                  {/* Note / Event */}
                  <button onClick={() => setModalView('add-note')}
                    className={cn(OPT_BASE, 'hover:bg-sky-50 hover:border-sky-300 dark:hover:bg-sky-500/15 dark:hover:border-sky-500/40')}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-sky-400/30">
                      <StickyNote size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-indigo-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                        Add Note / Event
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">Add a note, reminder or event label</p>
                    </div>
                  </button>

                  {/* WFO / WFH toggle */}
                  {!modalIsWeekend && (() => {
                    const isWFO = modalIsPast && modalWorkStatus === 'wfo'
                    const isPlanned = !modalIsPast && modalWorkStatus === 'planned_wfo'
                    const hoverCls = modalIsPast
                      ? isWFO
                        ? 'hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-500/15 dark:hover:border-emerald-500/40'
                        : 'hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-500/15 dark:hover:border-amber-500/40'
                      : isPlanned
                        ? 'hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-500/15 dark:hover:border-red-500/40'
                        : 'hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-500/15 dark:hover:border-orange-500/40'
                    const iconBg = modalIsPast
                      ? isWFO   ? 'from-emerald-500 to-teal-600'   : 'from-amber-500 to-orange-600'
                      : isPlanned ? 'from-slate-400 to-slate-500' : 'from-orange-500 to-amber-600'
                    return (
                      <button
                        onClick={() => { modalIsPast ? toggleWFO(modalDateKey) : togglePlannedWFO(modalDateKey); setShowModal(false) }}
                        className={cn(OPT_BASE, hoverCls)}
                      >
                        <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-md', iconBg)}>
                          {modalIsPast
                            ? isWFO ? <Home size={16} className="text-white" /> : <Building2 size={16} className="text-white" />
                            : isPlanned ? <X size={16} className="text-white" /> : <Briefcase size={16} className="text-white" />
                          }
                        </div>
                        <div>
                          <p className="text-sm font-bold text-indigo-900 dark:text-white transition-colors">
                            {modalIsPast ? (isWFO ? 'Mark as WFH' : 'Mark as WFO') : (isPlanned ? 'Remove Office Plan' : 'Plan Office Day')}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                            {modalIsPast
                              ? isWFO ? 'Change back to work from home' : 'Mark this day as worked from office'
                              : isPlanned ? 'Remove the planned office visit' : 'Mark as need to go to office'
                            }
                          </p>
                        </div>
                      </button>
                    )
                  })()}

                  {!modalIsWeekend && (
                    <>
                      {/* Call schedule */}
                      <button onClick={() => setModalView('add-schedule')}
                        className={cn(OPT_BASE, 'hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-500/15 dark:hover:border-blue-500/40')}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-400/30">
                          <Phone size={16} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-indigo-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">Add Call Schedule</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">Schedule a meeting or call</p>
                        </div>
                      </button>

                      {/* Todo */}
                      <button onClick={() => setModalView('add-todo')}
                        className={cn(OPT_BASE, 'hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-500/15 dark:hover:border-emerald-500/40')}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-400/30">
                          <CheckSquare size={16} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-indigo-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">Add Todo</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">Add a checklist item for this day</p>
                        </div>
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* ── Add Note form ── */}
              {modalView === 'add-note' && (
                <div className="space-y-4">
                  <div>
                    <label className="label">Note / Event Text</label>
                    <textarea
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="e.g. Team offsite, Leave day, Release deadline..."
                      className="input-field resize-none h-24"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="label">Highlight Color</label>
                    <div className="flex items-center gap-2.5 mt-2">
                      {NOTE_COLOR_KEYS.map(c => (
                        <button
                          key={c}
                          onClick={() => setNoteColor(c)}
                          title={NOTE_COLORS[c].label}
                          className={cn(
                            'w-9 h-9 rounded-full transition-all border-2',
                            NOTE_COLORS[c].swatch,
                            noteColor === c ? 'border-slate-800 dark:border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-90 hover:scale-105'
                          )}
                        />
                      ))}
                      <span className="text-xs font-semibold text-slate-500 ml-1">{NOTE_COLORS[noteColor].label}</span>
                    </div>
                    {noteText.trim() && (
                      <div className={cn('mt-3 px-3 py-2.5 rounded-xl border text-sm font-semibold', NOTE_COLORS[noteColor].chip, NOTE_COLORS[noteColor].border)}>
                        {noteText.trim()}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setModalView('options')} className="btn-secondary flex-1 justify-center">Back</button>
                    <button onClick={addNote} className="btn-primary flex-1 justify-center">Save Note</button>
                  </div>
                </div>
              )}

              {/* ── Add schedule form ── */}
              {modalView === 'add-schedule' && (
                <div className="space-y-3">
                  <div>
                    <label className="label">Call / Meeting Title</label>
                    <input value={scheduleTitle} onChange={e => setScheduleTitle(e.target.value)}
                      placeholder="e.g. Sprint Review, QA Sync..." className="input-field" autoFocus />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Start Time</label>
                      <input type="time" value={scheduleStart} onChange={e => setScheduleStart(e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="label">End Time</label>
                      <input type="time" value={scheduleEnd} onChange={e => setScheduleEnd(e.target.value)} className="input-field" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setModalView('options')} className="btn-secondary flex-1 justify-center">Back</button>
                    <button onClick={addSchedule} className="btn-primary flex-1 justify-center">Add Schedule</button>
                  </div>
                </div>
              )}

              {/* ── Add todo form ── */}
              {modalView === 'add-todo' && (
                <div className="space-y-3">
                  <div>
                    <label className="label">Todo Item</label>
                    <input value={newTodoText} onChange={e => setNewTodoText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addTodo()}
                      placeholder="What needs to be done?" className="input-field" autoFocus />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setModalView('options')} className="btn-secondary flex-1 justify-center">Back</button>
                    <button onClick={addTodo} className="btn-primary flex-1 justify-center">Add Todo</button>
                  </div>
                </div>
              )}

              {/* ── Edit note form ── */}
              {modalView === 'edit-note' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Pencil size={14} className="text-sky-500" />
                    <span className="text-xs font-bold text-indigo-900 dark:text-slate-300 uppercase tracking-widest">Edit Note</span>
                  </div>
                  <div>
                    <label className="label">Note / Event Text</label>
                    <textarea
                      value={editNoteText}
                      onChange={e => setEditNoteText(e.target.value)}
                      className="input-field resize-none h-24"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="label">Highlight Color</label>
                    <div className="flex items-center gap-2.5 mt-2">
                      {NOTE_COLOR_KEYS.map(c => (
                        <button key={c} onClick={() => setEditNoteColor(c)} title={NOTE_COLORS[c].label}
                          className={cn('w-9 h-9 rounded-full transition-all border-2', NOTE_COLORS[c].swatch,
                            editNoteColor === c ? 'border-slate-800 dark:border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-90 hover:scale-105'
                          )} />
                      ))}
                      <span className="text-xs font-semibold text-slate-500 ml-1">{NOTE_COLORS[editNoteColor].label}</span>
                    </div>
                    {editNoteText.trim() && (
                      <div className={cn('mt-3 px-3 py-2.5 rounded-xl border text-sm font-semibold', NOTE_COLORS[editNoteColor].chip, NOTE_COLORS[editNoteColor].border)}>
                        {editNoteText.trim()}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={deleteEditNote}
                      className="btn-secondary flex-1 justify-center text-red-600 dark:text-red-400 hover:border-red-300 dark:hover:border-red-500/40">
                      <Trash2 size={13} /> Delete
                    </button>
                    <button onClick={saveEditNote} className="btn-primary flex-1 justify-center">Save Changes</button>
                  </div>
                </div>
              )}

              {/* ── Edit event form ── */}
              {modalView === 'edit-event' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Pencil size={14} className="text-blue-500" />
                    <span className="text-xs font-bold text-indigo-900 dark:text-slate-300 uppercase tracking-widest">Edit Call / Schedule</span>
                  </div>
                  <div>
                    <label className="label">Call / Meeting Title</label>
                    <input value={editEventTitle} onChange={e => setEditEventTitle(e.target.value)}
                      className="input-field" autoFocus />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Start Time</label>
                      <input type="time" value={editEventStart} onChange={e => setEditEventStart(e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="label">End Time</label>
                      <input type="time" value={editEventEnd} onChange={e => setEditEventEnd(e.target.value)} className="input-field" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={deleteEditEvent}
                      className="btn-secondary flex-1 justify-center text-red-600 dark:text-red-400 hover:border-red-300 dark:hover:border-red-500/40">
                      <Trash2 size={13} /> Delete
                    </button>
                    <button onClick={saveEditEvent} className="btn-primary flex-1 justify-center">Save Changes</button>
                  </div>
                </div>
              )}

              {/* ── View note ── */}
              {modalView === 'view-note' && viewingNote && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', NOTE_COLORS[viewingNote.color].swatch)} />
                    <span className="text-xs font-bold text-indigo-900 dark:text-slate-300 uppercase tracking-widest">
                      {NOTE_COLORS[viewingNote.color].label} Note
                    </span>
                  </div>
                  <div className={cn('p-4 rounded-xl border text-sm font-semibold leading-relaxed break-words whitespace-pre-wrap', NOTE_COLORS[viewingNote.color].chip, NOTE_COLORS[viewingNote.color].border)}>
                    {viewingNote.text}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { deleteNote(viewingNote.id); setShowModal(false) }}
                      className="btn-secondary flex-1 justify-center text-red-600 dark:text-red-400 hover:border-red-300 dark:hover:border-red-500/40"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                    <button onClick={() => openEditNote(viewingNote)} className="btn-primary flex-1 justify-center">
                      <Pencil size={13} /> Edit
                    </button>
                  </div>
                </div>
              )}

              {/* ── View event ── */}
              {modalView === 'view-event' && viewingEvent && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/[0.08] border border-indigo-200 dark:border-indigo-500/25">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="font-bold text-indigo-900 dark:text-white text-base leading-snug">{viewingEvent.title}</p>
                      {viewingEvent.type === 'schedule' && (
                        <span className="text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30 rounded-full px-1.5 py-0.5 font-bold flex-shrink-0">Call</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Clock size={11} className="text-indigo-400" />
                        {format(new Date(viewingEvent.start), 'h:mm a')} – {format(new Date(viewingEvent.end), 'h:mm a')}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={11} className="text-indigo-400" />
                        {eventDuration(viewingEvent.start, viewingEvent.end)}
                      </span>
                      {viewingEvent.attendees && (
                        <span className="flex items-center gap-1.5">
                          <Users size={11} className="text-indigo-400" /> {viewingEvent.attendees} attendees
                        </span>
                      )}
                    </div>
                    {viewingEvent.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-snug">{viewingEvent.description}</p>
                    )}
                    {viewingEvent.meetLink && viewingEvent.meetLink !== '#' && (
                      <a href={viewingEvent.meetLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 btn-primary text-xs">
                        <Video size={12} /> Join Meeting
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Close</button>
                    {userEvents.some(e => e.id === viewingEvent.id) && (
                      <button onClick={() => openEditEvent(viewingEvent)} className="btn-primary flex-1 justify-center">
                        <Pencil size={13} /> Edit
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── View & manage todos ── */}
              {modalView === 'view-todos' && (() => {
                const viewDateKey  = format(modalDate, 'yyyy-MM-dd')
                const viewDateTodos = todos.filter(t => t.date === viewDateKey)
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckSquare size={14} className="text-emerald-500" />
                        <span className="text-xs font-bold text-indigo-900 dark:text-slate-300 uppercase tracking-widest">
                          Todos · {format(modalDate, 'MMM do')}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {viewDateTodos.filter(t => t.completed).length}/{viewDateTodos.length} done
                      </span>
                    </div>

                    <div className="space-y-1 max-h-52 overflow-y-auto">
                      {viewDateTodos.length === 0 && (
                        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No todos for this day yet.</p>
                      )}
                      {viewDateTodos.map(todo => (
                        editingTodoId === todo.id ? (
                          <div key={todo.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
                            <input
                              value={editingTodoText}
                              onChange={e => setEditingTodoText(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') saveTodoEdit(todo.id); if (e.key === 'Escape') setEditingTodoId(null) }}
                              className="input-field flex-1 text-sm py-1.5"
                              autoFocus
                            />
                            <button onClick={() => saveTodoEdit(todo.id)} className="btn-primary text-xs px-2.5 py-1.5">Save</button>
                            <button onClick={() => setEditingTodoId(null)} className="btn-secondary text-xs px-2.5 py-1.5">✕</button>
                          </div>
                        ) : (
                          <div key={todo.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.04] group transition-colors">
                            <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo.id)}
                              className="accent-emerald-500 w-4 h-4 cursor-pointer flex-shrink-0" />
                            <span className={cn('flex-1 text-sm', todo.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200')}>
                              {todo.text}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button
                                onClick={() => { setEditingTodoId(todo.id); setEditingTodoText(todo.text) }}
                                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-colors"
                              >
                                <Pencil size={11} className="text-slate-500 dark:text-slate-400" />
                              </button>
                              <button
                                onClick={() => deleteTodo(todo.id)}
                                className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                              >
                                <Trash2 size={11} className="text-red-500 dark:text-red-400" />
                              </button>
                            </div>
                          </div>
                        )
                      ))}
                    </div>

                    <div className="flex gap-2 pt-1 border-t border-slate-200/70 dark:border-white/[0.06]">
                      <input
                        value={newTodoForView}
                        onChange={e => setNewTodoForView(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addTodoFromView()}
                        placeholder="Add another todo..."
                        className="input-field flex-1 text-sm"
                      />
                      <button onClick={addTodoFromView} className="btn-primary text-xs px-3">Add</button>
                    </div>
                    <button onClick={() => setShowModal(false)} className="btn-secondary w-full justify-center">Done</button>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
