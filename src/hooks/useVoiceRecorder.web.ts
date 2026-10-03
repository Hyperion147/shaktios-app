import * as React from 'react';
import { useFocusEffect } from 'expo-router';
import { MAX_VOICE_SECONDS } from '../utils/voice-draft';

type Phase = 'idle' | 'preparing' | 'recording' | 'stopping' | 'recorded';

/** Own the browser stream explicitly: even a late permission grant must release its tracks. */
export function useVoiceRecorder() {
  const [phase, setPhase] = React.useState<Phase>('idle');
  const [uri, setUri] = React.useState<string | null>(null);
  const [seconds, setSeconds] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = React.useState(false);
  const phaseRef = React.useRef<Phase>('idle');
  const focused = React.useRef(false);
  const generation = React.useRef(0);
  const stream = React.useRef<MediaStream | null>(null);
  const recorder = React.useRef<MediaRecorder | null>(null);
  const clip = React.useRef<string | null>(null);
  const startedAt = React.useRef(0);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const ticker = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const updatePhase = React.useCallback((next: Phase) => {
    phaseRef.current = next;
    if (focused.current) setPhase(next);
  }, []);
  const stopTimers = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (ticker.current) clearInterval(ticker.current);
    timer.current = null;
    ticker.current = null;
  }, []);
  const clear = React.useCallback(async () => {
    ++generation.current;
    stopTimers();
    const active = recorder.current;
    recorder.current = null;
    if (active) {
      active.ondataavailable = null;
      active.onstop = null;
      active.onerror = null;
      if (active.state !== 'inactive') active.stop();
    }
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (clip.current) URL.revokeObjectURL(clip.current);
    clip.current = null;
    if (focused.current) { setUri(null); setSeconds(0); }
    updatePhase('idle');
  }, [stopTimers, updatePhase]);
  const stop = React.useCallback(async () => {
    const active = recorder.current;
    if (phaseRef.current !== 'recording' || !active) return;
    stopTimers();
    updatePhase('stopping');
    setSeconds(Math.min(MAX_VOICE_SECONDS, Math.round((Date.now() - startedAt.current) / 1000)));
    if (active.state !== 'inactive') active.stop();
    // MediaRecorder flushes asynchronously; the microphone need not remain active for that.
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }, [stopTimers, updatePhase]);
  const start = React.useCallback(async () => {
    if (['preparing', 'recording', 'stopping'].includes(phaseRef.current)) return;
    // Set the synchronous lock before the first await (double-taps must not open two streams).
    const clearing = clear();
    updatePhase('preparing');
    const revision = generation.current;
    await clearing;
    if (!focused.current || revision !== generation.current) return;
    setError(null);
    setPermissionDenied(false);
    try {
      const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!focused.current || revision !== generation.current || document.visibilityState === 'hidden') {
        microphone.getTracks().forEach((track) => track.stop());
        if (revision === generation.current) updatePhase('idle');
        return;
      }
      stream.current = microphone;
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported(type));
      const active = new MediaRecorder(microphone, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64000 });
      recorder.current = active;
      const chunks: BlobPart[] = [];
      active.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      active.onstop = () => {
        stopTimers();
        microphone.getTracks().forEach((track) => track.stop());
        if (!focused.current || revision !== generation.current) return;
        const blob = new Blob(chunks, { type: active.mimeType || 'audio/webm' });
        if (!blob.size) { setError('No recording was saved. Try again or use the manual form.'); updatePhase('idle'); return; }
        clip.current = URL.createObjectURL(blob);
        setUri(clip.current);
        setSeconds(Math.min(MAX_VOICE_SECONDS, Math.round((Date.now() - startedAt.current) / 1000)));
        updatePhase('recorded');
      };
      active.onerror = () => {
        if (focused.current && revision === generation.current) {
          setError('Audio recording was interrupted. Please record again or use the manual form.');
          void clear();
        }
      };
      active.start();
      startedAt.current = Date.now();
      updatePhase('recording');
      timer.current = setTimeout(() => { void stop(); }, MAX_VOICE_SECONDS * 1000);
      ticker.current = setInterval(() => setSeconds(Math.min(MAX_VOICE_SECONDS, Math.floor((Date.now() - startedAt.current) / 1000))), 200);
    } catch (failure) {
      if (!focused.current || revision !== generation.current) return;
      const denied = failure instanceof Error && ['NotAllowedError', 'PermissionDeniedError'].includes(failure.name);
      setPermissionDenied(denied);
      setError(denied ? 'Microphone access was denied. Enable it in browser settings, or continue with the manual form.' : 'Could not start the microphone. Use HTTPS or localhost and check microphone availability.');
      await clear();
    }
  }, [clear, stop, stopTimers, updatePhase]);
  useFocusEffect(React.useCallback(() => {
    focused.current = true;
    setPhase(phaseRef.current);
    return () => { focused.current = false; void clear(); };
  }, [clear]));
  React.useEffect(() => {
    const hide = () => {
      if (document.visibilityState !== 'hidden') return;
      if (phaseRef.current === 'recording') void stop();
      else if (phaseRef.current === 'preparing') void clear();
    };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, [clear, stop]);
  return { phase, uri, seconds, error, permissionDenied, start, stop, clear, busy: phase === 'preparing' || phase === 'stopping' };
}
