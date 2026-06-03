'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import { Zap, Plus, Save, ChevronDown, ChevronUp, Calendar } from 'lucide-react'
import { supabase, type StandupNote } from '@/lib/supabase'
import { cn, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function StandupPage() {
  const [notes, setNotes] = useState<StandupNote[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    tested_today: '',
    blockers: '',
    plan_tomorrow: '',
  })

  useEffect(() => { fetchNotes() }, [])

  async function fetchNotes() {
    const { data } = await supabase.from('standup_notes').select('*').order('date', { ascending: false })
    if (data) setNotes(data)
    setLoading(false)
  }

  async function saveNote() {
    if (!form.tested_today.trim() && !form.plan_tomorrow.trim()) {
      return toast.error('Fill in at least one field')
    }
    setSaving(true)
    const { error } = await supabase.from('standup_notes').upsert(
      [form], { onConflict: 'date' }
    )
    setSaving(false)
    if (error) return toast.error('Failed to save')
    toast.success('Standup saved!')
    fetchNotes()
  }

  return (
    <div>
      <Header title="Daily Standup" />
      <div className="p-6 space-y-6 animate-fade-in">

        {/* Today's standup form */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-violet-500 flex items-center justify-center shadow-lg shadow-yellow-500/25">
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Today&apos;s Standup</h3>
              <p className="text-xs text-slate-500">{format(new Date(), 'EEEE, MMMM do yyyy')}</p>
            </div>
            <div className="ml-auto">
              <input type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="input-field w-auto" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold">1</span>
                What did I test / work on today?
              </label>
              <textarea value={form.tested_today}
                onChange={e => setForm(f => ({ ...f, tested_today: e.target.value }))}
                placeholder="e.g. Tested login flow on staging, completed 15 test cases for Project X, filed 3 bugs..."
                rows={4} className="input-field resize-none" />
            </div>
            <div>
              <label className="label flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-[10px] flex items-center justify-center font-bold">2</span>
                Blockers / Issues?
              </label>
              <textarea value={form.blockers}
                onChange={e => setForm(f => ({ ...f, blockers: e.target.value }))}
                placeholder="Any blockers, dependencies, or issues you're facing..."
                rows={3} className="input-field resize-none" />
            </div>
            <div>
              <label className="label flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] flex items-center justify-center font-bold">3</span>
                Plan for tomorrow?
              </label>
              <textarea value={form.plan_tomorrow}
                onChange={e => setForm(f => ({ ...f, plan_tomorrow: e.target.value }))}
                placeholder="e.g. Continue regression testing, review test cases for Project Y..."
                rows={3} className="input-field resize-none" />
            </div>
          </div>

          <button className="btn-primary mt-5" onClick={saveNote} disabled={saving}>
            <Save size={15} /> {saving ? 'Saving...' : 'Save Standup'}
          </button>
        </div>

        {/* Past standups */}
        <div>
          <h3 className="section-title mb-4">Past Standups</h3>
          {loading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="glass-card h-16 animate-pulse" />)}</div>
          ) : notes.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Calendar size={32} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No standup notes yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notes.map(note => (
                <div key={note.id} className="glass-card overflow-hidden">
                  <div className="p-4 flex items-center gap-3 cursor-pointer hover:bg-white/[0.02]"
                    onClick={() => setExpandedId(expandedId === note.id ? null : note.id)}>
                    <Calendar size={14} className="text-violet-400 flex-shrink-0" />
                    <p className="text-sm font-medium text-white flex-1">{formatDate(note.date)}</p>
                    <div className="flex gap-2">
                      {note.tested_today && <span className="badge bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Tested</span>}
                      {note.blockers && <span className="badge bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">Blockers</span>}
                    </div>
                    {expandedId === note.id
                      ? <ChevronUp size={14} className="text-slate-500" />
                      : <ChevronDown size={14} className="text-slate-500" />}
                  </div>
                  {expandedId === note.id && (
                    <div className="px-4 pb-4 pt-2 border-t border-white/[0.05] space-y-3">
                      {note.tested_today && (
                        <div>
                          <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1">Tested / Worked On</p>
                          <p className="text-sm text-slate-300 whitespace-pre-wrap">{note.tested_today}</p>
                        </div>
                      )}
                      {note.blockers && (
                        <div>
                          <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1">Blockers</p>
                          <p className="text-sm text-slate-300 whitespace-pre-wrap">{note.blockers}</p>
                        </div>
                      )}
                      {note.plan_tomorrow && (
                        <div>
                          <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1">Plan for Tomorrow</p>
                          <p className="text-sm text-slate-300 whitespace-pre-wrap">{note.plan_tomorrow}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
