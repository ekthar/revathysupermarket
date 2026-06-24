// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'order_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

OrderSummary _$OrderSummaryFromJson(Map<String, dynamic> json) {
  return _OrderSummary.fromJson(json);
}

/// @nodoc
mixin _$OrderSummary {
  String get id => throw _privateConstructorUsedError;
  String get orderNumber => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  String get paymentMethod => throw _privateConstructorUsedError;
  String get paymentStatus => throw _privateConstructorUsedError;
  double get subtotal => throw _privateConstructorUsedError;
  double get discount => throw _privateConstructorUsedError;
  double get deliveryFee => throw _privateConstructorUsedError;
  double get total => throw _privateConstructorUsedError;
  String get deliveryMode => throw _privateConstructorUsedError;
  DateTime? get estimatedDeliveryAt => throw _privateConstructorUsedError;
  DateTime get createdAt => throw _privateConstructorUsedError;
  int get itemCount => throw _privateConstructorUsedError;
  List<OrderItemSummary> get items => throw _privateConstructorUsedError;

  /// Serializes this OrderSummary to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of OrderSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $OrderSummaryCopyWith<OrderSummary> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $OrderSummaryCopyWith<$Res> {
  factory $OrderSummaryCopyWith(
    OrderSummary value,
    $Res Function(OrderSummary) then,
  ) = _$OrderSummaryCopyWithImpl<$Res, OrderSummary>;
  @useResult
  $Res call({
    String id,
    String orderNumber,
    String status,
    String paymentMethod,
    String paymentStatus,
    double subtotal,
    double discount,
    double deliveryFee,
    double total,
    String deliveryMode,
    DateTime? estimatedDeliveryAt,
    DateTime createdAt,
    int itemCount,
    List<OrderItemSummary> items,
  });
}

/// @nodoc
class _$OrderSummaryCopyWithImpl<$Res, $Val extends OrderSummary>
    implements $OrderSummaryCopyWith<$Res> {
  _$OrderSummaryCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of OrderSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? orderNumber = null,
    Object? status = null,
    Object? paymentMethod = null,
    Object? paymentStatus = null,
    Object? subtotal = null,
    Object? discount = null,
    Object? deliveryFee = null,
    Object? total = null,
    Object? deliveryMode = null,
    Object? estimatedDeliveryAt = freezed,
    Object? createdAt = null,
    Object? itemCount = null,
    Object? items = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            orderNumber: null == orderNumber
                ? _value.orderNumber
                : orderNumber // ignore: cast_nullable_to_non_nullable
                      as String,
            status: null == status
                ? _value.status
                : status // ignore: cast_nullable_to_non_nullable
                      as String,
            paymentMethod: null == paymentMethod
                ? _value.paymentMethod
                : paymentMethod // ignore: cast_nullable_to_non_nullable
                      as String,
            paymentStatus: null == paymentStatus
                ? _value.paymentStatus
                : paymentStatus // ignore: cast_nullable_to_non_nullable
                      as String,
            subtotal: null == subtotal
                ? _value.subtotal
                : subtotal // ignore: cast_nullable_to_non_nullable
                      as double,
            discount: null == discount
                ? _value.discount
                : discount // ignore: cast_nullable_to_non_nullable
                      as double,
            deliveryFee: null == deliveryFee
                ? _value.deliveryFee
                : deliveryFee // ignore: cast_nullable_to_non_nullable
                      as double,
            total: null == total
                ? _value.total
                : total // ignore: cast_nullable_to_non_nullable
                      as double,
            deliveryMode: null == deliveryMode
                ? _value.deliveryMode
                : deliveryMode // ignore: cast_nullable_to_non_nullable
                      as String,
            estimatedDeliveryAt: freezed == estimatedDeliveryAt
                ? _value.estimatedDeliveryAt
                : estimatedDeliveryAt // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            createdAt: null == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as DateTime,
            itemCount: null == itemCount
                ? _value.itemCount
                : itemCount // ignore: cast_nullable_to_non_nullable
                      as int,
            items: null == items
                ? _value.items
                : items // ignore: cast_nullable_to_non_nullable
                      as List<OrderItemSummary>,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$OrderSummaryImplCopyWith<$Res>
    implements $OrderSummaryCopyWith<$Res> {
  factory _$$OrderSummaryImplCopyWith(
    _$OrderSummaryImpl value,
    $Res Function(_$OrderSummaryImpl) then,
  ) = __$$OrderSummaryImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String orderNumber,
    String status,
    String paymentMethod,
    String paymentStatus,
    double subtotal,
    double discount,
    double deliveryFee,
    double total,
    String deliveryMode,
    DateTime? estimatedDeliveryAt,
    DateTime createdAt,
    int itemCount,
    List<OrderItemSummary> items,
  });
}

/// @nodoc
class __$$OrderSummaryImplCopyWithImpl<$Res>
    extends _$OrderSummaryCopyWithImpl<$Res, _$OrderSummaryImpl>
    implements _$$OrderSummaryImplCopyWith<$Res> {
  __$$OrderSummaryImplCopyWithImpl(
    _$OrderSummaryImpl _value,
    $Res Function(_$OrderSummaryImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of OrderSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? orderNumber = null,
    Object? status = null,
    Object? paymentMethod = null,
    Object? paymentStatus = null,
    Object? subtotal = null,
    Object? discount = null,
    Object? deliveryFee = null,
    Object? total = null,
    Object? deliveryMode = null,
    Object? estimatedDeliveryAt = freezed,
    Object? createdAt = null,
    Object? itemCount = null,
    Object? items = null,
  }) {
    return _then(
      _$OrderSummaryImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        orderNumber: null == orderNumber
            ? _value.orderNumber
            : orderNumber // ignore: cast_nullable_to_non_nullable
                  as String,
        status: null == status
            ? _value.status
            : status // ignore: cast_nullable_to_non_nullable
                  as String,
        paymentMethod: null == paymentMethod
            ? _value.paymentMethod
            : paymentMethod // ignore: cast_nullable_to_non_nullable
                  as String,
        paymentStatus: null == paymentStatus
            ? _value.paymentStatus
            : paymentStatus // ignore: cast_nullable_to_non_nullable
                  as String,
        subtotal: null == subtotal
            ? _value.subtotal
            : subtotal // ignore: cast_nullable_to_non_nullable
                  as double,
        discount: null == discount
            ? _value.discount
            : discount // ignore: cast_nullable_to_non_nullable
                  as double,
        deliveryFee: null == deliveryFee
            ? _value.deliveryFee
            : deliveryFee // ignore: cast_nullable_to_non_nullable
                  as double,
        total: null == total
            ? _value.total
            : total // ignore: cast_nullable_to_non_nullable
                  as double,
        deliveryMode: null == deliveryMode
            ? _value.deliveryMode
            : deliveryMode // ignore: cast_nullable_to_non_nullable
                  as String,
        estimatedDeliveryAt: freezed == estimatedDeliveryAt
            ? _value.estimatedDeliveryAt
            : estimatedDeliveryAt // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        createdAt: null == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as DateTime,
        itemCount: null == itemCount
            ? _value.itemCount
            : itemCount // ignore: cast_nullable_to_non_nullable
                  as int,
        items: null == items
            ? _value._items
            : items // ignore: cast_nullable_to_non_nullable
                  as List<OrderItemSummary>,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$OrderSummaryImpl implements _OrderSummary {
  const _$OrderSummaryImpl({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.subtotal,
    required this.discount,
    required this.deliveryFee,
    required this.total,
    required this.deliveryMode,
    this.estimatedDeliveryAt,
    required this.createdAt,
    required this.itemCount,
    final List<OrderItemSummary> items = const [],
  }) : _items = items;

  factory _$OrderSummaryImpl.fromJson(Map<String, dynamic> json) =>
      _$$OrderSummaryImplFromJson(json);

  @override
  final String id;
  @override
  final String orderNumber;
  @override
  final String status;
  @override
  final String paymentMethod;
  @override
  final String paymentStatus;
  @override
  final double subtotal;
  @override
  final double discount;
  @override
  final double deliveryFee;
  @override
  final double total;
  @override
  final String deliveryMode;
  @override
  final DateTime? estimatedDeliveryAt;
  @override
  final DateTime createdAt;
  @override
  final int itemCount;
  final List<OrderItemSummary> _items;
  @override
  @JsonKey()
  List<OrderItemSummary> get items {
    if (_items is EqualUnmodifiableListView) return _items;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_items);
  }

  @override
  String toString() {
    return 'OrderSummary(id: $id, orderNumber: $orderNumber, status: $status, paymentMethod: $paymentMethod, paymentStatus: $paymentStatus, subtotal: $subtotal, discount: $discount, deliveryFee: $deliveryFee, total: $total, deliveryMode: $deliveryMode, estimatedDeliveryAt: $estimatedDeliveryAt, createdAt: $createdAt, itemCount: $itemCount, items: $items)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$OrderSummaryImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.orderNumber, orderNumber) ||
                other.orderNumber == orderNumber) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.paymentMethod, paymentMethod) ||
                other.paymentMethod == paymentMethod) &&
            (identical(other.paymentStatus, paymentStatus) ||
                other.paymentStatus == paymentStatus) &&
            (identical(other.subtotal, subtotal) ||
                other.subtotal == subtotal) &&
            (identical(other.discount, discount) ||
                other.discount == discount) &&
            (identical(other.deliveryFee, deliveryFee) ||
                other.deliveryFee == deliveryFee) &&
            (identical(other.total, total) || other.total == total) &&
            (identical(other.deliveryMode, deliveryMode) ||
                other.deliveryMode == deliveryMode) &&
            (identical(other.estimatedDeliveryAt, estimatedDeliveryAt) ||
                other.estimatedDeliveryAt == estimatedDeliveryAt) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.itemCount, itemCount) ||
                other.itemCount == itemCount) &&
            const DeepCollectionEquality().equals(other._items, _items));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    orderNumber,
    status,
    paymentMethod,
    paymentStatus,
    subtotal,
    discount,
    deliveryFee,
    total,
    deliveryMode,
    estimatedDeliveryAt,
    createdAt,
    itemCount,
    const DeepCollectionEquality().hash(_items),
  );

  /// Create a copy of OrderSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$OrderSummaryImplCopyWith<_$OrderSummaryImpl> get copyWith =>
      __$$OrderSummaryImplCopyWithImpl<_$OrderSummaryImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$OrderSummaryImplToJson(this);
  }
}

abstract class _OrderSummary implements OrderSummary {
  const factory _OrderSummary({
    required final String id,
    required final String orderNumber,
    required final String status,
    required final String paymentMethod,
    required final String paymentStatus,
    required final double subtotal,
    required final double discount,
    required final double deliveryFee,
    required final double total,
    required final String deliveryMode,
    final DateTime? estimatedDeliveryAt,
    required final DateTime createdAt,
    required final int itemCount,
    final List<OrderItemSummary> items,
  }) = _$OrderSummaryImpl;

  factory _OrderSummary.fromJson(Map<String, dynamic> json) =
      _$OrderSummaryImpl.fromJson;

  @override
  String get id;
  @override
  String get orderNumber;
  @override
  String get status;
  @override
  String get paymentMethod;
  @override
  String get paymentStatus;
  @override
  double get subtotal;
  @override
  double get discount;
  @override
  double get deliveryFee;
  @override
  double get total;
  @override
  String get deliveryMode;
  @override
  DateTime? get estimatedDeliveryAt;
  @override
  DateTime get createdAt;
  @override
  int get itemCount;
  @override
  List<OrderItemSummary> get items;

  /// Create a copy of OrderSummary
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$OrderSummaryImplCopyWith<_$OrderSummaryImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

OrderItemSummary _$OrderItemSummaryFromJson(Map<String, dynamic> json) {
  return _OrderItemSummary.fromJson(json);
}

/// @nodoc
mixin _$OrderItemSummary {
  String get name => throw _privateConstructorUsedError;
  int get quantity => throw _privateConstructorUsedError;
  double get price => throw _privateConstructorUsedError;

  /// Serializes this OrderItemSummary to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of OrderItemSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $OrderItemSummaryCopyWith<OrderItemSummary> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $OrderItemSummaryCopyWith<$Res> {
  factory $OrderItemSummaryCopyWith(
    OrderItemSummary value,
    $Res Function(OrderItemSummary) then,
  ) = _$OrderItemSummaryCopyWithImpl<$Res, OrderItemSummary>;
  @useResult
  $Res call({String name, int quantity, double price});
}

/// @nodoc
class _$OrderItemSummaryCopyWithImpl<$Res, $Val extends OrderItemSummary>
    implements $OrderItemSummaryCopyWith<$Res> {
  _$OrderItemSummaryCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of OrderItemSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? name = null,
    Object? quantity = null,
    Object? price = null,
  }) {
    return _then(
      _value.copyWith(
            name: null == name
                ? _value.name
                : name // ignore: cast_nullable_to_non_nullable
                      as String,
            quantity: null == quantity
                ? _value.quantity
                : quantity // ignore: cast_nullable_to_non_nullable
                      as int,
            price: null == price
                ? _value.price
                : price // ignore: cast_nullable_to_non_nullable
                      as double,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$OrderItemSummaryImplCopyWith<$Res>
    implements $OrderItemSummaryCopyWith<$Res> {
  factory _$$OrderItemSummaryImplCopyWith(
    _$OrderItemSummaryImpl value,
    $Res Function(_$OrderItemSummaryImpl) then,
  ) = __$$OrderItemSummaryImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String name, int quantity, double price});
}

/// @nodoc
class __$$OrderItemSummaryImplCopyWithImpl<$Res>
    extends _$OrderItemSummaryCopyWithImpl<$Res, _$OrderItemSummaryImpl>
    implements _$$OrderItemSummaryImplCopyWith<$Res> {
  __$$OrderItemSummaryImplCopyWithImpl(
    _$OrderItemSummaryImpl _value,
    $Res Function(_$OrderItemSummaryImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of OrderItemSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? name = null,
    Object? quantity = null,
    Object? price = null,
  }) {
    return _then(
      _$OrderItemSummaryImpl(
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
        quantity: null == quantity
            ? _value.quantity
            : quantity // ignore: cast_nullable_to_non_nullable
                  as int,
        price: null == price
            ? _value.price
            : price // ignore: cast_nullable_to_non_nullable
                  as double,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$OrderItemSummaryImpl implements _OrderItemSummary {
  const _$OrderItemSummaryImpl({
    required this.name,
    required this.quantity,
    required this.price,
  });

  factory _$OrderItemSummaryImpl.fromJson(Map<String, dynamic> json) =>
      _$$OrderItemSummaryImplFromJson(json);

  @override
  final String name;
  @override
  final int quantity;
  @override
  final double price;

  @override
  String toString() {
    return 'OrderItemSummary(name: $name, quantity: $quantity, price: $price)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$OrderItemSummaryImpl &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.quantity, quantity) ||
                other.quantity == quantity) &&
            (identical(other.price, price) || other.price == price));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, name, quantity, price);

  /// Create a copy of OrderItemSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$OrderItemSummaryImplCopyWith<_$OrderItemSummaryImpl> get copyWith =>
      __$$OrderItemSummaryImplCopyWithImpl<_$OrderItemSummaryImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$OrderItemSummaryImplToJson(this);
  }
}

abstract class _OrderItemSummary implements OrderItemSummary {
  const factory _OrderItemSummary({
    required final String name,
    required final int quantity,
    required final double price,
  }) = _$OrderItemSummaryImpl;

  factory _OrderItemSummary.fromJson(Map<String, dynamic> json) =
      _$OrderItemSummaryImpl.fromJson;

  @override
  String get name;
  @override
  int get quantity;
  @override
  double get price;

  /// Create a copy of OrderItemSummary
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$OrderItemSummaryImplCopyWith<_$OrderItemSummaryImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

OrderDetail _$OrderDetailFromJson(Map<String, dynamic> json) {
  return _OrderDetail.fromJson(json);
}

/// @nodoc
mixin _$OrderDetail {
  String get id => throw _privateConstructorUsedError;
  String get orderNumber => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  String get customerName => throw _privateConstructorUsedError;
  String get phone => throw _privateConstructorUsedError;
  OrderAddress get address => throw _privateConstructorUsedError;
  double get latitude => throw _privateConstructorUsedError;
  double get longitude => throw _privateConstructorUsedError;
  String? get notes => throw _privateConstructorUsedError;
  String get paymentMethod => throw _privateConstructorUsedError;
  String get paymentStatus => throw _privateConstructorUsedError;
  double get subtotal => throw _privateConstructorUsedError;
  double get discount => throw _privateConstructorUsedError;
  double get deliveryFee => throw _privateConstructorUsedError;
  double get total => throw _privateConstructorUsedError;
  String get deliveryMode => throw _privateConstructorUsedError;
  DateTime? get estimatedDeliveryAt => throw _privateConstructorUsedError;
  int get loyaltyPointsRedeemed => throw _privateConstructorUsedError;
  DateTime get createdAt => throw _privateConstructorUsedError;
  List<OrderDetailItem> get items => throw _privateConstructorUsedError;
  List<OrderStatusEvent> get statusEvents => throw _privateConstructorUsedError;
  DeliveryLocation? get deliveryLocation => throw _privateConstructorUsedError;

  /// Serializes this OrderDetail to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of OrderDetail
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $OrderDetailCopyWith<OrderDetail> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $OrderDetailCopyWith<$Res> {
  factory $OrderDetailCopyWith(
    OrderDetail value,
    $Res Function(OrderDetail) then,
  ) = _$OrderDetailCopyWithImpl<$Res, OrderDetail>;
  @useResult
  $Res call({
    String id,
    String orderNumber,
    String status,
    String customerName,
    String phone,
    OrderAddress address,
    double latitude,
    double longitude,
    String? notes,
    String paymentMethod,
    String paymentStatus,
    double subtotal,
    double discount,
    double deliveryFee,
    double total,
    String deliveryMode,
    DateTime? estimatedDeliveryAt,
    int loyaltyPointsRedeemed,
    DateTime createdAt,
    List<OrderDetailItem> items,
    List<OrderStatusEvent> statusEvents,
    DeliveryLocation? deliveryLocation,
  });

  $OrderAddressCopyWith<$Res> get address;
  $DeliveryLocationCopyWith<$Res>? get deliveryLocation;
}

/// @nodoc
class _$OrderDetailCopyWithImpl<$Res, $Val extends OrderDetail>
    implements $OrderDetailCopyWith<$Res> {
  _$OrderDetailCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of OrderDetail
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? orderNumber = null,
    Object? status = null,
    Object? customerName = null,
    Object? phone = null,
    Object? address = null,
    Object? latitude = null,
    Object? longitude = null,
    Object? notes = freezed,
    Object? paymentMethod = null,
    Object? paymentStatus = null,
    Object? subtotal = null,
    Object? discount = null,
    Object? deliveryFee = null,
    Object? total = null,
    Object? deliveryMode = null,
    Object? estimatedDeliveryAt = freezed,
    Object? loyaltyPointsRedeemed = null,
    Object? createdAt = null,
    Object? items = null,
    Object? statusEvents = null,
    Object? deliveryLocation = freezed,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            orderNumber: null == orderNumber
                ? _value.orderNumber
                : orderNumber // ignore: cast_nullable_to_non_nullable
                      as String,
            status: null == status
                ? _value.status
                : status // ignore: cast_nullable_to_non_nullable
                      as String,
            customerName: null == customerName
                ? _value.customerName
                : customerName // ignore: cast_nullable_to_non_nullable
                      as String,
            phone: null == phone
                ? _value.phone
                : phone // ignore: cast_nullable_to_non_nullable
                      as String,
            address: null == address
                ? _value.address
                : address // ignore: cast_nullable_to_non_nullable
                      as OrderAddress,
            latitude: null == latitude
                ? _value.latitude
                : latitude // ignore: cast_nullable_to_non_nullable
                      as double,
            longitude: null == longitude
                ? _value.longitude
                : longitude // ignore: cast_nullable_to_non_nullable
                      as double,
            notes: freezed == notes
                ? _value.notes
                : notes // ignore: cast_nullable_to_non_nullable
                      as String?,
            paymentMethod: null == paymentMethod
                ? _value.paymentMethod
                : paymentMethod // ignore: cast_nullable_to_non_nullable
                      as String,
            paymentStatus: null == paymentStatus
                ? _value.paymentStatus
                : paymentStatus // ignore: cast_nullable_to_non_nullable
                      as String,
            subtotal: null == subtotal
                ? _value.subtotal
                : subtotal // ignore: cast_nullable_to_non_nullable
                      as double,
            discount: null == discount
                ? _value.discount
                : discount // ignore: cast_nullable_to_non_nullable
                      as double,
            deliveryFee: null == deliveryFee
                ? _value.deliveryFee
                : deliveryFee // ignore: cast_nullable_to_non_nullable
                      as double,
            total: null == total
                ? _value.total
                : total // ignore: cast_nullable_to_non_nullable
                      as double,
            deliveryMode: null == deliveryMode
                ? _value.deliveryMode
                : deliveryMode // ignore: cast_nullable_to_non_nullable
                      as String,
            estimatedDeliveryAt: freezed == estimatedDeliveryAt
                ? _value.estimatedDeliveryAt
                : estimatedDeliveryAt // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            loyaltyPointsRedeemed: null == loyaltyPointsRedeemed
                ? _value.loyaltyPointsRedeemed
                : loyaltyPointsRedeemed // ignore: cast_nullable_to_non_nullable
                      as int,
            createdAt: null == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as DateTime,
            items: null == items
                ? _value.items
                : items // ignore: cast_nullable_to_non_nullable
                      as List<OrderDetailItem>,
            statusEvents: null == statusEvents
                ? _value.statusEvents
                : statusEvents // ignore: cast_nullable_to_non_nullable
                      as List<OrderStatusEvent>,
            deliveryLocation: freezed == deliveryLocation
                ? _value.deliveryLocation
                : deliveryLocation // ignore: cast_nullable_to_non_nullable
                      as DeliveryLocation?,
          )
          as $Val,
    );
  }

  /// Create a copy of OrderDetail
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $OrderAddressCopyWith<$Res> get address {
    return $OrderAddressCopyWith<$Res>(_value.address, (value) {
      return _then(_value.copyWith(address: value) as $Val);
    });
  }

  /// Create a copy of OrderDetail
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $DeliveryLocationCopyWith<$Res>? get deliveryLocation {
    if (_value.deliveryLocation == null) {
      return null;
    }

    return $DeliveryLocationCopyWith<$Res>(_value.deliveryLocation!, (value) {
      return _then(_value.copyWith(deliveryLocation: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$OrderDetailImplCopyWith<$Res>
    implements $OrderDetailCopyWith<$Res> {
  factory _$$OrderDetailImplCopyWith(
    _$OrderDetailImpl value,
    $Res Function(_$OrderDetailImpl) then,
  ) = __$$OrderDetailImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String orderNumber,
    String status,
    String customerName,
    String phone,
    OrderAddress address,
    double latitude,
    double longitude,
    String? notes,
    String paymentMethod,
    String paymentStatus,
    double subtotal,
    double discount,
    double deliveryFee,
    double total,
    String deliveryMode,
    DateTime? estimatedDeliveryAt,
    int loyaltyPointsRedeemed,
    DateTime createdAt,
    List<OrderDetailItem> items,
    List<OrderStatusEvent> statusEvents,
    DeliveryLocation? deliveryLocation,
  });

  @override
  $OrderAddressCopyWith<$Res> get address;
  @override
  $DeliveryLocationCopyWith<$Res>? get deliveryLocation;
}

/// @nodoc
class __$$OrderDetailImplCopyWithImpl<$Res>
    extends _$OrderDetailCopyWithImpl<$Res, _$OrderDetailImpl>
    implements _$$OrderDetailImplCopyWith<$Res> {
  __$$OrderDetailImplCopyWithImpl(
    _$OrderDetailImpl _value,
    $Res Function(_$OrderDetailImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of OrderDetail
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? orderNumber = null,
    Object? status = null,
    Object? customerName = null,
    Object? phone = null,
    Object? address = null,
    Object? latitude = null,
    Object? longitude = null,
    Object? notes = freezed,
    Object? paymentMethod = null,
    Object? paymentStatus = null,
    Object? subtotal = null,
    Object? discount = null,
    Object? deliveryFee = null,
    Object? total = null,
    Object? deliveryMode = null,
    Object? estimatedDeliveryAt = freezed,
    Object? loyaltyPointsRedeemed = null,
    Object? createdAt = null,
    Object? items = null,
    Object? statusEvents = null,
    Object? deliveryLocation = freezed,
  }) {
    return _then(
      _$OrderDetailImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        orderNumber: null == orderNumber
            ? _value.orderNumber
            : orderNumber // ignore: cast_nullable_to_non_nullable
                  as String,
        status: null == status
            ? _value.status
            : status // ignore: cast_nullable_to_non_nullable
                  as String,
        customerName: null == customerName
            ? _value.customerName
            : customerName // ignore: cast_nullable_to_non_nullable
                  as String,
        phone: null == phone
            ? _value.phone
            : phone // ignore: cast_nullable_to_non_nullable
                  as String,
        address: null == address
            ? _value.address
            : address // ignore: cast_nullable_to_non_nullable
                  as OrderAddress,
        latitude: null == latitude
            ? _value.latitude
            : latitude // ignore: cast_nullable_to_non_nullable
                  as double,
        longitude: null == longitude
            ? _value.longitude
            : longitude // ignore: cast_nullable_to_non_nullable
                  as double,
        notes: freezed == notes
            ? _value.notes
            : notes // ignore: cast_nullable_to_non_nullable
                  as String?,
        paymentMethod: null == paymentMethod
            ? _value.paymentMethod
            : paymentMethod // ignore: cast_nullable_to_non_nullable
                  as String,
        paymentStatus: null == paymentStatus
            ? _value.paymentStatus
            : paymentStatus // ignore: cast_nullable_to_non_nullable
                  as String,
        subtotal: null == subtotal
            ? _value.subtotal
            : subtotal // ignore: cast_nullable_to_non_nullable
                  as double,
        discount: null == discount
            ? _value.discount
            : discount // ignore: cast_nullable_to_non_nullable
                  as double,
        deliveryFee: null == deliveryFee
            ? _value.deliveryFee
            : deliveryFee // ignore: cast_nullable_to_non_nullable
                  as double,
        total: null == total
            ? _value.total
            : total // ignore: cast_nullable_to_non_nullable
                  as double,
        deliveryMode: null == deliveryMode
            ? _value.deliveryMode
            : deliveryMode // ignore: cast_nullable_to_non_nullable
                  as String,
        estimatedDeliveryAt: freezed == estimatedDeliveryAt
            ? _value.estimatedDeliveryAt
            : estimatedDeliveryAt // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        loyaltyPointsRedeemed: null == loyaltyPointsRedeemed
            ? _value.loyaltyPointsRedeemed
            : loyaltyPointsRedeemed // ignore: cast_nullable_to_non_nullable
                  as int,
        createdAt: null == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as DateTime,
        items: null == items
            ? _value._items
            : items // ignore: cast_nullable_to_non_nullable
                  as List<OrderDetailItem>,
        statusEvents: null == statusEvents
            ? _value._statusEvents
            : statusEvents // ignore: cast_nullable_to_non_nullable
                  as List<OrderStatusEvent>,
        deliveryLocation: freezed == deliveryLocation
            ? _value.deliveryLocation
            : deliveryLocation // ignore: cast_nullable_to_non_nullable
                  as DeliveryLocation?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$OrderDetailImpl implements _OrderDetail {
  const _$OrderDetailImpl({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.customerName,
    required this.phone,
    required this.address,
    required this.latitude,
    required this.longitude,
    this.notes,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.subtotal,
    required this.discount,
    required this.deliveryFee,
    required this.total,
    required this.deliveryMode,
    this.estimatedDeliveryAt,
    this.loyaltyPointsRedeemed = 0,
    required this.createdAt,
    final List<OrderDetailItem> items = const [],
    final List<OrderStatusEvent> statusEvents = const [],
    this.deliveryLocation,
  }) : _items = items,
       _statusEvents = statusEvents;

  factory _$OrderDetailImpl.fromJson(Map<String, dynamic> json) =>
      _$$OrderDetailImplFromJson(json);

  @override
  final String id;
  @override
  final String orderNumber;
  @override
  final String status;
  @override
  final String customerName;
  @override
  final String phone;
  @override
  final OrderAddress address;
  @override
  final double latitude;
  @override
  final double longitude;
  @override
  final String? notes;
  @override
  final String paymentMethod;
  @override
  final String paymentStatus;
  @override
  final double subtotal;
  @override
  final double discount;
  @override
  final double deliveryFee;
  @override
  final double total;
  @override
  final String deliveryMode;
  @override
  final DateTime? estimatedDeliveryAt;
  @override
  @JsonKey()
  final int loyaltyPointsRedeemed;
  @override
  final DateTime createdAt;
  final List<OrderDetailItem> _items;
  @override
  @JsonKey()
  List<OrderDetailItem> get items {
    if (_items is EqualUnmodifiableListView) return _items;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_items);
  }

  final List<OrderStatusEvent> _statusEvents;
  @override
  @JsonKey()
  List<OrderStatusEvent> get statusEvents {
    if (_statusEvents is EqualUnmodifiableListView) return _statusEvents;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_statusEvents);
  }

  @override
  final DeliveryLocation? deliveryLocation;

  @override
  String toString() {
    return 'OrderDetail(id: $id, orderNumber: $orderNumber, status: $status, customerName: $customerName, phone: $phone, address: $address, latitude: $latitude, longitude: $longitude, notes: $notes, paymentMethod: $paymentMethod, paymentStatus: $paymentStatus, subtotal: $subtotal, discount: $discount, deliveryFee: $deliveryFee, total: $total, deliveryMode: $deliveryMode, estimatedDeliveryAt: $estimatedDeliveryAt, loyaltyPointsRedeemed: $loyaltyPointsRedeemed, createdAt: $createdAt, items: $items, statusEvents: $statusEvents, deliveryLocation: $deliveryLocation)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$OrderDetailImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.orderNumber, orderNumber) ||
                other.orderNumber == orderNumber) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.customerName, customerName) ||
                other.customerName == customerName) &&
            (identical(other.phone, phone) || other.phone == phone) &&
            (identical(other.address, address) || other.address == address) &&
            (identical(other.latitude, latitude) ||
                other.latitude == latitude) &&
            (identical(other.longitude, longitude) ||
                other.longitude == longitude) &&
            (identical(other.notes, notes) || other.notes == notes) &&
            (identical(other.paymentMethod, paymentMethod) ||
                other.paymentMethod == paymentMethod) &&
            (identical(other.paymentStatus, paymentStatus) ||
                other.paymentStatus == paymentStatus) &&
            (identical(other.subtotal, subtotal) ||
                other.subtotal == subtotal) &&
            (identical(other.discount, discount) ||
                other.discount == discount) &&
            (identical(other.deliveryFee, deliveryFee) ||
                other.deliveryFee == deliveryFee) &&
            (identical(other.total, total) || other.total == total) &&
            (identical(other.deliveryMode, deliveryMode) ||
                other.deliveryMode == deliveryMode) &&
            (identical(other.estimatedDeliveryAt, estimatedDeliveryAt) ||
                other.estimatedDeliveryAt == estimatedDeliveryAt) &&
            (identical(other.loyaltyPointsRedeemed, loyaltyPointsRedeemed) ||
                other.loyaltyPointsRedeemed == loyaltyPointsRedeemed) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            const DeepCollectionEquality().equals(other._items, _items) &&
            const DeepCollectionEquality().equals(
              other._statusEvents,
              _statusEvents,
            ) &&
            (identical(other.deliveryLocation, deliveryLocation) ||
                other.deliveryLocation == deliveryLocation));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hashAll([
    runtimeType,
    id,
    orderNumber,
    status,
    customerName,
    phone,
    address,
    latitude,
    longitude,
    notes,
    paymentMethod,
    paymentStatus,
    subtotal,
    discount,
    deliveryFee,
    total,
    deliveryMode,
    estimatedDeliveryAt,
    loyaltyPointsRedeemed,
    createdAt,
    const DeepCollectionEquality().hash(_items),
    const DeepCollectionEquality().hash(_statusEvents),
    deliveryLocation,
  ]);

  /// Create a copy of OrderDetail
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$OrderDetailImplCopyWith<_$OrderDetailImpl> get copyWith =>
      __$$OrderDetailImplCopyWithImpl<_$OrderDetailImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$OrderDetailImplToJson(this);
  }
}

abstract class _OrderDetail implements OrderDetail {
  const factory _OrderDetail({
    required final String id,
    required final String orderNumber,
    required final String status,
    required final String customerName,
    required final String phone,
    required final OrderAddress address,
    required final double latitude,
    required final double longitude,
    final String? notes,
    required final String paymentMethod,
    required final String paymentStatus,
    required final double subtotal,
    required final double discount,
    required final double deliveryFee,
    required final double total,
    required final String deliveryMode,
    final DateTime? estimatedDeliveryAt,
    final int loyaltyPointsRedeemed,
    required final DateTime createdAt,
    final List<OrderDetailItem> items,
    final List<OrderStatusEvent> statusEvents,
    final DeliveryLocation? deliveryLocation,
  }) = _$OrderDetailImpl;

  factory _OrderDetail.fromJson(Map<String, dynamic> json) =
      _$OrderDetailImpl.fromJson;

  @override
  String get id;
  @override
  String get orderNumber;
  @override
  String get status;
  @override
  String get customerName;
  @override
  String get phone;
  @override
  OrderAddress get address;
  @override
  double get latitude;
  @override
  double get longitude;
  @override
  String? get notes;
  @override
  String get paymentMethod;
  @override
  String get paymentStatus;
  @override
  double get subtotal;
  @override
  double get discount;
  @override
  double get deliveryFee;
  @override
  double get total;
  @override
  String get deliveryMode;
  @override
  DateTime? get estimatedDeliveryAt;
  @override
  int get loyaltyPointsRedeemed;
  @override
  DateTime get createdAt;
  @override
  List<OrderDetailItem> get items;
  @override
  List<OrderStatusEvent> get statusEvents;
  @override
  DeliveryLocation? get deliveryLocation;

  /// Create a copy of OrderDetail
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$OrderDetailImplCopyWith<_$OrderDetailImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

OrderAddress _$OrderAddressFromJson(Map<String, dynamic> json) {
  return _OrderAddress.fromJson(json);
}

/// @nodoc
mixin _$OrderAddress {
  String get houseName => throw _privateConstructorUsedError;
  String get street => throw _privateConstructorUsedError;
  String get landmark => throw _privateConstructorUsedError;
  String get pincode => throw _privateConstructorUsedError;

  /// Serializes this OrderAddress to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of OrderAddress
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $OrderAddressCopyWith<OrderAddress> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $OrderAddressCopyWith<$Res> {
  factory $OrderAddressCopyWith(
    OrderAddress value,
    $Res Function(OrderAddress) then,
  ) = _$OrderAddressCopyWithImpl<$Res, OrderAddress>;
  @useResult
  $Res call({String houseName, String street, String landmark, String pincode});
}

/// @nodoc
class _$OrderAddressCopyWithImpl<$Res, $Val extends OrderAddress>
    implements $OrderAddressCopyWith<$Res> {
  _$OrderAddressCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of OrderAddress
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? houseName = null,
    Object? street = null,
    Object? landmark = null,
    Object? pincode = null,
  }) {
    return _then(
      _value.copyWith(
            houseName: null == houseName
                ? _value.houseName
                : houseName // ignore: cast_nullable_to_non_nullable
                      as String,
            street: null == street
                ? _value.street
                : street // ignore: cast_nullable_to_non_nullable
                      as String,
            landmark: null == landmark
                ? _value.landmark
                : landmark // ignore: cast_nullable_to_non_nullable
                      as String,
            pincode: null == pincode
                ? _value.pincode
                : pincode // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$OrderAddressImplCopyWith<$Res>
    implements $OrderAddressCopyWith<$Res> {
  factory _$$OrderAddressImplCopyWith(
    _$OrderAddressImpl value,
    $Res Function(_$OrderAddressImpl) then,
  ) = __$$OrderAddressImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String houseName, String street, String landmark, String pincode});
}

/// @nodoc
class __$$OrderAddressImplCopyWithImpl<$Res>
    extends _$OrderAddressCopyWithImpl<$Res, _$OrderAddressImpl>
    implements _$$OrderAddressImplCopyWith<$Res> {
  __$$OrderAddressImplCopyWithImpl(
    _$OrderAddressImpl _value,
    $Res Function(_$OrderAddressImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of OrderAddress
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? houseName = null,
    Object? street = null,
    Object? landmark = null,
    Object? pincode = null,
  }) {
    return _then(
      _$OrderAddressImpl(
        houseName: null == houseName
            ? _value.houseName
            : houseName // ignore: cast_nullable_to_non_nullable
                  as String,
        street: null == street
            ? _value.street
            : street // ignore: cast_nullable_to_non_nullable
                  as String,
        landmark: null == landmark
            ? _value.landmark
            : landmark // ignore: cast_nullable_to_non_nullable
                  as String,
        pincode: null == pincode
            ? _value.pincode
            : pincode // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$OrderAddressImpl implements _OrderAddress {
  const _$OrderAddressImpl({
    required this.houseName,
    required this.street,
    required this.landmark,
    required this.pincode,
  });

  factory _$OrderAddressImpl.fromJson(Map<String, dynamic> json) =>
      _$$OrderAddressImplFromJson(json);

  @override
  final String houseName;
  @override
  final String street;
  @override
  final String landmark;
  @override
  final String pincode;

  @override
  String toString() {
    return 'OrderAddress(houseName: $houseName, street: $street, landmark: $landmark, pincode: $pincode)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$OrderAddressImpl &&
            (identical(other.houseName, houseName) ||
                other.houseName == houseName) &&
            (identical(other.street, street) || other.street == street) &&
            (identical(other.landmark, landmark) ||
                other.landmark == landmark) &&
            (identical(other.pincode, pincode) || other.pincode == pincode));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, houseName, street, landmark, pincode);

  /// Create a copy of OrderAddress
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$OrderAddressImplCopyWith<_$OrderAddressImpl> get copyWith =>
      __$$OrderAddressImplCopyWithImpl<_$OrderAddressImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$OrderAddressImplToJson(this);
  }
}

abstract class _OrderAddress implements OrderAddress {
  const factory _OrderAddress({
    required final String houseName,
    required final String street,
    required final String landmark,
    required final String pincode,
  }) = _$OrderAddressImpl;

  factory _OrderAddress.fromJson(Map<String, dynamic> json) =
      _$OrderAddressImpl.fromJson;

  @override
  String get houseName;
  @override
  String get street;
  @override
  String get landmark;
  @override
  String get pincode;

  /// Create a copy of OrderAddress
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$OrderAddressImplCopyWith<_$OrderAddressImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

OrderDetailItem _$OrderDetailItemFromJson(Map<String, dynamic> json) {
  return _OrderDetailItem.fromJson(json);
}

/// @nodoc
mixin _$OrderDetailItem {
  String get id => throw _privateConstructorUsedError;
  String get productId => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  int get quantity => throw _privateConstructorUsedError;
  double get price => throw _privateConstructorUsedError;
  double get gstRate => throw _privateConstructorUsedError;

  /// Serializes this OrderDetailItem to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of OrderDetailItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $OrderDetailItemCopyWith<OrderDetailItem> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $OrderDetailItemCopyWith<$Res> {
  factory $OrderDetailItemCopyWith(
    OrderDetailItem value,
    $Res Function(OrderDetailItem) then,
  ) = _$OrderDetailItemCopyWithImpl<$Res, OrderDetailItem>;
  @useResult
  $Res call({
    String id,
    String productId,
    String name,
    int quantity,
    double price,
    double gstRate,
  });
}

/// @nodoc
class _$OrderDetailItemCopyWithImpl<$Res, $Val extends OrderDetailItem>
    implements $OrderDetailItemCopyWith<$Res> {
  _$OrderDetailItemCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of OrderDetailItem
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? productId = null,
    Object? name = null,
    Object? quantity = null,
    Object? price = null,
    Object? gstRate = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            productId: null == productId
                ? _value.productId
                : productId // ignore: cast_nullable_to_non_nullable
                      as String,
            name: null == name
                ? _value.name
                : name // ignore: cast_nullable_to_non_nullable
                      as String,
            quantity: null == quantity
                ? _value.quantity
                : quantity // ignore: cast_nullable_to_non_nullable
                      as int,
            price: null == price
                ? _value.price
                : price // ignore: cast_nullable_to_non_nullable
                      as double,
            gstRate: null == gstRate
                ? _value.gstRate
                : gstRate // ignore: cast_nullable_to_non_nullable
                      as double,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$OrderDetailItemImplCopyWith<$Res>
    implements $OrderDetailItemCopyWith<$Res> {
  factory _$$OrderDetailItemImplCopyWith(
    _$OrderDetailItemImpl value,
    $Res Function(_$OrderDetailItemImpl) then,
  ) = __$$OrderDetailItemImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String productId,
    String name,
    int quantity,
    double price,
    double gstRate,
  });
}

/// @nodoc
class __$$OrderDetailItemImplCopyWithImpl<$Res>
    extends _$OrderDetailItemCopyWithImpl<$Res, _$OrderDetailItemImpl>
    implements _$$OrderDetailItemImplCopyWith<$Res> {
  __$$OrderDetailItemImplCopyWithImpl(
    _$OrderDetailItemImpl _value,
    $Res Function(_$OrderDetailItemImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of OrderDetailItem
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? productId = null,
    Object? name = null,
    Object? quantity = null,
    Object? price = null,
    Object? gstRate = null,
  }) {
    return _then(
      _$OrderDetailItemImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        productId: null == productId
            ? _value.productId
            : productId // ignore: cast_nullable_to_non_nullable
                  as String,
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
        quantity: null == quantity
            ? _value.quantity
            : quantity // ignore: cast_nullable_to_non_nullable
                  as int,
        price: null == price
            ? _value.price
            : price // ignore: cast_nullable_to_non_nullable
                  as double,
        gstRate: null == gstRate
            ? _value.gstRate
            : gstRate // ignore: cast_nullable_to_non_nullable
                  as double,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$OrderDetailItemImpl implements _OrderDetailItem {
  const _$OrderDetailItemImpl({
    required this.id,
    required this.productId,
    required this.name,
    required this.quantity,
    required this.price,
    required this.gstRate,
  });

  factory _$OrderDetailItemImpl.fromJson(Map<String, dynamic> json) =>
      _$$OrderDetailItemImplFromJson(json);

  @override
  final String id;
  @override
  final String productId;
  @override
  final String name;
  @override
  final int quantity;
  @override
  final double price;
  @override
  final double gstRate;

  @override
  String toString() {
    return 'OrderDetailItem(id: $id, productId: $productId, name: $name, quantity: $quantity, price: $price, gstRate: $gstRate)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$OrderDetailItemImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.productId, productId) ||
                other.productId == productId) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.quantity, quantity) ||
                other.quantity == quantity) &&
            (identical(other.price, price) || other.price == price) &&
            (identical(other.gstRate, gstRate) || other.gstRate == gstRate));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, id, productId, name, quantity, price, gstRate);

  /// Create a copy of OrderDetailItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$OrderDetailItemImplCopyWith<_$OrderDetailItemImpl> get copyWith =>
      __$$OrderDetailItemImplCopyWithImpl<_$OrderDetailItemImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$OrderDetailItemImplToJson(this);
  }
}

abstract class _OrderDetailItem implements OrderDetailItem {
  const factory _OrderDetailItem({
    required final String id,
    required final String productId,
    required final String name,
    required final int quantity,
    required final double price,
    required final double gstRate,
  }) = _$OrderDetailItemImpl;

  factory _OrderDetailItem.fromJson(Map<String, dynamic> json) =
      _$OrderDetailItemImpl.fromJson;

  @override
  String get id;
  @override
  String get productId;
  @override
  String get name;
  @override
  int get quantity;
  @override
  double get price;
  @override
  double get gstRate;

  /// Create a copy of OrderDetailItem
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$OrderDetailItemImplCopyWith<_$OrderDetailItemImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

OrderStatusEvent _$OrderStatusEventFromJson(Map<String, dynamic> json) {
  return _OrderStatusEvent.fromJson(json);
}

/// @nodoc
mixin _$OrderStatusEvent {
  String get id => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  String? get note => throw _privateConstructorUsedError;
  DateTime get createdAt => throw _privateConstructorUsedError;

  /// Serializes this OrderStatusEvent to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of OrderStatusEvent
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $OrderStatusEventCopyWith<OrderStatusEvent> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $OrderStatusEventCopyWith<$Res> {
  factory $OrderStatusEventCopyWith(
    OrderStatusEvent value,
    $Res Function(OrderStatusEvent) then,
  ) = _$OrderStatusEventCopyWithImpl<$Res, OrderStatusEvent>;
  @useResult
  $Res call({String id, String status, String? note, DateTime createdAt});
}

/// @nodoc
class _$OrderStatusEventCopyWithImpl<$Res, $Val extends OrderStatusEvent>
    implements $OrderStatusEventCopyWith<$Res> {
  _$OrderStatusEventCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of OrderStatusEvent
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? status = null,
    Object? note = freezed,
    Object? createdAt = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            status: null == status
                ? _value.status
                : status // ignore: cast_nullable_to_non_nullable
                      as String,
            note: freezed == note
                ? _value.note
                : note // ignore: cast_nullable_to_non_nullable
                      as String?,
            createdAt: null == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as DateTime,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$OrderStatusEventImplCopyWith<$Res>
    implements $OrderStatusEventCopyWith<$Res> {
  factory _$$OrderStatusEventImplCopyWith(
    _$OrderStatusEventImpl value,
    $Res Function(_$OrderStatusEventImpl) then,
  ) = __$$OrderStatusEventImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String id, String status, String? note, DateTime createdAt});
}

/// @nodoc
class __$$OrderStatusEventImplCopyWithImpl<$Res>
    extends _$OrderStatusEventCopyWithImpl<$Res, _$OrderStatusEventImpl>
    implements _$$OrderStatusEventImplCopyWith<$Res> {
  __$$OrderStatusEventImplCopyWithImpl(
    _$OrderStatusEventImpl _value,
    $Res Function(_$OrderStatusEventImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of OrderStatusEvent
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? status = null,
    Object? note = freezed,
    Object? createdAt = null,
  }) {
    return _then(
      _$OrderStatusEventImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        status: null == status
            ? _value.status
            : status // ignore: cast_nullable_to_non_nullable
                  as String,
        note: freezed == note
            ? _value.note
            : note // ignore: cast_nullable_to_non_nullable
                  as String?,
        createdAt: null == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as DateTime,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$OrderStatusEventImpl implements _OrderStatusEvent {
  const _$OrderStatusEventImpl({
    required this.id,
    required this.status,
    this.note,
    required this.createdAt,
  });

  factory _$OrderStatusEventImpl.fromJson(Map<String, dynamic> json) =>
      _$$OrderStatusEventImplFromJson(json);

  @override
  final String id;
  @override
  final String status;
  @override
  final String? note;
  @override
  final DateTime createdAt;

  @override
  String toString() {
    return 'OrderStatusEvent(id: $id, status: $status, note: $note, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$OrderStatusEventImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.note, note) || other.note == note) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, status, note, createdAt);

  /// Create a copy of OrderStatusEvent
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$OrderStatusEventImplCopyWith<_$OrderStatusEventImpl> get copyWith =>
      __$$OrderStatusEventImplCopyWithImpl<_$OrderStatusEventImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$OrderStatusEventImplToJson(this);
  }
}

abstract class _OrderStatusEvent implements OrderStatusEvent {
  const factory _OrderStatusEvent({
    required final String id,
    required final String status,
    final String? note,
    required final DateTime createdAt,
  }) = _$OrderStatusEventImpl;

  factory _OrderStatusEvent.fromJson(Map<String, dynamic> json) =
      _$OrderStatusEventImpl.fromJson;

  @override
  String get id;
  @override
  String get status;
  @override
  String? get note;
  @override
  DateTime get createdAt;

  /// Create a copy of OrderStatusEvent
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$OrderStatusEventImplCopyWith<_$OrderStatusEventImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

DeliveryLocation _$DeliveryLocationFromJson(Map<String, dynamic> json) {
  return _DeliveryLocation.fromJson(json);
}

/// @nodoc
mixin _$DeliveryLocation {
  double get latitude => throw _privateConstructorUsedError;
  double get longitude => throw _privateConstructorUsedError;
  DateTime get updatedAt => throw _privateConstructorUsedError;

  /// Serializes this DeliveryLocation to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of DeliveryLocation
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $DeliveryLocationCopyWith<DeliveryLocation> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $DeliveryLocationCopyWith<$Res> {
  factory $DeliveryLocationCopyWith(
    DeliveryLocation value,
    $Res Function(DeliveryLocation) then,
  ) = _$DeliveryLocationCopyWithImpl<$Res, DeliveryLocation>;
  @useResult
  $Res call({double latitude, double longitude, DateTime updatedAt});
}

/// @nodoc
class _$DeliveryLocationCopyWithImpl<$Res, $Val extends DeliveryLocation>
    implements $DeliveryLocationCopyWith<$Res> {
  _$DeliveryLocationCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of DeliveryLocation
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? latitude = null,
    Object? longitude = null,
    Object? updatedAt = null,
  }) {
    return _then(
      _value.copyWith(
            latitude: null == latitude
                ? _value.latitude
                : latitude // ignore: cast_nullable_to_non_nullable
                      as double,
            longitude: null == longitude
                ? _value.longitude
                : longitude // ignore: cast_nullable_to_non_nullable
                      as double,
            updatedAt: null == updatedAt
                ? _value.updatedAt
                : updatedAt // ignore: cast_nullable_to_non_nullable
                      as DateTime,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$DeliveryLocationImplCopyWith<$Res>
    implements $DeliveryLocationCopyWith<$Res> {
  factory _$$DeliveryLocationImplCopyWith(
    _$DeliveryLocationImpl value,
    $Res Function(_$DeliveryLocationImpl) then,
  ) = __$$DeliveryLocationImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({double latitude, double longitude, DateTime updatedAt});
}

/// @nodoc
class __$$DeliveryLocationImplCopyWithImpl<$Res>
    extends _$DeliveryLocationCopyWithImpl<$Res, _$DeliveryLocationImpl>
    implements _$$DeliveryLocationImplCopyWith<$Res> {
  __$$DeliveryLocationImplCopyWithImpl(
    _$DeliveryLocationImpl _value,
    $Res Function(_$DeliveryLocationImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of DeliveryLocation
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? latitude = null,
    Object? longitude = null,
    Object? updatedAt = null,
  }) {
    return _then(
      _$DeliveryLocationImpl(
        latitude: null == latitude
            ? _value.latitude
            : latitude // ignore: cast_nullable_to_non_nullable
                  as double,
        longitude: null == longitude
            ? _value.longitude
            : longitude // ignore: cast_nullable_to_non_nullable
                  as double,
        updatedAt: null == updatedAt
            ? _value.updatedAt
            : updatedAt // ignore: cast_nullable_to_non_nullable
                  as DateTime,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$DeliveryLocationImpl implements _DeliveryLocation {
  const _$DeliveryLocationImpl({
    required this.latitude,
    required this.longitude,
    required this.updatedAt,
  });

  factory _$DeliveryLocationImpl.fromJson(Map<String, dynamic> json) =>
      _$$DeliveryLocationImplFromJson(json);

  @override
  final double latitude;
  @override
  final double longitude;
  @override
  final DateTime updatedAt;

  @override
  String toString() {
    return 'DeliveryLocation(latitude: $latitude, longitude: $longitude, updatedAt: $updatedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DeliveryLocationImpl &&
            (identical(other.latitude, latitude) ||
                other.latitude == latitude) &&
            (identical(other.longitude, longitude) ||
                other.longitude == longitude) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, latitude, longitude, updatedAt);

  /// Create a copy of DeliveryLocation
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$DeliveryLocationImplCopyWith<_$DeliveryLocationImpl> get copyWith =>
      __$$DeliveryLocationImplCopyWithImpl<_$DeliveryLocationImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$DeliveryLocationImplToJson(this);
  }
}

abstract class _DeliveryLocation implements DeliveryLocation {
  const factory _DeliveryLocation({
    required final double latitude,
    required final double longitude,
    required final DateTime updatedAt,
  }) = _$DeliveryLocationImpl;

  factory _DeliveryLocation.fromJson(Map<String, dynamic> json) =
      _$DeliveryLocationImpl.fromJson;

  @override
  double get latitude;
  @override
  double get longitude;
  @override
  DateTime get updatedAt;

  /// Create a copy of DeliveryLocation
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$DeliveryLocationImplCopyWith<_$DeliveryLocationImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
