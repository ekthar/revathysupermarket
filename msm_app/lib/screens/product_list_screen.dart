import 'package:flutter/material.dart';

class ProductListScreen extends StatelessWidget {
  const ProductListScreen({
    super.key,
    this.category,
    this.search,
  });

  final String? category;
  final String? search;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Products')),
      body: Center(
        child: Text(
          'Product List Screen'
          '${category != null ? '\nCategory: $category' : ''}'
          '${search != null ? '\nSearch: $search' : ''}',
        ),
      ),
    );
  }
}
