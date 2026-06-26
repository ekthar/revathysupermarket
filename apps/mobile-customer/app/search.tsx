import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { router, Stack } from "expo-router";
import { api } from "@/services/api";
import { useCartStore } from "@/stores/cart";
import type { Product } from "@msm/shared/types";
import { formatCurrency } from "@msm/shared/utils";

let debounceTimer: ReturnType<typeof setTimeout>;

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { addItem } = useCartStore();

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    clearTimeout(debounceTimer);

    if (text.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    debounceTimer = setTimeout(async () => {
      setIsLoading(true);
      setHasSearched(true);
      try {
        const { data } = await api.get(`/products?search=${encodeURIComponent(text.trim())}`);
        setResults(data.items || data || []);
      } catch {
        setResults([]);
      }
      setIsLoading(false);
    }, 300);
  }, []);

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      discountPrice: product.discountPrice,
      quantity: 1,
      unit: product.unit,
      stock: product.stock,
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-white pt-14">
        {/* Search Header */}
        <View className="px-5 pb-4 flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-3">
            <Text className="text-primary-600 text-base">←</Text>
          </Pressable>
          <View className="flex-1 h-12 bg-slate-50 rounded-xl flex-row items-center px-4 border border-slate-200">
            <Text className="text-slate-400 mr-2">🔍</Text>
            <TextInput
              className="flex-1 text-base text-slate-900"
              placeholder="Search products..."
              placeholderTextColor="#94a3b8"
              value={query}
              onChangeText={handleSearch}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => { setQuery(""); setResults([]); setHasSearched(false); }}>
                <Text className="text-slate-400 text-lg">✕</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Results */}
        {isLoading ? (
          <View className="flex-1 items-center pt-12">
            <ActivityIndicator color="#059669" />
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}
            ListEmptyComponent={
              hasSearched ? (
                <View className="items-center pt-12">
                  <Text className="text-3xl mb-2">🔍</Text>
                  <Text className="text-slate-400 text-sm">
                    No products found for "{query}"
                  </Text>
                </View>
              ) : query.length === 0 ? (
                <View className="items-center pt-12">
                  <Text className="text-3xl mb-2">🛒</Text>
                  <Text className="text-slate-400 text-sm">
                    Search for products, categories...
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/product/${item.id}`)}
                className="flex-row py-4 border-b border-slate-50"
              >
                <View className="w-14 h-14 bg-slate-50 rounded-xl mr-3 overflow-hidden">
                  {item.image ? (
                    <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Text>🛒</Text>
                    </View>
                  )}
                </View>
                <View className="flex-1 justify-center">
                  <Text className="text-sm font-sans-medium text-slate-800" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="text-xs text-slate-400">{item.unit}</Text>
                  <View className="flex-row items-center mt-1">
                    <Text className="text-sm font-sans-bold text-slate-900">
                      {formatCurrency(item.discountPrice || item.price)}
                    </Text>
                    {item.discountPrice && (
                      <Text className="text-xs text-slate-400 line-through ml-2">
                        {formatCurrency(item.price)}
                      </Text>
                    )}
                  </View>
                </View>
                <Pressable
                  onPress={() => handleAddToCart(item)}
                  className="self-center bg-primary-600 w-8 h-8 rounded-lg items-center justify-center"
                >
                  <Text className="text-white text-lg">+</Text>
                </Pressable>
              </Pressable>
            )}
          />
        )}
      </View>
    </>
  );
}
