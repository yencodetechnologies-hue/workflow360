import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:workflow360_rfid_app/api/api_models.dart';
import 'package:workflow360_rfid_app/api/providers.dart';
import 'package:workflow360_rfid_app/features/management/product_picker.dart';
import 'package:workflow360_rfid_app/features/products/product_detail_args.dart';
import 'package:workflow360_rfid_app/features/products/products_controller.dart';
import 'package:workflow360_rfid_app/rfid/rfid_models.dart';
import 'package:workflow360_rfid_app/rfid/rfid_service.dart';

class ManagementScreen extends ConsumerStatefulWidget {
  const ManagementScreen({super.key});

  @override
  ConsumerState<ManagementScreen> createState() => _ManagementScreenState();
}

class _ManagementScreenState extends ConsumerState<ManagementScreen> {
  bool _apiBusy = false;

  /// Starts UHF inventory and waits for one tag or the user to cancel.
  /// Returns null on timeout or cancel.
  Future<RfidTag?> _readOneTag() async {
    if (!mounted) return null;

    final rfid = ref.read(rfidServiceProvider);
    
    return await showDialog<RfidTag?>(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.black54,
      builder: (dialogContext) {
        return PopScope(
          canPop: false,
          child: Dialog(
            insetPadding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: _UhfReadingBody(
                rfid: rfid,
                title: 'UHF Scanner',
                message: 'Press Start to begin scanning, or use the device trigger.',
              ),
            ),
          ),
        );
      },
    );
  }

  String _errorMessage(Object e) {
    if (e is DioException) {
      final msg = e.message;
      if (msg != null && msg.isNotEmpty) return msg;
    }
    return e.toString();
  }

  Future<void> _assignProduct() async {
    final product = await ProductPicker.pick(context);
    if (product == null) return;

    final hasTag = product.tagId != null && product.tagId!.isNotEmpty;
    if (hasTag && mounted) {
      final confirm = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Product already assigned'),
          content: Text(
            'This product already has tag:\n${product.tagId}\n\nReplace with a new tag?',
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Reassign')),
          ],
        ),
      );
      if (confirm != true) return;
    }

    if (!mounted) return;
    final tag = await _readOneTag();
    if (tag == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            behavior: SnackBarBehavior.floating,
            content: Text(
              'No tag read before timeout (${RfidService.defaultScanTimeout.inSeconds}s). Try again.',
            ),
          ),
        );
      }
      return;
    }

    setState(() => _apiBusy = true);
    try {
      final api = ref.read(workflow360ApiProvider);
      final result = await api.assignTag(AssignTagRequest(
        productId: product.productId,
        tagId: tag.epc,
      ));

      if (mounted) {
        final epcShort = tag.epc.length > 20 ? '${tag.epc.substring(0, 20)}…' : tag.epc;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            behavior: SnackBarBehavior.floating,
            content: Text('${result.message} — Tag: $epcShort'),
          ),
        );
        ref.invalidate(productsProvider);
      }
    } catch (e) {
      debugPrint('DEBUG: Assign Product Error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(behavior: SnackBarBehavior.floating, content: Text(_errorMessage(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _apiBusy = false);
    }
  }

  Future<void> _unassignTag() async {
    final tag = await _readOneTag();
    if (tag == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            behavior: SnackBarBehavior.floating,
            content: Text(
              'No tag read before timeout (${RfidService.defaultScanTimeout.inSeconds}s). Try again.',
            ),
          ),
        );
      }
      return;
    }

    if (!mounted) return;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove tag assignment?'),
        content: SelectableText(
          tag.epc,
          style: const TextStyle(fontFamily: 'monospace', fontSize: 13),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Unassign'),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    setState(() => _apiBusy = true);
    try {
      final api = ref.read(workflow360ApiProvider);
      final result = await api.unassignTag(UnassignTagRequest(tagId: tag.epc));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            behavior: SnackBarBehavior.floating,
            content: Text(result.message),
          ),
        );
        ref.invalidate(productsProvider);
      }
    } catch (e) {
      debugPrint('DEBUG: Unassign Tag Error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(behavior: SnackBarBehavior.floating, content: Text(_errorMessage(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _apiBusy = false);
    }
  }

  Future<void> _browseTaggedProducts() async {
    context.push('/tagged-products');
  }

  Future<void> _identifyTag() async {
    final tag = await _readOneTag();
    if (tag == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            behavior: SnackBarBehavior.floating,
            content: Text(
              'No tag read before timeout (${RfidService.defaultScanTimeout.inSeconds}s). Try again.',
            ),
          ),
        );
      }
      return;
    }

    setState(() => _apiBusy = true);
    try {
      final api = ref.read(workflow360ApiProvider);
      final result = await api.identifyByTagId(tag.epc);

      if (!mounted) return;
      if (result.product != null) {
        await _showIdentifyResultSheet(product: result.product!, tag: tag);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            behavior: SnackBarBehavior.floating,
            content: Text('No product matched this tag.'),
          ),
        );
      }
    } catch (e) {
      debugPrint('DEBUG: Identify Tag Error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(behavior: SnackBarBehavior.floating, content: Text(_errorMessage(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _apiBusy = false);
    }
  }

  Future<void> _showIdentifyResultSheet({
    required Product product,
    required RfidTag tag,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) {
        final bottom = MediaQuery.viewPaddingOf(ctx).bottom;
        return Padding(
          padding: EdgeInsets.fromLTRB(24, 8, 24, 16 + bottom),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Matched product', style: Theme.of(ctx).textTheme.titleLarge),
              const SizedBox(height: 16),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(product.name, style: Theme.of(ctx).textTheme.titleMedium),
                subtitle: Text('ID ${product.productId} · SKU ${product.sku}'),
              ),
              const SizedBox(height: 8),
              Text('Tag (EPC)', style: Theme.of(ctx).textTheme.labelLarge),
              const SizedBox(height: 4),
              SelectableText(
                tag.epc,
                style: const TextStyle(fontFamily: 'monospace', fontSize: 13),
              ),
              if (tag.rssi != null) ...[
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(
                      Icons.signal_cellular_alt_rounded,
                      size: 15,
                      color: Theme.of(ctx).colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: 5),
                    Text(
                      'RSSI ${tag.rssi} dBm',
                      style: Theme.of(ctx).textTheme.bodySmall?.copyWith(
                            color: Theme.of(ctx).colorScheme.onSurfaceVariant,
                          ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 20),
              FilledButton.tonalIcon(
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: tag.epc));
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      const SnackBar(
                        behavior: SnackBarBehavior.floating,
                        content: Text('EPC copied'),
                      ),
                    );
                  }
                },
                icon: const Icon(Icons.copy),
                label: const Text('Copy EPC'),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Close'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        context.push(
                          '/products/${product.productId}',
                          extra: ProductDetailArgs(product: product),
                        );
                      },
                      child: const Text('Open product'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Management'),
        actions: [
          IconButton(
            onPressed: () => context.go('/products'),
            icon: const Icon(Icons.inventory_2_outlined),
            tooltip: 'Products',
          ),
        ],
      ),
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                sliver: SliverToBoxAdapter(
                  child: _ManagementHero(colorScheme: scheme),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    _ManagementActionCard(
                      icon: Icons.add_link_rounded,
                      title: 'Assign product',
                      subtitle: 'Choose a product, then scan its UHF tag to link.',
                      foreground: scheme.onPrimaryContainer,
                      background: scheme.primaryContainer,
                      onTap: _assignProduct,
                    ),
                    const SizedBox(height: 12),
                    _ManagementActionCard(
                      icon: Icons.link_off_rounded,
                      title: 'Remove tag assignment',
                      subtitle: 'Scan a tag to clear it from the product record.',
                      foreground: scheme.onErrorContainer,
                      background: scheme.errorContainer,
                      onTap: _unassignTag,
                    ),
                    const SizedBox(height: 12),
                    _ManagementActionCard(
                      icon: Icons.list_alt_rounded,
                      title: 'Browse tagged products',
                      subtitle: 'View all products that currently have a tag ID.',
                      foreground: scheme.onTertiaryContainer,
                      background: scheme.tertiaryContainer,
                      onTap: _browseTaggedProducts,
                    ),
                    const SizedBox(height: 12),
                    _ManagementActionCard(
                      icon: Icons.nfc_rounded,
                      title: 'Identify tag',
                      subtitle: 'Scan a tag to look up which product it belongs to.',
                      foreground: scheme.onSecondaryContainer,
                      background: scheme.secondaryContainer,
                      onTap: _identifyTag,
                    ),
                    const SizedBox(height: 24),
                  ]),
                ),
              ),
            ],
          ),
          if (_apiBusy)
            Positioned.fill(
              child: ColoredBox(
                color: Colors.black26,
                child: Center(
                  child: Card(
                    elevation: 6,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 22),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const SizedBox(
                            width: 36,
                            height: 36,
                            child: CircularProgressIndicator(strokeWidth: 3),
                          ),
                          const SizedBox(height: 14),
                          Text(
                            'Talking to server…',
                            style: Theme.of(context).textTheme.titleSmall,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ManagementHero extends StatelessWidget {
  const _ManagementHero({required this.colorScheme});

  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Material(
      elevation: 0,
      borderRadius: BorderRadius.circular(20),
      color: colorScheme.surfaceContainerHighest,
      child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          child: Row(
            children: [
              Icon(Icons.settings_input_antenna, size: 40, color: colorScheme.primary),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('UHF operations', style: text.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text(
                      'Optimized for Newland MT95L-style readers (nlscan broadcasts).',
                      style: text.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
    );
  }
}

class _ManagementActionCard extends StatelessWidget {
  const _ManagementActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.foreground,
    required this.background,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Color foreground;
  final Color background;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: background,
      borderRadius: BorderRadius.circular(20),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 36, color: foreground),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: foreground,
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: foreground.withValues(alpha: 0.85),
                          ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: foreground.withValues(alpha: 0.6)),
            ],
          ),
        ),
      ),
    );
  }
}

class _UhfReadingBody extends StatefulWidget {
  const _UhfReadingBody({
    required this.rfid,
    required this.title,
    required this.message,
  });

  final RfidService rfid;
  final String title;
  final String message;

  @override
  State<_UhfReadingBody> createState() => _UhfReadingBodyState();
}

class _UhfReadingBodyState extends State<_UhfReadingBody> with SingleTickerProviderStateMixin {
  late final AnimationController _pulse;
  StreamSubscription? _sub;
  bool _isScanning = false;
  RfidTag? _latestTag;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    )..repeat(reverse: true);
    
    // Automatically start scanning on open (optional, but requested "start and stop")
    _toggleScan();
  }

  Future<void> _toggleScan() async {
    if (_isScanning) {
      await _stopScan();
    } else {
      await _startScan();
    }
  }

  Future<void> _startScan() async {
    try {
      await widget.rfid.init();
      await widget.rfid.startInventory();
      setState(() {
        _isScanning = true;
        _latestTag = null;
      });
      _sub = widget.rfid.onTagRead.listen((tag) {
        setState(() => _latestTag = tag);
        // If we only want ONE tag, we could auto-stop here.
        // But for "Start/Stop" feel, we let it run.
      });
    } catch (e) {
      debugPrint('Scan Start Error: $e');
    }
  }

  Future<void> _stopScan() async {
    await _sub?.cancel();
    await widget.rfid.stopInventory();
    if (mounted) {
      setState(() => _isScanning = false);
    }
  }

  @override
  void dispose() {
    _sub?.cancel();
    widget.rfid.stopInventory();
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (_isScanning)
          ScaleTransition(
            scale: Tween<double>(begin: 0.88, end: 1.0).animate(
              CurvedAnimation(parent: _pulse, curve: Curves.easeInOut),
            ),
            child: Icon(Icons.sensors, size: 56, color: scheme.primary),
          )
        else
          Icon(Icons.sensors_off, size: 56, color: scheme.outline),
        const SizedBox(height: 16),
        Text(widget.title, style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 10),
        Text(
          _isScanning ? 'Scanning for tags...' : 'Scanner stopped',
          style: TextStyle(color: _isScanning ? scheme.primary : scheme.outline, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        if (_latestTag != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: scheme.primaryContainer,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: [
                const Text('Latest Tag Read:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(_latestTag!.epc, style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            if (!_isScanning)
              FilledButton.icon(
                onPressed: _startScan,
                icon: const Icon(Icons.play_arrow),
                label: const Text('Start'),
              )
            else
              FilledButton.icon(
                style: FilledButton.styleFrom(backgroundColor: scheme.error),
                onPressed: _stopScan,
                icon: const Icon(Icons.stop),
                label: const Text('Stop'),
              ),
          ],
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context, null),
                child: const Text('Cancel'),
              ),
            ),
            if (_latestTag != null) ...[
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: () => Navigator.pop(context, _latestTag),
                  child: const Text('Select Tag'),
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }
}
