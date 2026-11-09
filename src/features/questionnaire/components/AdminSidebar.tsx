'use client'

import React from 'react'
import Link from 'next/link'
import { LayoutDashboard, PieChart, CheckSquare, Users, LucideIcon } from 'lucide-react'

export type AdminSection = 'ringkasan' | 'statistik' | 'skor' | 'analitik'

const NAV_ITEMS: Array<{ key: AdminSection; label: string; icon: LucideIcon }> = [
  { key: 'ringkasan', label: 'Ringkasan', icon: LayoutDashboard },
  { key: 'statistik', label: 'Statistik Keseluruhan', icon: PieChart },
  { key: 'skor', label: 'Skor Pasien (IMSA)', icon: CheckSquare },
  { key: 'analitik', label: 'Analitik per Pertanyaan', icon: Users },
]

/**
 * Pure navigation — no data fetching. Switches which section `admin/page.tsx`
 * renders via the `?section=` query param (same query-param-driven server
 * re-render convention `?inisial=` already used, see ScoreTable.tsx).
 */
export default function AdminSidebar({ active }: { active: string }) {
  return (
    <nav style={styles.sidebar} aria-label="Navigasi admin">
      {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
        const isActive = active === key
        return (
          <Link
            key={key}
            href={`?section=${key}`}
            style={{ ...styles.link, ...(isActive ? styles.linkActive : {}) }}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={18} color={isActive ? '#3b82f6' : '#64748b'} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

const styles = {
  sidebar: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    width: '260px',
    flexShrink: 0,
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '24px',
    padding: '1.25rem',
    alignSelf: 'flex-start',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
  } as React.CSSProperties,
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.85rem 1rem',
    borderRadius: '14px',
    color: '#64748b',
    fontSize: '15px',
    fontWeight: 600,
    textDecoration: 'none',
  } as React.CSSProperties,
  linkActive: {
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
  } as React.CSSProperties,
}
