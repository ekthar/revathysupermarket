// PLACEHOLDER Firebase configuration for development environment.
// Replace these values with your actual Firebase project configuration.
// Generate using: flutterfire configure --project=your-dev-project
//
// These dummy values allow the app to compile without a real Firebase project.
// At runtime, Firebase initialization will fail gracefully and features
// dependent on Firebase (FCM push) will be disabled.

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;

class DevFirebaseOptions {
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'dev-placeholder-api-key',
    appId: '1:000000000000:android:0000000000000000000000',
    messagingSenderId: '000000000000',
    projectId: 'msm-supermarket-dev',
    storageBucket: 'msm-supermarket-dev.appspot.com',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'dev-placeholder-api-key',
    appId: '1:000000000000:ios:0000000000000000000000',
    messagingSenderId: '000000000000',
    projectId: 'msm-supermarket-dev',
    storageBucket: 'msm-supermarket-dev.appspot.com',
    iosBundleId: 'com.msm.supermarket.dev',
  );
}
