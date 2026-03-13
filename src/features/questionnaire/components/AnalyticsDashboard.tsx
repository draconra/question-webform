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

const COLORS = ['#0056b3', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']

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
    gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
    gap: '1.5rem',
    marginTop: '2rem',
  } as React.CSSProperties,
  card: {
    backgroundColor: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: '14px',
    padding: '1.5rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  } as React.CSSProperties,
  varName: {
    fontSize: '12px',
    color: '#9ca3af',
    fontFamily: 'monospace',
    margin: '0 0 4px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  prompt: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 1rem 0',
    lineHeight: 1.4,
  } as React.CSSProperties,
  chartWrapper: {
    marginTop: '0.5rem',
  } as React.CSSProperties,
  noData: {
    color: '#9ca3af',
    fontSize: '14px',
    padding: '1rem 0',
  } as React.CSSProperties,
  legendRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '0.75rem',
  } as React.CSSProperties,
  legendItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '6px',
    fontSize: '12px',
    color: '#374151',
  } as React.CSSProperties,
  legendDot: {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: '2px',
    flexShrink: 0,
    marginTop: '2px',
  } as React.CSSProperties,
  legendText: {
    lineHeight: 1.4,
  } as React.CSSProperties,
  loading: {
    padding: '3rem',
    textAlign: 'center' as const,
    color: '#6b7280',
    fontSize: '18px',
  } as React.CSSProperties,
  errorBox: {
    padding: '1rem',
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    borderRadius: '8px',
    marginTop: '1rem',
  } as React.CSSProperties,
  emptyState: {
    padding: '3rem',
    textAlign: 'center' as const,
    color: '#6b7280',
    fontSize: '18px',
    border: '2px dashed #e5e7eb',
    borderRadius: '12px',
    marginTop: '2rem',
  } as React.CSSProperties,
}
