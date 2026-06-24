// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'product.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ProductImpl _$$ProductImplFromJson(Map<String, dynamic> json) =>
    _$ProductImpl(
      id: json['id'] as String,
      slug: json['slug'] as String,
      name: json['name'] as String,
      category: json['category'] as String,
      price: (json['price'] as num).toDouble(),
      discountPrice: (json['discountPrice'] as num?)?.toDouble(),
      image: json['image'] as String,
      description: json['description'] as String?,
      stock: (json['stock'] as num).toInt(),
      popularity: (json['popularity'] as num?)?.toInt() ?? 0,
      unit: json['unit'] as String? ?? 'piece',
    );

Map<String, dynamic> _$$ProductImplToJson(_$ProductImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'slug': instance.slug,
      'name': instance.name,
      'category': instance.category,
      'price': instance.price,
      'discountPrice': instance.discountPrice,
      'image': instance.image,
      'description': instance.description,
      'stock': instance.stock,
      'popularity': instance.popularity,
      'unit': instance.unit,
    };
