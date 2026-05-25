// lib/screens/operations_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../models/rfid_tag_data.dart';
import '../services/app_state.dart';
import '../utils/app_theme.dart';
import '../widgets/shared_widgets.dart';

class OperationsScreen extends StatefulWidget {
  final ScanResult scan;
  final int initialTab;

  const OperationsScreen({
    super.key,
    required this.scan,
    this.initialTab = 0,
  });

  @override
  State<OperationsScreen> createState() => _OperationsScreenState();
}

class _OperationsScreenState extends State<OperationsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tab;
  final _pwdCtrl = TextEditingController(text: '00000000');

  OperationResult? _readResult;
  OperationResult? _writeResult;
  RfidTagRecord?   _identified;
  OperationResult? _deleteResult;

  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _tab = TabController(
        length: 4, vsync: this, initialIndex: widget.initialTab);
  }

  @override
  void dispose() {
    _tab.dispose();
    _pwdCtrl.dispose();
    super.dispose();
  }

  // ── Operations ──────────────────────────────────────────────

  Future<void> _doRead() async {
    setState(() => _busy = true);
    final result = await context.read<AppState>().readTag(
          epc: widget.scan.epc,
          password: _pwdCtrl.text,
        );
    setState(() { _readResult = result; _busy = false; });
  }

  Future<void> _doWrite() async {
    final state = context.read<AppState>();
    if (state.selectedProduct == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Go to Products tab and select a product first')));
      return;
    }
    final ok = await showConfirmSheet(
      context,
      title: 'Write to Tag',
      body: 'Write "${state.selectedProduct!.name}" '
            '(${state.selectedProduct!.sku}) to this tag?',
      confirmLabel: 'Write',
    );
    if (!ok || !mounted) return;
    setState(() => _busy = true);
    final result = await state.writeProductToTag(
        epc: widget.scan.epc, password: _pwdCtrl.text);
    setState(() { _writeResult = result; _busy = false; });
  }

  Future<void> _doIdentify() async {
    setState(() => _busy = true);
    final record = await context.read<AppState>().fetchAndIdentify(
          scan: widget.scan,
          password: _pwdCtrl.text,
        );
    setState(() { _identified = record; _busy = false; });
  }

  Future<void> _doClear() async {
    final ok = await showConfirmSheet(
      context,
      title: 'Clear Tag Memory',
      body: 'Overwrite user memory with zeros?\nTag stays functional.',
      confirmLabel: 'Clear',
      destructive: true,
    );
    if (!ok || !mounted) return;
    setState(() => _busy = true);
    final result = await context.read<AppState>().clearTag(
          epc: widget.scan.epc,
          password: _pwdCtrl.text,
        );
    setState(() { _deleteResult = result; _busy = false; });
  }

  Future<void> _doKill() async {
    final ok = await showConfirmSheet(
      context,
      title: '☠️ Kill Tag — PERMANENT',
      body: 'This PERMANENTLY disables the tag.\n'
            'Kill password must match what is set on the tag.\n\n'
            'This CANNOT be undone.',
      confirmLabel: 'Yes, Kill Tag',
      destructive: true,
    );
    if (!ok || !mounted) return;
    setState(() => _busy = true);
    final result = await context.read<AppState>().killTag(
          epc: widget.scan.epc,
          killPassword: _pwdCtrl.text,
        );
    setState(() { _deleteResult = result; _busy = false; });
    if (result.success && mounted) Navigator.pop(context);
  }

  // ── Build ───────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tag Operations'),
        leading: BackButton(
          color: AppColors.cyan,
          onPressed: () => Navigator.pop(context),
        ),
        bottom: TabBar(
          controller: _tab,
          tabs: const [
            Tab(icon: Icon(Icons.download), text: 'Read'),
            Tab(icon: Icon(Icons.upload),   text: 'Write'),
            Tab(icon: Icon(Icons.manage_search), text: 'Identify'),
            Tab(icon: Icon(Icons.delete_forever), text: 'Delete'),
          ],
        ),
      ),
      body: Column(children: [
        // Tag header
        _TagHeader(scan: widget.scan),
        // Shared password field
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: Row(children: [
            Expanded(
              child: TextField(
                controller: _pwdCtrl,
                style: GoogleFonts.jetBrainsMono(
                    color: AppColors.text, fontSize: 13),
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[0-9a-fA-F]'))
                ],
                maxLength: 8,
                decoration: InputDecoration(
                  labelText: 'Access / Kill Password (hex)',
                  labelStyle: GoogleFonts.inter(
                      color: AppColors.subtext, fontSize: 12),
                  counterText: '',
                  prefixIcon: const Icon(Icons.lock_outline,
                      color: AppColors.subtext, size: 18),
                ),
              ),
            ),
          ]),
        ),
        const SizedBox(height: 4),
        Expanded(
          child: TabBarView(
            controller: _tab,
            children: [
              _ReadTab(busy: _busy, result: _readResult, onRead: _doRead),
              _WriteTab(busy: _busy, result: _writeResult, onWrite: _doWrite),
              _IdentifyTab(busy: _busy, record: _identified, onIdentify: _doIdentify),
              _DeleteTab(busy: _busy, result: _deleteResult, onClear: _doClear, onKill: _doKill),
            ],
          ),
        ),
      ]),
    );
  }
}

// ── Tag header ───────────────────────────────────────────────

class _TagHeader extends StatelessWidget {
  final ScanResult scan;
  const _TagHeader({required this.scan});

  @override
  Widget build(BuildContext context) => Container(
        color: AppColors.surface,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(children: [
          const Icon(Icons.nfc, color: AppColors.cyan, size: 18),
          const SizedBox(width: 10),
          Expanded(child: EpcChip(epc: scan.epc)),
          const SizedBox(width: 10),
          RssiIndicator(rssi: scan.rssi),
        ]),
      );
}

// ── Read Tab ─────────────────────────────────────────────────

class _ReadTab extends StatelessWidget {
  final bool busy;
  final OperationResult? result;
  final VoidCallback onRead;
  const _ReadTab({required this.busy, this.result, required this.onRead});

  @override
  Widget build(BuildContext context) => SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const SectionHeader(title: 'Read Tag Memory'),
          Text(
            'Reads the user memory bank from the tag. '
            'If a product was written, it will be decoded below.',
            style: GoogleFonts.inter(
                color: AppColors.subtext, fontSize: 12),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.cyan,
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(48)),
              onPressed: busy ? null : onRead,
              icon: busy
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.download),
              label: Text(busy ? 'Reading…' : 'Read Tag'),
            ),
          ),
          if (result != null) ...[
            const SizedBox(height: 16),
            OperationBanner(
              success: result!.success,
              message: result!.success ? 'Read successful' : 'Read failed',
              detail: result!.error,
            ),
            if (result!.success) ...[
              const SizedBox(height: 12),
              HexDataCard(
                hex: result!.hexData ?? '',
                decoded: result!.decodedData ?? '',
              ),
            ],
          ],
        ]),
      );
}

// ── Write Tab ────────────────────────────────────────────────

class _WriteTab extends StatelessWidget {
  final bool busy;
  final OperationResult? result;
  final VoidCallback onWrite;
  const _WriteTab({required this.busy, this.result, required this.onWrite});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final product = state.selectedProduct;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SectionHeader(title: 'Write Product to Tag'),
        // Product preview
        if (product == null)
          _NoProductHint()
        else
          _ProductPreview(product: product),
        const SizedBox(height: 16),
        if (product != null) ...[
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(children: [
              const Icon(Icons.code, color: AppColors.subtext, size: 14),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'HEX: ${product.toHex()}',
                  style: GoogleFonts.jetBrainsMono(
                      color: AppColors.mono, fontSize: 10),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ]),
          ),
          const SizedBox(height: 12),
        ],
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.green,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(48)),
            onPressed: (busy || product == null) ? null : onWrite,
            icon: busy
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.upload),
            label: Text(busy ? 'Writing…' : 'Write to Tag'),
          ),
        ),
        if (result != null) ...[
          const SizedBox(height: 16),
          OperationBanner(
            success: result!.success,
            message: result!.success
                ? 'Product written successfully!'
                : 'Write failed',
            detail: result!.error,
          ),
        ],
      ]),
    );
  }
}

class _NoProductHint extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.amber.withOpacity(0.08),
          border: Border.all(color: AppColors.amber.withOpacity(0.4)),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(children: [
          const Icon(Icons.warning_amber, color: AppColors.amber, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'No product selected. Go to the Products tab and select one first.',
              style: GoogleFonts.inter(
                  color: AppColors.amber, fontSize: 12),
            ),
          ),
        ]),
      );
}

class _ProductPreview extends StatelessWidget {
  final Product product;
  const _ProductPreview({required this.product});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.green.withOpacity(0.06),
          border: Border.all(color: AppColors.green.withOpacity(0.4)),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(children: [
          Text(product.emoji, style: const TextStyle(fontSize: 28)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(product.name,
                  style: GoogleFonts.spaceGrotesk(
                      color: AppColors.green,
                      fontSize: 15,
                      fontWeight: FontWeight.bold)),
              Text('${product.sku}  ·  ${product.priceLabel}',
                  style: GoogleFonts.jetBrainsMono(
                      color: AppColors.subtext, fontSize: 10)),
            ]),
          ),
          const Icon(Icons.check_circle, color: AppColors.green, size: 20),
        ]),
      );
}

// ── Identify Tab ─────────────────────────────────────────────

class _IdentifyTab extends StatelessWidget {
  final bool busy;
  final RfidTagRecord? record;
  final VoidCallback onIdentify;
  const _IdentifyTab({required this.busy, this.record, required this.onIdentify});

  @override
  Widget build(BuildContext context) => SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const SectionHeader(title: 'Fetch & Identify Tag'),
          Text(
            'Reads the tag memory and looks up the product in the database.',
            style: GoogleFonts.inter(
                color: AppColors.subtext, fontSize: 12),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.amber,
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(48)),
              onPressed: busy ? null : onIdentify,
              icon: busy
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.manage_search),
              label: Text(busy ? 'Identifying…' : 'Fetch & Identify'),
            ),
          ),
          if (record != null) ...[
            const SizedBox(height: 20),
            if (record!.hasProduct)
              _IdentifiedProductCard(record: record!)
            else
              _UnknownTagCard(record: record!),
          ],
        ]),
      );
}

class _IdentifiedProductCard extends StatelessWidget {
  final RfidTagRecord record;
  const _IdentifiedProductCard({required this.record});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (_, appState, __) {
        final resolved = record.resolveProduct(appState.products);
        final name =
            resolved?.name ?? record.assignedProductName ?? 'Unknown';
        final category = resolved?.category ?? '';
        final sku = record.assignedSku ?? '';
        final price = resolved?.priceLabel ?? '—';
        final desc = resolved?.description ?? '';
        final emoji = resolved?.emoji ?? '📦';

        Widget kv(String k, String v) => Padding(
              padding: const EdgeInsets.only(bottom: 5),
              child: Row(children: [
                SizedBox(
                  width: 70,
                  child: Text(k,
                      style: GoogleFonts.inter(
                          color: AppColors.subtext, fontSize: 11)),
                ),
                Expanded(
                  child: Text(v,
                      style: GoogleFonts.jetBrainsMono(
                          color: AppColors.text,
                          fontSize: 11,
                          fontWeight: FontWeight.w600)),
                ),
              ]),
            );

        return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.green.withOpacity(0.07),
              border: Border.all(color: AppColors.green.withOpacity(0.4)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Text(emoji, style: const TextStyle(fontSize: 32)),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                    Text(name,
                        style: GoogleFonts.spaceGrotesk(
                            color: AppColors.green,
                            fontSize: 18,
                            fontWeight: FontWeight.bold)),
                    if (category.isNotEmpty)
                      Text(category,
                          style: GoogleFonts.inter(
                              color: AppColors.subtext, fontSize: 12)),
                  ]),
                ),
              ]),
              const SizedBox(height: 14),
              kv('SKU', sku.isEmpty ? '—' : sku),
              kv('Price', price),
              kv('Scanned', record.formattedTime),
              kv('RSSI', '${record.rssi} dBm'),
              if (desc.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(desc,
                    style: GoogleFonts.inter(
                        color: AppColors.subtext, fontSize: 12)),
              ],
            ]),
          ),
          const SizedBox(height: 12),
          HexDataCard(
            hex: record.rawHex,
            decoded: record.rawHex.isNotEmpty
                ? record.rawHex.substring(0, record.rawHex.length > 32
                    ? 32
                    : record.rawHex.length)
                : '',
          ),
        ]);
      },
    );
  }
}

class _UnknownTagCard extends StatelessWidget {
  final RfidTagRecord record;
  const _UnknownTagCard({required this.record});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.subtext.withOpacity(0.06),
          border: Border.all(color: AppColors.subtext.withOpacity(0.3)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const Icon(Icons.help_outline, color: AppColors.subtext),
            const SizedBox(width: 8),
            Text('No Product Assigned',
                style: GoogleFonts.spaceGrotesk(
                    color: AppColors.subtext,
                    fontSize: 15,
                    fontWeight: FontWeight.bold)),
          ]),
          const SizedBox(height: 8),
          Text(
            record.rawHex.isEmpty
                ? 'Tag memory is empty — write a product to it first.'
                : 'Tag has data but it doesn\'t match any product in the database.',
            style: GoogleFonts.inter(
                color: AppColors.subtext, fontSize: 12),
          ),
          if (record.rawHex.isNotEmpty) ...[
            const SizedBox(height: 12),
            HexDataCard(hex: record.rawHex, decoded: ''),
          ],
        ]),
      );
}

// ── Delete Tab ────────────────────────────────────────────────

class _DeleteTab extends StatelessWidget {
  final bool busy;
  final OperationResult? result;
  final VoidCallback onClear;
  final VoidCallback onKill;
  const _DeleteTab({
    required this.busy,
    this.result,
    required this.onClear,
    required this.onKill,
  });

  @override
  Widget build(BuildContext context) => SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const SectionHeader(title: 'Delete / Destroy Tag'),
          const SizedBox(height: 8),

          // Soft delete
          _DestructiveCard(
            icon: Icons.delete_sweep,
            title: 'Clear User Memory',
            subtitle:
                'Overwrites user memory bank with zeros.\n'
                'Tag remains functional — can be re-written.',
            color: AppColors.orange,
            onTap: busy ? null : onClear,
            busy: busy,
          ),
          const SizedBox(height: 14),

          // Hard delete
          _DestructiveCard(
            icon: Icons.dangerous_outlined,
            title: 'Kill Tag  (Permanent)',
            subtitle:
                'PERMANENTLY disables the tag. Uses kill password field above.\n'
                '⚠️ IRREVERSIBLE — tag cannot be used again.',
            color: AppColors.red,
            onTap: busy ? null : onKill,
            busy: busy,
          ),
          const SizedBox(height: 16),

          if (result != null)
            OperationBanner(
              success: result!.success,
              message: result!.success
                  ? 'Operation successful ✓'
                  : 'Operation failed',
              detail: result!.error,
            ),

          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.amber.withOpacity(0.07),
              border: Border.all(
                  color: AppColors.amber.withOpacity(0.3)),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(children: [
              const Icon(Icons.info_outline,
                  color: AppColors.amber, size: 16),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Kill requires a non-zero 8-hex-digit kill password '
                  'previously set on the tag\'s reserved memory. Default '
                  'tags have kill password 00000000 (kill disabled).',
                  style: GoogleFonts.inter(
                      color: AppColors.amber, fontSize: 11),
                ),
              ),
            ]),
          ),
        ]),
      );
}

class _DestructiveCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback? onTap;
  final bool busy;

  const _DestructiveCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
    required this.busy,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: color.withOpacity(0.07),
            border: Border.all(color: color.withOpacity(0.4)),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                  color: color.withOpacity(0.12), shape: BoxShape.circle),
              child: busy
                  ? SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: color))
                  : Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Text(title,
                    style: GoogleFonts.spaceGrotesk(
                        color: color,
                        fontSize: 14,
                        fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(subtitle,
                    style: GoogleFonts.inter(
                        color: color.withOpacity(0.7),
                        fontSize: 11)),
              ]),
            ),
            Icon(Icons.chevron_right,
                color: color.withOpacity(0.5)),
          ]),
        ),
      );
}
