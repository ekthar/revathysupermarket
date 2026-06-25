import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:msm_mobile/app.dart';
import 'package:msm_mobile/core/config/environment.dart';

void main() {
  testWidgets('App renders without errors', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MsmApp(config: EnvironmentConfig.dev),
      ),
    );

    // Verify the app renders (it should show the login page since unauthenticated)
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
