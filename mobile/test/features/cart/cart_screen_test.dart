import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:msm_mobile/features/cart/domain/cart_item_model.dart';
import 'package:msm_mobile/features/cart/presentation/cart_screen.dart';

void main() {
  group('CartScreen', () {
    const testItems = [
      CartItem(
        productId: 'prod-1',
        name: 'Apple Kashmir',
        price: 180.0,
        discountPrice: 150.0,
        quantity: 2,
        image: '/images/apple.jpg',
        unit: '1 kg',
      ),
      CartItem(
        productId: 'prod-2',
        name: 'Nendran Banana',
        price: 60.0,
        quantity: 1,
        image: '/images/banana.jpg',
        unit: '1 kg',
      ),
    ];

    Widget createWidget({
      List<CartItem> items = const [],
      double subtotal = 0,
      void Function(String, int)? onUpdateQuantity,
      void Function(String)? onRemoveItem,
      VoidCallback? onCheckout,
    }) {
      return MaterialApp(
        home: CartScreen(
          items: items,
          subtotal: subtotal,
          onUpdateQuantity: onUpdateQuantity,
          onRemoveItem: onRemoveItem,
          onCheckout: onCheckout,
        ),
      );
    }

    testWidgets('shows empty state when cart is empty', (tester) async {
      await tester.pumpWidget(createWidget());

      expect(find.text('Your cart is empty'), findsOneWidget);
      expect(find.text('Add items to get started'), findsOneWidget);
    });

    testWidgets('displays cart items', (tester) async {
      await tester.pumpWidget(createWidget(
        items: testItems,
        subtotal: 360,
      ));

      expect(find.text('Apple Kashmir'), findsOneWidget);
      expect(find.text('Nendran Banana'), findsOneWidget);
    });

    testWidgets('shows item count in title', (tester) async {
      await tester.pumpWidget(createWidget(
        items: testItems,
        subtotal: 360,
      ));

      expect(find.text('Cart (2)'), findsOneWidget);
    });

    testWidgets('displays subtotal', (tester) async {
      await tester.pumpWidget(createWidget(
        items: testItems,
        subtotal: 360,
      ));

      expect(find.text('\u20B9360'), findsOneWidget);
    });

    testWidgets('shows proceed to checkout button', (tester) async {
      await tester.pumpWidget(createWidget(
        items: testItems,
        subtotal: 360,
      ));

      expect(find.text('Proceed to Checkout'), findsOneWidget);
    });

    testWidgets('shows quantity for items', (tester) async {
      await tester.pumpWidget(createWidget(
        items: testItems,
        subtotal: 360,
      ));

      expect(find.text('2'), findsOneWidget); // Apple quantity
      expect(find.text('1'), findsOneWidget); // Banana quantity
    });

    testWidgets('shows unavailable reason for out of stock items',
        (tester) async {
      const unavailableItem = CartItem(
        productId: 'prod-3',
        name: 'Out of Stock Item',
        price: 100.0,
        quantity: 1,
        image: '',
        unit: '1 pc',
        available: false,
        unavailableReason: 'Only 0 available',
      );

      await tester.pumpWidget(createWidget(
        items: [unavailableItem],
        subtotal: 0,
      ));

      expect(find.text('Only 0 available'), findsOneWidget);
    });
  });
}
