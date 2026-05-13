import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:workflow360_rfid_app/rfid/rfid_service.dart';

class ScanScreen extends ConsumerStatefulWidget {
  const ScanScreen({super.key});

  @override
  ConsumerState<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends ConsumerState<ScanScreen> {
  final TextEditingController _controller = TextEditingController();
  bool _busy = false;
  final Map<String, int> _seen = {};

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _toggleInventory() async {
    final rfid = ref.read(rfidServiceProvider);
    setState(() => _busy = true);
    try {
      await rfid.init();
      if (_busy && _seen.isNotEmpty) {}
      await rfid.startInventory();
      rfid.onTagRead.listen((tag) {
        if (!mounted) return;
        setState(() {
          _seen.update(tag.epc, (v) => v + 1, ifAbsent: () => 1);
        });
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final epcs = _seen.keys.toList()..sort();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan'),
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          FilledButton.icon(
            onPressed: _busy ? null : _toggleInventory,
            icon: const Icon(Icons.play_arrow),
            label: const Text('Start inventory (RFID)'),
          ),
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

