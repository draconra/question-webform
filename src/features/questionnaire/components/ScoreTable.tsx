'use client'

import { useEffect, useState } from 'react'

type ScoreSummary = {
  inisial: string
  totalScore: number
  date: string
}

export default function ScoreTable() {
  const [scores, setScores] = useState<ScoreSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/scores')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch scores')
        return res.json()
      })
      .then((data) => {
        setScores(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Gagal memuat data skor')
        setLoading(false)
      })
  }, [])

  if (loading) return <div style={styles.loading}>Memuat skor…</div>
  if (error) return <div style={styles.errorBox}>{error}</div>
  if (scores.length === 0) return <div style={styles.emptyState}>Belum ada data skor responden.</div>

  return (
    <div style={styles.container}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Inisial Pasien</th>
            <th style={styles.th}>Waktu Pengisian</th>
            <th style={styles.th}>Skor Total IMSA (0-60)</th>
            <th style={styles.th}>Status Validasi</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, idx) => {
            const date = new Date(score.date)
            return (
              <tr key={`${score.inisial}-${idx}`} style={styles.tr}>
                <td style={styles.td}>
                  <div style={styles.inisialBadge}>{score.inisial}</div>
                </td>
                <td style={styles.td}>
                  {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  <span style={styles.timeStr}>
                    {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </td>
                <td style={styles.tdScore}>
                  <span style={{ 
                    ...styles.scoreBadge, 
                    backgroundColor: score.totalScore > 30 ? '#fee2e2' : '#ecfdf5',
                    color: score.totalScore > 30 ? '#b91c1c' : '#047857'
                  }}>
                    {score.totalScore}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={styles.validStatus}>Selesai</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    textAlign: 'left' as const,
  } as React.CSSProperties,
  th: {
    padding: '1rem 1.5rem',
    backgroundColor: '#f8fafc',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e2e8f0',
  } as React.CSSProperties,
  tr: {
    borderBottom: '1px solid #f1f5f9',
  } as React.CSSProperties,
  td: {
    padding: '1.25rem 1.5rem',
    fontSize: '15px',
    color: '#334155',
  } as React.CSSProperties,
  tdScore: {
    padding: '1.25rem 1.5rem',
    fontSize: '16px',
    fontWeight: 600,
  } as React.CSSProperties,
  inisialBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '16px',
    letterSpacing: '1px',
  } as React.CSSProperties,
  timeStr: {
    display: 'block',
    fontSize: '13px',
    color: '#94a3b8',
    marginTop: '4px',
  } as React.CSSProperties,
  scoreBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '15px',
    fontWeight: 700,
  } as React.CSSProperties,
  validStatus: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#f0fdf4',
    color: '#166534',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
  } as React.CSSProperties,
  loading: {
    padding: '3rem',
    textAlign: 'center' as const,
    color: '#6b7280',
    fontSize: '16px',
  } as React.CSSProperties,
  errorBox: {
    padding: '1rem',
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    borderRadius: '8px',
  } as React.CSSProperties,
  emptyState: {
    padding: '3rem',
    textAlign: 'center' as const,
    color: '#6b7280',
    fontSize: '16px',
    border: '2px dashed #e2e8f0',
    borderRadius: '16px',
  } as React.CSSProperties,
}
