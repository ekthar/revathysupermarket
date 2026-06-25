import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:msm_mobile/features/products/domain/product_model.dart'
    as models;
import 'package:msm_mobile/features/products/domain/product_model.dart'
    show Category, Product;
import 'package:msm_mobile/features/products/presentation/home_screen.dart';
import 'package:msm_mobile/features/products/providers/products_provider.dart';

void main() {
  group('HomeScreen', () {
    const testCategories = [
      Category(
        id: 'cat-1',
        name: 'Fruits',
        slug: 'fruits',
        sortOrder: 1,
      ),
      Category(
        id: 'cat-2',
        name: 'Vegetables',
        slug: 'vegetables',
        sortOrder: 2,
      ),
    ];

    const testProducts = [
      Product(
        id: 'prod-1',
        name: 'Apple Kashmir',
        slug: 'apple-kashmir',
        description: 'Fresh Kashmir apples',
        image: '',
        price: 180.0,
        discountPrice: 150.0,
        stock: 100,
        unit: '1 kg',
        isFeatured: true,
        categoryId: 'cat-1',
      ),
      Product(
        id: 'prod-2',
        name: 'Nendran Banana',
        slug: 'nendran-banana',
        description: 'Kerala nendran bananas',
        image: '',
        price: 60.0,
        stock: 50,
        unit: '1 kg',
        isFeatured: true,
        categoryId: 'cat-1',
      ),
    ];

    const testBanners = [
      models.Banner(
        id: 'banner-1',
        title: 'Summer Sale',
        subtitle: 'Up to 30% off',
        image: '',
      ),
    ];

    Widget createWidget({
      List<models.Banner> banners = const [],
      List<Category> categories = const [],
      List<Product> featuredProducts = const [],
      void Function(Category)? onCategoryTap,
      void Function(Product)? onProductTap,
    }) {
      return ProviderScope(
        overrides: [
          bannersProvider.overrideWith(
            (ref) => Future.value(banners),
          ),
          categoriesProvider.overrideWith(
            (ref) => Future.value(categories),
          ),
          featuredProductsProvider.overrideWith(
            (ref) => Future.value(featuredProducts),
          ),
        ],
        child: MaterialApp(
          home: HomeScreen(
            onCategoryTap: onCategoryTap,
            onProductTap: onProductTap,
          ),
        ),
      );
    }

    testWidgets('renders app bar with title', (tester) async {
      await tester.pumpWidget(createWidget());
      await tester.pumpAndSettle();

      expect(find.text('MSM Supermarket'), findsOneWidget);
    });

    testWidgets('shows search and cart buttons', (tester) async {
      await tester.pumpWidget(createWidget());
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('search_button')), findsOneWidget);
      expect(find.byKey(const Key('cart_button')), findsOneWidget);
    });

    testWidgets('displays categories', (tester) async {
      await tester.pumpWidget(createWidget(
        categories: testCategories,
      ));
      await tester.pumpAndSettle();

      expect(find.text('Fruits'), findsOneWidget);
      expect(find.text('Vegetables'), findsOneWidget);
    });

    testWidgets('shows shop by category header', (tester) async {
      await tester.pumpWidget(createWidget(
        categories: testCategories,
      ));
      await tester.pumpAndSettle();

      expect(find.text('Shop by Category'), findsOneWidget);
    });

    testWidgets('displays featured products', (tester) async {
      await tester.pumpWidget(createWidget(
        featuredProducts: testProducts,
      ));
      await tester.pumpAndSettle();

      expect(find.text('Featured Products'), findsOneWidget);
      expect(find.text('Apple Kashmir'), findsOneWidget);
      expect(find.text('Nendran Banana'), findsOneWidget);
    });

    testWidgets('shows product prices', (tester) async {
      await tester.pumpWidget(createWidget(
        featuredProducts: testProducts,
      ));
      await tester.pumpAndSettle();

      // Apple has discount price 150
      expect(find.text('\u20B9150'), findsOneWidget);
      // Original price displayed with strikethrough
      expect(find.text('\u20B9180'), findsOneWidget);
      // Banana price 60
      expect(find.text('\u20B960'), findsOneWidget);
    });

    testWidgets('displays banners', (tester) async {
      await tester.pumpWidget(createWidget(
        banners: testBanners,
      ));
      await tester.pumpAndSettle();

      expect(find.text('Summer Sale'), findsOneWidget);
    });

    testWidgets('calls onCategoryTap when category tapped', (tester) async {
      Category? tappedCategory;
      await tester.pumpWidget(createWidget(
        categories: testCategories,
        onCategoryTap: (cat) => tappedCategory = cat,
      ));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Fruits'));
      await tester.pumpAndSettle();

      expect(tappedCategory?.name, 'Fruits');
    });
  });
}
