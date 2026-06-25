import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

import '../../../core/network/api_client.dart';
import '../../../core/utils/platform_utils.dart';

/// GPS tracking service for active deliveries.
///
/// Watches position only during active delivery (OUT_FOR_DELIVERY or ARRIVING).
/// Throttles updates to max once per 5 seconds.
/// Posts coordinates to /api/delivery/location.
/// Stops immediately when delivery completes or no active orders.
/// Never logs precise coordinates for privacy.
class LocationService {
  LocationService({required ApiClient apiClient}) : _apiClient = apiClient;

  final ApiClient _apiClient;

  StreamSubscription<Position>? _positionSubscription;
  DateTime? _lastUpdateTime;
  bool _isTracking = false;
  String? _activeOrderId;

  /// Minimum interval between location updates in seconds.
  static const int throttleSeconds = 5;

  /// Whether the service is currently tracking location.
  bool get isTracking => _isTracking;

  /// The ID of the active order being tracked.
  String? get activeOrderId => _activeOrderId;

  /// Start tracking location for an active delivery.
  ///
  /// Requests location permission if not already granted.
  /// Only starts if [orderId] is provided, indicating an active delivery.
  /// On web, location tracking uses the browser's Geolocation API via geolocator_web.
  Future<bool> startTracking(String orderId) async {
    if (_isTracking && _activeOrderId == orderId) return true;

    // On web, continuous GPS tracking is less reliable; still attempt it
    // but log a warning for operators.
    if (PlatformUtils.isWeb) {
      debugPrint('LocationService: Running on web - GPS tracking may be limited');
    }

    // Stop any existing tracking first
    await stopTracking();

    // Check and request permissions
    final hasPermission = await _checkAndRequestPermission();
    if (!hasPermission) {
      debugPrint('LocationService: Permission denied');
      return false;
    }

    _activeOrderId = orderId;
    _isTracking = true;
    _lastUpdateTime = null;

    _positionSubscription = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10, // meters
      ),
    ).listen(
      _handlePositionUpdate,
      onError: (error) {
        debugPrint('LocationService: Position stream error');
      },
    );

    debugPrint('LocationService: Started tracking for order');
    return true;
  }

  /// Stop tracking location. Called when delivery completes or no active orders.
  Future<void> stopTracking() async {
    if (!_isTracking) return;

    _isTracking = false;
    _activeOrderId = null;
    _lastUpdateTime = null;

    await _positionSubscription?.cancel();
    _positionSubscription = null;

    debugPrint('LocationService: Stopped tracking');
  }

  /// Handle a position update from the GPS stream.
  ///
  /// Throttles updates to once per [throttleSeconds] seconds.
  void _handlePositionUpdate(Position position) {
    if (!_isTracking) return;

    final now = DateTime.now();
    if (_lastUpdateTime != null &&
        now.difference(_lastUpdateTime!).inSeconds < throttleSeconds) {
      return; // Throttled
    }

    _lastUpdateTime = now;
    _sendLocationToBackend(position.latitude, position.longitude);
  }

  /// Send location to the backend API.
  Future<void> _sendLocationToBackend(double latitude, double longitude) async {
    try {
      await _apiClient.post(
        '/delivery/location',
        data: {
          'latitude': latitude,
          'longitude': longitude,
        },
      );
    } catch (e) {
      // Non-critical: log but do not interrupt tracking
      debugPrint('LocationService: Failed to send location update');
    }
  }

  /// Check and request location permission.
  Future<bool> _checkAndRequestPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  /// Dispose the service.
  Future<void> dispose() async {
    await stopTracking();
  }
}
