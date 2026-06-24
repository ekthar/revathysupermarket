import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:msm_mobile/features/auth/presentation/login_screen.dart';

void main() {
  group('LoginScreen', () {
    Widget createWidget({void Function(String)? onSendOtp}) {
      return MaterialApp(
        home: LoginScreen(onSendOtp: onSendOtp),
      );
    }

    testWidgets('renders phone input field', (tester) async {
      await tester.pumpWidget(createWidget());

      expect(find.byKey(const Key('phone_input')), findsOneWidget);
      expect(find.text('Mobile Number'), findsOneWidget);
    });

    testWidgets('renders send OTP button', (tester) async {
      await tester.pumpWidget(createWidget());

      expect(find.text('Send OTP'), findsOneWidget);
    });

    testWidgets('shows welcome text', (tester) async {
      await tester.pumpWidget(createWidget());

      expect(find.text('Welcome to MSM'), findsOneWidget);
      expect(
        find.text('Enter your mobile number to continue'),
        findsOneWidget,
      );
    });

    testWidgets('validates empty phone number', (tester) async {
      await tester.pumpWidget(createWidget());

      await tester.tap(find.text('Send OTP'));
      await tester.pumpAndSettle();

      expect(find.text('Phone number is required'), findsOneWidget);
    });

    testWidgets('validates invalid phone number length', (tester) async {
      await tester.pumpWidget(createWidget());

      await tester.enterText(find.byKey(const Key('phone_input')), '12345');
      await tester.tap(find.text('Send OTP'));
      await tester.pumpAndSettle();

      expect(
        find.text('Enter a valid 10-digit mobile number'),
        findsOneWidget,
      );
    });

    testWidgets('validates non-Indian number', (tester) async {
      await tester.pumpWidget(createWidget());

      await tester.enterText(
          find.byKey(const Key('phone_input')), '1234567890');
      await tester.tap(find.text('Send OTP'));
      await tester.pumpAndSettle();

      expect(
        find.text('Enter a valid Indian mobile number'),
        findsOneWidget,
      );
    });

    testWidgets('calls onSendOtp with valid phone number', (tester) async {
      String? receivedPhone;
      await tester.pumpWidget(
        createWidget(onSendOtp: (phone) => receivedPhone = phone),
      );

      await tester.enterText(
          find.byKey(const Key('phone_input')), '9876543210');
      await tester.tap(find.text('Send OTP'));
      await tester.pumpAndSettle();

      expect(receivedPhone, '+919876543210');
    });

    testWidgets('shows +91 prefix', (tester) async {
      await tester.pumpWidget(createWidget());

      expect(find.text('+91 '), findsOneWidget);
    });
  });
}
