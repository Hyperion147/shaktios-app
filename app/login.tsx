import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppInput } from '@/src/components/AppInput';
import { useSession } from '@/src/store/session';
import { API_BASE_URL } from '@/src/constants/config';

const DEMO_OTP = '123456';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useSession();
  const [identifier, setIdentifier] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [step, setStep] = React.useState<'identifier' | 'otp'>('identifier');
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const requestOtp = () => {
    setError(null);
    if (identifier.trim().length < 4) {
      setError('Enter a valid phone number or email.');
      return;
    }
    // Backend has no OTP endpoint yet — demo code is 123456.
    setStep('otp');
  };

  const confirm = async () => {
    setError(null);
    if (otp.trim() !== DEMO_OTP) {
      setError('Invalid code. Use demo code 123456.');
      return;
    }
    setBusy(true);
    try {
      await login(identifier.trim());
      router.replace('/(tabs)/home');
    } catch {
      setError('Sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer className="justify-center">
      <View className="gap-2">
        <Text variant="h1" className="text-left">ShaktiOS</Text>
        <Text variant="muted">Citizen reporting — signals for event safety.</Text>
      </View>

      <View className="mt-8 gap-4">
        {step === 'identifier' ? (
          <>
            <AppInput
              label="Phone or email"
              placeholder="+91 98765 43210 or you@mail.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={identifier}
              onChangeText={setIdentifier}
              error={error}
            />
            <Pressable onPress={requestOtp} className="rounded-lg bg-primary py-3.5">
              <Text className="text-center font-semibold text-primary-foreground">Continue</Text>
            </Pressable>
          </>
        ) : (
          <>
            <AppInput
              label={`Code sent to ${identifier}`}
              placeholder="Enter 6-digit code"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              hint="Demo build — use code 123456 (backend OTP pending)."
              error={error}
            />
            <Pressable
              onPress={confirm}
              disabled={busy}
              className="rounded-lg bg-primary py-3.5 disabled:opacity-50">
              <Text className="text-center font-semibold text-primary-foreground">
                {busy ? 'Signing in…' : 'Verify & sign in'}
              </Text>
            </Pressable>
            <Pressable onPress={() => setStep('identifier')}>
              <Text className="text-center text-sm text-muted-foreground">Use a different ID</Text>
            </Pressable>
          </>
        )}
        <Text variant="muted" className="text-center text-xs">
          API: {API_BASE_URL}
        </Text>
      </View>
    </ScreenContainer>
  );
}
