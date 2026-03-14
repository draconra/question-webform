'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

type AnalyticsQuestion = {
  id: string
  variableName: string
  prompt: string
  type: string
  options: Array<{ label: string; value: number }> | null
  answerDistribution: Record<string, number>
}

const COLORS = ['#2563eb', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']

function QuestionChart({ question }: { question: AnalyticsQuestion }) {
  const totalAnswers = Object.values(question.answerDistribution).reduce((a, b) => a + b, 0)

  if (totalAnswers === 0) {
    return (
      <div style={styles.noData}>Belum ada jawaban</div>
    )
  }

  const chartData = question.options
    ? question.options.map((opt, i) => ({
        name: opt.label.length > 30 ? opt.label.slice(0, 28) + '…' : opt.label,
        fullLabel: opt.label,
        count: question.answerDistribution[String(opt.value)] ?? 0,
        color: COLORS[i % COLORS.length],
      }))
    : Object.entries(question.answerDistribution).map(([val, count], i) => ({
        name: val,
        fullLabel: val,
        count,
        color: COLORS[i % COLORS.length],
      }))

  return (
    <div style={styles.chartWrapper}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            angle={-20}
            textAnchor="end"
            interval={0}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value, _name, props) => [
              `${value} jawaban (${totalAnswers > 0 ? Math.round((Number(value) / totalAnswers) * 100) : 0}%)`,
              (props.payload as any)?.fullLabel ?? _name,
            ]}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={styles.legendRow}>
        {chartData.map((d, i) => (
          <span key={i} style={styles.legendItem}>
            <span style={{ ...styles.legendDot, backgroundColor: d.color }} />
            <span style={styles.legendText}>{d.count}× {d.fullLabel}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsDashboard({ inisial }: { inisial: string }) {
  const [questions, setQuestions] = useState<AnalyticsQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics?inisial=${encodeURIComponent(inisial)}`)
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Gagal memuat data analitik')
        setLoading(false)
      })
  }, [inisial])

  if (loading) {
    return <div style={styles.loading}>Memuat analitik…</div>
  }

  if (error) {
    return <div style={styles.errorBox}>{error}</div>
  }

  const questionsWithAnswers = questions.filter(
    (q) => Object.keys(q.answerDistribution).length > 0
  )

  if (questionsWithAnswers.length === 0) {
    return (
      <div style={styles.emptyState}>
        Belum ada data respons. Analitik akan muncul setelah responden mengisi kuesioner.
      </div>
    )
  }

  return (
    <div style={styles.grid}>
      {questions.map((q) => (
        <div key={q.id} style={styles.card}>
          <p style={styles.varName}>{q.variableName}</p>
          <h3 style={styles.prompt}>{q.prompt}</h3>
          <QuestionChart question={q} />
        </div>
      ))}
    </div>
  )
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))',
    gap: '2rem',
    marginTop: '2rem',
  } as React.CSSProperties,
  card: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '24px',
    padding: '2rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  } as React.CSSProperties,
  varName: {
    fontSize: '12px',
    color: '#94a3b8',
    fontFamily: 'monospace',
    margin: '0 0 8px 0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    fontWeight: 700,
  } as React.CSSProperties,
  prompt: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 1.5rem 0',
    lineHeight: 1.4,
    fontFamily: "'Outfit', sans-serif",
  } as React.CSSProperties,
  chartWrapper: {
    marginTop: '0.5rem',
  } as React.CSSProperties,
  noData: {
    color: '#94a3b8',
    fontSize: '14px',
    padding: '2rem 0',
    textAlign: 'center' as const,
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '2px dashed #e2e8f0',
  } as React.CSSProperties,
  legendRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginTop: '1.5rem',
    padding: '1.25rem',
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
  } as React.CSSProperties,
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: '#334155',
    fontWeight: 500,
  } as React.CSSProperties,
  legendDot: {
    display: 'inline-block',
    width: '12px',
    height: '12px',
    borderRadius: '4px',
    flexShrink: 0,
  } as React.CSSProperties,
  legendText: {
    lineHeight: 1.4,
  } as React.CSSProperties,
  loading: {
    padding: '4rem',
    textAlign: 'center' as const,
    color: '#64748b',
    fontSize: '18px',
    fontWeight: 500,
  } as React.CSSProperties,
  errorBox: {
    padding: '1.5rem',
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    borderRadius: '16px',
    border: '1px solid #fecaca',
    marginTop: '2rem',
  } as React.CSSProperties,
  emptyState: {
    padding: '5rem 2rem',
    textAlign: 'center' as const,
    color: '#94a3b8',
    fontSize: '1.1rem',
    fontWeight: 500,
    border: '2px dashed #e2e8f0',
    borderRadius: '24px',
    marginTop: '3rem',
    backgroundColor: '#f8fafc',
  } as React.CSSProperties,
}
