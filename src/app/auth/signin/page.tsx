import { signIn } from "@/auth"
import { ShieldAlert, ArrowRight } from "lucide-react"

export default function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string }
}) {
  return (
    <div style={styles.container}>
      {/* Background decoration */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconWrapper}>
            <ShieldAlert size={32} color="#2563eb" />
          </div>
          <h1 style={styles.title}>Admin Access</h1>
          <p style={styles.subtitle}>Sign in to manage the IMSA Questionnaire</p>
        </div>

        {searchParams.error === "CredentialsSignin" && (
          <div style={styles.errorBox}>
            Login failed. Please check your username and password.
          </div>
        )}

        <form
          action={async (formData) => {
            "use server"
            await signIn("credentials", formData)
          }}
          style={styles.form}
        >
          <input type="hidden" name="redirectTo" value={searchParams.callbackUrl || "/admin"} />
          
          <div style={styles.inputGroup}>
            <label htmlFor="username" style={styles.label}>Username</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.submitBtn}>
            <span>Sign In to Dashboard</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>

      <p style={styles.footerText}>
        Restricted access. This area is for authorized medical personnel only.
      </p>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    position: 'relative' as const,
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  blob1: {
    position: 'absolute' as const,
    top: '-10%',
    left: '-10%',
    width: '500px',
    height: '500px',
    backgroundColor: '#eff6ff',
    borderRadius: '50%',
    filter: 'blur(80px)',
    zIndex: 0,
  },
  blob2: {
    position: 'absolute' as const,
    bottom: '-10%',
    right: '-10%',
    width: '400px',
    height: '400px',
    backgroundColor: '#f0fdf4',
    borderRadius: '50%',
    filter: 'blur(80px)',
    zIndex: 0,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    padding: '3rem 2.5rem',
    borderRadius: '24px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01), 0 0 0 1px rgba(0,0,0,0.05)',
    width: '100%',
    maxWidth: '440px',
    zIndex: 1,
    position: 'relative' as const,
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '2.5rem',
  },
  iconWrapper: {
    width: '64px',
    height: '64px',
    backgroundColor: '#eff6ff',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem auto',
    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.1)',
  },
  title: {
    margin: '0 0 0.5rem 0',
    fontSize: '28px',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.03em',
  },
  subtitle: {
    margin: 0,
    color: '#64748b',
    fontSize: '15px',
    lineHeight: 1.5,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    padding: '1rem',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '2rem',
    textAlign: 'center' as const,
    border: '1px solid #fecaca',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#334155',
    marginLeft: '2px',
  },
  input: {
    padding: '0.875rem 1rem',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#fff',
    fontSize: '16px',
    color: '#0f172a',
    transition: 'all 0.2s ease',
    outline: 'none',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
  inputFocus: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.15)',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '1rem',
    backgroundColor: '#0f172a',
    color: 'white',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
    marginTop: '0.5rem',
  },
  footerText: {
    marginTop: '2.5rem',
    color: '#94a3b8',
    fontSize: '13px',
    textAlign: 'center' as const,
    zIndex: 1,
    maxWidth: '300px',
  }
}
