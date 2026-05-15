// lib/screens/delivery_scan_screen.dart

import 'package:flutter/material.dart';
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

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _tagCtrl.dispose();
    _vehicleCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final d = await DeliveryApi.getDelivery(widget.deliveryId);
      setState(() {
        _detail = d;
        if (d.vehicleLabel != null) _vehicleCtrl.text = d.vehicleLabel!;
      });
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _scan() async {
    final tag = _tagCtrl.text.trim();
    if (tag.isEmpty) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await DeliveryApi.scan(widget.deliveryId, widget.mode, tag);
      _tagCtrl.clear();
      setState(() => _lastOk = 'Scanned $tag');
      await _load();
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
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
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      setState(() => _loading = false);
    }
  }

  String get _title {
    switch (widget.mode) {
      case 'dispatch':
        return 'Dispatch scan';
      case 'pickup':
        return 'Pickup at godown';
      case 'deliver':
        return 'Deliver at biller';
      default:
        return 'Scan';
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = _detail;
    final dispatchComplete = d != null && d.dispatched >= d.totalRequired && d.totalRequired > 0;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(widget.deliveryNo),
        backgroundColor: AppColors.surface,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(_title, style: Theme.of(context).textTheme.titleLarge),
            if (d != null) ...[
              const SizedBox(height: 8),
              Text('Status: ${d.status}', style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: 4),
              Text(
                'Dispatch ${d.dispatched}/${d.totalRequired} · Pickup ${d.pickedUp}/${d.totalRequired} · Deliver ${d.delivered}/${d.totalRequired}',
                style: Theme.of(context).textTheme.labelSmall,
              ),
            ],
            if (widget.mode == 'dispatch' && d != null && !d.vehicleVerified) ...[
              const SizedBox(height: 16),
              TextField(
                controller: _vehicleCtrl,
                decoration: const InputDecoration(
                  labelText: 'Vehicle number (verify after dispatch)',
                  border: OutlineInputBorder(),
                ),
                textCapitalization: TextCapitalization.characters,
                enabled: dispatchComplete,
              ),
              const SizedBox(height: 8),
              FilledButton(
                onPressed: _loading || !dispatchComplete ? null : _verifyVehicle,
                child: const Text('Verify vehicle'),
              ),
              if (!dispatchComplete)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    'Complete all dispatch scans first',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.amber),
                  ),
                ),
            ],
            const SizedBox(height: 16),
            TextField(
              controller: _tagCtrl,
              decoration: InputDecoration(
                labelText: 'Tag ID (RFID / barcode)',
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.send),
                  onPressed: _loading ? null : _scan,
                ),
              ),
              onSubmitted: (_) => _scan(),
              enabled: widget.mode != 'pickup' || (d?.vehicleVerified ?? false),
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: _loading ? null : _scan,
              child: Text(_loading ? 'Saving…' : 'Submit scan'),
            ),
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
    );
  }
}
