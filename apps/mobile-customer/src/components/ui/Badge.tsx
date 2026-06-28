import { View, Text } from "react-native";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "secondary";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

const variantClasses: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: "bg-neutral-100", text: "text-neutral-700" },
  success: { bg: "bg-success-50", text: "text-success-700" },
  warning: { bg: "bg-warning-50", text: "text-warning-700" },
  error: { bg: "bg-error-50", text: "text-error-700" },
  info: { bg: "bg-info-50", text: "text-info-700" },
  secondary: { bg: "bg-secondary-50", text: "text-secondary-700" },
};

export function Badge({ children, variant = "default", size = "sm" }: BadgeProps) {
  const { bg, text } = variantClasses[variant];
  const sizeClass = size === "sm" ? "px-2 py-0.5" : "px-3 py-1";

  return (
    <View className={`${bg} ${sizeClass} rounded-full`}>
      <Text className={`${text} text-micro font-bold`}>{children}</Text>
    </View>
  );
}
