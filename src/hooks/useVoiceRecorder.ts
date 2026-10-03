import * as React from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync,
  useAudioRecorder, useAudioRecorderState, type RecordingStatus,
} from 'expo-audio';
import { discardRecording } from '../api/voice';
import { MAX_VOICE_SECONDS } from '../utils/voice-draft';

type Phase = 'idle' | 'preparing' | 'recording' | 'stopping' | 'recorded';
const OPTIONS = { ...RecordingPresets.HIGH_QUALITY, numberOfChannels: 1, bitRate: 64000 };

/** Foreground-only, bounded recording. Navigation/backgrounding never uploads audio. */
export function useVoiceRecorder() {
  const [phase, setPhase] = React.useState<Phase>('idle');
  const [uri, setUri] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = React.useState(false);
  const focused = React.useRef(false);
  const generation = React.useRef(0);
  const phaseRef = React.useRef<Phase>('idle');
  const uriRef = React.useRef<string | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const acceptStatus = React.useRef(false);
  const statusHandler = React.useRef<(status: RecordingStatus) => void>(() => {});
  const recorder = useAudioRecorder(OPTIONS, (status) => statusHandler.current(status));
  const state = useAudioRecorderState(recorder, 200);

  const updatePhase = React.useCallback((next: Phase) => {
    phaseRef.current = next;
    if (focused.current) setPhase(next);
  }, []);
  const clearTimer = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const restoreAudio = React.useCallback(async () => {
    try { await setAudioModeAsync({ allowsRecording: false, shouldPlayInBackground: false }); }
    catch { /* No private device/provider errors are logged. */ }
  }, []);

  const clear = React.useCallback(async () => {
    const revision = ++generation.current;
    acceptStatus.current = false;
    clearTimer();
    updatePhase('stopping');
    const previousUri = uriRef.current;
    uriRef.current = null;
    if (focused.current) setUri(null);
    try {
      if (recorder.isRecording) await recorder.stop();
      discardRecording(recorder.uri);
    } catch { /* The native object may already be released during navigation. */ }
    discardRecording(previousUri);
    await restoreAudio();
    if (revision === generation.current) updatePhase('idle');
  }, [clearTimer, recorder, restoreAudio, updatePhase]);

  const stop = React.useCallback(async () => {
    if (phaseRef.current !== 'recording') return;
    const revision = generation.current;
    clearTimer();
    updatePhase('stopping');
    try {
      await recorder.stop();
      const recordedUri = recorder.uri;
      if (!focused.current || revision !== generation.current) {
        discardRecording(recordedUri);
        return;
      }
      if (!recordedUri) throw new Error('No recording was saved. Please try again.');
      uriRef.current = recordedUri;
      setUri(recordedUri);
      updatePhase('recorded');
    } catch {
      if (focused.current && revision === generation.current) {
        setError('The recording could not be saved. Try again or use the manual form.');
        updatePhase('idle');
      }
    } finally { await restoreAudio(); }
  }, [clearTimer, recorder, restoreAudio, updatePhase]);

  React.useEffect(() => {
    statusHandler.current = (status) => {
      if (!focused.current || !acceptStatus.current || !['recording', 'stopping'].includes(phaseRef.current)) return;
      if (status.hasError) {
        clearTimer();
        setError('Audio recording was interrupted. Please record again or use the manual form.');
        void clear();
      } else if (status.isFinished && status.url) {
        acceptStatus.current = false;
        clearTimer();
        uriRef.current = status.url;
        setUri(status.url);
        if (phaseRef.current !== 'stopping') {
          updatePhase('recorded');
          void restoreAudio();
        }
      }
    };
  }, [clear, clearTimer, restoreAudio, updatePhase]);

  const start = React.useCallback(async () => {
    if (['preparing', 'recording', 'stopping'].includes(phaseRef.current)) return;
    await clear();
    if (!focused.current) return;
    const revision = generation.current;
    updatePhase('preparing');
    setError(null);
    setPermissionDenied(false);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!focused.current || revision !== generation.current) return;
      if (!permission.granted) {
        setPermissionDenied(true);
        setError('Microphone access was denied. Enable it in device settings, or continue with the manual form.');
        updatePhase('idle');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, shouldPlayInBackground: false, allowsBackgroundRecording: false });
      if (!focused.current || revision !== generation.current) { await restoreAudio(); return; }
      await recorder.prepareToRecordAsync();
      if (!focused.current || revision !== generation.current) { await clear(); return; }
      if (AppState.currentState === 'background') { await clear(); return; }
      acceptStatus.current = true;
      recorder.record({ forDuration: MAX_VOICE_SECONDS });
      updatePhase('recording');
      // Native duration plus a foreground timer: never intentionally exceed the REST limit.
      timer.current = setTimeout(() => { void stop(); }, MAX_VOICE_SECONDS * 1000);
    } catch {
      if (focused.current && revision === generation.current) {
        setError('Could not start the microphone. On web use HTTPS or localhost; on a device check microphone permission.');
      }
      await clear();
    }
  }, [clear, recorder, restoreAudio, stop, updatePhase]);

  useFocusEffect(React.useCallback(() => {
    focused.current = true;
    setPhase(phaseRef.current);
    return () => {
      focused.current = false;
      void clear();
    };
  }, [clear]));

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active' && phaseRef.current === 'recording') void stop();
    });
    return () => subscription.remove();
  }, [stop]);

  return { phase, uri, error, permissionDenied, start, stop, clear,
    seconds: Math.min(MAX_VOICE_SECONDS, Math.floor(state.durationMillis / 1000)),
    busy: phase === 'preparing' || phase === 'stopping' };
}
