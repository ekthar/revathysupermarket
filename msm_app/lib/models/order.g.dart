// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'order.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$OrderImpl _$$OrderImplFromJson(Map<String, dynamic> json) => _$OrderImpl(
  id: json['id'] as String,
  status: json['status'] as String,
  total: (json['total'] as num).toDouble(),
  createdAt: DateTime.parse(json['createdAt'] as String),
  deliveredAt: json['deliveredAt'] == null
      ? null
      : DateTime.parse(json['deliveredAt'] as String),
  deliverySlot: json['deliverySlot'] as String?,
  address: json['address'] as String?,
  phone: json['phone'] as String?,
  notes: json['notes'] as String?,
  items:
      (json['items'] as List<dynamic>?)
          ?.map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
);

Map<String, dynamic> _$$OrderImplToJson(_$OrderImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'status': instance.status,
      'total': instance.total,
      'createdAt': instance.createdAt.toIso8601String(),
      'deliveredAt': instance.deliveredAt?.toIso8601String(),
      'deliverySlot': instance.deliverySlot,
      'address': instance.address,
      'phone': instance.phone,
      'notes': instance.notes,
      'items': instance.items,
    };

_$OrderItemImpl _$$OrderItemImplFromJson(Map<String, dynamic> json) =>
    _$OrderItemImpl(
      productId: json['productId'] as String,
      name: json['name'] as String,
      quantity: (json['quantity'] as num).toInt(),
      price: (json['price'] as num).toDouble(),
      image: json['image'] as String?,
    );

Map<String, dynamic> _$$OrderItemImplToJson(_$OrderItemImpl instance) =>
    <String, dynamic>{
      'productId': instance.productId,
      'name': instance.name,
      'quantity': instance.quantity,
      'price': instance.price,
      'image': instance.image,
    };
