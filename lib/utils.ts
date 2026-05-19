import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  return format(new Date(date), 'MMM dd, yyyy')
}

export function formatRelative(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export const PROJECT_COLORS = [
  { label: 'Violet', value: '#8b5cf6', gradient: 'from-violet-500 to-purple-600' },
  { label: 'Teal', value: '#14b8a6', gradient: 'from-teal-400 to-cyan-600' },
  { label: 'Orange', value: '#f97316', gradient: 'from-orange-400 to-red-500' },
  { label: 'Pink', value: '#ec4899', gradient: 'from-pink-500 to-rose-600' },
  { label: 'Blue', value: '#3b82f6', gradient: 'from-blue-400 to-indigo-600' },
  { label: 'Green', value: '#22c55e', gradient: 'from-green-400 to-emerald-600' },
  { label: 'Yellow', value: '#eab308', gradient: 'from-yellow-400 to-amber-500' },
  { label: 'Red', value: '#ef4444', gradient: 'from-red-400 to-rose-600' },
]

export function getProjectGradient(color: string) {
  return PROJECT_COLORS.find(c => c.value === color)?.gradient ?? 'from-violet-500 to-purple-600'
}

export const STATUS_STYLES = {
  pass:    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  fail:    'bg-red-500/20 text-red-400 border-red-500/30',
  blocked: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  skipped: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  pending: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

export const PRIORITY_STYLES = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low:      'bg-green-500/20 text-green-400 border-green-500/30',
}

export const PROJECT_STATUS_STYLES = {
  active:    'bg-emerald-500/20 text-emerald-400',
  completed: 'bg-blue-500/20 text-blue-400',
  'on-hold': 'bg-orange-500/20 text-orange-400',
}
