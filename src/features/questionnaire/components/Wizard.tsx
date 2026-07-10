'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, Check } from 'lucide-react';

import { ParsedFormTemplate, ParsedQuestion } from '../types';
import SignaturePad from './SignaturePad';
import { maskPhone, NESTED_SUBS, NESTED_SUB_VARS } from '../utils';

export default function Wizard({ template }: { template: ParsedFormTemplate }) {
  const router = useRouter();
  // Step -4 = Info sheet, -3 = Identity/consent, -2 = Opening, -1 = Inisial, 0+ = questions
  const [step, setStep] = useState<'info' | 'identity' | 'opening' | 'inisial' | number>('info');
  const [nama, setNama] = useState('');
  const [alamat, setAlamat] = useState('');
  const [noTelp, setNoTelp] = useState('');
  const [signature, setSignature] = useState('');
  const [consent, setConsent] = useState(false);
  const [inisial, setInisial] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = template.questions;

  // Filter out companion "_lainnya" questions and nested sub-questions (rendered inline) — not standalone steps.
  const steppedQuestions = questions.filter(
    q => !q.variableName.endsWith('_lainnya') && !NESTED_SUB_VARS.includes(q.variableName)
  );

  // Build companion map: parent question ID → companion question.
  // Key insight: companion variableName = parentVariableName + '_lainnya' (8 chars).
  const companionMap = new Map<string, ParsedQuestion>();
  for (const q of questions) {
    if (q.variableName.endsWith('_lainnya')) {
      const parentVarName = q.variableName.slice(0, -8); // strip '_lainnya'
      const parent = questions.find(p => p.variableName === parentVarName);
      if (parent) companionMap.set(parent.id, q);
    }
  }

  // Track scroll direction for animations
  const [direction, setDirection] = useState(1);

  // Ref for auto-advance timer — cleared on unmount / before next advance
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isIntroStep = step === 'info' || step === 'identity' || step === 'opening' || step === 'inisial';
  const currentStep = step === 'info' ? -4 : step === 'identity' ? -3 : step === 'opening' ? -2 : step === 'inisial' ? -1 : (step as number);
  const lastStep = typeof step === 'number' && currentStep === steppedQuestions.length - 1;
  const progressPercentage = isIntroStep ? 0 : ((currentStep + 1) / steppedQuestions.length) * 100;

  const currentQuestion = isIntroStep ? null : steppedQuestions[currentStep];
  const currentAnswer = currentQuestion ? (answers[currentQuestion.id] || '') : '';

  // Companion question for the current step (if any)
  const currentCompanion = currentQuestion ? companionMap.get(currentQuestion.id) : undefined;
  const currentOpts = currentQuestion?.options ?? [];

  // Detect if a "requiresText" option is currently active
  const selectedRadioIdx = currentQuestion?.type === 'radio' ? parseInt(currentAnswer, 10) : -1;
  const radioOptRequiresText = (selectedRadioIdx >= 0 && !isNaN(selectedRadioIdx))
    ? (currentOpts[selectedRadioIdx]?.requiresText ?? false)
    : false;
  const selectedCbIndices = currentQuestion?.type === 'checkbox'
    ? currentAnswer.split(',').filter(Boolean).map(Number)
    : [];
  const checkboxRequiresText = selectedCbIndices.some(
    i => !isNaN(i) && (currentOpts[i]?.requiresText ?? false)
  );
  const companionRequired = radioOptRequiresText || checkboxRequiresText;
  const companionAnswer = currentCompanion ? (answers[currentCompanion.id] ?? '') : '';

  // Generic nested sub-question support (PRA-2 pendamping, 9a→9b, etc.)
  const nestedConfig = currentQuestion ? NESTED_SUBS[currentQuestion.variableName] : undefined;
  const isParentWithSub = !!nestedConfig;
  const subQuestion = nestedConfig ? questions.find(q => q.variableName === nestedConfig.subVar) : undefined;
  const subCompanion = subQuestion ? companionMap.get(subQuestion.id) : undefined;
  const showSub = !!(nestedConfig && subQuestion && nestedConfig.showWhenIdx.includes(selectedRadioIdx));
  const subAnswer = subQuestion ? (answers[subQuestion.id] ?? '') : '';
  const subOpts = subQuestion?.options ?? [];
  const subSelectedIdx = subAnswer !== '' ? parseInt(subAnswer, 10) : -1;
  const subRequiresText = subSelectedIdx >= 0 && !isNaN(subSelectedIdx)
    ? (subOpts[subSelectedIdx]?.requiresText ?? false)
    : false;
  const subCompanionAnswer = subCompanion ? (answers[subCompanion.id] ?? '') : '';

  const canProceed = step === 'info'
    ? true
    : step === 'identity'
    ? nama.trim() !== '' && alamat.trim() !== '' && noTelp.replace(/\D/g, '').length >= 7 && signature !== '' && consent
    : step === 'opening'
      ? true
      : step === 'inisial'
        ? inisial.trim() !== ''
        : currentAnswer !== '' && (!companionRequired || companionAnswer.trim() !== '')
            && (!showSub || (subAnswer !== '' && (!subRequiresText || subCompanionAnswer.trim() !== '')));

  // Helper: set parent answer, clearing sub data when the new selection hides the sub.
  const setParentAnswer = (qId: string, idx: number) => {
    setAnswers(prev => {
      const next = { ...prev, [qId]: String(idx) };
      if (nestedConfig && !nestedConfig.showWhenIdx.includes(idx) && subQuestion) {
        delete next[subQuestion.id];
        if (subCompanion) delete next[subCompanion.id];
      }
      return next;
    });
  };

  const handleNext = async () => {
    if (!canProceed || isSubmitting) return;

    setDirection(1);
    if (step === 'info') {
      setStep('identity');
    } else if (step === 'identity') {
      setStep('opening');
    } else if (step === 'opening') {
      setStep('inisial');
    } else if (step === 'inisial') {
      setStep(0);
    } else if (currentStep < steppedQuestions.length - 1) {
      setStep(currentStep + 1);
    } else {
      await submitForm();
    }
  };

  const handlePrevious = () => {
    if (isSubmitting) return;
    setDirection(-1);

    if (step === 'identity') {
      setStep('info');
    } else if (step === 'opening') {
      setStep('identity');
    } else if (step === 'inisial') {
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
        nama: nama.trim(),
        alamat: alamat.trim(),
        noTelp: maskPhone(noTelp),
        signature,
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
            // Checkbox: rawVal is comma-separated option indices like "0,2,5"
            const options = q.options || [];
            const indices = rawVal.split(',').filter(Boolean).map(Number);
            if (q.variableName === 'saat_ini_15_pengaturan_layanan') {
              // Q15 scoring uses letter-code values (a–k), not display labels
              val = indices
                .filter(i => !isNaN(i) && options[i])
                .map(i => String(options[i].value))
                .join(',');
            } else {
              val = indices
                .filter(i => !isNaN(i) && options[i])
                .map(i => options[i].label)
                .join(', ');
            }
          }
          // Companion text questions (type 'text'): val = rawVal (no mapping needed)
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
        const opt = options[idx];
        if (opt) {
          const qId = currentQuestion.id;
          if (isParentWithSub) {
            setParentAnswer(qId, idx);
          } else {
            setAnswers(prev => ({ ...prev, [qId]: String(idx) }));
          }
          // Auto-advance only when option does NOT require text AND this is not the PRA-2 parent
          if (!opt.requiresText && !isParentWithSub) {
            if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
            advanceTimerRef.current = setTimeout(() => {
              setStep(prev => {
                if (typeof prev === 'number' && prev < steppedQuestions.length - 1) {
                  setDirection(1);
                  return prev + 1;
                }
                return prev;
              });
            }, 400);
          }
        }
      }

      // Toggle checkbox options via number keys
      if (currentQuestion?.type === 'checkbox' && /^[1-9]$/.test(e.key)) {
        const options = currentQuestion.options || [];
        const idx = parseInt(e.key) - 1;
        if (options[idx]) {
          const qId = currentQuestion.id;
          setAnswers(prev => {
            const current = prev[qId] || '';
            const selected = current.split(',').filter(Boolean);
            const idxStr = String(idx);
            const newSelected = selected.includes(idxStr)
              ? selected.filter(s => s !== idxStr)
              : [...selected, idxStr];
            return { ...prev, [qId]: newSelected.join(',') };
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, inisial, isSubmitting]);

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
        <>
          <div style={styles.optionsList}>
            {options.map((opt, index) => {
              const isSelected = answers[currentQuestion.id] === String(index);
              return (
                <div
                  key={index}
                  onClick={() => {
                    const qId = currentQuestion.id;
                    if (isParentWithSub) {
                      setParentAnswer(qId, index);
                    } else {
                      setAnswers(prev => ({ ...prev, [qId]: String(index) }));
                    }
                    // Auto-advance on click only when option does NOT require text AND not PRA-2 parent
                    if (!opt.requiresText && !isParentWithSub) {
                      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
                      advanceTimerRef.current = setTimeout(() => {
                        setStep(prev => {
                          if (typeof prev === 'number' && prev < steppedQuestions.length - 1) {
                            setDirection(1);
                            return prev + 1;
                          }
                          return prev;
                        });
                      }, 400);
                    }
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
          {/* Inline companion text box for "Lainnya" radio options */}
          {radioOptRequiresText && currentCompanion && (
            <div style={styles.companionWrapper}>
              <p style={styles.companionLabel}>Sebutkan:</p>
              <input
                type="text"
                style={{ ...styles.textInput, fontSize: '1.1rem' }}
                placeholder="Ketik di sini..."
                value={companionAnswer}
                onChange={(e) => {
                  const cId = currentCompanion.id;
                  const v = e.target.value;
                  setAnswers(prev => ({ ...prev, [cId]: v }));
                }}
                autoFocus
              />
            </div>
          )}
          {/* Conditional nested sub-question (e.g. PRA-2 pendamping, 9b alasan tidak bekerja) */}
          {showSub && subQuestion && (
            <div style={styles.subQuestionWrapper}>
              <p style={styles.subQuestionLabel}>{subQuestion.prompt}</p>
              <div style={styles.optionsList}>
                {subOpts.map((subOpt, subIdx) => {
                  const isSubSelected = subAnswer === String(subIdx);
                  return (
                    <div
                      key={subIdx}
                      onClick={() => {
                        const sId = subQuestion.id;
                        setAnswers(prev => ({ ...prev, [sId]: String(subIdx) }));
                      }}
                      style={{
                        ...styles.subOptionCard,
                        borderColor: isSubSelected ? 'var(--primary-color)' : 'rgba(0,0,0,0.1)',
                        backgroundColor: isSubSelected ? 'rgba(0, 86, 179, 0.05)' : 'white',
                        transform: isSubSelected ? 'scale(1.02)' : 'scale(1)',
                      }}
                    >
                      <div style={styles.optionKeyLabel}>{String.fromCharCode(97 + subIdx)}</div>
                      <div style={{ flex: 1 }}>{subOpt.label}</div>
                      {isSubSelected && <Check size={20} color="var(--primary-color)" />}
                    </div>
                  );
                })}
              </div>
              {subRequiresText && subCompanion && (
                <div style={styles.companionWrapper}>
                  <p style={styles.companionLabel}>Sebutkan:</p>
                  <input
                    type="text"
                    style={{ ...styles.textInput, fontSize: '1.1rem' }}
                    placeholder="Ketik di sini..."
                    value={subCompanionAnswer}
                    onChange={(e) => {
                      const cId = subCompanion.id;
                      const v = e.target.value;
                      setAnswers(prev => ({ ...prev, [cId]: v }));
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </>
      );
    } else if (currentQuestion.type === 'checkbox') {
      const options = currentQuestion.options || [];
      const selected = (answers[currentQuestion.id] || '').split(',').filter(Boolean);
      return (
        <>
          <div style={styles.optionsList}>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>Boleh centang lebih dari 1</p>
            {options.map((opt, index) => {
              const isSelected = selected.includes(String(index));
              return (
                <div
                  key={index}
                  onClick={() => {
                    const qId = currentQuestion.id;
                    const idxStr = String(index);
                    setAnswers(prev => {
                      const cur = prev[qId] || '';
                      const sel = cur.split(',').filter(Boolean);
                      const next = sel.includes(idxStr)
                        ? sel.filter(s => s !== idxStr)
                        : [...sel, idxStr];
                      return { ...prev, [qId]: next.join(',') };
                    });
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
          {/* Inline companion text box for "Lainnya" checkbox options */}
          {checkboxRequiresText && currentCompanion && (
            <div style={styles.companionWrapper}>
              <p style={styles.companionLabel}>Sebutkan (Lainnya):</p>
              <input
                type="text"
                style={{ ...styles.textInput, fontSize: '1.1rem' }}
                placeholder="Ketik di sini..."
                value={companionAnswer}
                onChange={(e) => {
                  const cId = currentCompanion.id;
                  const v = e.target.value;
                  setAnswers(prev => ({ ...prev, [cId]: v }));
                }}
              />
            </div>
          )}
        </>
      );
    } else if (currentQuestion.type === 'number') {
      return (
        <input
          id={`question-${currentQuestion.id}`}
          name={`question-${currentQuestion.variableName}`}
          type="number"
          style={styles.textInput}
          value={answers[currentQuestion.id] || ''}
          onChange={(e) => { const qId = currentQuestion.id; const v = e.target.value; setAnswers(prev => ({ ...prev, [qId]: v })); }}
          placeholder="Ketik angka di sini..."
          autoComplete="off"
          autoFocus
        />
      );
    } else {
      return (
        <input
          type="text"
          style={styles.textInput}
          value={answers[currentQuestion.id] || ''}
          onChange={(e) => { const qId = currentQuestion.id; const v = e.target.value; setAnswers(prev => ({ ...prev, [qId]: v })); }}
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
            {step === 'info' ? (
              <div style={styles.questionBlock}>
                <div style={styles.questionNumber}>Lembar Informasi</div>
                <h2 style={styles.docTitle}>LEMBAR INFORMASI RESPONDEN</h2>
                <p style={styles.docSubtitle}>
                  Beyond Disease Counts : A Quantitative Analysis of Complexity Patterns in
                  Multimorbid Patient Populations in Yogyakarta using the Indonesian Version
                  of Intermed-SA Questionnare
                </p>

                <div style={styles.infoBody}>
                  <p>
                    Kami, Aghnaa Gayatri, Hari Koesnanto, Wahyudi Istiono, tim peneliti dari
                    Universitas Gadjah Mada, akan melakukan penelitian yang berjudul &ldquo;Beyond
                    Disease Counts : A Quantitative Analysis of Complexity Patterns in Multimorbid
                    Patient Populations in Yogyakarta using the Indonesian Version of Intermed-SA
                    Questionnare&rdquo;. Penelitian ini merupakan bagian dari hibah penelitian pasca
                    doktoral kami di Universitas Gadjah Mada yang dibiayai oleh hibah dana masyarakat
                    Fakultas Kedokteran, Kesehatan Masyarakat, dan Keperawatan UGM. Anda kami harapkan
                    untuk ikut serta menjadi responden penelitian ini. Sebelum Anda memutuskan
                    keikutsertaan Anda, kami mohon untuk terlebih dahulu membaca informasi berikut
                    dengan seksama, untuk memahami maksud penelitian ini dan hal-hal yang akan terjadi
                    jika Anda berpartisipasi. Apabila terdapat hal yang perlu ditanyakan, Anda dapat
                    secara langsung menanyakan kepada kami.
                  </p>

                  <h3 style={styles.infoHeading}>Tujuan penelitian</h3>
                  <p>
                    Tujuan penelitian ini secara umum adalah untuk memetakan sebaran tingkat
                    kompleksitas biopsikososial berdasarkan kuesioner INTERMED-SA pada pasien dengan
                    multimorbiditas di layanan kesehatan primer di Daerah Istimewa Yogyakarta (DIY).
                    Secara khusus bertujuan untuk :
                  </p>
                  <p>
                    1. Mendeskripsikan sebaran kompleksitas biopsikososial pada pasien multimorbid di
                    layanan primer menggunakan kuesioner INTERMED-SA.
                  </p>
                  <p>
                    2. Menganalisis hubungan antara karakteristik sosiodemografi, pola morbiditas, dan
                    utilisasi layanan kesehatan dengan tingkat kompleksitas pasien multimorbid.
                  </p>

                  <h3 style={styles.infoHeading}>Kenapa Anda terpilih</h3>
                  <p>
                    Anda telah terpilih menjadi salah satu responden dalam penelitian kami. Anda kami
                    pilih karena merupakan pasien dengan penyakit kronis di layanan primer yang
                    memberikan pelayanan pada pasien multimorbiditas. Akan ada kurang lebih 233 pasien
                    dari puskesmas/klinik pratama/Praktik dokter Mandiri yang kami undang untuk
                    mengikuti penelitian ini.
                  </p>

                  <h3 style={styles.infoHeading}>Keikutsertaan</h3>
                  <p>
                    Keputusan untuk ikut serta dalam penelitian ini ada pada Anda. Apabila Anda
                    bersedia untuk ikut serta, Anda akan diberikan lembar informasi ini untuk disimpan
                    dan akan kami minta untuk menandatangani lembar persetujuan. Walaupun sudah
                    memutuskan untuk bersedia, Anda dapat sewaktu-waktu mengundurkan diri tanpa perlu
                    memberikan alasan. Pengunduran diri Anda tidak akan dikenakan denda atau sanksi
                    apapun.
                  </p>
                  <p>
                    Jika Anda bersedia ikut serta dalam penelitian ini, Anda akan kami minta untuk
                    mengisi kuesioner yang berisi 23 pertanyaan dan formulir data sosiodemografi (usia,
                    jenis kelamin, pendidikan, pekerjaan, fasilitas kesehatan I, Jumlah dan jenis
                    diagnosis penyakit kronis yang diderita untuk mengonfirmasi status multimorbiditas)
                    yang dapat diisi sendiri, dibantu orang lain, maupun diisikan oleh orang lain atas
                    persetujuan Anda. Estimasi waktu pengisian kuesioner ini kurang lebih 15-30 menit.
                    Namun, kami tidak memberi batasan waktu untuk mengisi kuesioner ini.
                  </p>

                  <h3 style={styles.infoHeading}>Risiko dan manfaat keikutsertaan</h3>
                  <p>
                    Keikutsertaan Anda tidak akan berisiko apapun terhadap layanan yang Anda dapatkan
                    di layanan primer. Sebaliknya, tidak ada manfaat langsung yang dapat Anda rasakan
                    terhadap keikutsertaan Anda dalam penelitian ini. Namun, keikutsertaan Anda dapat
                    membantu kami memahami lebih lanjut mengenai kuesioner pengkajian objektif
                    kompleksitas pada pasien beberapa penyakit kronis di layanan primer, yang
                    kedepannya dapat dijadikan masukan untuk pengembangan model pelayanan komprehensif
                    di layanan primer yang lebih baik lagi.
                  </p>

                  <h3 style={styles.infoHeading}>Kerahasiaan</h3>
                  <p>
                    Seluruh informasi yang Anda berikan dalam penelitian ini akan dijaga
                    kerahasiaannya. Identitas Anda tidak akan dicantumkan dan hanya akan diganti dengan
                    kode atau inisial. Data yang dikumpulkan meliputi informasi sosiodemografi (seperti
                    usia, jenis kelamin, pendidikan, pekerjaan, fasilitas kesehatan tingkat pertama)
                    serta jumlah dan jenis diagnosis penyakit kronis untuk mengonfirmasi status
                    multimorbiditas, yang akan digunakan semata-mata untuk keperluan analisis dan
                    pelaporan penelitian. Dengan demikian, pendapat atau informasi yang Anda berikan
                    tidak dapat diidentifikasi oleh pihak di luar tim peneliti.
                  </p>
                  <p>
                    Namun, apabila terdapat informasi yang menunjukkan adanya risiko membahayakan
                    keselamatan Anda atau orang lain, peneliti berhak mengambil langkah yang
                    diperlukan, termasuk menghubungi pihak yang berwenang sesuai dengan ketentuan yang
                    berlaku.
                  </p>

                  <h3 style={styles.infoHeading}>Pelaporan dan pemaparan hasil</h3>
                  <p>
                    Hasil dari penelitian ini akan kami tulis dalam artikel ilmiah dan dipublikasikan
                    dalam jurnal dan konferensi ilmiah. Apabila Anda tertarik untuk membaca hasil
                    penelitian ini, Anda dapat menghubungi kami untuk kemudian kami berikan salinan
                    hasil yang telah kami susun. Informasi pribadi Anda tidak akan kami muat dalam
                    publikasi penelitian ini.
                  </p>

                  <h3 style={styles.infoHeading}>Kompensasi</h3>
                  <p>
                    Jika Anda bersedia mengikuti penelitian ini, dengan mengisi kuesioner, Anda akan
                    mendapatkan kompensasi berupa cinderamata <em>pouch</em>.
                  </p>

                  <h3 style={styles.infoHeading}>Pendanaan dan persetujuan</h3>
                  <p>
                    Penelitian ini didanai oleh Dana Masyarakat Tahun Anggaran 2026 Fakultas
                    Kedokteran, Kesehatan Masyarakat, dan keperawatan Universitas Gadjah Mada.
                    Penelitian ini telah dikaji dan disetujui oleh Komite Etik Fakultas Kedokteran,
                    Kesehatan Masyarakat, dan Keperawatan Universitas Gadjah Mada.
                  </p>

                  <h3 style={styles.infoHeading}>Informasi tambahan</h3>
                  <p>
                    Jika ada hal yang belum jelas yang ingin Anda tanyakan lebih lanjut, Anda dapat
                    menghubungi kami, dr. Aulia pada no. HP 082138280351 atau surel
                    auliaastagina@mail.ugm.ac.id. Anda juga dapat menghubungi Komisi Etik Fakultas
                    Kedokteran, Kesehatan Masyarakat, dan Keperawatan Universitas Gadjah Mada di nomor
                    telpon 08112666869, atau di surel mhrec_fmugm@ugm.ac.id.
                  </p>

                  <p style={{ marginTop: '1.5rem' }}>
                    Terima kasih atas waktu yang telah Anda luangkan untuk berpartisipasi dalam
                    penelitian kami.
                  </p>
                  <p style={{ marginTop: '1.5rem' }}>Hormat saya,</p>
                  <p style={{ margin: 0, fontWeight: 600 }}>dr. Aghnaa Gayatri, M.Sc</p>
                  <p style={{ margin: 0 }}>01/04/2026</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginTop: '2rem' }}>
                  <button style={styles.primaryBtn} onClick={handleNext}>
                    Lanjut <ArrowDown size={18} style={{ marginLeft: 8 }} />
                  </button>
                  <span style={styles.pressEnterHint}>Tekan <strong>Enter ↵</strong></span>
                </div>
              </div>
            ) : step === 'identity' ? (
              <div style={styles.questionBlock}>
                <div style={styles.questionNumber}>Lembar Persetujuan</div>
                <h2 style={styles.docTitle}>LEMBAR PERSETUJUAN</h2>

                <p style={styles.consentSubHeading}>Judul Penelitian:</p>
                <p style={styles.docSubtitle}>
                  Beyond Disease Counts : A Quantitative Analysis of Complexity Patterns in
                  Multimorbid Patient Populations in Yogyakarta using the Indonesian Version
                  of Intermed-SA Questionnare
                </p>

                <p style={styles.consentSubHeading}>Tim Peneliti:</p>
                <div style={styles.teamList}>
                  <p style={{ margin: 0 }}>dr. Aghnaa Gayatri, M.Sc, PhD, Sp.KKLP, Subsp.FOMC</p>
                  <p style={{ margin: 0 }}>Prof. dr. Hari Koesnanto Josep, MPH, DrPH, Sp.KKLP</p>
                  <p style={{ margin: 0 }}>Dr. dr. Wahyudi Istiono, M.Kes, Sp.KKLP Subsp. COPC</p>
                  <p style={{ margin: 0 }}>dr. Aulia Astagina Rahmadini</p>
                </div>

                <p style={{ ...styles.consentSubHeading, marginTop: '2rem' }}>
                  Saya yang bertanda tangan di bawah ini :
                </p>

                <p style={styles.fieldLabel}>
                  Nama <span style={styles.requiredMark}>*</span>
                </p>
                <input
                  type="text"
                  style={styles.textInput}
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Nama lengkap..."
                  autoComplete="name"
                  autoFocus
                />

                <p style={{ ...styles.fieldLabel, marginTop: '2rem' }}>
                  Alamat <span style={styles.requiredMark}>*</span>
                </p>
                <textarea
                  style={{ ...styles.textInput, fontSize: '1.25rem', resize: 'vertical', minHeight: '3.5rem' }}
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Alamat tempat tinggal..."
                  rows={2}
                  autoComplete="street-address"
                />

                <p style={{ ...styles.fieldLabel, marginTop: '2rem' }}>
                  No HP <span style={styles.requiredMark}>*</span>
                </p>
                <input
                  type="tel"
                  inputMode="tel"
                  style={styles.textInput}
                  value={noTelp}
                  onChange={(e) => setNoTelp(e.target.value)}
                  placeholder="08xx..."
                  autoComplete="tel"
                />
                <p style={styles.fieldHint}>
                  Nomor disimpan ter-enkripsi — hanya 4 digit depan &amp; 2 digit belakang yang terlihat.
                </p>

                <ul style={styles.consentBullets}>
                  <li>
                    Saya telah membaca dan memahami informasi pada lembar informasi tertanggal 1 April
                    2026 untuk penelitian di atas dan sudah diberikan kesempatan untuk bertanya.
                  </li>
                  <li>
                    Saya memahami bahwa keikutsertaan saya bersifat sukarela dan saya bebas
                    mengundurkan diri kapanpun, tanpa alasan, tanpa ada pengaruh terhadap hak-hak legal
                    saya.
                  </li>
                  <li>
                    Saya setuju untuk data saya disimpan secara anonim dan versi elektronik dari data
                    tersebut akan disimpan dalam komputer yang terkunci dengan kata sandi.
                  </li>
                  <li>
                    Saya memahami bahwa informasi yang saya berikan akan disimpan untuk penelitian
                    selanjutnya dan tidak akan dapat teridentifikasi pada analisis yang dilakukan.
                  </li>
                  <li>
                    Saya memahami bahwa hasil analisis penelitian ini akan ditampilkan dalam laporan
                    atau publikasi ilmiah, hal ini akan dilakukan dengan memastikan bahwa identitas saya
                    tidak dapat teridentifikasi.
                  </li>
                  <li>Saya setuju untuk ikut serta dalam penelitian ini.</li>
                </ul>

                <p style={{ ...styles.fieldLabel, marginTop: '2rem' }}>
                  Tanda Tangan Digital <span style={styles.requiredMark}>*</span>
                </p>
                <SignaturePad value={signature} onChange={setSignature} />

                <label style={styles.consentRow}>
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    style={styles.consentCheckbox}
                  />
                  <span style={styles.consentText}>
                    Saya telah membaca, memahami, dan menyetujui seluruh pernyataan di atas serta
                    bersedia ikut serta dalam penelitian ini.
                  </span>
                </label>

                {error && <p style={styles.errorText}>{error}</p>}

                <div style={{ display: 'flex', alignItems: 'center', marginTop: '2rem' }}>
                  <button
                    style={{ ...styles.primaryBtn, opacity: canProceed ? 1 : 0.5 }}
                    onClick={handleNext}
                    disabled={!canProceed}
                  >
                    Lanjut <ArrowDown size={18} style={{ marginLeft: 8 }} />
                  </button>
                </div>
              </div>
            ) : step === 'opening' ? (
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
                  id="inisial-input"
                  name="inisial"
                  type="text"
                  style={styles.textInput}
                  value={inisial}
                  onChange={(e) => setInisial(e.target.value.toUpperCase())}
                  placeholder="Ketik inisial..."
                  maxLength={10}
                  autoComplete="off"
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
                  <span style={styles.inisialBadge}>{inisial}</span>
                </div>
                <h2 style={styles.promptText}>{currentQuestion?.prompt}</h2>

                {renderInput()}
                {error && <p style={styles.errorText}>{error}</p>}

                {/* Show OK/Submit button for non-radio inputs, last step, Lainnya text required, or PRA-2 parent */}
                {(currentQuestion?.type !== 'radio' || lastStep || companionRequired || isParentWithSub) && (
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '2rem' }}>
                    <button
                      style={{ ...styles.primaryBtn, opacity: canProceed ? 1 : 0.5 }}
                      onClick={handleNext}
                      disabled={!canProceed || isSubmitting}
                    >
                      {lastStep ? 'Kirim' : 'OK'} <Check size={18} style={{ marginLeft: 8 }} />
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
          style={{ ...styles.navBtn, opacity: step === 'info' ? 0.3 : 1 }}
          onClick={handlePrevious}
          disabled={step === 'info' || isSubmitting}
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
    flexDirection: 'column' as const,
    padding: '1.5rem',
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%',
    overflowY: 'auto' as const,
    WebkitOverflowScrolling: 'touch' as const,
  },
  stepContainer: {
    width: '100%',
    margin: 'auto 0',
    padding: '2rem 0 6rem 0',
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
    flexWrap: 'wrap' as const,
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
  companionWrapper: {
    marginTop: '1.25rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e2e8f0',
  } as React.CSSProperties,
  companionLabel: {
    fontSize: '0.9rem',
    color: '#475569',
    marginBottom: '0.5rem',
    fontWeight: 600,
  } as React.CSSProperties,
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
  docTitle: {
    fontSize: 'clamp(20px, 4vw, 28px)',
    fontWeight: 800,
    lineHeight: 1.25,
    marginBottom: '0.75rem',
    color: '#0f172a',
    letterSpacing: '-0.02em',
    fontFamily: "'Outfit', sans-serif",
  } as React.CSSProperties,
  docSubtitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#334155',
    lineHeight: 1.5,
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  infoBody: {
    fontSize: '1rem',
    color: '#334155',
    lineHeight: 1.7,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.85rem',
  } as React.CSSProperties,
  infoHeading: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: '1rem 0 0 0',
  } as React.CSSProperties,
  consentSubHeading: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 0.5rem 0',
  } as React.CSSProperties,
  teamList: {
    fontSize: '0.95rem',
    color: '#334155',
    lineHeight: 1.6,
  } as React.CSSProperties,
  consentBullets: {
    fontSize: '0.95rem',
    color: '#334155',
    lineHeight: 1.6,
    margin: '2rem 0 0 0',
    paddingLeft: '1.25rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.6rem',
  } as React.CSSProperties,
  fieldLabel: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#475569',
    margin: '0 0 0.25rem 0',
  } as React.CSSProperties,
  requiredMark: {
    color: '#ef4444',
    marginLeft: '2px',
  } as React.CSSProperties,
  fieldHint: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: '0.5rem 0 0 0',
    lineHeight: 1.5,
  } as React.CSSProperties,
  consentRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginTop: '1.5rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  consentCheckbox: {
    width: '20px',
    height: '20px',
    marginTop: '2px',
    flexShrink: 0,
    accentColor: '#2563eb',
    cursor: 'pointer',
  } as React.CSSProperties,
  consentText: {
    fontSize: '14px',
    color: '#475569',
    lineHeight: 1.6,
    fontWeight: 500,
  } as React.CSSProperties,
  subQuestionWrapper: {
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '2px solid #e2e8f0',
  } as React.CSSProperties,
  subQuestionLabel: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#334155',
    marginBottom: '1rem',
  } as React.CSSProperties,
  subOptionCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    backgroundColor: 'white',
    border: '2px solid transparent',
    borderRadius: '12px',
    fontSize: '1.1rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.05)',
    color: '#334155',
  } as React.CSSProperties,
};
