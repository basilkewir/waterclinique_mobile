import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface WaterQualityRingProps {
  score: number;
  size?: number;
  label?: string;
  color?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#00B4D8';
  if (score >= 40) return '#eab308';
  if (score >= 20) return '#f97316';
  return '#ef4444';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Critical';
}

export default function WaterQualityRing({
  score,
  size = 100,
  label,
  color,
}: WaterQualityRingProps) {
  const effectiveColor = color || getScoreColor(score);
  const innerSize = size - 12;
  const pct = Math.max(0, Math.min(100, score));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.outerRing, { width: size, height: size, borderRadius: size / 2, borderColor: effectiveColor + '30' }]}>
        <View style={[styles.pie, { width: size, height: size, borderRadius: size / 2 }]}>
          <View style={[styles.fill, { width: size, height: size, borderRadius: size / 2, borderColor: effectiveColor }]}>
            <View style={[styles.innerCircle, { width: innerSize, height: innerSize, borderRadius: innerSize / 2, backgroundColor: '#fff' }]}>
              <Text style={[styles.scoreText, { color: effectiveColor }]}>{pct}</Text>
              <Text style={styles.scoreLabel}>{label || getScoreLabel(pct)}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pie: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  scoreText: {
    fontSize: 22,
    fontWeight: '900',
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
});
