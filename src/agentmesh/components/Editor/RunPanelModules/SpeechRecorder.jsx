import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Theme tokens matching RunPanel
const ACCENT = 'var(--theme-primary, #6366F1)';
const ACCENT_RGB = '99, 102, 241';
const TEXT = '#111827';
const SUBTEXT = '#6B7280';
const BORDER = 'rgba(0,0,0,0.08)';
const SURFACE = '#FFFFFF';
const RED = '#EF4444';
const GREEN = '#10B981';

const SUPPORTED_LANGS = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi-IN', label: 'हिंदी (Hindi)' },
  { code: 'ar-SA', label: 'العربية (Arabic)' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'es-ES', label: 'Español' },
  { code: 'zh-CN', label: '中文 (Chinese)' },
  { code: 'ja-JP', label: '日本語 (Japanese)' },
  { code: 'pt-BR', label: 'Português (BR)' },
];

export default function SpeechRecorder({
  autoStart = false,
  autoStop = true,
  silenceDelay = 1500,
  lang = 'en-US',
  onTranscript,
  inModal = false,
  isAudioPlaying = false,
}) {
  const [status, setStatus] = useState('idle'); // idle | waiting | listening | transcribed | error
  const [finalText, setFinalText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedLang, setSelectedLang] = useState(lang);
  const [isSuspended, setIsSuspended] = useState(false);

  // Refs to escape stale closures in recognition callbacks
  const isListeningRef = useRef(false);
  const recognitionRef = useRef(null);
  const activeRecognitionRef = useRef(null);
  const finalTextRef = useRef('');
  const submitTimerRef = useRef(null);

  // VAD refs (auto-start via AudioContext)
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const vadRafRef = useRef(null);
  const vadStreamRef = useRef(null);
  const vadTriggeredRef = useRef(false);

  const clearSubmitTimer = () => {
    if (submitTimerRef.current) {
      clearTimeout(submitTimerRef.current);
      submitTimerRef.current = null;
    }
  };

  const scheduleSubmit = useCallback(() => {
    clearSubmitTimer();
    submitTimerRef.current = setTimeout(() => {
      const text = finalTextRef.current.trim();
      if (text) onTranscript(text);
    }, silenceDelay);
  }, [silenceDelay, onTranscript]);

  const stopRecording = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        /* ignore */
      }
      recognitionRef.current = null;
    }
    setInterimText('');
  }, []);

  const stopVad = useCallback(() => {
    vadTriggeredRef.current = false;
    if (vadRafRef.current) { cancelAnimationFrame(vadRafRef.current); vadRafRef.current = null; }
    if (vadStreamRef.current) { vadStreamRef.current.getTracks().forEach(t => t.stop()); vadStreamRef.current = null; }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (_) { /* ignore */ }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const startRecording = useCallback(() => {
    if (isAudioPlaying) {
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setErrorMsg('Speech recognition is not supported. Please use Chrome or Edge.');
      setStatus('error');
      return;
    }

    finalTextRef.current = '';
    setFinalText('');
    setInterimText('');
    setErrorMsg('');
    setStatus('listening');
    isListeningRef.current = true;
    clearSubmitTimer();

    const recognition = new SR();
    recognition.lang = selectedLang;
    recognition.interimResults = true;
    recognition.continuous = !autoStop;

    recognition.onresult = (event) => {
      let interim = '';
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalChunk += t;
        else interim += t;
      }
      if (finalChunk) {
        finalTextRef.current += finalChunk;
        setFinalText(finalTextRef.current);
      }
      setInterimText(interim);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      activeRecognitionRef.current = null;
      setInterimText('');
      if (isListeningRef.current) {
        isListeningRef.current = false;
        setStatus('transcribed');
      }
    };

    recognition.onerror = (event) => {
      recognitionRef.current = null;
      activeRecognitionRef.current = null;
      setInterimText('');
      isListeningRef.current = false;
      if (event.error === 'no-speech') {
        setStatus('transcribed');
        return;
      }
      if (event.error === 'aborted') {
        return;
      }
      setErrorMsg(`Microphone error: ${event.error}`);
      setStatus('error');
    };

    recognitionRef.current = recognition;
    activeRecognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      try { recognition.abort(); } catch (_) {}
      setTimeout(() => {
        try {
          recognition.start();
        } catch (err) {
          setErrorMsg(`Microphone error: ${err.message}`);
          setStatus('error');
        }
      }, 150);
    }
  }, [autoStop, selectedLang, isAudioPlaying]);

  const startVad = useCallback(async () => {
    if (!autoStart || isListeningRef.current || vadTriggeredRef.current || isAudioPlaying) return;

    setStatus('waiting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      vadStreamRef.current = stream;

      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const THRESHOLD = 18; // RMS threshold
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length);
        if (rms > THRESHOLD && !vadTriggeredRef.current) {
          vadTriggeredRef.current = true;
          stopVad();
          startRecording();
          return;
        }
        vadRafRef.current = requestAnimationFrame(tick);
      };
      vadRafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      setErrorMsg(`Microphone access denied: ${err.message}`);
      setStatus('error');
    }
  }, [autoStart, startRecording, stopVad, isAudioPlaying]);

  const handleMicClick = useCallback(() => {
    if (isAudioPlaying) return;
    if (status === 'listening') {
      stopRecording();
      setStatus('transcribed');
    } else if (status === 'waiting') {
      stopVad();
      setStatus('idle');
    } else if (status === 'transcribed' && !autoStop) {
      clearSubmitTimer();
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return;
      setErrorMsg('');
      setStatus('listening');
      isListeningRef.current = true;
      const recognition = new SR();
      recognition.lang = selectedLang;
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.onresult = (event) => {
        let interim = '';
        let finalChunk = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalChunk += t;
          else interim += t;
        }
        if (finalChunk) {
          finalTextRef.current += finalChunk;
          setFinalText(finalTextRef.current);
        }
        setInterimText(interim);
      };
      recognition.onend = () => {
        recognitionRef.current = null;
        activeRecognitionRef.current = null;
        setInterimText('');
        if (isListeningRef.current) {
          isListeningRef.current = false;
          setStatus('transcribed');
        }
      };
      recognition.onerror = (event) => {
        recognitionRef.current = null;
        activeRecognitionRef.current = null;
        setInterimText('');
        isListeningRef.current = false;
        if (event.error === 'no-speech') { setStatus('transcribed'); return; }
        if (event.error === 'aborted') return;
        setErrorMsg(`Microphone error: ${event.error}`);
        setStatus('error');
      };
      recognitionRef.current = recognition;
      activeRecognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (e) {
        try { recognition.abort(); } catch (_) {}
        setTimeout(() => {
          try {
            recognition.start();
          } catch (err) {
            setErrorMsg(`Microphone error: ${err.message}`);
            setStatus('error');
          }
        }, 150);
      }
    } else {
      setIsSuspended(false);
      startRecording();
    }
  }, [status, autoStop, selectedLang, startRecording, stopRecording, stopVad, isAudioPlaying]);

  const handleConfirm = useCallback(() => {
    clearSubmitTimer();
    const text = finalTextRef.current.trim();
    if (text) onTranscript(text);
  }, [onTranscript]);

  const handleRetry = useCallback(() => {
    clearSubmitTimer();
    stopRecording();
    stopVad();
    setStatus('idle');
    setFinalText('');
    setInterimText('');
    setErrorMsg('');
    finalTextRef.current = '';
    vadTriggeredRef.current = false;
    if (autoStart && !isSuspended) {
      startVad();
    }
  }, [stopRecording, stopVad, autoStart, isSuspended, startVad]);

  const toggleSuspension = useCallback(() => {
    if (isSuspended) {
      setIsSuspended(false);
      if (autoStart) {
        startVad();
      } else {
        setStatus('idle');
      }
    } else {
      setIsSuspended(true);
      clearSubmitTimer();
      stopRecording();
      stopVad();
      setStatus('idle');
    }
  }, [isSuspended, autoStart, startVad, stopRecording, stopVad]);

  // Auto-submit (only when auto-stop is enabled — manual stop shows buttons instead)
  useEffect(() => {
    if (status === 'transcribed' && finalTextRef.current.trim() && autoStop) {
      scheduleSubmit();
    }
    return clearSubmitTimer;
  }, [status, scheduleSubmit, autoStop]);

  // Monitor isAudioPlaying to automatically stop and prevent recording while TTS plays
  useEffect(() => {
    if (isAudioPlaying) {
      if (activeRecognitionRef.current) {
        try { activeRecognitionRef.current.abort(); } catch (_) {}
        activeRecognitionRef.current = null;
      }
      stopRecording();
      stopVad();
      setStatus('idle');
    } else {
      if (autoStart && !isSuspended) {
        startVad();
      }
    }
  }, [isAudioPlaying, autoStart, isSuspended, stopRecording, stopVad, startVad]);

  // VAD trigger on mount / settings changes / suspension change
  useEffect(() => {
    if (autoStart && !isSuspended) {
      startVad();
    } else {
      stopVad();
    }
    return () => {
      if (activeRecognitionRef.current) {
        try { activeRecognitionRef.current.abort(); } catch (_) {}
        activeRecognitionRef.current = null;
      }
      stopRecording();
      stopVad();
      clearSubmitTimer();
    };
  }, [autoStart, isSuspended]); // eslint-disable-line react-hooks/exhaustive-deps

  const isListening = status === 'listening';
  const isWaiting = status === 'waiting';
  const isTranscribed = status === 'transcribed';
  const isError = status === 'error';
  const displayText = finalText + (interimText ? (finalText ? ' ' : '') + interimText : '');

  // Mic styling
  const micBg = isAudioPlaying
    ? 'linear-gradient(135deg, #9CA3AF, #6B7280)'
    : isSuspended
      ? 'linear-gradient(135deg, #9CA3AF, #6B7280)'
      : isListening
        ? `linear-gradient(135deg, #DC2626, ${RED})`
        : isTranscribed
          ? `linear-gradient(135deg, #059669, ${GREEN})`
          : isWaiting
            ? `linear-gradient(135deg, #D97706, #F59E0B)`
            : isError
              ? 'linear-gradient(135deg, #9CA3AF, #6B7280)'
              : `linear-gradient(135deg, rgba(${ACCENT_RGB},0.9), rgba(${ACCENT_RGB},0.7))`;

  const micShadow = isAudioPlaying || isSuspended
    ? 'none'
    : isListening
      ? '0 8px 30px rgba(239,68,68,0.35)'
      : isTranscribed
        ? '0 8px 30px rgba(16,185,129,0.3)'
        : `0 8px 30px rgba(${ACCENT_RGB},0.25)`;

  const statusLabel = isAudioPlaying
    ? 'Playing audio…'
    : isSuspended
      ? 'Listening Paused'
      : isListening
        ? (autoStop ? 'Listening — speak now' : 'Recording — click to stop')
        : isWaiting
          ? 'Waiting for voice…'
          : isTranscribed
            ? (finalText.trim() ? `Sending in ${(silenceDelay / 1000).toFixed(1)}s…` : 'No speech detected')
            : isError
              ? 'Tap to retry'
              : autoStart
                ? 'Initialising microphone…'
                : 'Tap mic to speak';

  // Reusable mic icon JSX for any button size
  const MicIcon = ({ size = 28 }) => {
    if (isAudioPlaying) return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>;
    if (isSuspended) return <svg width={size} height={size} viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>;
    if (isTranscribed) return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>;
    if (isError) return <svg width={size-2} height={size-2} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.48" /></svg>;
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>;
  };

  // Reusable mic button container (wraps rings + button)
  const MicButton = ({ size = 76, ringScales = [1.15, 1.35, 1.6], showRings = true }) => (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {showRings && (
        <>
          {/* Waveform bars behind mic while listening */}
          <AnimatePresence>
            {isListening && !isSuspended && (
              <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', gap: 2, left: '50%', transform: 'translateX(-50%)', zIndex: 0 }}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <motion.div key={`bar-${i}`} animate={{ scaleY: [0.25, 1, 0.25] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.075, ease: 'easeInOut' }} style={{ width: 2, height: size * 0.37, borderRadius: 2, background: `rgba(${ACCENT_RGB}, ${0.3 + (i % 4) * 0.15})`, transformOrigin: 'center' }} />
                ))}
              </div>
            )}
          </AnimatePresence>
          {/* VAD waiting rings */}
          <AnimatePresence>
            {isWaiting && !isSuspended && [1.3, 1.8].map((scale, i) => (
              <motion.div key={`vad-ring-${i}`} initial={{ scale: 1, opacity: 0.25 }} animate={{ scale, opacity: 0 }} exit={{ opacity: 0 }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.5, ease: 'easeOut' }} style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', border: `2px solid #F59E0B`, pointerEvents: 'none' }} />
            ))}
          </AnimatePresence>
          {/* Listening red rings */}
          <AnimatePresence>
            {isListening && !isSuspended && ringScales.map((scale, i) => (
              <motion.div key={`ring-${i}`} initial={{ scale: 1, opacity: 0.2 }} animate={{ scale, opacity: 0 }} exit={{ opacity: 0 }} transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.5, ease: 'easeOut' }} style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', border: `1.5px solid rgba(239,68,68,0.4)`, pointerEvents: 'none' }} />
            ))}
          </AnimatePresence>
        </>
      )}
      {/* The button itself */}
      <motion.button
        onClick={isError ? handleRetry : handleMicClick}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.06 }}
        style={{
          position: 'relative', zIndex: 1, width: size, height: size,
          borderRadius: '50%', border: 'none', background: micBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: micShadow, transition: 'background 0.3s, box-shadow 0.3s', outline: 'none',
        }}
      >
        <MicIcon size={size * 0.37} />
      </motion.button>
    </div>
  );

  // Shared top bar
  const TopBar = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minHeight: 28 }}>
      <div>
        {isSuspended && (<span style={{ fontSize: 10, background: '#F3F4F6', color: '#4B5563', padding: '3px 8px', borderRadius: 12, fontWeight: 700 }}>PAUSED</span>)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {(status === 'idle' || status === 'waiting' || isSuspended) && (
          <>
            {autoStart && !inModal && (
              <button onClick={toggleSuspension} title={isSuspended ? 'Resume' : 'Pause'} style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${BORDER}`, background: isSuspended ? `rgba(${ACCENT_RGB}, 0.1)` : '#F3F4F6', color: isSuspended ? ACCENT : TEXT, fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                {isSuspended ? '▶ Resume' : '⏸ Pause'}
              </button>
            )}
            <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} disabled={isListening} style={{ background: '#F9FAFB', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 11, fontWeight: 600, padding: '4px 8px', cursor: 'pointer', outline: 'none' }}>
              {SUPPORTED_LANGS.map(l => (<option key={l.code} value={l.code}>{l.label}</option>))}
            </select>
          </>
        )}
      </div>
    </div>
  );

  // Shared transcript area
  const TranscriptArea = () => (
    <AnimatePresence>
      {(isListening || isTranscribed) && displayText && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ width: '100%', background: '#F9FAFB', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Transcript</div>
          <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.6, color: TEXT }}>
            {finalText}
            {interimText && <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>{finalText ? ' ' : ''}{interimText}</span>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: inModal ? 10 : 14,
      padding: inModal ? '4px 0 0' : '24px 20px 18px',
      background: inModal ? 'transparent' : SURFACE,
      borderRadius: inModal ? 0 : 20,
      border: inModal ? 'none' : `1px solid ${BORDER}`,
      boxShadow: inModal ? 'none' : '0 4px 20px rgba(0,0,0,0.06)',
      width: '100%',
      fontFamily: "'Inter', 'Google Sans', sans-serif",
      position: 'relative',
      flex: 1,
    }}>
      <TopBar />

      {inModal ? (
        <>
          {/* MODAL LAYOUT: Mic centered, status, transcript, and actions */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', gap: 12 }}>
            <MicButton size={76} />
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: isSuspended ? SUBTEXT : isListening ? RED : isTranscribed && finalText.trim() ? GREEN : isWaiting ? '#D97706' : SUBTEXT, marginBottom: 2 }}>
                {statusLabel}
              </div>
              {status === 'idle' && (
                <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 500 }}>
                  {autoStop ? 'Auto-stops on silence' : 'Manual stop'} · {autoStart ? 'Auto-starts on voice' : 'Manual start'}
                </div>
              )}
            </div>

            <TranscriptArea />
          </div>

          {/* Bottom action row: Re-record + Send (only when transcribed) */}
          <AnimatePresence>
            {isTranscribed && finalText.trim() && !(autoStart && autoStop) && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 0 4px', borderTop: `1px solid ${BORDER}` }}>
                <button onClick={handleRetry} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${BORDER}`, background: 'transparent', color: SUBTEXT, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  Re-record
                </button>
                <button onClick={handleConfirm} style={{ flex: 2, padding: '10px 0', borderRadius: 10, border: 'none', background: `rgba(${ACCENT_RGB}, 1)`, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 14px rgba(${ACCENT_RGB}, 0.35)`, transition: 'opacity 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                  Send Now
                </button>
              </motion.div>
            )}
            {isTranscribed && !finalText.trim() && !(autoStart && autoStop) && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={handleRetry} style={{ width: '100%', padding: '9px 0', borderRadius: 10, border: `1px solid ${BORDER}`, background: 'transparent', color: SUBTEXT, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Nothing captured — Try Again
              </motion.button>
            )}
          </AnimatePresence>
        </>
      ) : (
        <>
          {/* INLINE LAYOUT: mic centered, transcript + buttons below */}
          <MicButton size={76} />

          {/* Status text */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: isSuspended ? SUBTEXT : isListening ? RED : isTranscribed && finalText.trim() ? GREEN : isWaiting ? '#D97706' : SUBTEXT, marginBottom: 2 }}>
              {statusLabel}
            </div>
            {status === 'idle' && (
              <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 500 }}>
                {autoStop ? 'Auto-stops on silence' : 'Manual stop'} · {autoStart ? 'Auto-starts on voice' : 'Manual start'}
              </div>
            )}
          </div>

          <TranscriptArea />

          {/* Confirm / Retry row */}
          <AnimatePresence>
            {isTranscribed && finalText.trim() && !(autoStart && autoStop) && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', gap: 8, width: '100%' }}>
                <button onClick={handleRetry} style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: `1px solid ${BORDER}`, background: 'transparent', color: SUBTEXT, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>Re-record</button>
                <button onClick={handleConfirm} style={{ flex: 2, padding: '9px 0', borderRadius: 10, border: 'none', background: `rgba(${ACCENT_RGB}, 1)`, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 14px rgba(${ACCENT_RGB}, 0.35)`, transition: 'opacity 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>Send Now</button>
              </motion.div>
            )}
            {isTranscribed && !finalText.trim() && !(autoStart && autoStop) && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={handleRetry} style={{ width: '100%', padding: '9px 0', borderRadius: 10, border: `1px solid ${BORDER}`, background: 'transparent', color: SUBTEXT, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Nothing captured — Try Again
              </motion.button>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Error */}
      {isError && (
        <div style={{ fontSize: 12, color: '#DC2626', textAlign: 'center', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10, padding: '10px 14px', width: '100%' }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}
