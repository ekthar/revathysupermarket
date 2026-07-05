import { useEffect, useRef, useState } from 'react';
import { Animated, Text, View, useWindowDimensions } from 'react-native';

type ToastType = 'success' | 'error' | 'info';

let showToastFn: (message: string, type: ToastType) => void = () => {};

export function showToast(message: string, type: ToastType = 'info') {
  showToastFn(message, type);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');

  useEffect(() => {
    showToastFn = (msg, t) => {
      setMessage(msg);
      setType(t);
      setVisible(true);
      Animated.parallel([
        Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      ]).start();
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
        ]).start(() => setVisible(false));
      }, 3000);
    };
  }, []);

  const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-neutral-800';

  return (
    <View style={{ flex: 1 }}>
      {children}
      {visible && (
        <Animated.View
          className={`absolute top-12 left-4 right-4 z-50 ${bgColor} rounded-2xl px-5 py-3.5 shadow-xl`}
          style={{ opacity, transform: [{ translateY }] }}
        >
          <Text className="text-white text-body font-semibold text-center">{message}</Text>
        </Animated.View>
      )}
    </View>
  );
}
