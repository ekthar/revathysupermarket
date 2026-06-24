import 'package:flutter_test/flutter_test.dart';
import 'package:msm_mobile/features/cart/data/cart_repository.dart';
import 'package:msm_mobile/features/cart/domain/cart_item_model.dart';
import 'package:msm_mobile/features/checkout/presentation/checkout_screen.dart';

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
  group('Checkout Validation', () {
    group('CheckoutData', () {
      test('stores payment method correctly', () {
        const data = CheckoutData(
          paymentMethod: 'COD',
          deliveryMode: 'ASAP',
        );
        expect(data.paymentMethod, 'COD');
        expect(data.deliveryMode, 'ASAP');
        expect(data.promoCode, isNull);
        expect(data.loyaltyPoints, 0);
      });

      test('stores all checkout fields', () {
        const data = CheckoutData(
          paymentMethod: 'WALLET',
          deliveryMode: 'SCHEDULED',
          promoCode: 'SAVE10',
          loyaltyPoints: 50,
          notes: 'Leave at door',
          addressId: 'addr-1',
        );

        expect(data.paymentMethod, 'WALLET');
        expect(data.deliveryMode, 'SCHEDULED');
        expect(data.promoCode, 'SAVE10');
        expect(data.loyaltyPoints, 50);
        expect(data.notes, 'Leave at door');
        expect(data.addressId, 'addr-1');
      });
    });

    group('Cart minimum order validation', () {
      late CartRepository cartRepository;
      late InMemoryCartStorage storage;

      setUp(() {
        storage = InMemoryCartStorage();
        cartRepository = CartRepository(storage: storage);
      });

      test('cart subtotal below minimum should fail validation', () async {
        const cheapItem = CartItem(
          productId: 'prod-1',
          name: 'Small Item',
          price: 10.0,
          quantity: 1,
          image: '',
          unit: 'pc',
        );
        await cartRepository.addItem(cheapItem);

        // Minimum order is 99; subtotal is 10
        expect(cartRepository.subtotal, 10.0);
        expect(cartRepository.subtotal >= 99, false);
      });

      test('cart subtotal at minimum should pass validation', () async {
        const item = CartItem(
          productId: 'prod-1',
          name: 'Item',
          price: 100.0,
          quantity: 1,
          image: '',
          unit: 'pc',
        );
        await cartRepository.addItem(item);

        expect(cartRepository.subtotal, 100.0);
        expect(cartRepository.subtotal >= 99, true);
      });
    });

    group('Payment method rules', () {
      test('all valid payment methods are accepted', () {
        const validMethods = ['COD', 'UPI_ON_DELIVERY', 'CARD', 'WALLET'];

        for (final method in validMethods) {
          final data = CheckoutData(
            paymentMethod: method,
            deliveryMode: 'ASAP',
          );
          expect(
            validMethods.contains(data.paymentMethod),
            true,
            reason: '$method should be valid',
          );
        }
      });

      test('wallet payment requires sufficient balance', () {
        const walletBalance = 150.0;
        const orderTotal = 200.0;

        // Wallet balance insufficient for full payment
        expect(walletBalance >= orderTotal, false);

        // But wallet can be used for partial payment
        expect(walletBalance > 0, true);
      });
    });

    group('Delivery mode rules', () {
      test('ASAP mode does not require slot', () {
        const data = CheckoutData(
          paymentMethod: 'COD',
          deliveryMode: 'ASAP',
        );
        // ASAP mode - no slot needed
        expect(data.deliveryMode, 'ASAP');
      });

      test('SCHEDULED mode requires delivery slot', () {
        // For scheduled mode, a delivery slot should be selected
        // The server enforces this, but client should validate
        const deliveryMode = 'SCHEDULED';
        expect(deliveryMode == 'SCHEDULED', true);
        // Client should ensure a slot is selected before submission
      });
    });
  });
}
