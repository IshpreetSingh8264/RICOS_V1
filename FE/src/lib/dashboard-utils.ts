// ─── Severity config ─────────────────────────────────────────────────────────

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string

export interface SeverityConfig {
  label: string
  color: string        // Tailwind text color class
  bg: string           // Tailwind bg class
  border: string       // Tailwind border color class
  dot: string          // Tailwind bg class for the dot indicator
  glow: string         // CSS box-shadow string
}

export function getSeverityConfig(severity: SeverityLevel): SeverityConfig {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
    case 'SEVERE':
      return {
        label: severity?.toUpperCase() === 'SEVERE' ? 'Severe' : 'Critical',
        color: 'text-red-400',
        bg: 'bg-red-500/15',
        border: 'border-red-500/40',
        dot: 'bg-red-500',
        glow: '0 0 8px rgba(239,68,68,0.4)',
      }
    case 'HIGH':
      return {
        label: 'High',
        color: 'text-orange-400',
        bg: 'bg-orange-500/15',
        border: 'border-orange-500/40',
        dot: 'bg-orange-500',
        glow: '0 0 8px rgba(249,115,22,0.4)',
      }
    case 'MEDIUM':
    case 'MODERATE':
      return {
        label: severity?.toUpperCase() === 'MODERATE' ? 'Moderate' : 'Medium',
        color: 'text-amber-400',
        bg: 'bg-amber-500/15',
        border: 'border-amber-500/40',
        dot: 'bg-amber-500',
        glow: '0 0 8px rgba(245,158,11,0.4)',
      }
    case 'LOW':
      return {
        label: 'Low',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/15',
        border: 'border-emerald-500/40',
        dot: 'bg-emerald-500',
        glow: '0 0 8px rgba(16,185,129,0.4)',
      }
    default:
      return {
        label: severity ?? 'Unknown',
        color: 'text-slate-400',
        bg: 'bg-slate-500/15',
        border: 'border-slate-500/40',
        dot: 'bg-slate-500',
        glow: 'none',
      }
  }
}

// ─── Status config ───────────────────────────────────────────────────────────

export type StatusLevel =
  | 'ACTIVE' | 'RESOLVED' | 'PENDING' | 'CLOSED'
  | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  | 'DEPLOYED' | 'AVAILABLE' | 'OFFLINE'
  | 'TEAM_ASSIGNED' | 'RESCUING'
  | string

export interface StatusConfig {
  label: string
  color: string
  bg: string
  border: string
  dot: string
}

export function getStatusConfig(status: StatusLevel): StatusConfig {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
    case 'DEPLOYED':
      return { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', dot: 'bg-emerald-500' }
    case 'AVAILABLE':
      return { label: 'Available', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/40', dot: 'bg-blue-500' }
    case 'RESOLVED':
    case 'COMPLETED':
    case 'CLOSED':
      return { label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(), color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', dot: 'bg-emerald-500' }
    case 'PENDING':
    case 'OPEN':
      return { label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(), color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/40', dot: 'bg-amber-500' }
    case 'TEAM_ASSIGNED':
      return { label: 'Team Assigned', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/40', dot: 'bg-blue-500' }
    case 'IN_PROGRESS':
    case 'RESCUING':
      return { label: 'Help En Route', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/40', dot: 'bg-orange-500' }
    case 'CANCELLED':
      return { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/40', dot: 'bg-red-500' }
    case 'OFFLINE':
      return { label: 'Offline', color: 'text-slate-500', bg: 'bg-slate-600/15', border: 'border-slate-600/40', dot: 'bg-slate-600' }
    default:
      return { label: status ?? 'Unknown', color: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/40', dot: 'bg-slate-500' }
  }
}

// ─── Time formatting ─────────────────────────────────────────────────────────

export function formatTimeAgo(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return 'Unknown'
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (isNaN(date.getTime())) return 'Invalid date'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)
  const diffWk = Math.floor(diffDay / 7)
  const diffMo = Math.floor(diffDay / 30)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  if (diffWk < 5) return `${diffWk}w ago`
  if (diffMo < 12) return `${diffMo}mo ago`
  return `${Math.floor(diffMo / 12)}y ago`
}

export function formatDate(dateStr: string | Date | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return '—'
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('en-IN', opts ?? {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—'
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (isNaN(date.getTime())) return '—'

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Currency formatting ─────────────────────────────────────────────────────

export function formatCurrency(
  amount: number | string | null | undefined,
  currency = 'INR',
  compact = false
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0)
  if (isNaN(num)) return '₹0'

  if (compact) {
    if (num >= 1_00_00_000) return `₹${(num / 1_00_00_000).toFixed(1)}Cr`
    if (num >= 1_00_000) return `₹${(num / 1_00_000).toFixed(1)}L`
    if (num >= 1_000) return `₹${(num / 1_000).toFixed(1)}K`
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatNumber(
  value: number | string | null | undefined,
  compact = false
): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0)
  if (isNaN(num)) return '0'

  if (compact) {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  }

  return new Intl.NumberFormat('en-IN').format(num)
}

// ─── Truncate text ───────────────────────────────────────────────────────────

export function truncate(str: string | null | undefined, maxLen: number): string {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}

// ─── Get initials ─────────────────────────────────────────────────────────────

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}
