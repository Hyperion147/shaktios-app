import * as React from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Linking from 'expo-linking';
import { Mic, Square, Play, Pause, ChevronDown, ShieldCheck } from 'lucide-react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { PrimaryButton, ScreenHeader, Stepper } from '@/src/components/design';
import { VoiceDraftPreview } from '@/src/components/VoiceDraftPreview';
import { useSession } from '@/src/store/session';
import { useVoiceRecorder } from '@/src/hooks/useVoiceRecorder';
import { fetchVoiceConfig, requestVoiceDraft } from '@/src/api/voice';
import { normalizeError } from '@/src/api/client';
import { confirmedVoicePatch, MAX_VOICE_SECONDS } from '@/src/utils/voice-draft';
import type { VoiceConfig, VoiceDraft } from '@/src/types/voice';
import type { VenueEvent } from '@/src/types';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';

function Playback({ uri, disabled }: { uri: string; disabled: boolean }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  React.useEffect(() => { if (disabled) player.pause(); }, [disabled, player]);
  return <Pressable accessibilityRole="button" accessibilityLabel={status.playing ? 'Pause recording' : 'Listen to recording'}
    disabled={disabled} onPress={() => {
      if (status.playing) player.pause();
      else { if (status.didJustFinish) void player.seekTo(0); player.play(); }
    }} className="min-h-12 flex-row items-center justify-center gap-2 rounded-xl border border-border bg-card p-3">
    {status.playing ? <Pause size={18} color={THEME.light.primary} /> : <Play size={18} color={THEME.light.primary} />}
    <Text className="font-semibold text-primary">{status.playing ? 'Pause recording' : 'Listen to recording'}</Text>
  </Pressable>;
}

export default function VoiceReportScreen() {
  const { user, activeEvent } = useSession();
  const router = useRouter();
  if (!user || !activeEvent || activeEvent.status === 'ended' || !activeEvent.zones.length) {
    return <ScreenContainer><ScreenHeader title="Voice report" onBack={() => router.back()} />
      <Text className="py-6 text-[14px]">Join an active or upcoming event with registered zones before recording a report.</Text>
      <PrimaryButton title="Choose an event" onPress={() => router.replace('/(tabs)/join')} />
    </ScreenContainer>;
  }
  // Switching citizen or venue destroys the old recorder/request/preview together.
  return <VoiceCapture key={`${user.id}:${activeEvent.id}`} venue={activeEvent} />;
}

function VoiceCapture({ venue }: { venue: VenueEvent }) {
  const router = useRouter();
  const { setDraft, setPendingLocation } = useSession();
  const recording = useVoiceRecorder();
  const [config, setConfig] = React.useState<VoiceConfig | null>(null);
  const [configLoading, setConfigLoading] = React.useState(true);
  const [configError, setConfigError] = React.useState<string | null>(null);
  const [language, setLanguage] = React.useState('unknown');
  const [showLanguages, setShowLanguages] = React.useState(false);
  const [consent, setConsent] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<VoiceDraft | null>(null);
  const scroll = React.useRef<ScrollView>(null);
  const showingPreview = preview !== null;
  React.useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [showingPreview]);
  const mounted = React.useRef(true);
  const configRequest = React.useRef<AbortController | null>(null);
  const draftRequest = React.useRef<AbortController | null>(null);

  const loadConfig = React.useCallback(async () => {
    configRequest.current?.abort();
    const controller = new AbortController();
    configRequest.current = controller;
    setConfigLoading(true);
    setConfigError(null);
    try {
      const next = await fetchVoiceConfig(controller.signal);
      if (!controller.signal.aborted && mounted.current) setConfig(next);
    } catch (failure) {
      if (!controller.signal.aborted && mounted.current) {
        setConfig(null);
        setConfigError(normalizeError(failure).status === 404
          ? 'The running API does not have voice reporting yet. Restart the updated API, or continue manually.'
          : normalizeError(failure).message);
      }
    } finally {
      if (configRequest.current === controller && mounted.current) setConfigLoading(false);
    }
  }, []);

  React.useEffect(() => { void loadConfig(); }, [loadConfig]);
  useFocusEffect(React.useCallback(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      configRequest.current?.abort();
      draftRequest.current?.abort();
    };
  }, []));

  const processAudio = async () => {
    if (draftRequest.current || !recording.uri || !consent || !config?.configured) return;
    const controller = new AbortController();
    draftRequest.current = controller;
    setProcessing(true);
    setError(null);
    try {
      const draft = await requestVoiceDraft(recording.uri, venue, language, controller.signal);
      if (!mounted.current || controller.signal.aborted || draftRequest.current !== controller) return;
      await recording.clear();
      if (!mounted.current || controller.signal.aborted || draftRequest.current !== controller) return;
      setPreview(draft);
    } catch (failure) {
      if (mounted.current && !controller.signal.aborted && draftRequest.current === controller) setError(normalizeError(failure).message);
    } finally {
      if (draftRequest.current === controller) {
        draftRequest.current = null;
        if (mounted.current) setProcessing(false);
      }
    }
  };

  const cancelProcessing = () => {
    draftRequest.current?.abort();
    draftRequest.current = null;
    setProcessing(false);
    setError('Stopped waiting. No report was submitted. Audio already sent to Sarvam cannot be recalled; you can retry explicitly or use the manual form.');
  };
  const accept = () => {
    if (!preview) return;
    try {
      setDraft(confirmedVoicePatch(preview, venue));
      setPendingLocation(null);
      router.replace('/location');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Please review the draft.'); }
  };
  const activeRecording = recording.phase === 'recording';
  const unavailable = !config?.configured || configLoading;
  const currentLanguage = config?.languages.find((item) => item.code === language)?.label ?? 'Auto detect';

  return <ScreenContainer className="px-0">
    <View className="px-5"><ScreenHeader title="Report by voice" onBack={() => router.back()} />
      <Stepper steps={['Voice', 'Preview', 'Location', 'Review']} current={preview ? 1 : 0} />
    </View>
    <ScrollView ref={scroll} className="flex-1 px-5" contentContainerClassName="gap-4 pb-8" keyboardShouldPersistTaps="handled">
      {preview ? <VoiceDraftPreview draft={preview} venue={venue}
        onChange={(patch) => setPreview((current) => current ? { ...current, fields: { ...current.fields, ...patch } } : null)}
        onAccept={accept} onDiscard={() => { setPreview(null); setConsent(false); setError(null); }} /> : <>
        <View className="gap-2 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center gap-2"><Mic size={20} color={THEME.light.primary} /><Text className="text-[16px] font-bold">Describe what you observed</Text></View>
          <Text className="text-[13px] leading-5 text-muted-foreground">Say what happened, the venue zone and how urgent it is. Speak in a supported Indian language or English. Mixed-language speech may need extra review.</Text>
          <Text className="text-[12px] font-semibold">{venue.name}</Text>
          <Text className="text-[12px] text-muted-foreground">Up to {MAX_VOICE_SECONDS} seconds. GPS, identities and emergency dispatch are never inferred from your voice.</Text>
        </View>
        {configLoading ? <View className="flex-row items-center gap-2"><ActivityIndicator color={THEME.light.primary} /><Text>Checking voice availability…</Text></View> : null}
        {configError || config?.configured === false ? <View className="gap-3 rounded-2xl bg-[#FFF4D6] p-4">
          <Text className="text-[13px] font-bold">Voice processing is not available yet</Text>
          <Text className="text-[12px] leading-5">{configError ?? 'The server needs its Sarvam API key. The manual report form works without it. No API key belongs in this app.'}</Text>
          <PrimaryButton title="Check again" variant="outline" onPress={() => { void loadConfig(); }} />
        </View> : null}
        {config && <View className="gap-2">
          <Text className="text-[13px] font-bold">Speech language</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Choose speech language" disabled={activeRecording || recording.busy || processing}
            onPress={() => setShowLanguages((value) => !value)} className="min-h-12 flex-row items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
            <Text className="font-semibold">{currentLanguage}</Text><ChevronDown size={18} color={THEME.light.mutedForeground} />
          </Pressable>
          {showLanguages && <ScrollView className="max-h-52 rounded-xl border border-border bg-card" nestedScrollEnabled>
            {config.languages.map((item) => <Pressable key={item.code} accessibilityRole="radio" accessibilityState={{ checked: language === item.code }}
              onPress={() => { setLanguage(item.code); setShowLanguages(false); }} className={cn('min-h-12 justify-center px-4 py-3', language === item.code && 'bg-primary/10')}>
              <Text className="text-[13px]">{item.label}</Text>
            </Pressable>)}
          </ScrollView>}
        </View>}
        <View className="items-center gap-3 rounded-2xl border border-border bg-card p-6">
          {activeRecording ? <Square size={30} color={THEME.light.destructive} /> : <Mic size={30} color={THEME.light.primary} />}
          <Text accessibilityLiveRegion="polite" className="text-[23px] font-bold tabular-nums">{recording.seconds}s / {MAX_VOICE_SECONDS}s</Text>
          <Text className="text-center text-[12px] text-muted-foreground">{activeRecording ? 'Recording… stop when you are finished.' : recording.uri ? 'Recording saved temporarily on this device.' : 'Microphone is off. Start only when you are ready.'}</Text>
        </View>
        <PrimaryButton title={activeRecording ? 'Stop recording' : recording.uri ? 'Record again' : 'Start recording'}
          variant={activeRecording ? 'danger' : 'primary'} loading={recording.busy}
          disabled={processing || unavailable} onPress={() => { setError(null); setConsent(false); setShowLanguages(false); void (activeRecording ? recording.stop() : recording.start()); }} />
        {recording.error && <Text accessibilityRole="alert" className="text-[13px] text-destructive">{recording.error}</Text>}
        {recording.permissionDenied && Platform.OS !== 'web' && <PrimaryButton title="Open microphone settings" variant="outline" onPress={() => { void Linking.openSettings().catch(() => setError('Open your device settings to allow microphone access.')); }} />}
        {recording.uri && <>
          <Playback uri={recording.uri} disabled={processing} />
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: consent, disabled: processing }} disabled={processing}
            onPress={() => setConsent((value) => !value)} className="flex-row items-start gap-3 rounded-2xl border border-border bg-card p-4">
            <View className={cn('mt-0.5 size-6 items-center justify-center rounded-md border', consent ? 'border-primary bg-primary' : 'border-border')}><Text className="font-bold text-white">{consent ? '✓' : ''}</Text></View>
            <Text className="flex-1 text-[12px] leading-5">I agree to send this recording and its transcript to Sarvam AI to create a draft. Avoid unnecessary names or private details. I will review the results before submitting.</Text>
          </Pressable>
          <PrimaryButton title="Process voice & preview" loading={processing} disabled={!consent || unavailable || recording.busy}
            onPress={() => { void processAudio(); }} />
          {processing && <>
            <Text accessibilityLiveRegion="polite" className="text-center text-[12px] text-muted-foreground">Transcribing speech and preparing suggestions… this may take a minute or longer. No report is being submitted.</Text>
            <PrimaryButton title="Cancel processing" variant="outline" onPress={cancelProcessing} />
          </>}
          {!processing && <PrimaryButton title="Discard recording" variant="ghost" onPress={() => { setConsent(false); void recording.clear(); }} />}
        </>}
        <View className="flex-row items-start gap-2"><ShieldCheck size={17} color={THEME.light.primary} /><Text className="flex-1 text-[11px] leading-5 text-muted-foreground">ShaktiOS does not retain the recording on its server. Temporary device audio is removed after processing or leaving this screen. Sarvam's processing and retention policies also apply. This is not an emergency helpline.</Text></View>
        <PrimaryButton title="Use the manual form instead" variant="outline" onPress={() => router.replace('/report')} />
      </>}
      {error && <Text accessibilityRole="alert" className="text-[13px] text-destructive">{error}</Text>}
    </ScrollView>
  </ScreenContainer>;
}
