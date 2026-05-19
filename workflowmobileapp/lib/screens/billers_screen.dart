// lib/screens/billers_screen.dart

import 'package:flutter/material.dart';
import '../services/user_api.dart';
import '../utils/app_theme.dart';

class BillersScreen extends StatefulWidget {
  const BillersScreen({super.key});

  @override
  State<BillersScreen> createState() => _BillersScreenState();
}

class _BillersScreenState extends State<BillersScreen> {
  List<UserRow> _users = [];
  bool _loading = true;
  String? _error;
  String _q = '';
  final _siteCtrl = TextEditingController();
  final _contactNameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController(text: '123456');

  @override
  void dispose() {
    _siteCtrl.dispose();
    _contactNameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final users = await UserApi.listUsers();
      setState(() => _users = users.where((u) => u.role == 'BILLER').toList());
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _resetPassword(UserRow b) async {
    final pwdCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Reset password for ${b.email ?? b.siteName ?? b.id}'),
        content: TextField(
          controller: pwdCtrl,
          decoration: const InputDecoration(labelText: 'New password'),
          obscureText: true,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Reset')),
        ],
      ),
    );
    if (ok != true || pwdCtrl.text.length < 4) return;
    try {
      await UserApi.resetPassword(b.id, pwdCtrl.text);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password reset')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Future<void> _editBiller(UserRow b) async {
    final siteCtrl = TextEditingController(text: b.siteName ?? '');
    final contactCtrl = TextEditingController(text: b.contactName ?? '');
    final phoneCtrl = TextEditingController(text: b.contactPhone ?? '');
    final addressCtrl = TextEditingController(text: b.siteAddress ?? '');
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Edit ${b.siteName ?? b.email ?? 'biller'}'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: siteCtrl, decoration: const InputDecoration(labelText: 'Site name')),
              TextField(controller: contactCtrl, decoration: const InputDecoration(labelText: 'Contact name')),
              TextField(controller: phoneCtrl, decoration: const InputDecoration(labelText: 'Contact phone')),
              TextField(controller: addressCtrl, decoration: const InputDecoration(labelText: 'Site address')),
              const SizedBox(height: 8),
              Text('Login: ${b.email ?? '—'}', style: Theme.of(ctx).textTheme.bodySmall),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Save')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await UserApi.updateUser(b.id, {
        'siteName': siteCtrl.text.trim(),
        'contactName': contactCtrl.text.trim(),
        'contactPhone': phoneCtrl.text.trim(),
        'siteAddress': addressCtrl.text.trim(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Biller updated')));
        _load();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Future<void> _create() async {
    if (_emailCtrl.text.trim().isEmpty || _passCtrl.text.isEmpty) return;
    try {
      await UserApi.createUser({
        'role': 'BILLER',
        'email': _emailCtrl.text.trim(),
        'password': _passCtrl.text,
        'siteName': _siteCtrl.text.trim(),
        'contactName': _contactNameCtrl.text.trim(),
        'contactPhone': _phoneCtrl.text.trim(),
      });
      _siteCtrl.clear();
      _contactNameCtrl.clear();
      _phoneCtrl.clear();
      _emailCtrl.clear();
      _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Biller created')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  List<UserRow> get _filtered {
    final s = _q.trim().toLowerCase();
    if (s.isEmpty) return _users;
    return _users.where((b) {
      return (b.email?.toLowerCase().contains(s) ?? false) ||
          (b.siteName?.toLowerCase().contains(s) ?? false) ||
          (b.contactPhone?.toLowerCase().contains(s) ?? false) ||
          (b.contactName?.toLowerCase().contains(s) ?? false);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              TextField(controller: _siteCtrl, decoration: const InputDecoration(labelText: 'Site name')),
              TextField(controller: _contactNameCtrl, decoration: const InputDecoration(labelText: 'Contact name')),
              TextField(controller: _phoneCtrl, decoration: const InputDecoration(labelText: 'Contact phone')),
              TextField(controller: _emailCtrl, decoration: const InputDecoration(labelText: 'Email *')),
              TextField(controller: _passCtrl, decoration: const InputDecoration(labelText: 'Password *'), obscureText: true),
              const SizedBox(height: 8),
              FilledButton(onPressed: _create, child: const Text('Create biller')),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: TextField(
            decoration: const InputDecoration(hintText: 'Search billers…', prefixIcon: Icon(Icons.search)),
            onChanged: (v) => setState(() => _q = v),
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
              : _error != null
                  ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.red)))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: _filtered.length,
                        itemBuilder: (_, i) {
                          final b = _filtered[i];
                          return Card(
                            color: AppColors.card,
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              title: Text(b.siteName ?? b.email ?? b.id),
                              subtitle: Text(
                                '${b.contactName ?? ''} ${b.contactPhone ?? ''}\n${b.email ?? ''} · ${b.active == false ? 'Inactive' : 'Active'}',
                              ),
                              isThreeLine: true,
                              trailing: PopupMenuButton(
                                itemBuilder: (_) => [
                                  const PopupMenuItem(value: 'edit', child: Text('Edit')),
                                  const PopupMenuItem(value: 'reset', child: Text('Reset password')),
                                  PopupMenuItem(
                                    value: b.active == false ? 'on' : 'off',
                                    child: Text(b.active == false ? 'Activate' : 'Deactivate'),
                                  ),
                                ],
                                onSelected: (v) async {
                                  if (v == 'edit') {
                                    await _editBiller(b);
                                  } else if (v == 'reset') {
                                    await _resetPassword(b);
                                  } else {
                                    await UserApi.setActive(b.id, v == 'on');
                                    _load();
                                  }
                                },
                              ),
                            ),
                          );
                        },
                      ),
                    ),
        ),
      ],
    );
  }
}
