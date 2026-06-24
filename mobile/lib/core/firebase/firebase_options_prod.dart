// PLACEHOLDER Firebase configuration for production environment.
// Replace these values with your actual Firebase project configuration.
// Generate using: flutterfire configure --project=your-prod-project
//
// These dummy values allow the app to compile without a real Firebase project.
// At runtime, Firebase initialization will fail gracefully and features
// dependent on Firebase (FCM push) will be disabled.

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;

class ProdFirebaseOptions {
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'prod-placeholder-api-key',
    appId: '1:000000000000:android:0000000000000000000000',
    messagingSenderId: '000000000000',
    projectId: 'msm-supermarket-prod',
    storageBucket: 'msm-supermarket-prod.appspot.com',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'prod-placeholder-api-key',
    appId: '1:000000000000:ios:0000000000000000000000',
    messagingSenderId: '000000000000',
    projectId: 'msm-supermarket-prod',
    storageBucket: 'msm-supermarket-prod.appspot.com',
    iosBundleId: 'com.msm.supermarket',
  );
}
