import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:workflow360_rfid_app/api/providers.dart';

class HistoryScreen extends ConsumerWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(_historyProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan history'),
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: historyAsync.when(
        data: (items) {
          if (items.isEmpty) {
            return const Center(child: Text('No history'));
          }
          final fmt = DateFormat('yyyy-MM-dd HH:mm:ss');
          return RefreshIndicator(
            onRefresh: () async => ref.refresh(_historyProvider.future),
            child: ListView.separated(
              itemCount: items.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final h = items[index];
                return ListTile(
                  title: Text(h.epc),
                  subtitle: Text(
                    '${h.productName ?? '-'}\n${fmt.format(h.ts.toLocal())}',
                  ),
                  isThreeLine: true,
                );
              },
            ),
          );
        },
        error: (e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Failed to load history:\n$e'),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () => ref.refresh(_historyProvider),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

final _historyProvider = FutureProvider((ref) async {
  final api = ref.watch(workflow360ApiProvider);
  return api.fetchScanHistory();
});

