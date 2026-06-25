import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../config/environment.dart';
import '../network/api_client.dart';
import '../utils/platform_utils.dart';
import 'firebase_options_dev.dart';
import 'firebase_options_prod.dart';

/// Background message handler - must be a top-level function.
///
/// Parses the FCM data message and shows a high-priority local notification
/// on the 'delivery_alerts' channel with full-screen intent on Android
/// and time-sensitive notification on iOS.
/// On web, local notifications are not supported; the browser handles
/// push notification display via the service worker.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // On web, background messages are handled by the service worker.
  if (kIsWeb) return;

  // Initialize Firebase in the background isolate
  try {
    await Firebase.initializeApp();
  } catch (_) {
    // Already initialized or not configured
  }

  final data = message.data;
  final eventId = data['eventId'] ?? '';
  final orderNumber = data['orderNumber'] ?? 'New Order';
  final deepLink = data['deepLink'] ?? '';

  await _showAlertNotification(
    title: 'New Delivery Assignment',
    body: 'Order #$orderNumber has been assigned to you',
    payload: deepLink.isNotEmpty ? deepLink : 'msmsupermarket://delivery/order/${data['orderId'] ?? ''}',
    eventId: eventId,
  );
}

/// Shows a high-priority notification for delivery alerts.
/// No-op on web where flutter_local_notifications is not supported.
Future<void> _showAlertNotification({
  required String title,
  required String body,
  required String payload,
  required String eventId,
}) async {
  // flutter_local_notifications does not support web platform
  if (kIsWeb) return;

  final flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

  const androidDetails = AndroidNotificationDetails(
    'delivery_alerts',
    'Delivery Alerts',
    channelDescription: 'High-priority notifications for delivery assignments',
    importance: Importance.max,
    priority: Priority.high,
    fullScreenIntent: true,
    category: AndroidNotificationCategory.alarm,
    visibility: NotificationVisibility.public,
    enableVibration: true,
    playSound: true,
    autoCancel: false,
    ongoing: true,
  );

  // iOS: time-sensitive notification with maximum interruption level.
  // NOTE: iOS does not support full-screen takeover like Android. The strongest
  // policy-compliant behavior is a time-sensitive notification with sound and banner.
  // This requires the "Time Sensitive Notifications" entitlement in Xcode.
  const iosDetails = DarwinNotificationDetails(
    presentAlert: true,
    presentBadge: true,
    presentSound: true,
    interruptionLevel: InterruptionLevel.timeSensitive,
  );

  const details = NotificationDetails(
    android: androidDetails,
    iOS: iosDetails,
  );

  await flutterLocalNotificationsPlugin.show(
    eventId.hashCode,
    title,
    body,
    details,
    payload: payload,
  );
}

/// FCM service that manages Firebase Cloud Messaging for the app.
///
/// Handles initialization, token management, foreground messages, and
/// notification tap navigation.
class FcmService {
  FcmService({
    required ApiClient apiClient,
    required EnvironmentConfig config,
    required String installationId,
    this.onAssignmentReceived,
    this.onNotificationTapped,
  })  : _apiClient = apiClient,
        _config = config,
        _installationId = installationId;

  final ApiClient _apiClient;
  final EnvironmentConfig _config;

  /// Unique installation identifier sent to the backend for device registration.
  final String _installationId;

  /// Callback invoked when an assignment push is received in the foreground.
  final void Function(Map<String, dynamic> data)? onAssignmentReceived;

  /// Callback invoked when a notification is tapped.
  final void Function(String deepLink)? onNotificationTapped;

  bool _initialized = false;
  String? _currentToken;
  StreamSubscription<String>? _tokenRefreshSubscription;
  StreamSubscription<RemoteMessage>? _foregroundMessageSubscription;

  bool get isInitialized => _initialized;
  String? get currentToken => _currentToken;

  /// Initialize Firebase and FCM. Wrapped in try/catch since no real Firebase
  /// project may be configured. Returns true if initialization succeeded.
  Future<bool> initialize() async {
    if (_initialized) return true;

    try {
      final firebaseOptions = _getFirebaseOptions();
      await Firebase.initializeApp(options: firebaseOptions);
    } catch (e) {
      debugPrint('FCM: Firebase initialization failed (expected if no '
          'Firebase project is configured): $e');
      return false;
    }

    try {
      final messaging = FirebaseMessaging.instance;

      // Request notification permission
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        criticalAlert: false,
        provisional: false,
      );

      if (settings.authorizationStatus == AuthorizationStatus.denied) {
        debugPrint('FCM: Notification permission denied');
        return false;
      }

      // Set up background message handler (not needed on web - service worker handles it)
      if (!PlatformUtils.isWeb) {
        FirebaseMessaging.onBackgroundMessage(
          firebaseMessagingBackgroundHandler,
        );
      }

      // Get the initial FCM token
      // On web, getToken requires a vapidKey for web push
      if (PlatformUtils.isWeb) {
        _currentToken = await messaging.getToken(
          vapidKey: 'placeholder-vapid-key-replace-with-real-key',
        );
      } else {
        _currentToken = await messaging.getToken();
      }
      if (_currentToken != null) {
        await _registerTokenWithBackend(_currentToken!);
      }

      // Listen for token refresh
      _tokenRefreshSubscription =
          messaging.onTokenRefresh.listen(_handleTokenRefresh);

      // Listen for foreground messages
      _foregroundMessageSubscription =
          FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // Handle notification tap when app is opened from terminated/background
      FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

      // Check if app was opened via notification tap from terminated state
      final initialMessage = await messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleNotificationTap(initialMessage);
      }

      _initialized = true;
      debugPrint('FCM: Initialized successfully with token: '
          '${_currentToken?.substring(0, 10)}...');
      return true;
    } catch (e) {
      debugPrint('FCM: Setup failed: $e');
      return false;
    }
  }

  /// Get the appropriate Firebase options based on platform and environment.
  FirebaseOptions _getFirebaseOptions() {
    if (PlatformUtils.isWeb) {
      return _config.isDev
          ? DevFirebaseOptions.web
          : ProdFirebaseOptions.web;
    }
    // On mobile, use defaultTargetPlatform to determine iOS vs Android
    if (defaultTargetPlatform == TargetPlatform.iOS) {
      return _config.isDev
          ? DevFirebaseOptions.ios
          : ProdFirebaseOptions.ios;
    }
    return _config.isDev
        ? DevFirebaseOptions.android
        : ProdFirebaseOptions.android;
  }

  /// Get the platform string for device registration.
  String _getPlatformString() {
    if (PlatformUtils.isWeb) return 'web';
    if (defaultTargetPlatform == TargetPlatform.iOS) return 'ios';
    return 'android';
  }

  /// Register the FCM token with the backend.
  Future<void> _registerTokenWithBackend(String token) async {
    try {
      await _apiClient.post(
        '/devices',
        data: {
          'installationId': _installationId,
          'token': token,
          'platform': _getPlatformString(),
        },
      );
      debugPrint('FCM: Token registered with backend');
    } catch (e) {
      debugPrint('FCM: Failed to register token with backend: $e');
    }
  }

  /// Handle FCM token refresh by re-registering with backend.
  void _handleTokenRefresh(String newToken) {
    _currentToken = newToken;
    _registerTokenWithBackend(newToken);
    debugPrint('FCM: Token refreshed');
  }

  /// Handle foreground messages - parse and trigger alarm if it is
  /// a delivery assignment.
  void _handleForegroundMessage(RemoteMessage message) {
    final data = message.data;
    final type = data['type'];

    if (type == 'delivery_assignment' || data.containsKey('eventId')) {
      onAssignmentReceived?.call(data);
    }

    // Show local notification even in foreground for delivery alerts
    if (data.containsKey('eventId')) {
      _showAlertNotification(
        title: message.notification?.title ?? 'New Delivery Assignment',
        body: message.notification?.body ??
            'Order #${data['orderNumber']} assigned',
        payload: data['deepLink'] ??
            'msmsupermarket://delivery/order/${data['orderId'] ?? ''}',
        eventId: data['eventId'] ?? '',
      );
    }
  }

  /// Handle notification tap navigation.
  void _handleNotificationTap(RemoteMessage message) {
    final deepLink = message.data['deepLink'] ??
        'msmsupermarket://delivery/order/${message.data['orderId'] ?? ''}';
    onNotificationTapped?.call(deepLink);
  }

  /// Dispose of subscriptions.
  void dispose() {
    _tokenRefreshSubscription?.cancel();
    _foregroundMessageSubscription?.cancel();
  }
}
