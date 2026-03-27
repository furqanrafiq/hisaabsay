import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';

export interface DonutSlice {
  value: number;
  color: string;
  label: string;
}

interface Props {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polarToCartesian(cx, cy, r, endDeg);
  const end = polarToCartesian(cx, cy, r, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

export function DonutChart({ slices, size = 180, thickness = 32, centerLabel, centerSub }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const total = slices.reduce((s, sl) => s + sl.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;

  if (total === 0) {
    return (
      <View style={[styles.wrap, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={r} stroke={Colors.border} strokeWidth={thickness} fill="none" />
        </Svg>
        <View style={styles.center}>
          <Text style={styles.centerLabel}>No data</Text>
        </View>
      </View>
    );
  }

  const validSlices = slices.filter((sl) => sl.value > 0);

  let currentDeg = 0;
  const paths = validSlices.map((sl, i) => {
    const sweep = (sl.value / total) * 358;
    const path = arcPath(cx, cy, r, currentDeg, currentDeg + sweep);
    currentDeg += sweep + 1;

    const isSelected = selectedIndex === i;
    const dimmed = selectedIndex !== null && !isSelected;

    return (
      <Path
        key={i}
        d={path}
        stroke={sl.color}
        strokeWidth={isSelected ? thickness + 6 : thickness}
        fill="none"
        strokeLinecap="round"
        opacity={dimmed ? 0.3 : 1}
        onPress={() => setSelectedIndex(isSelected ? null : i)}
      />
    );
  });

  const selected = selectedIndex !== null ? validSlices[selectedIndex] : null;
  const pct = selected ? Math.round((selected.value / total) * 100) : null;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>{paths}</Svg>

      {/* Tapping the center deselects */}
      <TouchableWithoutFeedback onPress={() => setSelectedIndex(null)}>
        <View style={[styles.center, { width: (r - thickness / 2) * 2, height: (r - thickness / 2) * 2, borderRadius: r }]}>
          {selected ? (
            <>
              <View style={[styles.dot, { backgroundColor: selected.color }]} />
              <Text style={[styles.selectedLabel, { color: selected.color }]} numberOfLines={2}>
                {selected.label}
              </Text>
              <Text style={styles.selectedPct}>{pct}%</Text>
            </>
          ) : (
            <>
              {centerLabel && <Text style={styles.centerLabel}>{centerLabel}</Text>}
              {centerSub && <Text style={styles.centerSub}>{centerSub}</Text>}
            </>
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center', padding: 4 },
  centerLabel: { fontSize: Theme.fontSize.md, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3, textAlign: 'center' },
  centerSub: { fontSize: Theme.fontSize.xs, color: Colors.textTertiary, marginTop: 2, textAlign: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  selectedLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center', lineHeight: 14 },
  selectedPct: { fontSize: Theme.fontSize.md, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
});
