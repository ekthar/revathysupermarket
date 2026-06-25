import 'package:freezed_annotation/freezed_annotation.dart';

part 'user_model.freezed.dart';
part 'user_model.g.dart';

/// User roles available in the MSM system.
enum UserRole {
  @JsonValue('CUSTOMER')
  customer,
  @JsonValue('DELIVERY_PARTNER')
  deliveryPartner,
  @JsonValue('ADMIN')
  admin,
  @JsonValue('STAFF')
  staff,
}

/// Represents a user in the MSM system.
///
/// Uses Freezed for immutable data classes with value equality,
/// copyWith, and JSON serialization.
@freezed
abstract class User with _$User {
  const factory User({
    required String id,
    required String name,
    required UserRole role,
    String? phone,
    String? email,
    String? avatarUrl,
  }) = _User;

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}
