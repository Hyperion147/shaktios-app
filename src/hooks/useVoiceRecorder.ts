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
  const [recordedSeconds, setRecordedSeconds] = React.useState(0);
  const startedAt = React.useRef(0);
  const focused = React.useRef(false);
  const generation = React.useRef(0);
  const phaseRef = React.useRef<Phase>('idle');
  const uriRef = React.useRef<string | null>(null);
  const acceptStatus = React.useRef(false);
  const statusHandler = React.useRef<(status: RecordingStatus) => void>(() => {});
  const recorder = useAudioRecorder(OPTIONS, (status) => statusHandler.current(status));
  const state = useAudioRecorderState(recorder, 200);

  const updatePhase = React.useCallback((next: Phase) => {
    phaseRef.current = next;
    if (focused.current) setPhase(next);
  }, []);
  const restoreAudio = React.useCallback(async () => {
    try { await setAudioModeAsync({ allowsRecording: false, shouldPlayInBackground: false }); }
    catch { /* No private device/provider errors are logged. */ }
  }, []);

  const clear = React.useCallback(async () => {
    const revision = ++generation.current;
    acceptStatus.current = false;
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
  }, [recorder, restoreAudio, updatePhase]);

  const stop = React.useCallback(async () => {
    if (phaseRef.current !== 'recording') return;
    const revision = generation.current;
    setRecordedSeconds(Math.min(MAX_VOICE_SECONDS, Math.round((Date.now() - startedAt.current) / 1000)));
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
      // The duration limit can start flushing at the same instant as a manual
      // stop. Let its completion callback finish rather than discarding the clip.
      if (acceptStatus.current && Date.now() - startedAt.current >= MAX_VOICE_SECONDS * 1000) return;
      if (focused.current && revision === generation.current) {
        setError('The recording could not be saved. Try again or use the manual form.');
        updatePhase('idle');
      }
    } finally { await restoreAudio(); }
  }, [recorder, restoreAudio, updatePhase]);

  React.useEffect(() => {
    statusHandler.current = (status) => {
      if (!focused.current || !acceptStatus.current || !['recording', 'stopping'].includes(phaseRef.current)) {
        if (status.isFinished && status.url) discardRecording(status.url);
        return;
      }
      if (status.hasError) {
        setError('Audio recording was interrupted. Please record again or use the manual form.');
        void clear();
      } else if (status.isFinished && status.url) {
        acceptStatus.current = false;
        uriRef.current = status.url;
        setUri(status.url);
        setRecordedSeconds(Math.min(MAX_VOICE_SECONDS, Math.round((Date.now() - startedAt.current) / 1000)));
        updatePhase('recorded');
        void restoreAudio();
      }
    };
  }, [clear, restoreAudio, updatePhase]);

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
      startedAt.current = Date.now();
      // One duration owner: a second JS stop timer races the recorder's own
      // automatic stop and can discard the finished clip on web/native.
      recorder.record({ forDuration: MAX_VOICE_SECONDS });
      updatePhase('recording');
    } catch {
      if (focused.current && revision === generation.current) {
        setError('Could not start the microphone. On web use HTTPS or localhost; on a device check microphone permission.');
      }
      await clear();
    }
  }, [clear, recorder, restoreAudio, updatePhase]);

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
    seconds: phase === 'recorded' ? recordedSeconds : phase === 'recording' ? Math.min(MAX_VOICE_SECONDS, Math.floor(state.durationMillis / 1000)) : 0,
    busy: phase === 'preparing' || phase === 'stopping' };
}
