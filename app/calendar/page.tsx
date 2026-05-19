'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { Calendar, Video, Clock, Users, ExternalLink, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, addDays, startOfWeek, isSameDay, isToday, addWeeks, subWeeks } from 'date-fns'

type CalEvent = {
  id: string
  title: string
  start: string
  end: string
  meetLink?: string
  attendees?: number
  description?: string
  colorId?: string
}

const MOCK_EVENTS: CalEvent[] = [
  {
    id: '1', title: 'Daily Standup', start: new Date().toISOString().replace(/T.*/, 'T09:00:00'),
    end: new Date().toISOString().replace(/T.*/, 'T09:30:00'), attendees: 6, meetLink: '#',
  },
  {
    id: '2', title: 'Sprint Planning', start: new Date().toISOString().replace(/T.*/, 'T11:00:00'),
    end: new Date().toISOString().replace(/T.*/, 'T12:00:00'), attendees: 12, meetLink: '#',
    description: 'Plan sprint tasks for next 2 weeks',
  },
  {
    id: '3', title: 'QA Review - E-Commerce', start: addDays(new Date(), 1).toISOString().replace(/T.*/, 'T14:00:00'),
    end: addDays(new Date(), 1).toISOString().replace(/T.*/, 'T15:00:00'), attendees: 4, meetLink: '#',
  },
  {
    id: '4', title: 'Bug Triage Meeting', start: addDays(new Date(), 2).toISOString().replace(/T.*/, 'T10:00:00'),
    end: addDays(new Date(), 2).toISOString().replace(/T.*/, 'T10:30:00'), attendees: 8,
  },
]

export default function CalendarPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [events, setEvents] = useState<CalEvent[]>(MOCK_EVENTS)
  const [googleConnected] = useState(false)
  const [selectedDay, setSelectedDay] = useState(new Date())

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const dayEvents = events.filter(e => isSameDay(new Date(e.start), selectedDay))

  function formatTime(iso: string) {
    return format(new Date(iso), 'h:mm a')
  }

  function eventDuration(start: string, end: string) {
    const mins = (new Date(end).getTime() - new Date(start).getTime()) / 60000
    if (mins < 60) return `${mins}m`
    return `${Math.floor(mins / 60)}h ${mins % 60 ? `${mins % 60}m` : ''}`
  }

  return (
    <div>
      <Header title="Calendar" />
      <div className="p-6 space-y-6 animate-fade-in">

        {/* Google Calendar connection */}
        {!googleConnected && (
          <div className="glass-card p-4 border-blue-500/20 bg-blue-500/5 flex items-start gap-3">
            <AlertCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-300">Connect Google Calendar</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Add your Google OAuth credentials to .env to see your real meetings. Currently showing demo events.
              </p>
            </div>
            <button className="btn-primary flex-shrink-0">
              <Calendar size={14} /> Connect Google
            </button>
          </div>
        )}

        {/* Week navigator */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">
              {format(weekStart, 'MMMM yyyy')}
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentWeek(w => subWeeks(w, 1))}
                className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] flex items-center justify-center transition-colors">
                <ChevronLeft size={15} className="text-slate-400" />
              </button>
              <button onClick={() => setCurrentWeek(new Date())}
                className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] text-xs text-slate-300 transition-colors">
                Today
              </button>
              <button onClick={() => setCurrentWeek(w => addWeeks(w, 1))}
                className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] flex items-center justify-center transition-colors">
                <ChevronRight size={15} className="text-slate-400" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => {
              const dayEvCount = events.filter(e => isSameDay(new Date(e.start), day)).length
              const selected = isSameDay(day, selectedDay)
              const today = isToday(day)
              return (
                <button key={day.toISOString()} onClick={() => setSelectedDay(day)}
                  className={cn('p-3 rounded-xl text-center transition-all',
                    selected ? 'bg-violet-600/30 border border-violet-500/40' :
                    today ? 'bg-white/[0.06] border border-white/[0.12]' : 'hover:bg-white/[0.04]'
                  )}>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">{format(day, 'EEE')}</p>
                  <p className={cn('text-lg font-bold mt-0.5', selected ? 'text-violet-300' : today ? 'text-white' : 'text-slate-400')}>
                    {format(day, 'd')}
                  </p>
                  {dayEvCount > 0 && (
                    <div className="flex justify-center gap-0.5 mt-1">
                      {Array.from({ length: Math.min(dayEvCount, 3) }).map((_, i) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-violet-400" />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Day events */}
        <div>
          <h3 className="section-title mb-4">
            {isToday(selectedDay) ? 'Today' : format(selectedDay, 'EEEE, MMMM do')}
            <span className="ml-2 text-sm font-normal text-slate-500">· {dayEvents.length} events</span>
          </h3>

          {dayEvents.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Calendar size={36} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400">No events scheduled.</p>
            </div>
          ) : (
            <div className="space-y-3">
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
                          <p className="font-semibold text-white">{ev.title}</p>
                          {ev.description && <p className="text-sm text-slate-400 mt-0.5">{ev.description}</p>}
                        </div>
                        {ev.meetLink && ev.meetLink !== '#' && (
                          <a href={ev.meetLink} target="_blank" rel="noopener noreferrer">
                            <button className="btn-primary flex-shrink-0 ml-3">
                              <Video size={13} /> Join
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
        </div>
      </div>
    </div>
  )
}
