import 'package:flutter/material.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key, this.returnTo});

  final String? returnTo;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: Center(
        child: Text(
          'Login Screen'
          '${returnTo != null ? '\nReturn to: $returnTo' : ''}',
        ),
      ),
    );
  }
}
