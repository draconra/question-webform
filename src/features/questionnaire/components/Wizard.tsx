'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, Check } from 'lucide-react';

export default function Wizard({ template }: { template: any }) {
  const router = useRouter();
  // Step -2 = Opening, Step -1 = Inisial collection screen, 0+ = questions
  const [step, setStep] = useState<'opening' | 'inisial' | number>('opening');
  const [inisial, setInisial] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = template.questions;

  // Track scroll direction for animations
  const [direction, setDirection] = useState(1);

  const currentStep = step === 'opening' ? -2 : step === 'inisial' ? -1 : (step as number);
  const progressPercentage = (step === 'opening' || step === 'inisial') ? 0 : ((currentStep + 1) / questions.length) * 100;
  
  const currentQuestion = (step === 'opening' || step === 'inisial') ? null : questions[currentStep];
  const currentAnswer = currentQuestion ? (answers[currentQuestion.id] || '') : '';
  const canProceed = step === 'opening' ? true : step === 'inisial' ? inisial.trim() !== '' : currentAnswer !== '';

  const handleNext = async () => {
    if (!canProceed || isSubmitting) return;
    
    setDirection(1);
    if (step === 'opening') {
      setStep('inisial');
    } else if (step === 'inisial') {
      setStep(0);
    } else if (currentStep < questions.length - 1) {
      setStep(currentStep + 1);
    } else {
      await submitForm();
    }
  };

  const handlePrevious = () => {
    if (isSubmitting) return;
    setDirection(-1);
    
    if (step === 'inisial') {
      setStep('opening');
    } else if (currentStep === 0) {
      setStep('inisial');
    } else if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        formTemplateId: template.id,
        inisial: inisial.trim(),
        answers: Object.entries(answers).map(([questionId, rawVal]) => {
          const q = questions.find((q: any) => q.id === questionId);
          let val = rawVal;
          if (q && q.type === 'radio') {
            const options = JSON.parse(q.options || '[]');
            const idx = parseInt(rawVal, 10);
            if (!isNaN(idx) && options[idx]) {
              val = String(options[idx].value);
            }
          }
          return { questionId, value: val };
        }),
      };

      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to submit');
      }

      router.push('/questionnaire/success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.');
      setIsSubmitting(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      }
      
      // Auto-select radio options via number keys (1, 2, 3...)
      if (currentQuestion?.type === 'radio' && /^[1-9]$/.test(e.key)) {
        const options = JSON.parse(currentQuestion.options || '[]');
        const idx = parseInt(e.key) - 1;
        if (options[idx]) {
          setAnswers(prev => ({ ...prev, [currentQuestion.id]: String(idx) }));
          // Auto-advance after small delay (except on the last question)
          setTimeout(() => {
            if (currentStep < questions.length - 1) {
              setDirection(1);
              setStep(currentStep + 1);
            }
          }, 400);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, inisial, answers, isSubmitting]);

  const variants = {
    enter: (direction: number) => ({
      y: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      y: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      y: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  const renderInput = () => {
    if (!currentQuestion) return null;

    if (currentQuestion.type === 'radio') {
      const options = JSON.parse(currentQuestion.options || '[]');
      return (
        <div style={styles.optionsList}>
          {options.map((opt: any, index: number) => {
            const isSelected = answers[currentQuestion.id] === String(index);
            return (
              <div 
                key={index}
                onClick={() => {
                  setAnswers({ ...answers, [currentQuestion.id]: String(index) });
                  // Auto-advance on click (except on the last question)
                  setTimeout(() => {
                    if (currentStep < questions.length - 1) {
                      setDirection(1);
                      setStep(currentStep + 1);
                    }
                  }, 400);
                }}
                style={{
                  ...styles.optionCard,
                  borderColor: isSelected ? 'var(--primary-color)' : 'rgba(0,0,0,0.1)',
                  backgroundColor: isSelected ? 'rgba(0, 86, 179, 0.05)' : 'white',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                <div style={styles.optionKeyLabel}>{index + 1}</div>
                <div style={{ flex: 1 }}>{opt.label}</div>
                {isSelected && <Check size={24} color="var(--primary-color)" />}
              </div>
            );
          })}
        </div>
      );
    } else if (currentQuestion.type === 'number') {
      return (
        <input
          type="number"
          style={styles.textInput}
          value={answers[currentQuestion.id] || ''}
          onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
          placeholder="Ketik angka di sini..."
          autoFocus
        />
      );
    } else {
      return (
        <input
          type="text"
          style={styles.textInput}
          value={answers[currentQuestion.id] || ''}
          onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
          placeholder="Ketik jawaban di sini..."
          autoFocus
        />
      );
    }
  };

  return (
    <div style={styles.typeformContainer}>
      {/* Progress Bar */}
      <div style={styles.progressBarContainer}>
        <div style={{ ...styles.progressBarFill, width: `${progressPercentage}%` }} />
      </div>

      <div style={styles.contentWrapper}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={styles.stepContainer}
          >
            {step === 'opening' ? (
              <div style={styles.questionBlock}>
                <div style={styles.questionNumber}>Selamat Datang</div>
                <h2 style={{ ...styles.promptText, fontSize: '32px' }}>Bapak/Ibu yang terhormat,</h2>
                <div style={{ ...styles.helperText, fontSize: '18px', color: '#4b5563' }}>
                  <p style={{ marginBottom: '1rem' }}>
                    Kuesioner ini akan membantu pemberi layanan kesehatan (tenaga kesehatan profesional yang bertanggung jawab atas perawatan Anda) mendapatkan gambaran yang lebih baik tentang konsekuensi penyakit Anda.
                  </p>
                  <p style={{ marginBottom: '1rem' }}>
                    Kuesioner ini berisi informasi penting yang kami perlukan untuk menyesuaikan perawatan yang akan kami berikan dengan kebutuhan Anda.
                  </p>
                  <p style={{ marginBottom: '1rem' }}>
                    Silakan isi kuesioner dengan memberi tanda centang pada jawaban yang paling sesuai dengan Anda.
                  </p>
                  <p style={{ marginBottom: '1rem' }}>
                    Jika Anda mengalami kesulitan dalam menjawab, Anda dapat meminta bantuan anggota keluarga, perawat atau orang terdekat Anda untuk membantu pengisian kuesioner.
                  </p>
                  <p>Terima kasih.</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
                  <button 
                    style={styles.primaryBtn}
                    onClick={handleNext}
                  >
                    Mulai <ArrowDown size={18} style={{ marginLeft: 8 }} />
                  </button>
                  <span style={styles.pressEnterHint}>Tekan <strong>Enter ↵</strong></span>
                </div>
              </div>
            ) : step === 'inisial' ? (
              <div style={styles.questionBlock}>
                <div style={styles.questionNumber}>Langkah Awal</div>
                <h2 style={styles.promptText}>Silakan masukkan inisial Anda</h2>
                <p style={styles.helperText}>
                  Contoh: <strong>AB</strong>, <strong>MR</strong>. 
                </p>
                <input
                  type="text"
                  style={styles.textInput}
                  value={inisial}
                  onChange={(e) => setInisial(e.target.value.toUpperCase())}
                  placeholder="Ketik inisial..."
                  maxLength={10}
                  autoFocus
                />
                {error && <p style={styles.errorText}>{error}</p>}
                
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '2rem' }}>
                  <button 
                    style={{ ...styles.primaryBtn, opacity: canProceed ? 1 : 0.5 }}
                    onClick={handleNext}
                    disabled={!canProceed}
                  >
                    Lanjut <Check size={18} style={{ marginLeft: 8 }} />
                  </button>
                  <span style={styles.pressEnterHint}>Tekan <strong>Enter ↵</strong></span>
                </div>
              </div>
            ) : (
              <div style={styles.questionBlock}>
                <div style={styles.questionNumber}>
                  {currentStep + 1} <span style={{ opacity: 0.4 }}>/ {questions.length}</span>
                  <span style={styles.inisialBadge}>{inisial}</span>
                </div>
                <h2 style={styles.promptText}>{currentQuestion?.prompt}</h2>
                
                {renderInput()}
                {error && <p style={styles.errorText}>{error}</p>}

                {/* Show OK button for text/number inputs, OR if it's the very last question (Submit) */}
                {(currentQuestion?.type !== 'radio' || currentStep === questions.length - 1) && (
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '2rem' }}>
                    <button 
                      style={{ ...styles.primaryBtn, opacity: canProceed ? 1 : 0.5 }}
                      onClick={handleNext}
                      disabled={!canProceed || isSubmitting}
                    >
                      {currentStep === questions.length - 1 ? 'Kirim' : 'OK'} <Check size={18} style={{ marginLeft: 8 }} />
                    </button>
                    <span style={styles.pressEnterHint}>Tekan <strong>Enter ↵</strong></span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Navigation Controls */}
      <div style={styles.floatingNav}>
        <button 
          style={{ ...styles.navBtn, opacity: step === 'opening' ? 0.3 : 1 }} 
          onClick={handlePrevious}
          disabled={step === 'opening' || isSubmitting}
        >
          <ArrowUp size={24} />
        </button>
        <button 
          style={{ ...styles.navBtn, opacity: !canProceed ? 0.3 : 1 }} 
          onClick={handleNext}
          disabled={!canProceed || isSubmitting}
        >
          <ArrowDown size={24} />
        </button>
      </div>
    </div>
  );
}

const styles = {
  typeformContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    width: '100vw',
    backgroundColor: '#fafafa',
    color: '#111827',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
    position: 'relative' as const,
  },
  progressBarContainer: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '6px',
    backgroundColor: 'rgba(0,0,0,0.05)',
    zIndex: 50,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'var(--primary-color)',
    transition: 'width 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
  },
  contentWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%',
  },
  stepContainer: {
    width: '100%',
  },
  questionBlock: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  questionNumber: {
    fontSize: '20px',
    color: 'var(--primary-color)',
    fontWeight: 600,
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  inisialBadge: {
    backgroundColor: 'rgba(0, 86, 179, 0.1)',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '14px',
    color: 'var(--primary-color)',
  },
  promptText: {
    fontSize: '36px',
    fontWeight: 400,
    lineHeight: 1.3,
    marginBottom: '2rem',
    color: '#000',
    letterSpacing: '-0.02em',
  },
  helperText: {
    fontSize: '20px',
    color: '#6b7280',
    marginBottom: '2rem',
  },
  textInput: {
    fontSize: '32px',
    border: 'none',
    borderBottom: '2px solid rgba(0,0,0,0.2)',
    padding: '12px 0',
    backgroundColor: 'transparent',
    color: 'var(--primary-color)',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s',
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginTop: '1rem',
  },
  optionCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: 'white',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '8px',
    fontSize: '22px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    color: '#111827',
  },
  optionKeyLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    backgroundColor: 'rgba(0,0,0,0.05)',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 600,
    marginRight: '16px',
    color: '#4b5563',
  },
  primaryBtn: {
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 28px',
    fontSize: '22px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'opacity 0.2s',
  },
  pressEnterHint: {
    marginLeft: '16px',
    fontSize: '16px',
    color: '#9ca3af',
  },
  errorText: {
    color: '#ef4444',
    fontSize: '16px',
    marginTop: '12px',
  },
  floatingNav: {
    position: 'fixed' as const,
    bottom: '24px',
    right: '24px',
    display: 'flex',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: '#4b5563',
    transition: 'background-color 0.2s',
  },
};
