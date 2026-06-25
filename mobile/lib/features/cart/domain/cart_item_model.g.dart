// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'cart_item_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CartItemImpl _$$CartItemImplFromJson(Map<String, dynamic> json) =>
    _$CartItemImpl(
      productId: json['productId'] as String,
      name: json['name'] as String,
      price: (json['price'] as num).toDouble(),
      discountPrice: (json['discountPrice'] as num?)?.toDouble(),
      quantity: (json['quantity'] as num).toInt(),
      image: json['image'] as String,
      unit: json['unit'] as String,
      available: json['available'] as bool? ?? true,
      unavailableReason: json['unavailableReason'] as String?,
    );

Map<String, dynamic> _$$CartItemImplToJson(_$CartItemImpl instance) =>
    <String, dynamic>{
      'productId': instance.productId,
      'name': instance.name,
      'price': instance.price,
      'discountPrice': instance.discountPrice,
      'quantity': instance.quantity,
      'image': instance.image,
      'unit': instance.unit,
      'available': instance.available,
      'unavailableReason': instance.unavailableReason,
    };
