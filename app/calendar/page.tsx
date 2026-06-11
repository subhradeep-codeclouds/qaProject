'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import {
  Calendar, Video, Clock, Users, ChevronLeft, ChevronRight,
  AlertCircle, Plus, CheckSquare, X, Phone, Briefcase, Home, Building2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  format, addDays, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval,
  isSameDay, isToday, addMonths, subMonths, isSameMonth
} from 'date-fns'

type CalEvent = {
  id: string
  title: string
  start: string
  end: string
  meetLink?: string
  attendees?: number
  description?: string
  type?: 'event' | 'schedule'
}

type Todo = { id: string; text: string; completed: boolean; date: string }
type WorkStatus = Record<string, 'wfo' | 'planned_wfo'>

const MOCK_EVENTS: CalEvent[] = [
  {
    id: '1', title: 'Daily Standup',
    start: new Date().toISOString().replace(/T.*/, 'T09:00:00'),
    end: new Date().toISOString().replace(/T.*/, 'T09:30:00'),
    attendees: 6, meetLink: '#', type: 'event',
  },
  {
    id: '2', title: 'Sprint Planning',
    start: new Date().toISOString().replace(/T.*/, 'T11:00:00'),
    end: new Date().toISOString().replace(/T.*/, 'T12:00:00'),
    attendees: 12, meetLink: '#', type: 'event',
    description: 'Plan sprint tasks for next 2 weeks',
  },
  {
    id: '3', title: 'QA Review - E-Commerce',
    start: addDays(new Date(), 1).toISOString().replace(/T.*/, 'T14:00:00'),
    end: addDays(new Date(), 1).toISOString().replace(/T.*/, 'T15:00:00'),
    attendees: 4, meetLink: '#', type: 'event',
  },
  {
    id: '4', title: 'Bug Triage Meeting',
    start: addDays(new Date(), 2).toISOString().replace(/T.*/, 'T10:00:00'),
    end: addDays(new Date(), 2).toISOString().replace(/T.*/, 'T10:30:00'),
    attendees: 8, type: 'event',
  },
]

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function isWeekend(day: Date) {
  return [0, 6].includes(day.getDay())
}

function isPastOrToday(day: Date) {
  return format(day, 'yyyy-MM-dd') <= format(new Date(), 'yyyy-MM-dd')
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [userEvents, setUserEvents] = useState<CalEvent[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [googleConnected] = useState(false)
  const [workStatus, setWorkStatus] = useState<WorkStatus>({})

  const [showModal, setShowModal] = useState(false)
  const [modalDate, setModalDate] = useState<Date>(new Date())
  const [modalView, setModalView] = useState<'options' | 'add-schedule' | 'add-todo'>('options')

  const [newTodoText, setNewTodoText] = useState('')
  const [scheduleTitle, setScheduleTitle] = useState('')
  const [scheduleStart, setScheduleStart] = useState('09:00')
  const [scheduleEnd, setScheduleEnd] = useState('10:00')

  useEffect(() => {
    const storedTodos = localStorage.getItem('qa_portal_todos')
    if (storedTodos) {
      try { setTodos(JSON.parse(storedTodos)) } catch { /* ignore */ }
    }
    const storedEvents = localStorage.getItem('qa_portal_user_events')
    if (storedEvents) {
      try { setUserEvents(JSON.parse(storedEvents)) } catch { /* ignore */ }
    }
    const storedWS = localStorage.getItem('qa_portal_work_status')
    if (storedWS) {
      try { setWorkStatus(JSON.parse(storedWS)) } catch { /* ignore */ }
    }
  }, [])

  const allEvents = [...MOCK_EVENTS, ...userEvents]

  function saveTodos(updated: Todo[]) {
    setTodos(updated)
    localStorage.setItem('qa_portal_todos', JSON.stringify(updated))
  }

  function saveUserEvents(updated: CalEvent[]) {
    setUserEvents(updated)
    localStorage.setItem('qa_portal_user_events', JSON.stringify(updated))
  }

  function saveWorkStatus(updated: WorkStatus) {
    setWorkStatus(updated)
    localStorage.setItem('qa_portal_work_status', JSON.stringify(updated))
  }

  function toggleWFO(dateKey: string) {
    const updated = { ...workStatus }
    if (updated[dateKey] === 'wfo') {
      delete updated[dateKey]
    } else {
      updated[dateKey] = 'wfo'
    }
    saveWorkStatus(updated)
  }

  function togglePlannedWFO(dateKey: string) {
    const updated = { ...workStatus }
    if (updated[dateKey] === 'planned_wfo') {
      delete updated[dateKey]
    } else {
      updated[dateKey] = 'planned_wfo'
    }
    saveWorkStatus(updated)
  }

  function toggleTodo(id: string) {
    saveTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  function deleteTodo(id: string) {
    saveTodos(todos.filter(t => t.id !== id))
  }

  function addTodo() {
    if (!newTodoText.trim()) return
    const dateKey = format(modalDate, 'yyyy-MM-dd')
    saveTodos([...todos, { id: Date.now().toString(), text: newTodoText.trim(), completed: false, date: dateKey }])
    setNewTodoText('')
    setShowModal(false)
  }

  function addSchedule() {
    if (!scheduleTitle.trim()) return
    const dateStr = format(modalDate, 'yyyy-MM-dd')
    const newEvent: CalEvent = {
      id: Date.now().toString(),
      title: scheduleTitle.trim(),
      start: `${dateStr}T${scheduleStart}:00`,
      end: `${dateStr}T${scheduleEnd}:00`,
      type: 'schedule',
    }
    saveUserEvents([...userEvents, newEvent])
    setScheduleTitle('')
    setScheduleStart('09:00')
    setScheduleEnd('10:00')
    setShowModal(false)
  }

  function openModalForDate(day: Date) {
    setSelectedDay(day)
    setModalDate(day)
    setModalView('options')
    setNewTodoText('')
    setScheduleTitle('')
    setShowModal(true)
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const allDays = eachDayOfInterval({ start: calStart, end: calEnd })

  // Monthly stats
  const allMonthWeekdays = eachDayOfInterval({ start: monthStart, end: monthEnd }).filter(d => !isWeekend(d))
  const doneWeekdays = allMonthWeekdays.filter(d => isPastOrToday(d))
  const futureWeekdays = allMonthWeekdays.filter(d => !isPastOrToday(d))
  const wfoDoneCount = doneWeekdays.filter(d => workStatus[format(d, 'yyyy-MM-dd')] === 'wfo').length
  const wfhDoneCount = doneWeekdays.length - wfoDoneCount
  const plannedWFOCount = futureWeekdays.filter(d => workStatus[format(d, 'yyyy-MM-dd')] === 'planned_wfo').length

  const selectedDateKey = format(selectedDay, 'yyyy-MM-dd')
  const dayEvents = allEvents.filter(e => isSameDay(new Date(e.start), selectedDay))
  const dayTodos = todos.filter(t => t.date === selectedDateKey)

  function formatTime(iso: string) {
    return format(new Date(iso), 'h:mm a')
  }

  function eventDuration(start: string, end: string) {
    const mins = (new Date(end).getTime() - new Date(start).getTime()) / 60000
    if (mins < 60) return `${mins}m`
    return `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ''}`
  }

  const modalDateKey = format(modalDate, 'yyyy-MM-dd')
  const modalIsWeekend = isWeekend(modalDate)
  const modalIsPast = isPastOrToday(modalDate)
  const modalWorkStatus = workStatus[modalDateKey]

  return (
    <div>
      <Header title="Calendar" />
      <div className="p-6 space-y-6 animate-fade-in">

        {/* Google Calendar connection banner */}
        {!googleConnected && (
          <div className="glass-card p-4 flex items-start gap-3" style={{ borderColor: 'rgba(59,130,246,0.3)' }}>
            <AlertCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-300">Connect Google Calendar</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Add your Google OAuth credentials to .env to see real meetings. Currently showing demo events.
              </p>
            </div>
            <button className="btn-primary flex-shrink-0 text-xs">
              <Calendar size={13} /> Connect Google
            </button>
          </div>
        )}

        {/* Month calendar */}
        <div className="glass-card p-5">
          {/* Month navigator */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-white text-lg tracking-tight">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMonth(m => subMonths(m, 1))}
                className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors border border-white/[0.06]"
              >
                <ChevronLeft size={15} className="text-slate-400" />
              </button>
              <button
                onClick={() => { setCurrentMonth(new Date()); setSelectedDay(new Date()) }}
                className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs text-slate-300 font-medium transition-colors border border-white/[0.06]"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth(m => addMonths(m, 1))}
                className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors border border-white/[0.06]"
              >
                <ChevronRight size={15} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_LABELS.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest py-1.5">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {allDays.map(day => {
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isSelected = isSameDay(day, selectedDay)
              const isTodays = isToday(day)
              const evCount = allEvents.filter(e => isSameDay(new Date(e.start), day)).length
              const todoCnt = todos.filter(t => t.date === format(day, 'yyyy-MM-dd')).length
              const dateKey = format(day, 'yyyy-MM-dd')
              const dayWorkStatus = workStatus[dateKey]
              const weekend = isWeekend(day)
              const pastOrToday = isPastOrToday(day)

              let statusLabel = ''
              let statusClass = ''
              if (!weekend && isCurrentMonth) {
                if (dayWorkStatus === 'wfo') {
                  statusLabel = 'WFO'
                  statusClass = 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]'
                } else if (dayWorkStatus === 'planned_wfo') {
                  statusLabel = 'OFFICE'
                  statusClass = 'text-violet-400 drop-shadow-[0_0_6px_rgba(167,139,250,0.7)]'
                } else if (pastOrToday) {
                  statusLabel = 'WFH'
                  statusClass = 'text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]'
                } else {
                  statusLabel = 'WFH'
                  statusClass = 'text-emerald-400/50'
                }
              }

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => openModalForDate(day)}
                  className={cn(
                    'p-1.5 rounded-xl text-center transition-all min-h-[82px] flex flex-col items-center justify-start pt-2 relative group',
                    !isCurrentMonth && 'opacity-30',
                    isSelected && 'bg-violet-600/25 border border-violet-400/50',
                    !isSelected && isTodays && 'bg-white/[0.08] border border-white/[0.15]',
                    !isSelected && !isTodays && 'hover:bg-white/[0.05] border border-transparent',
                    dayWorkStatus === 'wfo' && isCurrentMonth && !isSelected && 'bg-amber-500/10 border-amber-500/30',
                    dayWorkStatus === 'planned_wfo' && isCurrentMonth && !isSelected && 'bg-violet-500/10 border-violet-500/30',
                  )}
                >
                  <p className={cn(
                    'text-sm font-bold leading-none',
                    isSelected ? 'text-violet-300' : isTodays ? 'text-white' : 'text-slate-400'
                  )}>
                    {format(day, 'd')}
                  </p>

                  {/* Work status label */}
                  {statusLabel && (
                    <span className={cn(
                      'text-[9px] font-black uppercase tracking-widest mt-1.5 leading-none',
                      statusClass
                    )}>
                      {statusLabel}
                    </span>
                  )}

                  {(evCount > 0 || todoCnt > 0) && (
                    <div className="flex items-center justify-center gap-0.5 mt-1.5 flex-wrap">
                      {Array.from({ length: Math.min(evCount, 3) }).map((_, i) => (
                        <div key={`ev-${i}`} className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      ))}
                      {todoCnt > 0 && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </div>
                  )}
                  <span className="absolute bottom-1 text-[8px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    + add
                  </span>
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-4 pt-4 border-t border-white/[0.06] flex-wrap">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              Events / Calls
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              Todos
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-amber-400/80 font-black uppercase tracking-wider">
              WFO
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/80 font-black uppercase tracking-wider">
              WFH
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-violet-400/80 font-black uppercase tracking-wider">
              OFFICE
            </div>
          </div>

          {/* Monthly WFO Stats */}
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
              {format(currentMonth, 'MMMM yyyy')} — Work Summary
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <Building2 size={14} className="text-amber-400" />
                </div>
                <p className="text-2xl font-black text-amber-400 leading-none drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                  {wfoDoneCount}
                </p>
                <p className="text-[9px] font-bold text-amber-400/60 uppercase tracking-widest mt-1">
                  WFO Done
                </p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <Home size={14} className="text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-emerald-400 leading-none drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                  {wfhDoneCount}
                </p>
                <p className="text-[9px] font-bold text-emerald-400/60 uppercase tracking-widest mt-1">
                  WFH Done
                </p>
              </div>
              <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <Briefcase size={14} className="text-violet-400" />
                </div>
                <p className="text-2xl font-black text-violet-400 leading-none drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]">
                  {plannedWFOCount}
                </p>
                <p className="text-[9px] font-bold text-violet-400/60 uppercase tracking-widest mt-1">
                  Need WFO
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Selected day panel */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">
              {isToday(selectedDay) ? 'Today' : format(selectedDay, 'EEEE, MMMM do')}
              <span className="ml-2 text-sm font-normal text-slate-500 dark:text-[#2d6a3e]">
                · {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}, {dayTodos.length} todo{dayTodos.length !== 1 ? 's' : ''}
              </span>
            </h3>
            <button
              onClick={() => { setModalDate(selectedDay); setModalView('options'); setShowModal(true) }}
              className="btn-primary text-xs"
            >
              <Plus size={13} /> Add
            </button>
          </div>

          {/* Events / call schedules */}
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
                              <span className="text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full px-1.5 py-0.5 font-bold">
                                Call
                              </span>
                            )}
                          </div>
                          {ev.description && <p className="text-sm text-slate-400 mt-0.5">{ev.description}</p>}
                        </div>
                        {ev.meetLink && ev.meetLink !== '#' && (
                          <a href={ev.meetLink} target="_blank" rel="noopener noreferrer">
                            <button className="btn-primary flex-shrink-0 ml-3 text-xs">
                              <Video size={12} /> Join
                            </button>
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock size={11} /> {eventDuration(ev.start, ev.end)}
                        </span>
                        {ev.attendees && (
                          <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Users size={11} /> {ev.attendees} attendees
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Todos checklist */}
          {dayTodos.length > 0 && (
            <div className="glass-card p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckSquare size={14} className="text-emerald-400 flex-shrink-0" />
                <h4 className="text-sm font-bold text-white">Todo Checklist</h4>
                <span className="text-xs text-slate-500 ml-1">
                  {dayTodos.filter(t => t.completed).length}/{dayTodos.length} done
                </span>
              </div>
              <div className="space-y-1">
                {dayTodos.map(todo => (
                  <label key={todo.id} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-white/[0.04] transition-colors">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                      className="accent-emerald-400 w-4 h-4 cursor-pointer flex-shrink-0"
                    />
                    <span className={cn('flex-1 text-sm', todo.completed ? 'line-through text-slate-500' : 'text-white')}>
                      {todo.text}
                    </span>
                    <button
                      onClick={e => { e.preventDefault(); deleteTodo(todo.id) }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded-lg"
                    >
                      <X size={12} className="text-red-400" />
                    </button>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {dayEvents.length === 0 && dayTodos.length === 0 && (
            <div className="glass-card p-12 text-center">
              <Calendar size={36} className="text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">Nothing scheduled for this day.</p>
              <button
                onClick={() => { setModalDate(selectedDay); setModalView('options'); setShowModal(true) }}
                className="btn-primary mx-auto"
              >
                <Plus size={14} /> Add Something
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Day action modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="glass-card w-full max-w-sm p-5 mx-4 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {format(modalDate, 'EEEE')}
                </p>
                <h3 className="font-bold text-white text-base">
                  {format(modalDate, 'MMMM do, yyyy')}
                </h3>
                {/* Current work status badge in modal header */}
                {!modalIsWeekend && (
                  <div className="flex items-center gap-1.5 mt-1">
                    {modalWorkStatus === 'wfo' ? (
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                        ● WFO
                      </span>
                    ) : modalWorkStatus === 'planned_wfo' ? (
                      <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
                        ● OFFICE PLANNED
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                        ● WFH
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors"
              >
                <X size={14} className="text-slate-400" />
              </button>
            </div>

            {/* Options */}
            {modalView === 'options' && (
              <div className="space-y-2">
                {/* WFO / WFH toggle — only for weekdays */}
                {!modalIsWeekend && (
                  <button
                    onClick={() => {
                      if (modalIsPast) {
                        toggleWFO(modalDateKey)
                      } else {
                        togglePlannedWFO(modalDateKey)
                      }
                      setShowModal(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.06] transition-all text-left group',
                      modalIsPast
                        ? modalWorkStatus === 'wfo'
                          ? 'hover:bg-emerald-500/15 hover:border-emerald-500/40'
                          : 'hover:bg-amber-500/15 hover:border-amber-500/40'
                        : modalWorkStatus === 'planned_wfo'
                          ? 'hover:bg-red-500/15 hover:border-red-500/40'
                          : 'hover:bg-violet-500/15 hover:border-violet-500/40'
                    )}
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg',
                      modalIsPast
                        ? modalWorkStatus === 'wfo'
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20'
                          : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20'
                        : modalWorkStatus === 'planned_wfo'
                          ? 'bg-gradient-to-br from-slate-500 to-slate-600'
                          : 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/20'
                    )}>
                      {modalIsPast
                        ? modalWorkStatus === 'wfo'
                          ? <Home size={15} className="text-white" />
                          : <Building2 size={15} className="text-white" />
                        : modalWorkStatus === 'planned_wfo'
                          ? <X size={15} className="text-white" />
                          : <Briefcase size={15} className="text-white" />
                      }
                    </div>
                    <div>
                      <p className={cn(
                        'text-sm font-semibold text-white transition-colors',
                        modalIsPast
                          ? modalWorkStatus === 'wfo'
                            ? 'group-hover:text-emerald-300'
                            : 'group-hover:text-amber-300'
                          : modalWorkStatus === 'planned_wfo'
                            ? 'group-hover:text-red-300'
                            : 'group-hover:text-violet-300'
                      )}>
                        {modalIsPast
                          ? modalWorkStatus === 'wfo'
                            ? 'Mark as WFH'
                            : 'Mark as WFO'
                          : modalWorkStatus === 'planned_wfo'
                            ? 'Remove Office Plan'
                            : 'Plan Office Day'
                        }
                      </p>
                      <p className="text-xs text-slate-500">
                        {modalIsPast
                          ? modalWorkStatus === 'wfo'
                            ? 'Change back to work from home'
                            : 'Mark this day as worked from office'
                          : modalWorkStatus === 'planned_wfo'
                            ? 'Remove the planned office visit'
                            : 'Mark this future date as need to go to office'
                        }
                      </p>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => setModalView('add-schedule')}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.04] hover:bg-blue-500/15 border border-white/[0.06] hover:border-blue-500/40 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                    <Phone size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">Add Call Schedule</p>
                    <p className="text-xs text-slate-500">Schedule a meeting or call</p>
                  </div>
                </button>
                <button
                  onClick={() => setModalView('add-todo')}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.04] hover:bg-emerald-500/15 border border-white/[0.06] hover:border-emerald-500/40 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                    <CheckSquare size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">Add Todo</p>
                    <p className="text-xs text-slate-500">Add a checklist item for this day</p>
                  </div>
                </button>
              </div>
            )}

            {/* Add schedule form */}
            {modalView === 'add-schedule' && (
              <div className="space-y-3">
                <div>
                  <label className="label">Call / Meeting Title</label>
                  <input
                    value={scheduleTitle}
                    onChange={e => setScheduleTitle(e.target.value)}
                    placeholder="e.g. Sprint Review, QA Sync..."
                    className="input-field"
                    autoFocus
                  />
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

            {/* Add todo form */}
            {modalView === 'add-todo' && (
              <div className="space-y-3">
                <div>
                  <label className="label">Todo Item</label>
                  <input
                    value={newTodoText}
                    onChange={e => setNewTodoText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTodo()}
                    placeholder="What needs to be done?"
                    className="input-field"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setModalView('options')} className="btn-secondary flex-1 justify-center">Back</button>
                  <button onClick={addTodo} className="btn-primary flex-1 justify-center">Add Todo</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
