// lib/main.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'navigation/app_router.dart';
import 'services/app_state.dart';
import 'utils/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarBrightness: Brightness.light,
    statusBarIconBrightness: Brightness.dark,
  ));
  runApp(
    ChangeNotifierProvider(
      create: (_) => AppState(),
      child: const Workflow360App(),
    ),
  );
}

class Workflow360App extends StatelessWidget {
  const Workflow360App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Workflow 360',
      theme: AppTheme.light,
      debugShowCheckedModeBanner: false,
      routerConfig: AppRouter.create(),
    );
  }
}
