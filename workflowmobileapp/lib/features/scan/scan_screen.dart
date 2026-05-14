import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:workflow360_rfid_app/rfid/rfid_models.dart';
import 'package:workflow360_rfid_app/rfid/rfid_service.dart';

class ScanScreen extends ConsumerStatefulWidget {
  const ScanScreen({super.key});

  @override
  ConsumerState<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends ConsumerState<ScanScreen> {
  final TextEditingController _controller = TextEditingController();
  bool _busy = false;
  bool _inventoryRunning = false;
  final Map<String, int> _seen = {};
  StreamSubscription<RfidTag>? _readSub;

  Future<void> _startInventory() async {
    if (_inventoryRunning || _busy) return;
    final rfid = ref.read(rfidServiceProvider);
    setState(() => _busy = true);
    try {
      await rfid.init();
      await _readSub?.cancel();
      await rfid.startInventory();
      _readSub = rfid.onTagRead.listen(
        (tag) {
          if (!mounted) return;
          setState(() {
            _seen.update(tag.epc, (v) => v + 1, ifAbsent: () => 1);
          });
        },
        onError: (_) {},
      );
      if (mounted) setState(() => _inventoryRunning = true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _stopInventory() async {
    if (!_inventoryRunning && _readSub == null) return;
    setState(() => _busy = true);
    try {
      await _readSub?.cancel();
      _readSub = null;
      await ref.read(rfidServiceProvider).stopInventory();
      if (mounted) setState(() => _inventoryRunning = false);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  void dispose() {
    unawaited(_readSub?.cancel());
    _readSub = null;
    unawaited(ref.read(rfidServiceProvider).stopInventory());
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final epcs = _seen.keys.toList()..sort();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan'),
        leading: IconButton(
          onPressed: () async {
            await _stopInventory();
            if (context.mounted) context.pop();
          },
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_inventoryRunning)
            FilledButton.tonalIcon(
              onPressed: _busy ? null : _stopInventory,
              icon: const Icon(Icons.stop),
              label: const Text('Stop inventory'),
            )
          else
            FilledButton.icon(
              onPressed: _busy ? null : _startInventory,
              icon: const Icon(Icons.play_arrow),
              label: const Text('Start inventory (RFID)'),
            ),
          if (_inventoryRunning) ...[
            const SizedBox(height: 8),
            Text(
              'Listening for tags — use the device scan trigger.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
          const SizedBox(height: 16),
          TextField(
            controller: _controller,
            decoration: const InputDecoration(
              labelText: 'EPC',
              hintText: 'Enter/scan EPC',
            ),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: () => context.pop(_controller.text.trim()),
            child: const Text('Use this EPC'),
          ),
          if (epcs.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text('Found: ${epcs.length}', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            ...epcs.map((epc) {
              final count = _seen[epc] ?? 0;
              return ListTile(
                title: Text(epc),
                subtitle: Text('Seen: $count'),
                onTap: () => context.pop(epc),
              );
            }),
          ],
        ],
      ),
    );
  }
}
