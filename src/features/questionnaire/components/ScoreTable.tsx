'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Trash2 } from 'lucide-react'

type ScoreSummary = {
  id: string
  inisial: string
  totalScore: number
  date: string
  nama?: string | null
  noTelp?: string | null
  hasSignature: boolean
}

export default function ScoreTable() {
  const router = useRouter()
  const [scores, setScores] = useState<ScoreSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ScoreSummary | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/scores', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch scores')
        return res.json()
      })
      .then((data) => {
        setScores(data)
        setLoading(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError('Gagal memuat data skor')
        setLoading(false)
      })
    return () => controller.abort()
  }, [])

  async function confirmDelete() {
    if (!pendingDelete) return
    const target = pendingDelete
    setDeletingId(target.id)
    try {
      const res = await fetch(`/api/responses/${encodeURIComponent(target.id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete response')
      setScores((prev) => prev.filter((s) => s.id !== target.id))
      router.refresh() // "Total Respons" card on the dashboard is server-rendered
    } catch {
      setError('Gagal menghapus data responden')
    } finally {
      setDeletingId(null)
      setPendingDelete(null)
    }
  }

  if (loading) return <div style={styles.loading}>Memuat skor…</div>
  if (error) return <div style={styles.errorBox}>{error}</div>
  if (scores.length === 0) return <div style={styles.emptyState}>Belum ada data skor responden.</div>

  return (
    <div style={styles.container}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Inisial Pasien</th>
            <th style={styles.th}>Nama</th>
            <th style={styles.th}>No. Telp</th>
            <th style={styles.th}>Dokumen Persetujuan</th>
            <th style={styles.th}>Waktu Pengisian</th>
            <th style={styles.th}>Skor Total IMSA (0-60)</th>
            <th style={styles.th}>Status Validasi</th>
            <th style={styles.th}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score) => {
            const date = new Date(score.date)
            return (
              <tr key={score.id} style={styles.tr}>
                <td style={styles.td}>
                  <button
                    onClick={() => router.push(`?section=analitik&id=${encodeURIComponent(score.id)}&inisial=${encodeURIComponent(score.inisial)}`)}
                    style={styles.inisialButton}
                    title="Lihat analitik untuk pasien ini"
                  >
                    {score.inisial}
                  </button>
                </td>
                <td style={styles.td}>{score.nama ?? <span style={styles.emptyCell}>—</span>}</td>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '13px' }}>
                  {score.noTelp ?? <span style={styles.emptyCell}>—</span>}
                </td>
                <td style={{ ...styles.tdScore, textAlign: 'center' as const }}>
                  {score.hasSignature ? (
                    <a
                      href={`/api/responses/${encodeURIComponent(score.id)}/consent-pdf`}
                      style={styles.downloadLink}
                      title="Unduh dokumen persetujuan (PDF)"
                    >
                      <Download size={14} /> PDF
                    </a>
                  ) : (
                    <span style={styles.emptyCell}>—</span>
                  )}
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
                <td style={{ ...styles.tdScore, textAlign: 'center' as const }}>
                  <button
                    onClick={() => setPendingDelete(score)}
                    disabled={deletingId === score.id}
                    style={styles.deleteButton}
                    title="Hapus data responden ini"
                  >
                    <Trash2 size={14} /> Hapus
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {pendingDelete && (
        <div style={styles.dialogOverlay}>
          <div style={styles.dialogCard}>
            <h3 style={styles.dialogTitle}>Hapus data responden {pendingDelete.inisial}?</h3>
            <p style={styles.dialogBody}>
              Data akan disembunyikan dari tabel skor, analitik, dan ekspor CSV. Data tidak
              dihapus permanen dari database dan hanya dapat dipulihkan secara manual.
            </p>
            <div style={styles.dialogActions}>
              <button
                onClick={() => setPendingDelete(null)}
                disabled={deletingId === pendingDelete.id}
                style={styles.dialogCancelBtn}
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingId === pendingDelete.id}
                style={styles.dialogConfirmBtn}
              >
                {deletingId === pendingDelete.id ? 'Menghapus…' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
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
  downloadLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    textDecoration: 'none',
  } as React.CSSProperties,
  emptyCell: {
    color: '#cbd5e1',
    fontSize: '16px',
  } as React.CSSProperties,
  deleteButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
  } as React.CSSProperties,
  dialogOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    padding: '1.5rem',
  } as React.CSSProperties,
  dialogCard: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '2rem',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  } as React.CSSProperties,
  dialogTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 0.75rem',
  } as React.CSSProperties,
  dialogBody: {
    fontSize: '14px',
    color: '#475569',
    lineHeight: 1.5,
    margin: '0 0 1.5rem',
  } as React.CSSProperties,
  dialogActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  } as React.CSSProperties,
  dialogCancelBtn: {
    padding: '10px 18px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    color: '#334155',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
  } as React.CSSProperties,
  dialogConfirmBtn: {
    padding: '10px 18px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#dc2626',
    color: 'white',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
  } as React.CSSProperties,
}
