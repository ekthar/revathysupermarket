import 'package:freezed_annotation/freezed_annotation.dart';

part 'product_model.freezed.dart';
part 'product_model.g.dart';

/// Category model for product organization.
@freezed
abstract class Category with _$Category {
  const factory Category({
    required String id,
    required String name,
    required String slug,
    String? description,
    String? image,
    @Default(0) int sortOrder,
  }) = _Category;

  factory Category.fromJson(Map<String, dynamic> json) =>
      _$CategoryFromJson(json);
}

/// Product model for display and cart operations.
@freezed
abstract class Product with _$Product {
  const factory Product({
    required String id,
    required String name,
    required String slug,
    required String description,
    required String image,
    required double price,
    double? discountPrice,
    required int stock,
    required String unit,
    @Default(false) bool isFeatured,
    double? gstRate,
    required String categoryId,
    ProductCategory? category,
  }) = _Product;

  factory Product.fromJson(Map<String, dynamic> json) =>
      _$ProductFromJson(json);
}

/// Inline category info attached to a product.
@freezed
abstract class ProductCategory with _$ProductCategory {
  const factory ProductCategory({
    required String id,
    required String name,
    required String slug,
  }) = _ProductCategory;

  factory ProductCategory.fromJson(Map<String, dynamic> json) =>
      _$ProductCategoryFromJson(json);
}

/// Banner model for home screen carousel.
@freezed
abstract class Banner with _$Banner {
  const factory Banner({
    required String id,
    required String title,
    String? subtitle,
    required String image,
    String? href,
  }) = _Banner;

  factory Banner.fromJson(Map<String, dynamic> json) => _$BannerFromJson(json);
}
