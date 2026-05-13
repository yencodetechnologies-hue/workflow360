import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:workflow360_rfid_app/app/app.dart';

void main() {
  runApp(const ProviderScope(child: Workflow360App()));
}
