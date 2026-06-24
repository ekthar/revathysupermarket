import 'package:freezed_annotation/freezed_annotation.dart';

part 'product.freezed.dart';
part 'product.g.dart';

@freezed
class Product with _$Product {
  const factory Product({
    required String id,
    required String slug,
    required String name,
    required String category,
    required double price,
    double? discountPrice,
    required String image,
    String? description,
    required int stock,
    @Default(0) int popularity,
    @Default('piece') String unit,
  }) = _Product;

  factory Product.fromJson(Map<String, dynamic> json) =>
      _$ProductFromJson(json);
}
