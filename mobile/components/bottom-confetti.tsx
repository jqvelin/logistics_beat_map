import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { palette } from '@/constants/theme';

const COLORS = [
  palette.purple,
  palette.orange,
  palette.cyan,
  palette.green,
  palette.pink,
  palette.yellow,
] as const;

const COUNT = 40;

type PieceConfig = {
  id: number;
  startX: number;
  delay: number;
  destY: number;
  destX: number;
  spin: number;
  color: string;
  w: number;
  h: number;
};

type PieceProps = PieceConfig;

function Piece({
  startX,
  delay,
  destY,
  destX,
  spin,
  color,
  w,
  h,
}: PieceProps) {
  const ty = useSharedValue(0);
  const tx = useSharedValue(0);
  const rot = useSharedValue(0);
  const op = useSharedValue(1);

  /* eslint-disable react-hooks/exhaustive-deps -- shared values (ty, tx, rot, op) are stable refs */
  useEffect(() => {
    const dur = 820 + Math.random() * 280;
    ty.value = withDelay(
      delay,
      withTiming(destY, {
        duration: dur,
        easing: Easing.bezier(0.22, 0.8, 0.28, 1),
      }),
    );
    tx.value = withDelay(
      delay,
      withTiming(destX, {
        duration: dur,
        easing: Easing.out(Easing.quad),
      }),
    );
    rot.value = withDelay(delay, withTiming(spin, { duration: dur + 120 }));
    op.value = withDelay(delay + 480, withTiming(0, { duration: 420 }));
  }, [delay, destX, destY, spin]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const aStyle = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rot.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 0,
          left: startX,
          width: w,
          height: h,
          marginLeft: -w / 2,
          backgroundColor: color,
          borderRadius: 2,
        },
        aStyle,
      ]}
    />
  );
}

/**
 * Burst from a single point at the bottom center; pieces fan across the screen width.
 * Confined to a short band above the bottom edge (not full-screen height).
 * Does not capture touches. Unmount between bursts so each correct answer replays.
 */
export function BottomConfetti() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const zoneHeight = Math.min(240, Math.max(160, windowHeight * 0.32));

  const pieces = useMemo((): PieceConfig[] => {
    const originX = windowWidth / 2;
    const halfSpread = (windowWidth * 0.46) / 2;
    return Array.from({ length: COUNT }, (_, i) => {
      const w = 5 + Math.random() * 5;
      const h = 6 + Math.random() * 8;
      const t = COUNT > 1 ? i / (COUNT - 1) : 0.5;
      const fanX = (t - 0.5) * 2 * halfSpread;
      const jitter = (Math.random() - 0.5) * 10;
      return {
        id: i,
        startX: originX,
        delay: Math.floor(Math.min(i * 3, 90) + Math.random() * 45),
        destY: -(78 + Math.random() * (zoneHeight * 0.52)),
        destX: fanX + jitter,
        spin: 160 + Math.random() * 560 * (Math.random() > 0.5 ? 1 : -1),
        color: COLORS[i % COLORS.length],
        w,
        h,
      };
    });
  }, [windowWidth, zoneHeight]);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.zone,
        {
          height: zoneHeight,
          bottom: 0,
          width: windowWidth,
        },
      ]}>
      {pieces.map((p) => (
        <Piece key={p.id} {...p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 4,
    overflow: 'visible',
  },
});
