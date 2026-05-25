// lib/screens/login_screen.dart

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../config/api_config.dart';
import '../services/auth_service.dart';
import '../utils/app_theme.dart';

class LoginScreen extends StatefulWidget {
  final String role;

  const LoginScreen({super.key, required this.role});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _idCtrl = TextEditingController();
  final _passCtrl = TextEditingController(text: '123456');
  bool _busy = false;
  String? _error;

  bool get _isDelivery => widget.role == 'DELIVERY';

  @override
  void dispose() {
    _idCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    debugPrint('[Login] Sign in tapped — role=${widget.role}');
    debugPrint(
      '[Login] ${_isDelivery ? 'loginId' : 'email'}=${_idCtrl.text.trim().isEmpty ? '(empty)' : _idCtrl.text.trim()}',
    );
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await AuthService.login(
        role: widget.role,
        loginId: _isDelivery ? _idCtrl.text : null,
        email: _isDelivery ? null : _idCtrl.text,
        password: _passCtrl.text,
      );
      debugPrint('[Login] Success — role=${widget.role}');
      if (!mounted) return;
      if (widget.role == 'DELIVERY') {
        context.go('/deliveries');
      } else if (widget.role == 'GODOWN') {
        context.go('/queue');
      } else {
        context.go('/dashboard');
      }
    } catch (e, st) {
      debugPrint('[Login] Failed — $e');
      debugPrint('[Login] Stack trace:\n$st');
      final msg = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : AuthService.loginNetworkErrorMessage(e);
      setState(() => _error = msg);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final roleLabel = widget.role[0] + widget.role.substring(1).toLowerCase();
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text('$roleLabel login'),
        backgroundColor: AppColors.surface,
      ),
      body: AppPageBackground(
        child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
            Text(
              'Workflow 360',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: AppColors.primary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            TextField(
              controller: _idCtrl,
              decoration: InputDecoration(
                labelText: _isDelivery ? 'Vehicle number' : 'Email',
                hintText: _isDelivery ? 'TN09AB1234' : 'user@example.com',
                border: const OutlineInputBorder(),
              ),
              textCapitalization: _isDelivery ? TextCapitalization.characters : TextCapitalization.none,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _passCtrl,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Password',
                border: OutlineInputBorder(),
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(
                _error!,
                style: const TextStyle(color: AppColors.red, fontSize: 13),
              ),
            ],
            if (kDebugMode) ...[
              const SizedBox(height: 16),
              Text(
                'API: $kApiBaseUrl',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.subtext,
                      fontSize: 11,
                    ),
              ),
            ],
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _busy ? null : _login,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 14),
                child: Text(_busy ? 'Signing in…' : 'Sign in'),
              ),
            ),
            ],
          ),
        ),
      ),
      ),
    );
  }
}
