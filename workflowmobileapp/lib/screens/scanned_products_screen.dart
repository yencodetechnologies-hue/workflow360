// lib/screens/scanned_products_screen.dart

import 'package:flutter/material.dart';
import 'product_list_screen.dart';

/// Product picker focused on assigning a catalog item to RFID tags.
class ScannedProductsScreen extends StatelessWidget {
  const ScannedProductsScreen({super.key});

  @override
  Widget build(BuildContext context) => const ProductListScreen(
        heading: 'Assign products',
        description:
            'Tap a product to select it for tagging. Then open Scan new products to inventory, read, or write tags.',
      );
}
