'use client'

import React from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { QUESTION_DOMAIN_MAP, NESTED_SUB_VARS } from '../utils'
import type { AnalyticsQuestion } from '@/features/questionnaire'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16']

type ChartCard =
  | { kind: 'pie'; id: string; title: string; data: Array<{ name: string; value: number }> }
  | { kind: 'bar'; id: string; title: string; data: Array<{ bucket: string; count: number }> }

/**
 * Questions outside QUESTION_DOMAIN_MAP carry no IMSA scoring weight — that's
 * exactly the "Data Diri & Tambahan" domain (identity/demographic + PRA/Tamb).
 * Same convention AnalyticsDashboard uses for its domain grouping.
 */
export function isIdentityQuestion(variableName: string): boolean {
  return QUESTION_DOMAIN_MAP[variableName] === undefined
}

/**
 * Buckets a value→count distribution into ~6 equal-width ranges for a histogram.
 * `answerDistribution` is already aggregated (value → how many responses had it),
 * so this groups keys, not raw rows.
 */
export function buildHistogram(distribution: Record<string, number>): Array<{ bucket: string; count: number }> {
  const entries = Object.entries(distribution)
    .map(([key, count]) => [Number(key), count] as const)
    .filter(([n]) => Number.isFinite(n))
  if (entries.length === 0) return []

  const values = entries.map(([n]) => n)
  const min = Math.min(...values)
  const max = Math.max(...values)

  if (min === max) {
    return [{ bucket: `${min}`, count: entries.reduce((sum, [, c]) => sum + c, 0) }]
  }

  const width = Math.max(1, Math.ceil((max - min + 1) / 6))
  const buckets = new Map<number, number>()
  for (const [n, count] of entries) {
    const idx = Math.floor((n - min) / width)
    buckets.set(idx, (buckets.get(idx) ?? 0) + count)
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([idx, count]) => {
      const lo = min + idx * width
      const hi = lo + width - 1
      return { bucket: width === 1 ? `${lo}` : `${lo}-${hi}`, count }
    })
}

/** Resolves stored keys (option values, or raw tokens for checkbox) back to their option label. */
export function buildPieData(question: AnalyticsQuestion): Array<{ name: string; value: number }> {
  return Object.entries(question.answerDistribution).map(([key, value]) => {
    const opt = question.options?.find((o) => String(o.value) === key)
    return { name: opt?.label ?? key, value }
  })
}

/**
 * Accumulated statistics across ALL responses (not scoped to one patient) for the
 * "Data Diri & Tambahan" domain — demographic/intake questions like jenis_kelamin,
 * pekerjaan, pendidikan. IMSA-scored items stay in the per-patient AnalyticsDashboard.
 */
export default function OverallStatsCharts({ questions }: { questions: AnalyticsQuestion[] }) {
  const cards: ChartCard[] = []

  for (const q of questions) {
    if (!isIdentityQuestion(q.variableName)) continue
    if (q.variableName.endsWith('_lainnya')) continue
    if (NESTED_SUB_VARS.includes(q.variableName)) continue
    if (Object.keys(q.answerDistribution).length === 0) continue

    if ((q.type === 'radio' || q.type === 'checkbox') && q.options && q.options.length > 0) {
      cards.push({ kind: 'pie', id: q.id, title: q.prompt, data: buildPieData(q) })
    } else if (q.type === 'number') {
      const data = buildHistogram(q.answerDistribution)
      if (data.length > 0) cards.push({ kind: 'bar', id: q.id, title: q.prompt, data })
    }
    // Free-text questions (type 'text') have no categorical/numeric shape to chart — skipped.
  }

  if (cards.length === 0) {
    return (
      <div style={styles.emptyState}>
        Belum ada data respons. Statistik akan muncul setelah responden mengisi kuesioner.
      </div>
    )
  }

  return (
    <div style={styles.grid}>
      {cards.map((card) => (
        <div key={card.id} style={styles.card}>
          <h3 style={styles.cardTitle}>{card.title}</h3>
          <ResponsiveContainer width="100%" height={260}>
            {card.kind === 'pie' ? (
              <PieChart>
                <Pie
                  data={card.data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {card.data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            ) : (
              <BarChart data={card.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  )
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '1.5rem',
  } as React.CSSProperties,
  card: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    padding: '1.5rem',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#334155',
    margin: '0 0 1rem 0',
    lineHeight: 1.4,
  } as React.CSSProperties,
  emptyState: {
    padding: '5rem 2rem',
    textAlign: 'center' as const,
    color: '#94a3b8',
    fontSize: '1.1rem',
    fontWeight: 500,
    backgroundColor: '#f8fafc',
    borderRadius: '24px',
    border: '2px dashed #cbd5e1',
  } as React.CSSProperties,
}
