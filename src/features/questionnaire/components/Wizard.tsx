'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, Check } from 'lucide-react';

import { ParsedFormTemplate } from '../types';

export default function Wizard({ template }: { template: ParsedFormTemplate }) {
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
          const q = questions.find((q) => q.id === questionId);
          let val = rawVal;
          if (q && q.type === 'radio') {
            const options = q.options || [];
            const idx = parseInt(rawVal, 10);
            if (!isNaN(idx) && options[idx]) {
              val = String(options[idx].value);
            }
          } else if (q && q.type === 'checkbox') {
            // Checkbox: rawVal is comma-separated indices like "0,2,5"
            const options = q.options || [];
            const indices = rawVal.split(',').filter(Boolean).map(Number);
            const labels = indices
              .filter(i => !isNaN(i) && options[i])
              .map(i => options[i].label);
            val = labels.join(', ');
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
      if ((currentQuestion?.type === 'radio') && /^[1-9]$/.test(e.key)) {
        const options = currentQuestion.options || [];
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

      // Toggle checkbox options via number keys
      if (currentQuestion?.type === 'checkbox' && /^[1-9]$/.test(e.key)) {
        const options = currentQuestion.options || [];
        const idx = parseInt(e.key) - 1;
        if (options[idx]) {
          setAnswers(prev => {
            const current = prev[currentQuestion.id] || '';
            const selected = current.split(',').filter(Boolean);
            const idxStr = String(idx);
            const newSelected = selected.includes(idxStr)
              ? selected.filter(s => s !== idxStr)
              : [...selected, idxStr];
            return { ...prev, [currentQuestion.id]: newSelected.join(',') };
          });
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
      const options = currentQuestion.options || [];
      return (
        <div style={styles.optionsList}>
          {options.map((opt, index) => {
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
    } else if (currentQuestion.type === 'checkbox') {
      const options = currentQuestion.options || [];
      const selected = (answers[currentQuestion.id] || '').split(',').filter(Boolean);
      return (
        <div style={styles.optionsList}>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>Boleh centang lebih dari 1</p>
          {options.map((opt, index) => {
            const isSelected = selected.includes(String(index));
            return (
              <div
                key={index}
                onClick={() => {
                  const idxStr = String(index);
                  const newSelected = isSelected
                    ? selected.filter(s => s !== idxStr)
                    : [...selected, idxStr];
                  setAnswers({ ...answers, [currentQuestion.id]: newSelected.join(',') });
                }}
                style={{
                  ...styles.optionCard,
                  borderColor: isSelected ? 'var(--primary-color)' : 'rgba(0,0,0,0.1)',
                  backgroundColor: isSelected ? 'rgba(0, 86, 179, 0.05)' : 'white',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                <div style={{
                  ...styles.optionKeyLabel,
                  backgroundColor: isSelected ? 'var(--primary-color)' : undefined,
                  color: isSelected ? 'white' : undefined,
                }}>{isSelected ? '✓' : index + 1}</div>
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
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    fontFamily: "'Inter', sans-serif",
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
    backgroundColor: '#2563eb',
    transition: 'width 0.6s cubic-bezier(0.65, 0, 0.35, 1)',
  },
  contentWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center', // Center vertically for modern proportionality
    justifyContent: 'center',
    padding: '2rem',
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%',
    overflowY: 'auto' as const,
    WebkitOverflowScrolling: 'touch' as const,
  },
  stepContainer: {
    width: '100%',
    padding: '2rem 0',
  },
  questionBlock: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  questionNumber: {
    fontSize: '18px',
    color: '#2563eb',
    fontWeight: 700,
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  inisialBadge: {
    backgroundColor: '#eff6ff',
    border: '1px solid rgba(37, 99, 235, 0.1)',
    padding: '4px 12px',
    borderRadius: '100px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#2563eb',
    textTransform: 'none' as const,
    letterSpacing: 'normal',
  },
  promptText: {
    fontSize: 'clamp(24px, 5vw, 42px)',
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: '2.5rem',
    color: '#0f172a',
    letterSpacing: '-0.03em',
    fontFamily: "'Outfit', sans-serif",
  },
  helperText: {
    fontSize: '1.25rem',
    color: '#64748b',
    marginBottom: '2.5rem',
    lineHeight: 1.6,
  },
  textInput: {
    fontSize: 'clamp(28px, 4vw, 36px)',
    border: 'none',
    borderBottom: '2px solid #e2e8f0',
    padding: '16px 0',
    backgroundColor: 'transparent',
    color: '#2563eb',
    outline: 'none',
    width: '100%',
    transition: 'all 0.3s ease',
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 600,
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    marginTop: '0.5rem',
  },
  optionCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '1.25rem 1.5rem',
    backgroundColor: 'white',
    border: '2px solid transparent',
    borderRadius: '16px',
    fontSize: '1.25rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
    color: '#334155',
  },
  optionKeyLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    marginRight: '1rem',
    color: '#64748b',
    flexShrink: 0,
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '1rem 2.5rem',
    fontSize: '1.25rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
    boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)',
  },
  pressEnterHint: {
    marginLeft: '1.25rem',
    fontSize: '0.875rem',
    color: '#94a3b8',
    fontWeight: 500,
  },
  errorText: {
    color: '#ef4444',
    fontSize: '1rem',
    fontWeight: 500,
    marginTop: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  floatingNav: {
    position: 'fixed' as const,
    bottom: '2rem',
    right: '2rem',
    display: 'flex',
    gap: '1px',
    backgroundColor: '#e2e8f0',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '56px',
    height: '56px',
    border: 'none',
    backgroundColor: 'white',
    cursor: 'pointer',
    color: '#475569',
    transition: 'all 0.2s',
  },
};
