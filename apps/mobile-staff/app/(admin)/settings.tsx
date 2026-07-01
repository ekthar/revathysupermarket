import { useEffect, useState } from "react";
import { View, Text, ScrollView, Switch, TextInput, ActivityIndicator, Alert } from "react-native";
import { api } from "@/services/api";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedFadeIn } from "@/components/AnimatedFadeIn";

interface Flag {
  key: string;
  enabled: boolean;
  config: Record<string, any> | null;
}

const FLAG_LABELS: Record<string, { label: string; desc: string }> = {
  stock_value_visible: { label: "Stock Value Visible", desc: "Show inventory valuation on dashboard" },
  forced_accept_delivery: { label: "Forced Accept Delivery", desc: "Auto-assign orders without choice" },
  ring_alert_rules: { label: "Ring Alert Rules", desc: "Ringtone/duration for incoming alerts" },
  print_required_alert: { label: "Print Required Alert", desc: "Alert when orders are unprinted" },
};

export default function AdminSettingsScreen() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/feature-flags").then(({ data }) => {
      setFlags(data.flags ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function toggleFlag(key: string, enabled: boolean) {
    try {
      await api.put("/feature-flags", { key, enabled });
      setFlags((prev) => prev.map((f) => f.key === key ? { ...f, enabled } : f));
    } catch {
      Alert.alert("Error", "Failed to update flag");
    }
  }

  async function updateConfig(key: string, config: Record<string, any>) {
    try {
      await api.put("/feature-flags", { key, config });
      setFlags((prev) => prev.map((f) => f.key === key ? { ...f, config } : f));
    } catch {
      Alert.alert("Error", "Failed to update config");
    }
  }

  if (loading) {
    return <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950"><ActivityIndicator size="large" color="#059669" /></View>;
  }

  return (
    <AnimatedScreen className="flex-1 bg-white dark:bg-slate-950">
      <ScrollView className="flex-1 bg-white dark:bg-slate-950" contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white pt-10 mb-6">Feature Flags</Text>

        {flags.map((flag, i) => {
          const meta = FLAG_LABELS[flag.key] ?? { label: flag.key, desc: "" };
          return (
            <AnimatedFadeIn key={flag.key} index={Math.min(i, 8)}>
              <View className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-3">
                <View className="flex-row justify-between items-center">
                  <View className="flex-1 mr-3">
                    <Text className="text-sm font-bold text-slate-900 dark:text-white">{meta.label}</Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{meta.desc}</Text>
                  </View>
                  <Switch
                    value={flag.enabled}
                    onValueChange={(v) => toggleFlag(flag.key, v)}
                    trackColor={{ true: "#059669", false: "#e2e8f0" }}
                    thumbColor="white"
                  />
                </View>

                {/* Print threshold config */}
                {flag.key === "print_required_alert" && flag.config && (
                  <View className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Text className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Threshold (minutes)</Text>
                    <TextInput
                      className="h-10 border border-slate-200 dark:border-slate-700 rounded-xl px-3 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                      keyboardType="number-pad"
                      placeholderTextColor="#94a3b8"
                      defaultValue={String(flag.config.thresholdMinutes ?? 10)}
                      onEndEditing={(e) => {
                        const val = Math.max(1, Number(e.nativeEvent.text) || 10);
                        updateConfig(flag.key, { thresholdMinutes: val });
                      }}
                    />
                  </View>
                )}

                {/* Ring alert config */}
                {flag.key === "ring_alert_rules" && flag.config && (
                  <View className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
                    <ConfigRow label="Duration (sec)" value={String(flag.config.durationSeconds ?? 30)} onSave={(v) => updateConfig(flag.key, { ...flag.config, durationSeconds: Number(v) || 30 })} />
                    <ConfigRow label="Escalation (sec)" value={String(flag.config.escalationAfterSeconds ?? 60)} onSave={(v) => updateConfig(flag.key, { ...flag.config, escalationAfterSeconds: Number(v) || 60 })} />
                  </View>
                )}
              </View>
            </AnimatedFadeIn>
          );
        })}
      </ScrollView>
    </AnimatedScreen>
  );
}

function ConfigRow({ label, value, onSave }: { label: string; value: string; onSave: (v: string) => void }) {
  return (
    <View className="flex-row items-center gap-2">
      <Text className="text-xs text-slate-600 dark:text-slate-300 flex-1">{label}</Text>
      <TextInput
        className="h-8 w-20 border border-slate-200 dark:border-slate-700 rounded-lg px-2 bg-slate-50 dark:bg-slate-900 text-xs text-center text-slate-900 dark:text-white"
        keyboardType="number-pad"
        placeholderTextColor="#94a3b8"
        defaultValue={value}
        onEndEditing={(e) => onSave(e.nativeEvent.text)}
      />
    </View>
  );
}
