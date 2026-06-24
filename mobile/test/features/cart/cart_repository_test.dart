import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:msm_mobile/features/cart/data/cart_repository.dart';
import 'package:msm_mobile/features/cart/domain/cart_item_model.dart';

/// In-memory implementation of CartStorage for testing.
class InMemoryCartStorage implements CartStorage {
  final Map<String, String> _store = {};

  @override
  Future<String?> read(String key) async => _store[key];

  @override
  Future<void> write(String key, String value) async => _store[key] = value;

  @override
  Future<void> delete(String key) async => _store.remove(key);
}

void main() {
  late InMemoryCartStorage storage;
  late CartRepository cartRepository;

  setUp(() {
    storage = InMemoryCartStorage();
    cartRepository = CartRepository(storage: storage);
  });

  group('CartRepository', () {
    const testItem = CartItem(
      productId: 'prod-1',
      name: 'Apple',
      price: 120.0,
      discountPrice: 99.0,
      quantity: 1,
      image: '/images/apple.jpg',
      unit: '1 kg',
    );

    const testItem2 = CartItem(
      productId: 'prod-2',
      name: 'Banana',
      price: 40.0,
      quantity: 2,
      image: '/images/banana.jpg',
      unit: '1 dozen',
    );

    group('addItem', () {
      test('adds new item to empty cart', () async {
        await cartRepository.addItem(testItem);

        expect(cartRepository.items.length, 1);
        expect(cartRepository.items.first.productId, 'prod-1');
        expect(cartRepository.items.first.quantity, 1);
      });

      test('increments quantity for existing item', () async {
        await cartRepository.addItem(testItem);
        await cartRepository.addItem(testItem);

        expect(cartRepository.items.length, 1);
        expect(cartRepository.items.first.quantity, 2);
      });

      test('adds different items separately', () async {
        await cartRepository.addItem(testItem);
        await cartRepository.addItem(testItem2);

        expect(cartRepository.items.length, 2);
      });
    });

    group('removeItem', () {
      test('removes item from cart', () async {
        await cartRepository.addItem(testItem);
        await cartRepository.addItem(testItem2);

        await cartRepository.removeItem('prod-1');

        expect(cartRepository.items.length, 1);
        expect(cartRepository.items.first.productId, 'prod-2');
      });

      test('does nothing for non-existent item', () async {
        await cartRepository.addItem(testItem);

        await cartRepository.removeItem('non-existent');

        expect(cartRepository.items.length, 1);
      });
    });

    group('updateQuantity', () {
      test('updates quantity of existing item', () async {
        await cartRepository.addItem(testItem);

        await cartRepository.updateQuantity('prod-1', 5);

        expect(cartRepository.items.first.quantity, 5);
      });

      test('removes item when quantity is 0', () async {
        await cartRepository.addItem(testItem);

        await cartRepository.updateQuantity('prod-1', 0);

        expect(cartRepository.items.isEmpty, true);
      });

      test('removes item when quantity is negative', () async {
        await cartRepository.addItem(testItem);

        await cartRepository.updateQuantity('prod-1', -1);

        expect(cartRepository.items.isEmpty, true);
      });
    });

    group('clearCart', () {
      test('removes all items', () async {
        await cartRepository.addItem(testItem);
        await cartRepository.addItem(testItem2);

        await cartRepository.clearCart();

        expect(cartRepository.items.isEmpty, true);
        expect(cartRepository.itemCount, 0);
      });
    });

    group('subtotal', () {
      test('calculates subtotal with discount prices', () async {
        await cartRepository.addItem(testItem); // discountPrice: 99
        await cartRepository.addItem(testItem2); // price: 40, qty: 2

        // testItem qty=1, discountPrice=99 -> 99
        // testItem2 qty=2, price=40 -> 80
        expect(cartRepository.subtotal, 179.0);
      });

      test('uses original price when no discount', () async {
        await cartRepository.addItem(testItem2); // price: 40, qty: 2

        expect(cartRepository.subtotal, 80.0);
      });
    });

    group('itemCount', () {
      test('sums all quantities', () async {
        await cartRepository.addItem(testItem); // qty: 1
        await cartRepository.addItem(testItem2); // qty: 2

        expect(cartRepository.itemCount, 3);
      });
    });

    group('persistence', () {
      test('persists items to storage', () async {
        await cartRepository.addItem(testItem);

        final stored = await storage.read('msm_cart_v1');
        expect(stored, isNotNull);

        final decoded = json.decode(stored!) as List;
        expect(decoded.length, 1);
        expect((decoded[0] as Map)['productId'], 'prod-1');
      });

      test('loads items from storage', () async {
        // Pre-populate storage
        final items = [testItem.toJson()];
        await storage.write('msm_cart_v1', json.encode(items));

        // Create new repository instance to test loading
        final newRepo = CartRepository(storage: storage);
        await newRepo.loadCart();

        expect(newRepo.items.length, 1);
        expect(newRepo.items.first.productId, 'prod-1');
        expect(newRepo.items.first.name, 'Apple');
      });

      test('handles corrupted storage gracefully', () async {
        await storage.write('msm_cart_v1', 'invalid-json');

        final newRepo = CartRepository(storage: storage);
        await newRepo.loadCart();

        expect(newRepo.items.isEmpty, true);
      });
    });
  });
}
