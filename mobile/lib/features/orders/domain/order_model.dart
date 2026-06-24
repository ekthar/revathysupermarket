import 'package:freezed_annotation/freezed_annotation.dart';

part 'order_model.freezed.dart';
part 'order_model.g.dart';

/// Order summary for list display.
@freezed
abstract class OrderSummary with _$OrderSummary {
  const factory OrderSummary({
    required String id,
    required String orderNumber,
    required String status,
    required String paymentMethod,
    required String paymentStatus,
    required double subtotal,
    required double discount,
    required double deliveryFee,
    required double total,
    required String deliveryMode,
    DateTime? estimatedDeliveryAt,
    required DateTime createdAt,
    required int itemCount,
    @Default([]) List<OrderItemSummary> items,
  }) = _OrderSummary;

  factory OrderSummary.fromJson(Map<String, dynamic> json) =>
      _$OrderSummaryFromJson(json);
}

/// Minimal item info for order list display.
@freezed
abstract class OrderItemSummary with _$OrderItemSummary {
  const factory OrderItemSummary({
    required String name,
    required int quantity,
    required double price,
  }) = _OrderItemSummary;

  factory OrderItemSummary.fromJson(Map<String, dynamic> json) =>
      _$OrderItemSummaryFromJson(json);
}

/// Full order detail.
@freezed
abstract class OrderDetail with _$OrderDetail {
  const factory OrderDetail({
    required String id,
    required String orderNumber,
    required String status,
    required String customerName,
    required String phone,
    required OrderAddress address,
    required double latitude,
    required double longitude,
    String? notes,
    required String paymentMethod,
    required String paymentStatus,
    required double subtotal,
    required double discount,
    required double deliveryFee,
    required double total,
    required String deliveryMode,
    DateTime? estimatedDeliveryAt,
    @Default(0) int loyaltyPointsRedeemed,
    required DateTime createdAt,
    @Default([]) List<OrderDetailItem> items,
    @Default([]) List<OrderStatusEvent> statusEvents,
    DeliveryLocation? deliveryLocation,
  }) = _OrderDetail;

  factory OrderDetail.fromJson(Map<String, dynamic> json) =>
      _$OrderDetailFromJson(json);
}

/// Address embedded in an order.
@freezed
abstract class OrderAddress with _$OrderAddress {
  const factory OrderAddress({
    required String houseName,
    required String street,
    required String landmark,
    required String pincode,
  }) = _OrderAddress;

  factory OrderAddress.fromJson(Map<String, dynamic> json) =>
      _$OrderAddressFromJson(json);
}

/// Order line item detail.
@freezed
abstract class OrderDetailItem with _$OrderDetailItem {
  const factory OrderDetailItem({
    required String id,
    required String productId,
    required String name,
    required int quantity,
    required double price,
    required double gstRate,
  }) = _OrderDetailItem;

  factory OrderDetailItem.fromJson(Map<String, dynamic> json) =>
      _$OrderDetailItemFromJson(json);
}

/// Status event in order timeline.
@freezed
abstract class OrderStatusEvent with _$OrderStatusEvent {
  const factory OrderStatusEvent({
    required String id,
    required String status,
    String? note,
    required DateTime createdAt,
  }) = _OrderStatusEvent;

  factory OrderStatusEvent.fromJson(Map<String, dynamic> json) =>
      _$OrderStatusEventFromJson(json);
}

/// Live delivery partner location.
@freezed
abstract class DeliveryLocation with _$DeliveryLocation {
  const factory DeliveryLocation({
    required double latitude,
    required double longitude,
    required DateTime updatedAt,
  }) = _DeliveryLocation;

  factory DeliveryLocation.fromJson(Map<String, dynamic> json) =>
      _$DeliveryLocationFromJson(json);
}
