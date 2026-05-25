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
                  foregroundColor: Colors.white,
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
        // ── Count bar (assigned products only) ──
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (state.isScanning)
                Text(
                  'Scanning… stop to load assigned products',
                  style: GoogleFonts.inter(
                    color: AppColors.subtext,
                    fontSize: 12,
                  ),
                )
              else if (state.isBusy)
                Text(
                  'Reading tag memory…',
                  style: GoogleFonts.inter(
                    color: AppColors.subtext,
                    fontSize: 12,
                  ),
                )
              else if (state.assignedProductSummaries.isNotEmpty)
                Text(
                  '${state.assignedTagCount} assigned tag(s) · ${state.assignedProductSummaries.length} product(s)',
                  style: GoogleFonts.inter(
                    color: AppColors.subtext,
                    fontSize: 12,
                  ),
                )
              else if (state.scanResults.isNotEmpty)
                Text(
                  'No assigned products in this scan (${state.scanResults.length} other tag(s) hidden)',
                  style: GoogleFonts.inter(
                    color: AppColors.subtext,
                    fontSize: 12,
                  ),
                )
              else
                Text(
                  'Assigned products appear here after a scan',
                  style: GoogleFonts.inter(
                    color: AppColors.subtext,
                    fontSize: 12,
                  ),
                ),
              if (!state.isScanning &&
                  !state.isBusy &&
                  state.assignedProductSummaries.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    'Only tags with a product in memory are listed.',
                    style: GoogleFonts.inter(
                      color: AppColors.subtext.withOpacity(0.85),
                      fontSize: 10,
                      height: 1.35,
                    ),
                  ),
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
        // ── Assigned products (grouped by name + quantity) ──
        Expanded(
          child: state.isScanning || state.isBusy
              ? _EmptyState(
                  scanning: state.isScanning,
                  identifying: state.isBusy,
                )
              : state.assignedProductSummaries.isEmpty
                  ? _EmptyState(
                      scanning: false,
                      noAssigned: state.scanResults.isNotEmpty,
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(14, 8, 14, 80),
                      itemCount: state.assignedProductSummaries.length,
                      itemBuilder: (_, i) {
                        final row = state.assignedProductSummaries[i];
                        return _AssignedProductCard(summary: row);
                      },
                    ),
        ),
      ]),
    );
  }
}

class _AssignedProductCard extends StatelessWidget {
  final AssignedProductScanSummary summary;
  const _AssignedProductCard({required this.summary});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Text(summary.emoji, style: const TextStyle(fontSize: 28)),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              summary.productName,
              style: GoogleFonts.inter(
                color: AppColors.text,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${summary.quantity}',
                style: GoogleFonts.inter(
                  color: AppColors.cyan,
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                summary.quantity == 1 ? 'tag' : 'tags',
                style: GoogleFonts.inter(
                  color: AppColors.subtext,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

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

class _EmptyState extends StatelessWidget {
  final bool scanning;
  final bool identifying;
  final bool noAssigned;

  const _EmptyState({
    required this.scanning,
    this.identifying = false,
    this.noAssigned = false,
  });

  @override
  Widget build(BuildContext context) => Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.8, end: 1.0),
            duration: const Duration(seconds: 2),
            curve: Curves.easeInOut,
            builder: (_, v, c) => Transform.scale(
                scale: scanning || identifying ? v : 1, child: c),
            child: Icon(
              identifying ? Icons.hourglass_top : Icons.radar,
              size: 72,
              color: scanning || identifying
                  ? AppColors.cyan.withOpacity(0.6)
                  : AppColors.border,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            identifying
                ? 'Loading assigned products…'
                : noAssigned
                    ? 'No assigned products in range'
                    : scanning
                        ? 'Scanning for tags…'
                        : 'Tap Start Inventory',
            style: GoogleFonts.inter(color: AppColors.subtext, fontSize: 15),
            textAlign: TextAlign.center,
          ),
          if (!scanning && !identifying) ...[
            const SizedBox(height: 6),
            Text(
              noAssigned
                  ? 'Unassigned tags are not shown here'
                  : 'Stop scan to see product names and quantities',
              style: GoogleFonts.inter(
                color: AppColors.subtext.withOpacity(0.5),
                fontSize: 12,
              ),
              textAlign: TextAlign.center,
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
