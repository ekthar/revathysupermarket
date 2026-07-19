import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  RefreshControl,
  Modal,
  TextInput,
  Switch,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Plus, SlidersHorizontal, X } from "lucide-react-native";
import { api } from "@/services/api";
import { useCartStore } from "@/stores/cart";
import type { Product, Category } from "@msm/shared/types";
import { formatCurrency } from "@msm/shared/utils";
import { ErrorState } from "@/components/ui/ErrorState";
import { showToast } from "@/components/ui/Toast";

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: "", label: "Popular" },
  { value: "price_asc", label: "Price \u2191" },
  { value: "price_desc", label: "Price \u2193" },
  { value: "name_asc", label: "A-Z" },
];

export default function CategoriesScreen() {
  const { category: selectedSlug } = useLocalSearchParams<{ category?: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(selectedSlug || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const { addItem } = useCartStore();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Reset and fetch when filters change
    setProducts([]);
    setNextCursor(null);
    setHasMore(true);
    fetchProducts(true);
  }, [activeCategory, sortBy, minPrice, maxPrice, inStockOnly]);

  const buildQueryString = useCallback((cursor?: string | null) => {
    const params = new URLSearchParams();
    if (activeCategory) params.set("category", activeCategory);
    if (sortBy) params.set("sort", sortBy);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (inStockOnly) params.set("inStock", "true");
    params.set("limit", String(PAGE_SIZE));
    if (cursor) params.set("cursor", cursor);
    return `?${params.toString()}`;
  }, [activeCategory, sortBy, minPrice, maxPrice, inStockOnly]);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get("/categories");
      setCategories(data.items || data || []);
    } catch {}
  };

  const fetchProducts = async (isInitial: boolean = false) => {
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const cursor = isInitial ? null : nextCursor;
      const { data } = await api.get(`/products${buildQueryString(cursor)}`);
      const items = data.items || data || [];
      const serverCursor = data.nextCursor || null;

      if (isInitial) {
        setProducts(items);
      } else {
        setProducts((prev) => [...prev, ...items]);
      }

      setNextCursor(serverCursor);
      setHasMore(!!serverCursor && items.length >= PAGE_SIZE);
    } catch {
      setError("Failed to load products. Pull down to retry.");
    }

    setIsLoading(false);
    setIsLoadingMore(false);
  };

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading) {
      fetchProducts(false);
    }
  }, [isLoadingMore, hasMore, isLoading, nextCursor]);

  const onRefresh = useCallback(() => {
    setProducts([]);
    setNextCursor(null);
    setHasMore(true);
    fetchProducts(true);
  }, [buildQueryString]);

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setSortBy("");
    setActiveCategory(null);
  };

  const hasActiveFilters = !!minPrice || !!maxPrice || inStockOnly;

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
    showToast(`${product.name} added to cart`, 'success');
  }, [addItem]);

  const renderProductCard = useCallback(({ item }: { item: Product }) => (
    <Pressable
      className="flex-1 bg-white border border-neutral-100 rounded-xl overflow-hidden"
      onPress={() => router.push(`/product/${item.id}`)}
    >
      <View className="h-28 bg-neutral-50 items-center justify-center">
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Text className="text-2xl">{'\u{1F6D2}'}</Text>
        )}
        {item.discountPrice && (
          <View className="absolute top-2 left-2 bg-primary-900 px-1.5 py-0.5 rounded-full">
            <Text className="text-[9px] font-black text-white">
              {Math.round(((item.price - item.discountPrice) / item.price) * 100)}% OFF
            </Text>
          </View>
        )}
        {item.stock <= 0 && (
          <View className="absolute inset-0 bg-white/80 items-center justify-center">
            <View className="bg-neutral-900/90 px-2 py-0.5 rounded-full">
              <Text className="text-micro font-semibold text-white">Sold out</Text>
            </View>
          </View>
        )}
      </View>
      <View className="p-3">
        <Text className="text-caption font-semibold text-neutral-800" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-micro text-neutral-400">{item.unit}</Text>
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-body font-black text-neutral-900">
            {formatCurrency(item.discountPrice || item.price)}
          </Text>
          <Pressable
            onPress={() => handleAddToCart(item)}
            disabled={item.stock <= 0}
            className={`w-7 h-7 rounded-full items-center justify-center ${item.stock <= 0 ? "bg-neutral-200" : "bg-primary-900"}`}
          >
            <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  ), [handleAddToCart]);

  // Footer component for loading indicator
  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View className="py-6 items-center">
        <ActivityIndicator size="small" color="#050505" />
        <Text className="text-micro text-neutral-400 mt-2 font-medium">Loading more...</Text>
      </View>
    );
  }, [isLoadingMore]);

  if (error && products.length === 0) {
    return <ErrorState message={error} onRetry={onRefresh} />;
  }

  return (
    <View className="flex-1 bg-white pt-14">
      {/* Header */}
      <View className="px-4 pb-3 flex-row items-center justify-between">
        <Text className="text-heading font-bold text-neutral-900">Browse</Text>
        <Pressable
          onPress={() => setFilterVisible(true)}
          className="flex-row items-center"
        >
          <SlidersHorizontal size={18} color={hasActiveFilters ? "#050505" : "#9CA3AF"} strokeWidth={2} />
          {hasActiveFilters && (
            <View className="w-2 h-2 rounded-full bg-primary-900 ml-1" />
          )}
        </Pressable>
      </View>

      {/* Category Chips */}
      <FlatList
        horizontal
        data={[{ id: "all", name: "All", slug: "" } as any, ...categories]}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
        renderItem={({ item }) => {
          const isActive =
            (item.slug === "" && !activeCategory) ||
            item.slug === activeCategory;
          return (
            <Pressable
              onPress={() => setActiveCategory(item.slug || null)}
              className={`px-4 py-2 rounded-full mr-2 ${
                isActive ? "bg-primary-900" : "bg-neutral-100"
              }`}
            >
              <Text
                className={`text-caption font-bold ${
                  isActive ? "text-white" : "text-neutral-600"
                }`}
              >
                {item.name}
              </Text>
            </Pressable>
          );
        }}
      />

      {/* Sort Chips */}
      <FlatList
        horizontal
        data={SORT_OPTIONS}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
        renderItem={({ item }) => {
          const isActive = sortBy === item.value || (!sortBy && item.value === "");
          return (
            <Pressable
              onPress={() => setSortBy(item.value)}
              className={`px-4 py-2 rounded-full mr-2 border ${
                isActive
                  ? "bg-primary-900 border-primary-900"
                  : "bg-white border-neutral-200"
              }`}
            >
              <Text
                className={`text-caption font-bold ${
                  isActive ? "text-white" : "text-neutral-600"
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />

      {/* Products Grid with Infinite Scroll */}
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        columnWrapperStyle={{ gap: 12 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        refreshControl={
          <RefreshControl refreshing={isLoading && products.length === 0} onRefresh={onRefresh} tintColor="#050505" />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !isLoading ? (
            <View className="py-16 items-center">
              <Text className="text-3xl mb-2">{'\uD83D\uDCE6'}</Text>
              <Text className="text-neutral-400 text-caption font-medium">No products found</Text>
              {hasActiveFilters && (
                <Pressable onPress={clearFilters} className="mt-3 px-4 py-2 rounded-full bg-neutral-100">
                  <Text className="text-caption font-bold text-neutral-600">Clear filters</Text>
                </Pressable>
              )}
            </View>
          ) : null
        }
        renderItem={renderProductCard}
      />

      {/* Filter Modal */}
      <Modal
        visible={filterVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setFilterVisible(false)}>
          <View className="flex-1 bg-black/40" />
        </TouchableWithoutFeedback>
        <View className="bg-white rounded-t-2xl px-6 pb-8 pt-6">
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-heading font-bold text-neutral-900">Filters</Text>
            <Pressable onPress={() => setFilterVisible(false)}>
              <X size={22} color="#050505" strokeWidth={2} />
            </Pressable>
          </View>

          <Text className="text-caption font-bold text-neutral-700 mb-3">Price Range</Text>
          <View className="flex-row items-center gap-3 mb-5">
            <TextInput
              placeholder="Min"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={minPrice}
              onChangeText={setMinPrice}
              className="flex-1 h-11 rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-body text-neutral-900 font-medium"
            />
            <Text className="text-neutral-400 text-caption">{'\u2014'}</Text>
            <TextInput
              placeholder="Max"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={maxPrice}
              onChangeText={setMaxPrice}
              className="flex-1 h-11 rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-body text-neutral-900 font-medium"
            />
          </View>

          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-caption font-bold text-neutral-700">In stock only</Text>
            <Switch
              value={inStockOnly}
              onValueChange={setInStockOnly}
              trackColor={{ false: "#E5E7EB", true: "#050505" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => {
                clearFilters();
                setFilterVisible(false);
              }}
              className="flex-1 h-11 rounded-xl border border-neutral-200 items-center justify-center"
            >
              <Text className="text-caption font-bold text-neutral-600">Clear all</Text>
            </Pressable>
            <Pressable
              onPress={() => setFilterVisible(false)}
              className="flex-1 h-11 rounded-xl bg-primary-900 items-center justify-center"
            >
              <Text className="text-caption font-bold text-white">Apply</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
