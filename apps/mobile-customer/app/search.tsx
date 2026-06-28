import { useState, useCallback, memo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Image,
} from "react-native";
import { router, Stack } from "expo-router";
import { ArrowLeft, Search, X, Plus, ShoppingBag } from "lucide-react-native";
import { api } from "@/services/api";
import { useCartStore } from "@/stores/cart";
import type { Product } from "@msm/shared/types";
import { formatCurrency } from "@msm/shared/utils";
import { Skeleton } from "@/components/ui/Skeleton";

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

  const handleAddToCart = useCallback((product: Product) => {
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
  }, [addItem]);

  const renderItem = useCallback(({ item }: { item: Product }) => (
    <Pressable
      onPress={() => router.push(`/product/${item.id}`)}
      className="flex-row py-4 border-b border-neutral-50"
    >
      <View className="w-14 h-14 bg-neutral-50 rounded-xl mr-3 overflow-hidden items-center justify-center">
        {item.image ? (
          <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <ShoppingBag size={16} color="#9CA3AF" />
        )}
      </View>
      <View className="flex-1 justify-center">
        <Text className="text-body font-semibold text-neutral-800" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-micro text-neutral-400">{item.unit}</Text>
        <View className="flex-row items-center mt-1">
          <Text className="text-body font-black text-neutral-900">
            {formatCurrency(item.discountPrice || item.price)}
          </Text>
          {item.discountPrice && (
            <Text className="text-micro text-neutral-400 line-through ml-2">
              {formatCurrency(item.price)}
            </Text>
          )}
        </View>
      </View>
      <Pressable
        onPress={() => handleAddToCart(item)}
        className="self-center h-8 w-8 rounded-full bg-primary-900 items-center justify-center"
      >
        <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
      </Pressable>
    </Pressable>
  ), [handleAddToCart]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-white pt-14">
        {/* Search Header */}
        <View className="px-4 pb-4 flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="mr-3 h-9 w-9 rounded-full bg-neutral-100 items-center justify-center"
          >
            <ArrowLeft size={16} color="#374151" />
          </Pressable>
          <View className="flex-1 h-12 bg-neutral-50 rounded-xl flex-row items-center px-4 border border-neutral-200">
            <Search size={16} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-body text-neutral-900 font-medium"
              placeholder="Search products..."
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={handleSearch}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => { setQuery(""); setResults([]); setHasSearched(false); }}>
                <X size={16} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Results */}
        {isLoading ? (
          <View className="px-4 pt-4">
            {[1, 2, 3, 4].map((i) => (
              <View key={i} className="flex-row py-4 border-b border-neutral-50">
                <Skeleton height={56} width={56} borderRadius={12} />
                <View className="flex-1 ml-3 justify-center">
                  <Skeleton height={14} width="70%" />
                  <View className="mt-2"><Skeleton height={12} width="40%" /></View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              hasSearched ? (
                <View className="items-center pt-16">
                  <Search size={32} color="#D1D5DB" />
                  <Text className="text-neutral-400 text-body mt-3">
                    No products found for "{query}"
                  </Text>
                </View>
              ) : query.length === 0 ? (
                <View className="items-center pt-16">
                  <ShoppingBag size={32} color="#D1D5DB" />
                  <Text className="text-neutral-400 text-body mt-3">
                    Search for products, categories...
                  </Text>
                </View>
              ) : null
            }
            renderItem={renderItem}
          />
        )}
      </View>
    </>
  );
}
