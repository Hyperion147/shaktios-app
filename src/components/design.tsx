import * as React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import {
  AlertTriangle,
  ChevronLeft,
  Eye,
  Flame,
  HeartPulse,
  HelpCircle,
  Info,
  UserSearch,
  Users,
  Wrench,
} from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { THEME } from '@/lib/theme';
import { Text } from '@/components/ui/text';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { IncidentCategoryId } from '@/src/types';

export const BRAND = '#6468F0';
const INK = THEME.light.foreground;

/* ---------------- Brand logo ---------------- */

export { ShaktiLogo } from './shakti-logo';

/* ---------------- Headers ---------------- */

export function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-2 pb-1 pt-2">
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="rounded-full p-1.5 active:opacity-60">
          <ChevronLeft size={24} color={INK} />
        </Pressable>
      ) : null}
      <Text className="flex-1 text-center text-[17px] font-bold tracking-tight">{title}</Text>
      <View className="w-9 items-end">{right}</View>
    </View>
  );
}

/* ---------------- Stepper ---------------- */

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <View className="flex-row items-start justify-center px-2 py-3">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            <View className="w-14 items-center gap-1">
              <View
                className={cn(
                  'h-7 w-7 items-center justify-center rounded-full',
                  active || done ? 'bg-primary' : 'bg-border/60'
                )}>
                <Text
                  className={cn(
                    'text-[13px] font-bold',
                    active || done ? 'text-primary-foreground' : 'text-muted-foreground'
                  )}>
                  {done ? '✓' : i + 1}
                </Text>
              </View>
              <Text
                className={cn(
                  'text-center text-[11px]',
                  active ? 'font-bold text-foreground' : 'text-muted-foreground'
                )}>
                {label}
              </Text>
            </View>
            {i < steps.length - 1 ? (
              <View className="mx-0.5 mt-3.5 h-0.5 flex-1 bg-border/70" />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

/* ---------------- Buttons ---------------- */

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
}) {
  const btnVariant =
    variant === 'primary' ? 'default' : variant === 'danger' ? 'destructive' : variant;
  return (
    <Button
      variant={btnVariant}
      onPress={onPress}
      disabled={disabled || loading}
      className="h-14 rounded-2xl">
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? BRAND : '#fff'} />
      ) : (
        <Text className="text-center text-[15px] font-bold">{title}</Text>
      )}
    </Button>
  );
}

/* ---------------- Category tiles ---------------- */

const CATEGORY_META: Record<IncidentCategoryId, { icon: typeof Flame; bg: string; fg: string }> = {
  crowd: { icon: Users, bg: '#EEEDFF', fg: '#6468F0' },
  medical: { icon: HeartPulse, bg: '#FFE9E9', fg: '#E5484D' },
  fire_smoke: { icon: Flame, bg: '#FFF1E3', fg: '#E8830C' },
  suspicious: { icon: Eye, bg: '#E7F0FF', fg: '#2F6FED' },
  lost_person: { icon: UserSearch, bg: '#E4F5F0', fg: '#12A594' },
  violence: { icon: AlertTriangle, bg: '#FFE9E9', fg: '#E5484D' },
  infrastructure: { icon: Wrench, bg: '#EEEDFF', fg: '#6468F0' },
  other: { icon: HelpCircle, bg: '#EAF0F6', fg: '#5B6B7C' },
};

export function categoryMeta(id: IncidentCategoryId) {
  return CATEGORY_META[id] ?? CATEGORY_META.other;
}

export function CategoryIcon({ id, size = 40 }: { id: IncidentCategoryId; size?: number }) {
  const meta = categoryMeta(id);
  const Icon = meta.icon;
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: meta.bg }}
      className="items-center justify-center">
      <Icon color={meta.fg} size={size * 0.5} />
    </View>
  );
}

export function CategoryTile({
  id,
  label,
  selected,
  onPress,
}: {
  id: IncidentCategoryId;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const meta = categoryMeta(id);
  const Icon = meta.icon;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      className={cn(
        'flex-1 items-center gap-2 rounded-2xl border bg-card px-2 py-4 active:opacity-80',
        selected ? 'border-2 border-primary' : 'border-border'
      )}>
      <View
        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: meta.bg }}
        className="items-center justify-center">
        <Icon color={meta.fg} size={22} />
      </View>
      <Text className="text-center text-[12px] font-semibold leading-4">{label}</Text>
    </Pressable>
  );
}

/* ---------------- Cards & pills ---------------- */

export function InfoNote({ text }: { text: string }) {
  return (
    <Alert icon={Info} className="border-transparent bg-[#EEEDFF]">
      <AlertDescription className="text-[12px] leading-5 text-foreground">{text}</AlertDescription>
    </Alert>
  );
}

const PILL_STYLES: Record<string, { bg: string; fg: string }> = {
  under_review: { bg: '#FFF4D6', fg: '#9A6A00' },
  received: { bg: '#E3F2FF', fg: '#1B6FD0' },
  action_initiated: { bg: '#FFEAD1', fg: '#B25E09' },
  submitted: { bg: '#E3F2FF', fg: '#1B6FD0' },
  resolved: { bg: '#DFF7E8', fg: '#1E7F4D' },
};

export function StatusPill({ status, label }: { status: string; label?: string }) {
  const s = PILL_STYLES[status] ?? PILL_STYLES.received;
  return (
    <Badge style={{ backgroundColor: s.bg }} className="border-transparent px-2.5 py-1">
      <Text style={{ color: s.fg }} className="text-[11px] font-bold">
        {label ?? (status === 'action_initiated' ? 'Operator Responding' : status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()))}
      </Text>
    </Badge>
  );
}

/* ---------------- Error illustration cards (screen 14) ---------------- */

export function ErrorIllustration({
  icon,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-2 rounded-3xl border border-border bg-card px-6 py-10">
      <View className="mb-1 h-16 w-16 items-center justify-center rounded-full bg-[#EEEDFF]">
        {icon}
      </View>
      <Text className="text-center text-[15px] font-bold">{title}</Text>
      <Text variant="muted" className="text-center text-[12px] leading-5">
        {message}
      </Text>
      <Button onPress={onPrimary} className="mt-1 h-12 w-full rounded-xl">
        <Text className="text-[14px] font-bold">{primaryLabel}</Text>
      </Button>
      {secondaryLabel ? (
        <Pressable onPress={onSecondary} className="mt-1 py-1">
          <Text className="text-center text-[13px] text-muted-foreground">{secondaryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
