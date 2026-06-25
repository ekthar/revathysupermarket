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

    // Verify the app renders (initially shows splash during auth loading)
    expect(find.byType(MaterialApp), findsOneWidget);

    // Advance past the auth initialization delay so the timer completes
    await tester.pumpAndSettle(const Duration(seconds: 1));

    // After auth resolves to unauthenticated, should redirect to login
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
