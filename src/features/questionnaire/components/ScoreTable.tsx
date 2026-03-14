'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type ScoreSummary = {
  inisial: string
  totalScore: number
  date: string
}

export default function ScoreTable() {
  const router = useRouter()
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
                  <button 
                    onClick={() => router.push(`?inisial=${encodeURIComponent(score.inisial)}`)}
                    style={styles.inisialButton}
                    title="Lihat analitik untuk pasien ini"
                  >
                    {score.inisial}
                  </button>
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
    borderRadius: '24px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    textAlign: 'left' as const,
  } as React.CSSProperties,
  th: {
    padding: '1.25rem 1.5rem',
    backgroundColor: '#f8fafc',
    color: '#64748b',
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e2e8f0',
  } as React.CSSProperties,
  tr: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.2s ease',
  } as React.CSSProperties,
  td: {
    padding: '1.25rem 1.5rem',
    fontSize: '15px',
    color: '#334155',
    fontWeight: 500,
  } as React.CSSProperties,
  tdScore: {
    padding: '1.25rem 1.5rem',
  } as React.CSSProperties,
  inisialButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 800,
    fontSize: '16px',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: "'Outfit', sans-serif",
  } as React.CSSProperties,
  timeStr: {
    display: 'block',
    fontSize: '13px',
    color: '#94a3b8',
    marginTop: '4px',
    fontWeight: 400,
  } as React.CSSProperties,
  scoreBadge: {
    padding: '8px 16px',
    borderRadius: '100px',
    fontSize: '14px',
    fontWeight: 700,
    display: 'inline-block',
  } as React.CSSProperties,
  validStatus: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#ecfdf5',
    color: '#047857',
    borderRadius: '100px',
    fontSize: '12px',
    fontWeight: 700,
  } as React.CSSProperties,
  loading: {
    padding: '4rem',
    textAlign: 'center' as const,
    color: '#64748b',
    fontSize: '16px',
    fontWeight: 500,
  } as React.CSSProperties,
  errorBox: {
    margin: '2rem',
    padding: '1rem 1.5rem',
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    borderRadius: '12px',
    border: '1px solid #fecaca',
    fontWeight: 500,
  } as React.CSSProperties,
  emptyState: {
    padding: '5rem 2rem',
    textAlign: 'center' as const,
    color: '#94a3b8',
    fontSize: '1.1rem',
    fontWeight: 500,
    border: '2px dashed #e2e8f0',
    borderRadius: '24px',
    margin: '2rem',
  } as React.CSSProperties,
}
