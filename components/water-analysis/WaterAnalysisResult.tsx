import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaCard } from '@/components/ui/AquaComponents';
import { AquaColors, Spacing, BorderRadius } from '@/constants/theme-constants';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SimpleIndicator {
  label: string;
  color: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface UserFriendlyResult {
  status: string;
  safety_level: string;
  icon?: string;
  color: string;
  bg_color: string;
  text_color: string;
  one_line_advice: string;
  risk_score: number;
  risk_percentage?: number;
  confidence: number;
  indicators: SimpleIndicator[];
  boil_required: boolean;
}

export interface DetailedResult {
  safety_level: string;
  risk_score: number;
  confidence_score: number;
  safety_verdict: string;
  primary_concerns: string[];
  visual_assessment: {
    clarity: string;
    color: string;
    particles: boolean;
    particle_description?: string;
    surface_condition: string;
  };
  six_dimensions: Record<string, any>;
  contamination_analysis: {
    bacterial_risk: string;
    chemical_signs: boolean;
    physical_contamination: boolean;
    health_implications?: string[];
  };
  recommendations: {
    immediate_actions: string[];
    treatment_methods: string[];
    boiling_required: boolean;
    long_term_solutions?: string[];
  };
  community_guidance: {
    warning_signs: string[];
    preventive_measures: string[];
  };
  ai_provider: string;
  ai_model: string;
}

interface WaterAnalysisResultProps {
  result: UserFriendlyResult;
  detailed?: DetailedResult;
  onRetake: () => void;
  onSave?: () => void;
  readingId?: number | null;
}

// ── Gradient colour pairs per status ─────────────────────────────────────────

const GRADIENT_COLOURS: Record<string, [string, string]> = {
  Safe:      ['#22c55e', '#16a34a'],
  Caution:   ['#eab308', '#ca8a04'],
  Unsafe:    ['#f97316', '#ea580c'],
  Dangerous: ['#ef4444', '#dc2626'],
};

const STATUS_ICONS: Record<string, string> = {
  Safe:      'checkmark.seal.fill',
  Caution:   'exclamationmark.triangle.fill',
  Unsafe:    'xmark.octagon.fill',
  Dangerous: 'exclamationmark.octagon.fill',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function WaterAnalysisResult({
  result,
  detailed,
  onRetake,
  onSave,
  readingId,
}: WaterAnalysisResultProps) {
  const [showDetails, setShowDetails] = useState(false);

  const gradientColors = GRADIENT_COLOURS[result.status] ?? ['#6b7280', '#4b5563'];
  const statusIcon     = STATUS_ICONS[result.status] ?? 'exclamationmark.triangle.fill';
  const dims           = detailed?.six_dimensions;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Verdict header */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {result.icon ? (
          <Text style={styles.headerEmoji}>{result.icon}</Text>
        ) : (
          <IconSymbol name={statusIcon as any} size={56} color="rgba(255,255,255,0.95)" />
        )}
        <Text style={styles.statusText}>{result.status.toUpperCase()}</Text>
        <Text style={styles.adviceText}>{result.one_line_advice}</Text>

        {/* Risk bar */}
        <View style={styles.riskBarOuter}>
          <View style={[styles.riskBarInner, { width: `${result.risk_score}%` as any }]} />
        </View>
        <Text style={styles.riskLabel}>Risk: {result.risk_score}/100 · {result.confidence}% confidence</Text>
      </LinearGradient>

      {/* Boil alert */}
      {result.boil_required && (
        <View style={styles.boilAlert}>
          <IconSymbol name="flame.fill" size={18} color="#dc2626" />
          <Text style={styles.boilText}>Boil water for at least 1 minute before drinking</Text>
        </View>
      )}

      {/* Indicators */}
      {result.indicators.length > 0 && (
        <AquaCard style={styles.section}>
          <Text style={styles.sectionTitle}>What we found</Text>
          {result.indicators.map((ind, i) => (
            <View key={i} style={styles.indicatorRow}>
              <View style={[styles.indicatorBar, { backgroundColor: ind.color }]} />
              <Text style={styles.indicatorLabel}>{ind.label}</Text>
              <View style={[styles.severityBadge, { backgroundColor: ind.color + '22' }]}>
                <Text style={[styles.severityText, { color: ind.color }]}>
                  {ind.severity.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </AquaCard>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.retakeBtn} onPress={onRetake}>
          <IconSymbol name="camera.fill" size={18} color={AquaColors.aquaDeep} />
          <Text style={styles.retakeBtnText}>New Test</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reportBtn}
          onPress={() => Linking.openURL('https://watercliniq.com/contact')}
        >
          <IconSymbol name="cross.case.fill" size={18} color="#fff" />
          <Text style={styles.reportBtnText}>Water Cliniq</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.learnMoreBtn}
          onPress={() => Linking.openURL('https://watercliniq.com/water-quality-guide')}
        >
          <IconSymbol name="book.fill" size={18} color={AquaColors.primary} />
          <Text style={styles.learnMoreBtnText}>Learn More</Text>
        </TouchableOpacity>
      </View>

      {/* Report Issue */}
      <TouchableOpacity
        style={styles.issueReportBtn}
        onPress={() => Linking.openURL('https://watercliniq.com/report-water-issue')}
      >
        <IconSymbol name="exclamationmark.bubble.fill" size={16} color="#dc2626" />
        <Text style={styles.issueReportText}>Report a water quality issue in your area</Text>
      </TouchableOpacity>

      {/* Save button */}
      {onSave && (
        <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
          <IconSymbol name="square.and.arrow.down.fill" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>Save Result{readingId ? ` #${readingId}` : ''}</Text>
        </TouchableOpacity>
      )}

      {/* Expand / collapse details */}
      {detailed && (
        <>
          <TouchableOpacity
            style={styles.expandToggle}
            onPress={() => setShowDetails(v => !v)}
          >
            <Text style={styles.expandToggleText}>
              {showDetails ? 'Hide technical details' : 'See technical details'}
            </Text>
            <IconSymbol
              name={showDetails ? 'chevron.up' : 'chevron.down'}
              size={14}
              color={AquaColors.primary}
            />
          </TouchableOpacity>

          {showDetails && (
            <View>
              {/* 6-Dimension scores */}
              {dims && Object.keys(dims).length > 0 && (
                <AquaCard style={styles.section}>
                  <Text style={styles.sectionTitle}>6-Dimension Assessment</Text>
                  {[
                    ['Colour',       'colour_score',        'colour_detail'],
                    ['Clarity',      'clarity_score',       'clarity_detail'],
                    ['Particles',    'particles_score',     'particles_detail'],
                    ['Rust',         'rust_score',          'rust_detail'],
                    ['Contamination','contamination_score', 'contamination_detail'],
                    ['WHO Compliance','who_compliance_score','who_compliance_detail'],
                  ].map(([label, scoreKey, detailKey]) => {
                    const score = dims[scoreKey] ?? 0;
                    const barColor = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : score >= 25 ? '#f97316' : '#ef4444';
                    return (
                      <View key={scoreKey} style={styles.dimRow}>
                        <View style={styles.dimHeader}>
                          <Text style={styles.dimLabel}>{label}</Text>
                          <Text style={[styles.dimScore, { color: barColor }]}>{score}/100</Text>
                        </View>
                        <View style={styles.dimBarOuter}>
                          <View style={[styles.dimBarFill, { width: `${score}%` as any, backgroundColor: barColor }]} />
                        </View>
                        {dims[detailKey] ? (
                          <Text style={styles.dimDetail}>{dims[detailKey]}</Text>
                        ) : null}
                      </View>
                    );
                  })}
                </AquaCard>
              )}

              {/* Visual assessment */}
              <AquaCard style={styles.section}>
                <Text style={styles.sectionTitle}>Visual Assessment</Text>
                {[
                  { label: 'Clarity',   value: detailed.visual_assessment.clarity },
                  { label: 'Colour',    value: detailed.visual_assessment.color },
                  { label: 'Particles', value: detailed.visual_assessment.particles ? (detailed.visual_assessment.particle_description || 'Detected') : 'None' },
                  { label: 'Surface',   value: detailed.visual_assessment.surface_condition },
                ].map(({ label, value }) => (
                  <View key={label} style={styles.metaRow}>
                    <Text style={styles.metaLabel}>{label}</Text>
                    <Text style={styles.metaValue}>{value || '—'}</Text>
                  </View>
                ))}
              </AquaCard>

              {/* Immediate actions */}
              {detailed.recommendations.immediate_actions.length > 0 && (
                <AquaCard style={styles.section}>
                  <Text style={styles.sectionTitle}>Recommended Actions</Text>
                  {detailed.recommendations.immediate_actions.map((action, i) => (
                    <View key={i} style={styles.actionRow}>
                      <View style={[styles.actionNum, { backgroundColor: gradientColors[0] }]}>
                        <Text style={styles.actionNumText}>{i + 1}</Text>
                      </View>
                      <Text style={styles.actionText}>{action}</Text>
                    </View>
                  ))}
                </AquaCard>
              )}

              {/* Health implications */}
              {(detailed.contamination_analysis.health_implications ?? []).length > 0 && (
                <AquaCard style={styles.section}>
                  <Text style={styles.sectionTitle}>Possible Health Risks</Text>
                  {detailed.contamination_analysis.health_implications!.map((h, i) => (
                    <Text key={i} style={styles.healthItem}>- {h}</Text>
                  ))}
                </AquaCard>
              )}

              {/* AI metadata */}
              <Text style={styles.metaFooter}>
                {detailed.ai_provider} / {detailed.ai_model} · {detailed.confidence_score}% confidence
              </Text>
            </View>
          )}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },

  header: {
    padding: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 8,
  },
  statusText: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  adviceText: { fontSize: 15, color: 'rgba(255,255,255,0.93)', textAlign: 'center', lineHeight: 22 },
  riskBarOuter: { width: '75%', height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden', marginTop: 8 },
  riskBarInner: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
  headerEmoji: { fontSize: 56, marginBottom: 8 },
  riskLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  boilAlert: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
    borderRadius: 12, padding: 14, margin: 16, marginBottom: 0,
  },
  boilText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#dc2626' },

  section: { padding: Spacing.md, marginHorizontal: 16, marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },

  indicatorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  indicatorBar: { width: 4, height: 36, borderRadius: 2 },
  indicatorLabel: { flex: 1, fontSize: 14, color: '#374151' },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  severityText: { fontSize: 11, fontWeight: '700' },

  actionsRow: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 0 },
  retakeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#fff', padding: 12, borderRadius: 14,
    borderWidth: 1.5, borderColor: AquaColors.aquaDeep,
  },
  retakeBtnText: { fontSize: 13, fontWeight: '600', color: AquaColors.aquaDeep },
  reportBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#1d4ed8', padding: 12, borderRadius: 14,
  },
  reportBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  learnMoreBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#fff', padding: 12, borderRadius: 14,
    borderWidth: 1.5, borderColor: AquaColors.primary,
  },
  learnMoreBtnText: { fontSize: 13, fontWeight: '600', color: AquaColors.primary },

  issueReportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: 12, marginHorizontal: 16, marginTop: 8,
    borderRadius: 10, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
  },
  issueReportText: { fontSize: 13, fontWeight: '600', color: '#dc2626' },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: AquaColors.aquaDeep, margin: 16, marginTop: 12,
    padding: 14, borderRadius: 14,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  expandToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14,
  },
  expandToggleText: { fontSize: 14, fontWeight: '600', color: AquaColors.primary },

  dimRow: { marginBottom: 12 },
  dimHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  dimLabel: { fontSize: 13, fontWeight: '600', color: '#1f2937' },
  dimScore: { fontSize: 13, fontWeight: '700' },
  dimBarOuter: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  dimBarFill: { height: '100%', borderRadius: 3 },
  dimDetail: { fontSize: 11, color: '#6b7280', marginTop: 2, lineHeight: 16 },

  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  metaLabel: { fontSize: 13, color: '#6b7280' },
  metaValue: { fontSize: 13, fontWeight: '600', color: '#1f2937', textTransform: 'capitalize' },

  actionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  actionNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionNumText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  actionText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },

  healthItem: { fontSize: 13, color: '#b91c1c', lineHeight: 20, marginBottom: 4 },

  metaFooter: { textAlign: 'center', fontSize: 11, color: '#9ca3af', marginVertical: 8 },
});
