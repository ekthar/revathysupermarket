/// Represents a delivery assignment event from the backend.
///
/// Created when an admin assigns an order to a delivery partner.
/// Remains "pending" until the partner acknowledges it.
class AssignmentEvent {
  const AssignmentEvent({
    required this.eventId,
    required this.orderId,
    required this.orderNumber,
    required this.assignedAt,
    this.customerName,
    this.address,
    this.total,
  });

  final String eventId;
  final String orderId;
  final String orderNumber;
  final DateTime assignedAt;
  final String? customerName;
  final String? address;
  final double? total;

  factory AssignmentEvent.fromJson(Map<String, dynamic> json) {
    return AssignmentEvent(
      eventId: json['eventId'] as String? ?? json['id'] as String? ?? '',
      orderId: json['orderId'] as String? ?? '',
      orderNumber: json['orderNumber'] as String? ?? '',
      assignedAt: DateTime.tryParse(json['assignedAt'] as String? ?? '') ??
          DateTime.now(),
      customerName: json['customerName'] as String?,
      address: json['address'] as String?,
      total: (json['total'] is num) ? (json['total'] as num).toDouble() : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'eventId': eventId,
      'orderId': orderId,
      'orderNumber': orderNumber,
      'assignedAt': assignedAt.toIso8601String(),
      if (customerName != null) 'customerName': customerName,
      if (address != null) 'address': address,
      if (total != null) 'total': total,
    };
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AssignmentEvent &&
          runtimeType == other.runtimeType &&
          eventId == other.eventId;

  @override
  int get hashCode => eventId.hashCode;

  @override
  String toString() =>
      'AssignmentEvent(eventId: $eventId, order: $orderNumber)';
}
