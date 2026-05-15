// lib/screens/scan_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../models/rfid_tag_data.dart';
import '../services/app_state.dart';
import '../utils/app_theme.dart';
import '../widgets/shared_widgets.dart';
import 'bulk_results_screen.dart';
import 'operations_screen.dart';

Future<String?> _bulkAccessPasswordDialog(BuildContext context) async {
  final ctrl = TextEditingController(text: '00000000');
  final pwd = await showDialog<String>(
    context: context,
    builder: (dialogCtx) => AlertDialog(
      title: Text(
        'Access password',
        style: GoogleFonts.spaceGrotesk(
          color: AppColors.text,
          fontWeight: FontWeight.bold,
        ),
      ),
      content: TextField(
        controller: ctrl,
        maxLength: 8,
        decoration: InputDecoration(
          labelText: 'Hex (8 characters)',
          labelStyle: GoogleFonts.inter(color: AppColors.subtext, fontSize: 12),
          counterText: '',
        ),
        inputFormatters: [
          FilteringTextInputFormatter.allow(RegExp(r'[0-9a-fA-F]')),
        ],
        style: GoogleFonts.jetBrainsMono(color: AppColors.text, fontSize: 14),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(dialogCtx),
          child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.subtext)),
        ),
        TextButton(
          onPressed: () {
            final p = ctrl.text.trim();
            if (p.length != 8) {
              ScaffoldMessenger.of(dialogCtx).showSnackBar(
                const SnackBar(content: Text('Enter exactly 8 hex characters')),
              );
              return;
            }
            Navigator.pop(dialogCtx, p.toUpperCase());
          },
          child: Text('Continue', style: GoogleFonts.inter(color: AppColors.cyan)),
        ),
      ],
    ),
  );
  ctrl.dispose();
  return pwd;
}

Future<void> _bulkReadAllTags(BuildContext context, AppState state) async {
  final pwd = await _bulkAccessPasswordDialog(context);
  if (pwd == null || !context.mounted) return;
  final report = await state.readAllTags(password: pwd);
  if (!context.mounted) return;
  if (report != null) {
    await Navigator.push<void>(
      context,
      MaterialPageRoute(builder: (_) => BulkResultsScreen(report: report)),
    );
  }
}

Future<void> _bulkWriteAllTags(BuildContext context, AppState state) async {
  final product = state.selectedProduct;
  if (product == null) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Select a product first from the Products tab')),
    );
    return;
  }
  final n = state.scanResults.length;
  final ok = await showDialog<bool>(
    context: context,
    builder: (dialogCtx) => AlertDialog(
      title: Text(
        'Write all tags?',
        style: GoogleFonts.spaceGrotesk(
          color: AppColors.text,
          fontWeight: FontWeight.bold,
        ),
      ),
      content: Text(
        'Write "${product.name}" (${product.sku}) to all $n unique tag(s) currently in the list?',
        style: GoogleFonts.inter(color: AppColors.text, fontSize: 14),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(dialogCtx, false),
          child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.subtext)),
        ),
        TextButton(
          onPressed: () => Navigator.pop(dialogCtx, true),
          child: Text('Write all', style: GoogleFonts.inter(color: AppColors.green)),
        ),
      ],
    ),
  );
  if (ok != true || !context.mounted) return;
  final pwd = await _bulkAccessPasswordDialog(context);
  if (pwd == null || !context.mounted) return;
  final report = await state.writeProductToAllTags(password: pwd);
  if (!context.mounted) return;
  if (report != null) {
    await Navigator.push<void>(
      context,
      MaterialPageRoute(builder: (_) => BulkResultsScreen(report: report)),
    );
  }
}

Future<void> _bulkIdentifyAllTags(BuildContext context, AppState state) async {
  final pwd = await _bulkAccessPasswordDialog(context);
  if (pwd == null || !context.mounted) return;
  final report = await state.identifyAllTags(password: pwd);
  if (!context.mounted) return;
  if (report != null) {
    await Navigator.push<void>(
      context,
      MaterialPageRoute(builder: (_) => BulkResultsScreen(report: report)),
    );
  }
}

class ScanScreen extends StatelessWidget {
  const ScanScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (ctx, state, _) => Column(children: [
        ReaderStatusBar(state: state),
        // ── Scan button bar ──
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Row(children: [
            Expanded(
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: state.isScanning
                      ? AppColors.orange
                      : AppColors.cyan,
                  foregroundColor: Colors.black,
                  minimumSize: const Size.fromHeight(48),
                ),
                onPressed: state.isBusy
                    ? null
                    : state.status == ReaderStatus.error
                        ? state.retryInitReader
                        : state.isScanning
                            ? state.stopScan
                            : state.startScan,
                icon: Icon(state.status == ReaderStatus.error
                    ? Icons.refresh
                    : state.isScanning
                        ? Icons.stop
                        : Icons.radar),
                label: Text(state.status == ReaderStatus.error
                    ? 'Retry Connection'
                    : state.isScanning
                        ? 'Stop Scan'
                        : 'Start Inventory'),
              ),
            ),
            if (const bool.fromEnvironment('RFID_MOCK')) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.amber.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: AppColors.amber.withOpacity(0.5)),
                ),
                child: Text(
                  'MOCK',
                  style: GoogleFonts.inter(
                    color: AppColors.amber,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
            const SizedBox(width: 10),
            _IconBtn(
              icon: Icons.delete_sweep_outlined,
              color: AppColors.subtext,
              onTap: state.clearRecords,
              tooltip: 'Clear all',
            ),
          ]),
        ),
        // ── Count bar ──
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${state.scanResults.length} unique tag(s) in range',
                          style: GoogleFonts.inter(
                              color: AppColors.subtext, fontSize: 12),
                        ),
                        Text(
                          'One list row per EPC — many stickers can share one chip ID.',
                          style: GoogleFonts.inter(
                              color: AppColors.subtext.withOpacity(0.85),
                              fontSize: 10,
                              height: 1.35),
                        ),
                        if (state.totalInventoryDetections >
                            state.scanResults.length)
                          Padding(
                            padding: const EdgeInsets.only(top: 2),
                            child: Text(
                              '${state.totalInventoryDetections} reader reports (same EPC updates one row).',
                              style: GoogleFonts.inter(
                                  color: AppColors.cyan.withOpacity(0.75),
                                  fontSize: 10,
                                  height: 1.35),
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (state.selectedProduct != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.cyan.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: AppColors.cyan.withOpacity(0.4)),
                      ),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        Text(state.selectedProduct!.emoji,
                            style: const TextStyle(fontSize: 12)),
                        const SizedBox(width: 5),
                        Text(state.selectedProduct!.name,
                            style: GoogleFonts.inter(
                                color: AppColors.cyan,
                                fontSize: 11,
                                fontWeight: FontWeight.w600)),
                      ]),
                    ),
                ],
              ),
            ],
          ),
        ),
        if (state.scanResults.isNotEmpty && !state.isBusy)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Bulk (all ${state.scanResults.length} unique tag(s))',
                  style: GoogleFonts.inter(
                    color: AppColors.subtext,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _BulkActionBtn(
                      label: 'Read all',
                      icon: Icons.download_done_outlined,
                      color: AppColors.cyan,
                      onTap: () => _bulkReadAllTags(ctx, state),
                    ),
                    const SizedBox(width: 8),
                    _BulkActionBtn(
                      label: 'Write all',
                      icon: Icons.upload_file_outlined,
                      color: AppColors.green,
                      onTap: () => _bulkWriteAllTags(ctx, state),
                    ),
                    const SizedBox(width: 8),
                    _BulkActionBtn(
                      label: 'Identify all',
                      icon: Icons.travel_explore,
                      color: AppColors.amber,
                      onTap: () => _bulkIdentifyAllTags(ctx, state),
                    ),
                  ],
                ),
              ],
            ),
          ),
        const Divider(height: 1),
        // ── Tag list ──
        Expanded(
          child: state.scanResults.isEmpty
              ? _EmptyState(scanning: state.isScanning)
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(14, 8, 14, 80),
                  itemCount: state.scanResults.length,
                  itemBuilder: (_, i) {
                    final tag = state.scanResults[i];
                    return _TagCard(scan: tag);
                  },
                ),
        ),
      ]),
    );
  }
}

class _TagCard extends StatelessWidget {
  final ScanResult scan;
  const _TagCard({required this.scan});

  @override
  Widget build(BuildContext context) {
    final state = context.read<AppState>();
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.nfc, color: AppColors.cyan, size: 18),
          const SizedBox(width: 8),
          Expanded(child: EpcChip(epc: scan.epc)),
          RssiIndicator(rssi: scan.rssi),
        ]),
        if (scan.inventoryHits > 1)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(
              'Seen ${scan.inventoryHits}× this scan (one row per EPC)',
              style: GoogleFonts.inter(
                color: AppColors.subtext,
                fontSize: 10,
              ),
            ),
          ),
        Consumer<AppState>(
          builder: (_, s, __) {
            RfidTagRecord? record;
            for (final r in s.tagRecords) {
              if (r.epc == scan.epc) {
                record = r;
                break;
              }
            }
            if (record != null) {
              if (record.hasProduct) {
                final p = record.resolveProduct(s.products);
                return Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p?.emoji ?? '📦',
                          style: const TextStyle(fontSize: 16)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              record.assignedProductName ?? '',
                              style: GoogleFonts.inter(
                                color: AppColors.text,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              record.assignedSku ?? '',
                              style: GoogleFonts.jetBrainsMono(
                                color: AppColors.subtext,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }
              return Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  record.memoryReadOk
                      ? 'No product in tag memory'
                      : 'Could not read tag memory',
                  style: GoogleFonts.inter(
                    color: record.memoryReadOk
                        ? AppColors.subtext
                        : AppColors.red,
                    fontSize: 12,
                  ),
                ),
              );
            }
            if (s.isScanning) {
              return Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  'Stop scan to load product name',
                  style: GoogleFonts.inter(
                    color: AppColors.subtext.withOpacity(0.75),
                    fontSize: 11,
                  ),
                ),
              );
            }
            if (s.isBusy) {
              return Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Row(
                  children: [
                    SizedBox(
                      width: 12,
                      height: 12,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.amber.withOpacity(0.9),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Loading product…',
                      style: GoogleFonts.inter(
                        color: AppColors.subtext,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              );
            }
            return const SizedBox.shrink();
          },
        ),
        const SizedBox(height: 12),
        // ── Action buttons ──
        Row(children: [
          _ActionBtn(
            label: 'Read',
            icon: Icons.download_outlined,
            color: AppColors.cyan,
            onTap: () => _navigate(context, scan, _OpTab.read),
          ),
          const SizedBox(width: 8),
          _ActionBtn(
            label: 'Write',
            icon: Icons.upload_outlined,
            color: AppColors.green,
            onTap: () {
              if (state.selectedProduct == null) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                    content: Text(
                        'Select a product first from the Products tab')));
                return;
              }
              _navigate(context, scan, _OpTab.write);
            },
          ),
          const SizedBox(width: 8),
          _ActionBtn(
            label: 'Identify',
            icon: Icons.manage_search,
            color: AppColors.amber,
            onTap: () => _navigate(context, scan, _OpTab.identify),
          ),
          const SizedBox(width: 8),
          _ActionBtn(
            label: 'Delete',
            icon: Icons.delete_outline,
            color: AppColors.red,
            onTap: () => _navigate(context, scan, _OpTab.delete),
          ),
        ]),
      ]),
    );
  }

  void _navigate(BuildContext ctx, ScanResult scan, _OpTab tab) {
    Navigator.push(
      ctx,
      MaterialPageRoute(
        builder: (_) => OperationsScreen(
          scan: scan,
          initialTab: tab.index,
        ),
      ),
    );
  }
}

enum _OpTab { read, write, identify, delete }

class _BulkActionBtn extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _BulkActionBtn({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => Expanded(
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.08),
              border: Border.all(color: color.withOpacity(0.4)),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: [
                Icon(icon, color: color, size: 20),
                const SizedBox(height: 4),
                Text(
                  label,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    color: color,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
}

class _ActionBtn extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _ActionBtn({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => Expanded(
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.08),
              border: Border.all(color: color.withOpacity(0.4)),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(children: [
              Icon(icon, color: color, size: 18),
              const SizedBox(height: 3),
              Text(label,
                  style: GoogleFonts.inter(
                      color: color,
                      fontSize: 10,
                      fontWeight: FontWeight.w600)),
            ]),
          ),
        ),
      );
}

class _EmptyState extends StatelessWidget {
  final bool scanning;
  const _EmptyState({required this.scanning});

  @override
  Widget build(BuildContext context) => Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.8, end: 1.0),
            duration: const Duration(seconds: 2),
            curve: Curves.easeInOut,
            builder: (_, v, c) => Transform.scale(
                scale: scanning ? v : 1, child: c),
            child: Icon(Icons.radar,
                size: 72,
                color: scanning
                    ? AppColors.cyan.withOpacity(0.6)
                    : AppColors.border),
          ),
          const SizedBox(height: 16),
          Text(
            scanning ? 'Scanning for UHF tags…' : 'Tap Start Inventory',
            style: GoogleFonts.inter(
                color: AppColors.subtext, fontSize: 15),
          ),
          if (!scanning) ...[
            const SizedBox(height: 6),
            Text(
              'Hold the NLS-MT95L near a tag',
              style: GoogleFonts.inter(
                  color: AppColors.subtext.withOpacity(0.5), fontSize: 12),
            ),
          ],
        ]),
      );
}

class _IconBtn extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  final String tooltip;

  const _IconBtn({
    required this.icon,
    required this.color,
    required this.onTap,
    required this.tooltip,
  });

  @override
  Widget build(BuildContext context) => Tooltip(
        message: tooltip,
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            width: 46,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.border),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
        ),
      );
}
