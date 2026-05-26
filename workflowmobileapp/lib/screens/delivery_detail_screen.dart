// lib/screens/delivery_detail_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../navigation/nav_config.dart';
import '../services/auth_service.dart';
import '../services/delivery_api.dart';
import '../utils/app_theme.dart';

class DeliveryDetailScreen extends StatefulWidget {
  final String deliveryId;

  const DeliveryDetailScreen({super.key, required this.deliveryId});

  @override
  State<DeliveryDetailScreen> createState() => _DeliveryDetailScreenState();
}

class _DeliveryDetailScreenState extends State<DeliveryDetailScreen> {
  DeliveryFull? _d;
  bool _loading = true;
  String? _error;
  String _role = 'ADMIN';

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final user = await AuthService.getUser();
    setState(() => _role = user?.role ?? 'ADMIN');
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final d = await DeliveryApi.getDeliveryFull(widget.deliveryId);
      setState(() => _d = d);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('ApiException: ', '').replaceFirst('Exception: ', ''));
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _regenerate() async {
    try {
      await DeliveryApi.regenerateTokens(widget.deliveryId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Links regenerated')));
        await _load();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  void _copy(String? text) {
    if (text == null || text.isEmpty) return;
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Copied')));
  }

  String _fmt(String? iso) {
    if (iso == null || iso.isEmpty) return '—';
    try {
      return DateFormat.yMMMd().add_jm().format(DateTime.parse(iso).toLocal());
    } catch (_) {
      return iso;
    }
  }

  Widget _statusCard(String title, String value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 120, child: Text(title, style: const TextStyle(color: AppColors.subtext))),
          Expanded(child: Text(value, style: TextStyle(fontWeight: FontWeight.w600, color: color))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_d?.deliveryNo ?? 'Delivery'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.red)))
              : _d == null
                  ? const Center(child: Text('Not found'))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.all(16),
                        children: [
                          Text(_d!.customerName, style: Theme.of(context).textTheme.titleLarge),
                          if (_d!.siteName != null) Text(_d!.siteName!, style: const TextStyle(fontWeight: FontWeight.w600)),
                          if (_d!.siteAddress != null && _d!.siteAddress!.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text(_d!.siteAddress!, style: const TextStyle(color: AppColors.subtext)),
                            ),
                          const SizedBox(height: 8),
                          Chip(label: Text(deliveryStatusLabel(_d!.status))),
                          _statusCard('Scheduled', _fmt(_d!.deliveryAt)),
                          if (_d!.returnExpectedAt != null)
                            _statusCard('Return expected', _fmt(_d!.returnExpectedAt)),
                          if (_d!.vehicleLabel != null) _statusCard('Vehicle', _d!.vehicleLabel!),
                          const SizedBox(height: 16),
                          Card(
                            color: AppColors.card,
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Verification', style: Theme.of(context).textTheme.titleMedium),
                                  const SizedBox(height: 8),
                                  _statusCard(
                                    'Delivery handover',
                                    _d!.deliveryVerifiedAt != null
                                        ? 'Verified by ${_d!.deliveryVerifierName ?? '—'} · ${_fmt(_d!.deliveryVerifiedAt)}'
                                        : 'Pending',
                                    color: _d!.deliveryVerifiedAt != null ? Colors.green : AppColors.amber,
                                  ),
                                  _statusCard(
                                    'Biller return',
                                    _d!.billerReturnSubmittedAt != null
                                        ? 'Submitted ${_fmt(_d!.billerReturnSubmittedAt)}'
                                        : 'Pending',
                                    color: _d!.billerReturnSubmittedAt != null ? Colors.green : AppColors.amber,
                                  ),
                                  if (_d!.billerReturnSubmittedAt != null) ...[
                                    _statusCard('Damage total', '${_d!.damageTotal ?? 0}'),
                                    _statusCard('Missing total', '${_d!.missingTotal ?? 0}'),
                                  ],
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text('Products (${_d!.lines.length})', style: Theme.of(context).textTheme.titleMedium),
                          ..._d!.lines.map((l) {
                            final meta = [
                              if (l.sku != null && l.sku!.isNotEmpty) l.sku!,
                              if (l.godownName != null && l.godownName!.isNotEmpty) l.godownName!,
                              if (l.rate != null && l.rate!.isNotEmpty) l.rate!,
                            ].join(' · ');
                            return ListTile(
                              dense: true,
                              title: Text(l.particulars ?? l.productId),
                              subtitle: meta.isEmpty ? null : Text(meta),
                              trailing: Text('×${l.qty}${l.unit != null && l.unit!.isNotEmpty ? ' ${l.unit}' : ''}'),
                            );
                          }),
                          const SizedBox(height: 16),
                          Text('Magic links', style: Theme.of(context).textTheme.titleMedium),
                          if (_d!.deliveryVerifyUrl != null)
                            ListTile(
                              title: const Text('Delivery-person verify'),
                              subtitle: Text(_d!.deliveryVerifyUrl!, maxLines: 2, overflow: TextOverflow.ellipsis),
                              trailing: IconButton(icon: const Icon(Icons.copy), onPressed: () => _copy(_d!.deliveryVerifyUrl)),
                            ),
                          if (_d!.billerReturnUrl != null)
                            ListTile(
                              title: const Text('Biller return / damage'),
                              subtitle: Text(_d!.billerReturnUrl!, maxLines: 2, overflow: TextOverflow.ellipsis),
                              trailing: IconButton(icon: const Icon(Icons.copy), onPressed: () => _copy(_d!.billerReturnUrl)),
                            ),
                          if (_role == 'ADMIN')
                            FilledButton(onPressed: _regenerate, child: const Text('Regenerate magic links')),
                          const SizedBox(height: 12),
                          FilledButton.icon(
                            onPressed: () {
                              final mode = scanModeForDelivery(_role, _d!.status);
                              context.push('/scan/${widget.deliveryId}', extra: {
                                'deliveryNo': _d!.deliveryNo,
                                'mode': mode,
                                'role': _role,
                              }).then((_) => _load());
                            },
                            icon: const Icon(Icons.qr_code_scanner),
                            label: const Text('Open scan'),
                          ),
                        ],
                      ),
                    ),
    );
  }
}
