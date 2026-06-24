// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'order_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$OrderSummaryImpl _$$OrderSummaryImplFromJson(Map<String, dynamic> json) =>
    _$OrderSummaryImpl(
      id: json['id'] as String,
      orderNumber: json['orderNumber'] as String,
      status: json['status'] as String,
      paymentMethod: json['paymentMethod'] as String,
      paymentStatus: json['paymentStatus'] as String,
      subtotal: (json['subtotal'] as num).toDouble(),
      discount: (json['discount'] as num).toDouble(),
      deliveryFee: (json['deliveryFee'] as num).toDouble(),
      total: (json['total'] as num).toDouble(),
      deliveryMode: json['deliveryMode'] as String,
      estimatedDeliveryAt: json['estimatedDeliveryAt'] == null
          ? null
          : DateTime.parse(json['estimatedDeliveryAt'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      itemCount: (json['itemCount'] as num).toInt(),
      items:
          (json['items'] as List<dynamic>?)
              ?.map((e) => OrderItemSummary.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$$OrderSummaryImplToJson(_$OrderSummaryImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'orderNumber': instance.orderNumber,
      'status': instance.status,
      'paymentMethod': instance.paymentMethod,
      'paymentStatus': instance.paymentStatus,
      'subtotal': instance.subtotal,
      'discount': instance.discount,
      'deliveryFee': instance.deliveryFee,
      'total': instance.total,
      'deliveryMode': instance.deliveryMode,
      'estimatedDeliveryAt': instance.estimatedDeliveryAt?.toIso8601String(),
      'createdAt': instance.createdAt.toIso8601String(),
      'itemCount': instance.itemCount,
      'items': instance.items,
    };

_$OrderItemSummaryImpl _$$OrderItemSummaryImplFromJson(
  Map<String, dynamic> json,
) => _$OrderItemSummaryImpl(
  name: json['name'] as String,
  quantity: (json['quantity'] as num).toInt(),
  price: (json['price'] as num).toDouble(),
);

Map<String, dynamic> _$$OrderItemSummaryImplToJson(
  _$OrderItemSummaryImpl instance,
) => <String, dynamic>{
  'name': instance.name,
  'quantity': instance.quantity,
  'price': instance.price,
};

_$OrderDetailImpl _$$OrderDetailImplFromJson(Map<String, dynamic> json) =>
    _$OrderDetailImpl(
      id: json['id'] as String,
      orderNumber: json['orderNumber'] as String,
      status: json['status'] as String,
      customerName: json['customerName'] as String,
      phone: json['phone'] as String,
      address: OrderAddress.fromJson(json['address'] as Map<String, dynamic>),
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      notes: json['notes'] as String?,
      paymentMethod: json['paymentMethod'] as String,
      paymentStatus: json['paymentStatus'] as String,
      subtotal: (json['subtotal'] as num).toDouble(),
      discount: (json['discount'] as num).toDouble(),
      deliveryFee: (json['deliveryFee'] as num).toDouble(),
      total: (json['total'] as num).toDouble(),
      deliveryMode: json['deliveryMode'] as String,
      estimatedDeliveryAt: json['estimatedDeliveryAt'] == null
          ? null
          : DateTime.parse(json['estimatedDeliveryAt'] as String),
      loyaltyPointsRedeemed:
          (json['loyaltyPointsRedeemed'] as num?)?.toInt() ?? 0,
      createdAt: DateTime.parse(json['createdAt'] as String),
      items:
          (json['items'] as List<dynamic>?)
              ?.map((e) => OrderDetailItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      statusEvents:
          (json['statusEvents'] as List<dynamic>?)
              ?.map((e) => OrderStatusEvent.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      deliveryLocation: json['deliveryLocation'] == null
          ? null
          : DeliveryLocation.fromJson(
              json['deliveryLocation'] as Map<String, dynamic>,
            ),
    );

Map<String, dynamic> _$$OrderDetailImplToJson(_$OrderDetailImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'orderNumber': instance.orderNumber,
      'status': instance.status,
      'customerName': instance.customerName,
      'phone': instance.phone,
      'address': instance.address,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'notes': instance.notes,
      'paymentMethod': instance.paymentMethod,
      'paymentStatus': instance.paymentStatus,
      'subtotal': instance.subtotal,
      'discount': instance.discount,
      'deliveryFee': instance.deliveryFee,
      'total': instance.total,
      'deliveryMode': instance.deliveryMode,
      'estimatedDeliveryAt': instance.estimatedDeliveryAt?.toIso8601String(),
      'loyaltyPointsRedeemed': instance.loyaltyPointsRedeemed,
      'createdAt': instance.createdAt.toIso8601String(),
      'items': instance.items,
      'statusEvents': instance.statusEvents,
      'deliveryLocation': instance.deliveryLocation,
    };

_$OrderAddressImpl _$$OrderAddressImplFromJson(Map<String, dynamic> json) =>
    _$OrderAddressImpl(
      houseName: json['houseName'] as String,
      street: json['street'] as String,
      landmark: json['landmark'] as String,
      pincode: json['pincode'] as String,
    );

Map<String, dynamic> _$$OrderAddressImplToJson(_$OrderAddressImpl instance) =>
    <String, dynamic>{
      'houseName': instance.houseName,
      'street': instance.street,
      'landmark': instance.landmark,
      'pincode': instance.pincode,
    };

_$OrderDetailItemImpl _$$OrderDetailItemImplFromJson(
  Map<String, dynamic> json,
) => _$OrderDetailItemImpl(
  id: json['id'] as String,
  productId: json['productId'] as String,
  name: json['name'] as String,
  quantity: (json['quantity'] as num).toInt(),
  price: (json['price'] as num).toDouble(),
  gstRate: (json['gstRate'] as num).toDouble(),
);

Map<String, dynamic> _$$OrderDetailItemImplToJson(
  _$OrderDetailItemImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'productId': instance.productId,
  'name': instance.name,
  'quantity': instance.quantity,
  'price': instance.price,
  'gstRate': instance.gstRate,
};

_$OrderStatusEventImpl _$$OrderStatusEventImplFromJson(
  Map<String, dynamic> json,
) => _$OrderStatusEventImpl(
  id: json['id'] as String,
  status: json['status'] as String,
  note: json['note'] as String?,
  createdAt: DateTime.parse(json['createdAt'] as String),
);

Map<String, dynamic> _$$OrderStatusEventImplToJson(
  _$OrderStatusEventImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'status': instance.status,
  'note': instance.note,
  'createdAt': instance.createdAt.toIso8601String(),
};

_$DeliveryLocationImpl _$$DeliveryLocationImplFromJson(
  Map<String, dynamic> json,
) => _$DeliveryLocationImpl(
  latitude: (json['latitude'] as num).toDouble(),
  longitude: (json['longitude'] as num).toDouble(),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$$DeliveryLocationImplToJson(
  _$DeliveryLocationImpl instance,
) => <String, dynamic>{
  'latitude': instance.latitude,
  'longitude': instance.longitude,
  'updatedAt': instance.updatedAt.toIso8601String(),
};
