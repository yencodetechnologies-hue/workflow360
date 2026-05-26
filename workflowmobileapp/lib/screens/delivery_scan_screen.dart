// lib/screens/delivery_scan_screen.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../navigation/nav_config.dart';
import '../services/app_state.dart';
import '../services/delivery_api.dart';
import '../utils/app_theme.dart';

class DeliveryScanScreen extends StatefulWidget {
  final String deliveryId;
  final String deliveryNo;
  final String mode;
  final String role;

  const DeliveryScanScreen({
    super.key,
    required this.deliveryId,
    required this.deliveryNo,
    required this.mode,
    required this.role,
  });

  @override
  State<DeliveryScanScreen> createState() => _DeliveryScanScreenState();
}

class _DeliveryScanScreenState extends State<DeliveryScanScreen> {
  final _tagCtrl = TextEditingController();
  final _vehicleCtrl = TextEditingController();
  DeliveryDetail? _detail;
  bool _loading = false;
  String? _error;
  String? _lastOk;
  bool _rfidListening = false;
  late String _mode;

  bool get _isAdmin => widget.role == 'ADMIN';

  @override
  void initState() {
    super.initState();
    _mode = widget.mode;
    _load();
  }

  Future<void> _load() async {
    try {
      final d = await DeliveryApi.getDelivery(widget.deliveryId);
      setState(() {
        _detail = d;
        if (d.vehicleLabel != null) _vehicleCtrl.text = d.vehicleLabel!;
      });
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('ApiException: ', '').replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _scan([String? tagOverride]) async {
    final tag = (tagOverride ?? _tagCtrl.text).trim();
    if (tag.isEmpty) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await DeliveryApi.scan(widget.deliveryId, _mode, tag);
      _tagCtrl.clear();
      setState(() => _lastOk = 'Scanned $tag');
      await _load();
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('ApiException: ', '').replaceFirst('Exception: ', ''));
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _verifyVehicle() async {
    final v = _vehicleCtrl.text.trim();
    if (v.isEmpty) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await DeliveryApi.vehicleVerify(widget.deliveryId, v);
      setState(() => _lastOk = 'Vehicle $v verified');
      await _load();
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('ApiException: ', '').replaceFirst('Exception: ', ''));
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _closeReturn() async {
    setState(() => _loading = true);
    try {
      await DeliveryApi.closeReturn(widget.deliveryId);
      setState(() => _lastOk = 'Return closed');
      await _load();
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _openChallan() async {
    final url = Uri.parse(DeliveryApi.challanPdfUrl(widget.deliveryId));
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _toggleRfid() async {
    final app = context.read<AppState>();
    if (!_rfidListening) {
      if (!app.isReady) await app.initReader();
      await app.startScan();
      setState(() => _rfidListening = true);
      app.addListener(_onRfidTag);
    } else {
      app.removeListener(_onRfidTag);
      await app.stopScan();
      setState(() => _rfidListening = false);
    }
  }

  void _onRfidTag() {
    final app = context.read<AppState>();
    final tag = app.lastInventoryEpc;
    if (tag != null && tag.isNotEmpty && mounted) {
      _scan(tag);
    }
  }

  @override
  void dispose() {
    if (_rfidListening) {
      final app = context.read<AppState>();
      app.removeListener(_onRfidTag);
      app.stopScan();
    }
    _tagCtrl.dispose();
    _vehicleCtrl.dispose();
    super.dispose();
  }

  String get _title {
    switch (_mode) {
      case 'dispatch':
        return 'Dispatch scan';
      case 'pickup':
        return 'Pickup at godown';
      case 'deliver':
        return 'Deliver at site';
      case 'return':
        return 'Return scan (godown)';
      case 'return-pickup':
        return 'Return pickup (site)';
      default:
        return 'Scan';
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = _detail;
    final dispatchComplete = d != null && d.dispatched >= d.totalRequired && d.totalRequired > 0;
    final outForDelivery = d != null &&
        (d.status == 'OUT_FOR_DELIVERY' || (d.status == 'DISPATCHED' && d.vehicleVerified));
    var canScan = true;
    if (_mode == 'pickup' || _mode == 'deliver') {
      canScan = outForDelivery;
    } else if (_mode == 'return-pickup') {
      canScan = d?.status == 'RETURN_PICKUP';
    }

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(widget.deliveryNo),
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.pop()),
        actions: [
          if (_mode == 'dispatch')
            IconButton(icon: const Icon(Icons.picture_as_pdf), onPressed: _openChallan, tooltip: 'Challan PDF'),
        ],
      ),
      body: AppPageBackground(
        child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_isAdmin) ...[
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: scanModes.map((m) {
                  final selected = _mode == m;
                  return ChoiceChip(
                    label: Text(m[0].toUpperCase() + m.substring(1)),
                    selected: selected,
                    onSelected: canScanAction(widget.role, m)
                        ? (_) => setState(() => _mode = m)
                        : null,
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
            ],
            Text(_title, style: Theme.of(context).textTheme.titleLarge),
            if (d != null) ...[
              const SizedBox(height: 8),
              Text('Status: ${d.status}', style: Theme.of(context).textTheme.bodySmall),
              Text(
                'Dispatch ${d.dispatched}/${d.totalRequired} · Pickup ${d.pickedUp}/${d.totalRequired} · Deliver ${d.delivered}/${d.totalRequired} · Return ${d.returned}/${d.totalRequired}',
                style: Theme.of(context).textTheme.labelSmall,
              ),
            ],
            if (_mode == 'dispatch' && d != null && d.status == 'PACKED' && widget.role == 'GODOWN') ...[
              const SizedBox(height: 16),
              TextField(
                controller: _vehicleCtrl,
                decoration: const InputDecoration(
                  labelText: 'Vehicle number (out for delivery)',
                  border: OutlineInputBorder(),
                ),
                textCapitalization: TextCapitalization.characters,
              ),
              const SizedBox(height: 8),
              FilledButton(
                onPressed: _loading ? null : _verifyVehicle,
                child: const Text('Out for delivery'),
              ),
              const Text(
                'Driver login: vehicle number + password 123456 (auto-created)',
                style: TextStyle(fontSize: 11, color: AppColors.subtext),
              ),
            ],
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: _toggleRfid,
              icon: Icon(_rfidListening ? Icons.stop : Icons.sensors),
              label: Text(_rfidListening ? 'Stop RFID listener' : 'Start RFID listener'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _tagCtrl,
              decoration: InputDecoration(
                labelText: 'Tag ID (RFID / barcode)',
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(icon: const Icon(Icons.send), onPressed: _loading || !canScan ? null : () => _scan()),
              ),
              onSubmitted: (_) => _scan(),
              enabled: canScan && !_loading,
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: _loading || !canScan ? null : () => _scan(),
              child: Text(_loading ? 'Saving…' : 'Submit scan'),
            ),
            if (_mode == 'return') ...[
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: _loading ? null : _closeReturn,
                child: const Text('Close return'),
              ),
            ],
            if (_lastOk != null) ...[
              const SizedBox(height: 12),
              Text(_lastOk!, style: const TextStyle(color: AppColors.green)),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: AppColors.red)),
            ],
          ],
        ),
      ),
      ),
    );
  }
}
