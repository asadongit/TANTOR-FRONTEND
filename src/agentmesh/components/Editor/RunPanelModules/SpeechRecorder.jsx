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
      try { recognitionRef.current.stop(); } catch (_) { /* ignore */ }
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
      setInterimText('');
      if (isListeningRef.current) {
        isListeningRef.current = false;
        setStatus('transcribed');
      }
    };

    recognition.onerror = (event) => {
      recognitionRef.current = null;
      setInterimText('');
      isListeningRef.current = false;
      if (event.error === 'no-speech') { setStatus('transcribed'); return; }
      if (event.error === 'aborted') return;
      setErrorMsg(`Microphone error: ${event.error}`);
      setStatus('error');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [autoStop, selectedLang]);

  const startVad = useCallback(async () => {
    if (!autoStart || isListeningRef.current || vadTriggeredRef.current) return;

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
  }, [autoStart, startRecording, stopVad]);

  const handleMicClick = useCallback(() => {
    if (status === 'listening') {
      stopRecording();
      setStatus('transcribed');
    } else if (status === 'waiting') {
      stopVad();
      setStatus('idle');
    } else {
      setIsSuspended(false);
      startRecording();
    }
  }, [status, startRecording, stopRecording, stopVad]);

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

  // Auto-submit
  useEffect(() => {
    if (status === 'transcribed' && finalTextRef.current.trim()) {
      scheduleSubmit();
    }
    return clearSubmitTimer;
  }, [status, scheduleSubmit]);

  // VAD trigger on mount / settings changes / suspension change
  useEffect(() => {
    if (autoStart && !isSuspended) {
      startVad();
    } else {
      stopVad();
    }
    return () => { stopRecording(); stopVad(); clearSubmitTimer(); };
  }, [autoStart, isSuspended]); // eslint-disable-line react-hooks/exhaustive-deps

  const isListening = status === 'listening';
  const isWaiting = status === 'waiting';
  const isTranscribed = status === 'transcribed';
  const isError = status === 'error';
  const displayText = finalText + (interimText ? (finalText ? ' ' : '') + interimText : '');

  // Mic styling
  const micBg = isSuspended
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

  const micShadow = isSuspended
    ? 'none'
    : isListening
      ? '0 8px 30px rgba(239,68,68,0.35)'
      : isTranscribed
        ? '0 8px 30px rgba(16,185,129,0.3)'
        : `0 8px 30px rgba(${ACCENT_RGB},0.25)`;

  const statusLabel = isSuspended
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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
      padding: '24px 20px 18px',
      background: SURFACE,
      borderRadius: 20,
      border: `1px solid ${BORDER}`,
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      width: '100%',
      fontFamily: "'Inter', 'Google Sans', sans-serif",
      position: 'relative',
    }}>

      {/* Top row: lang selector / suspension indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div>
          {isSuspended && (
            <span style={{ fontSize: 10, background: '#F3F4F6', color: '#4B5563', padding: '3px 8px', borderRadius: 12, fontWeight: 700 }}>
              PAUSED
            </span>
          )}
        </div>
        {(status === 'idle' || status === 'waiting' || isSuspended) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: SUBTEXT, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Lang
            </span>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              disabled={isListening}
              style={{
                background: '#F9FAFB',
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                color: TEXT,
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 8px',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {SUPPORTED_LANGS.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Mic button with animated rings */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* Waveform bars behind mic while listening */}
        <AnimatePresence>
          {isListening && !isSuspended && (
            <div style={{
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 0,
            }}>
              {Array.from({ length: 11 }).map((_, i) => (
                <motion.div
                  key={`bar-${i}`}
                  animate={{ scaleY: [0.25, 1, 0.25] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.075, ease: 'easeInOut' }}
                  style={{
                    width: 3,
                    height: 28,
                    borderRadius: 3,
                    background: `rgba(${ACCENT_RGB}, ${0.3 + (i % 4) * 0.15})`,
                    transformOrigin: 'center',
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* VAD waiting: gentle pulse */}
        <AnimatePresence>
          {isWaiting && !isSuspended && [1.3, 1.8].map((scale, i) => (
            <motion.div
              key={`vad-ring-${i}`}
              initial={{ scale: 1, opacity: 0.25 }}
              animate={{ scale, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.5, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: 76,
                height: 76,
                borderRadius: '50%',
                border: `2px solid #F59E0B`,
                pointerEvents: 'none',
              }}
            />
          ))}
        </AnimatePresence>

        {/* Listening: red pulse rings */}
        <AnimatePresence>
          {isListening && !isSuspended && [1.4, 1.9, 2.4].map((scale, i) => (
            <motion.div
              key={`ring-${i}`}
              initial={{ scale: 1, opacity: 0.3 }}
              animate={{ scale, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.4, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: 76,
                height: 76,
                borderRadius: '50%',
                border: `2px solid ${RED}`,
                pointerEvents: 'none',
              }}
            />
          ))}
        </AnimatePresence>

        {/* Main mic button */}
        <motion.button
          onClick={isError ? handleRetry : handleMicClick}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.06 }}
          style={{
            position: 'relative',
            zIndex: 1,
            width: 76,
            height: 76,
            borderRadius: '50%',
            border: 'none',
            background: micBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: micShadow,
            transition: 'background 0.3s, box-shadow 0.3s',
            outline: 'none',
          }}
        >
          {isSuspended ? (
            // Play/Resume symbol
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : isTranscribed ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : isError ? (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.48" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </motion.button>
      </div>

      {/* Status text */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: isSuspended ? SUBTEXT : isListening ? RED : isTranscribed && finalText.trim() ? GREEN : isWaiting ? '#D97706' : SUBTEXT,
          marginBottom: 2,
        }}>
          {statusLabel}
        </div>
        {status === 'idle' && (
          <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 500 }}>
            {autoStop ? 'Auto-stops on silence' : 'Manual stop'} · {autoStart ? 'Auto-starts on voice' : 'Manual start'}
          </div>
        )}
      </div>

      {/* Toggle Hold Button (Auto Mode Only) */}
      {(autoStart && autoStop) && (
        <button
          onClick={toggleSuspension}
          style={{
            padding: '6px 16px',
            borderRadius: 20,
            border: `1px solid ${BORDER}`,
            background: isSuspended ? `rgba(${ACCENT_RGB}, 0.1)` : '#F3F4F6',
            color: isSuspended ? ACCENT : TEXT,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s',
          }}
        >
          {isSuspended ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              </svg>
              Resume Listening
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
              Pause / Hold
            </>
          )}
        </button>
      )}

      {/* Live transcript */}
      <AnimatePresence>
        {(isListening || isTranscribed) && displayText && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              width: '100%',
              background: '#F9FAFB',
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: 9, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
              Transcript
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.6, color: TEXT }}>
              {finalText}
              {interimText && (
                <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                  {finalText ? ' ' : ''}{interimText}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm / Retry row (Shown only in manual modes) */}
      <AnimatePresence>
        {isTranscribed && finalText.trim() && !(autoStart && autoStop) && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', gap: 8, width: '100%' }}
          >
            <button
              onClick={handleRetry}
              style={{
                flex: 1,
                padding: '9px 0',
                borderRadius: 10,
                border: `1px solid ${BORDER}`,
                background: 'transparent',
                color: SUBTEXT,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              Re-record
            </button>
            <button
              onClick={handleConfirm}
              style={{
                flex: 2,
                padding: '9px 0',
                borderRadius: 10,
                border: 'none',
                background: `rgba(${ACCENT_RGB}, 1)`,
                color: 'white',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: `0 4px 14px rgba(${ACCENT_RGB}, 0.35)`,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              Send Now
            </button>
          </motion.div>
        )}
        {isTranscribed && !finalText.trim() && !(autoStart && autoStop) && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleRetry}
            style={{
              width: '100%', padding: '9px 0', borderRadius: 10,
              border: `1px solid ${BORDER}`, background: 'transparent',
              color: SUBTEXT, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Nothing captured — Try Again
          </motion.button>
        )}
      </AnimatePresence>

      {/* Error */}
      {isError && (
        <div style={{
          fontSize: 12, color: '#DC2626', textAlign: 'center',
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.18)',
          borderRadius: 10, padding: '10px 14px', width: '100%',
        }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}
