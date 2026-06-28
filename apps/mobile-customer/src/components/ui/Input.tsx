import { forwardRef, useState } from "react";
import {
  View,
  TextInput,
  Text,
  type TextInputProps,
} from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, icon, iconRight, className, ...props },
  ref
) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? "border-error-500"
    : focused
    ? "border-neutral-900"
    : "border-neutral-200";

  return (
    <View className={className}>
      {label && (
        <Text className="text-caption font-bold text-neutral-700 mb-1.5">
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center h-12 rounded-xl border ${borderColor} bg-neutral-50 px-4`}
      >
        {icon && <View className="mr-3">{icon}</View>}
        <TextInput
          ref={ref}
          placeholderTextColor="#9CA3AF"
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          className="flex-1 text-body text-neutral-900 font-medium"
          {...props}
        />
        {iconRight && <View className="ml-3">{iconRight}</View>}
      </View>
      {error && (
        <Text className="text-micro text-error-500 mt-1 font-medium">
          {error}
        </Text>
      )}
      {hint && !error && (
        <Text className="text-micro text-neutral-400 mt-1">{hint}</Text>
      )}
    </View>
  );
});
