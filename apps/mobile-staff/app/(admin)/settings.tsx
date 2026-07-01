import { useEffect, useState } from "react";
import { View, Text, ScrollView, Switch, TextInput, ActivityIndicator, Alert } from "react-native";
import { api } from "@/services/api";

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
    return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator size="large" color="#059669" /></View>;
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 20 }}>
      <Text className="text-2xl font-bold text-slate-900 pt-10 mb-6">Feature Flags</Text>

      {flags.map((flag) => {
        const meta = FLAG_LABELS[flag.key] ?? { label: flag.key, desc: "" };
        return (
          <View key={flag.key} className="border border-slate-200 rounded-2xl p-4 mb-3">
            <View className="flex-row justify-between items-center">
              <View className="flex-1 mr-3">
                <Text className="text-sm font-bold text-slate-900">{meta.label}</Text>
                <Text className="text-xs text-slate-500 mt-0.5">{meta.desc}</Text>
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
              <View className="mt-3 pt-3 border-t border-slate-100">
                <Text className="text-xs font-bold text-slate-600 mb-1">Threshold (minutes)</Text>
                <TextInput
                  className="h-10 border border-slate-200 rounded-xl px-3 bg-slate-50 text-sm"
                  keyboardType="number-pad"
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
              <View className="mt-3 pt-3 border-t border-slate-100 gap-2">
                <ConfigRow label="Duration (sec)" value={String(flag.config.durationSeconds ?? 30)} onSave={(v) => updateConfig(flag.key, { ...flag.config, durationSeconds: Number(v) || 30 })} />
                <ConfigRow label="Escalation (sec)" value={String(flag.config.escalationAfterSeconds ?? 60)} onSave={(v) => updateConfig(flag.key, { ...flag.config, escalationAfterSeconds: Number(v) || 60 })} />
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

function ConfigRow({ label, value, onSave }: { label: string; value: string; onSave: (v: string) => void }) {
  return (
    <View className="flex-row items-center gap-2">
      <Text className="text-xs text-slate-600 flex-1">{label}</Text>
      <TextInput
        className="h-8 w-20 border border-slate-200 rounded-lg px-2 bg-slate-50 text-xs text-center"
        keyboardType="number-pad"
        defaultValue={value}
        onEndEditing={(e) => onSave(e.nativeEvent.text)}
      />
    </View>
  );
}
