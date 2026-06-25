import 'package:freezed_annotation/freezed_annotation.dart';

part 'cart_item_model.freezed.dart';
part 'cart_item_model.g.dart';

/// Represents an item in the shopping cart.
@freezed
abstract class CartItem with _$CartItem {
  const factory CartItem({
    required String productId,
    required String name,
    required double price,
    double? discountPrice,
    required int quantity,
    required String image,
    required String unit,
    @Default(true) bool available,
    String? unavailableReason,
  }) = _CartItem;

  factory CartItem.fromJson(Map<String, dynamic> json) =>
      _$CartItemFromJson(json);
}
