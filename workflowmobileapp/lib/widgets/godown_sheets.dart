// lib/widgets/godown_sheets.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/godown_api.dart';
import '../utils/app_theme.dart';
import '../utils/delivery_wizard.dart';

/// Quick godown summary from the list; full detail stays on the detail route.
Future<void> showGodownPreviewSheet(
  BuildContext context, {
  required GodownRow godown,
  int stock = 0,
}) {
  final branch = godownBranch(godown);
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) {
      final bottom = MediaQuery.paddingOf(ctx).bottom;
      return Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: EdgeInsets.fromLTRB(20, 12, 20, 16 + bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: AppGradients.brandIcon,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.warehouse_outlined, color: Colors.white, size: 26),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        godown.name,
                        style: GoogleFonts.spaceGrotesk(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppColors.text,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        [
                          if (godown.code != null && godown.code!.isNotEmpty) godown.code,
                          branch,
                        ].join(' · '),
                        style: GoogleFonts.inter(fontSize: 13, color: AppColors.subtext),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '$stock',
                      style: GoogleFonts.spaceGrotesk(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                    Text(
                      'units in stock',
                      style: GoogleFonts.inter(fontSize: 11, color: AppColors.subtext),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 20),
            _PreviewRow(icon: Icons.phone_outlined, label: 'Mobile', value: godown.mobile),
            _PreviewRow(icon: Icons.location_on_outlined, label: 'Location', value: godown.location),
            _PreviewRow(icon: Icons.home_outlined, label: 'Address', value: godown.address),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: () {
                Navigator.pop(ctx);
                context.push('/godowns/${godown.id}');
              },
              child: const Text('Open full details'),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Close'),
            ),
          ],
        ),
      );
    },
  );
}

class _PreviewRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? value;

  const _PreviewRow({required this.icon, required this.label, this.value});

  @override
  Widget build(BuildContext context) {
    final v = value?.trim();
    if (v == null || v.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: AppColors.subtext),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppColors.subtext)),
                Text(v, style: GoogleFonts.inter(fontSize: 14, color: AppColors.text)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Add-godown form in a scrollable bottom sheet (admin).
Future<GodownRow?> showGodownCreateSheet(BuildContext context) {
  final nameCtrl = TextEditingController();
  final codeCtrl = TextEditingController();
  final mobileCtrl = TextEditingController();
  final addressCtrl = TextEditingController();
  final locationCtrl = TextEditingController();
  final cityCtrl = TextEditingController();
  final passCtrl = TextEditingController(text: '123456');
  var saving = false;
  String? error;

  return showModalBottomSheet<GodownRow?>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) {
      return StatefulBuilder(
        builder: (ctx, setSheetState) {
          final bottom = MediaQuery.viewInsetsOf(ctx).bottom;
          final maxH = MediaQuery.sizeOf(ctx).height * 0.9;
          return Padding(
            padding: EdgeInsets.only(bottom: bottom),
            child: Container(
              constraints: BoxConstraints(maxHeight: maxH),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(height: 10),
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 8, 0),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Add godown',
                            style: GoogleFonts.spaceGrotesk(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppColors.text,
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: saving ? null : () => Navigator.pop(ctx),
                          icon: const Icon(Icons.close, color: AppColors.subtext),
                        ),
                      ],
                    ),
                  ),
                  Flexible(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                      child: Column(
                        children: [
                          if (error != null) ...[
                            Text(error!, style: const TextStyle(color: AppColors.red, fontSize: 13)),
                            const SizedBox(height: 8),
                          ],
                          TextField(
                            controller: nameCtrl,
                            decoration: const InputDecoration(labelText: 'Name *'),
                            enabled: !saving,
                          ),
                          TextField(
                            controller: codeCtrl,
                            decoration: const InputDecoration(labelText: 'Code *'),
                            enabled: !saving,
                          ),
                          TextField(
                            controller: mobileCtrl,
                            decoration: const InputDecoration(labelText: 'Mobile *'),
                            keyboardType: TextInputType.phone,
                            enabled: !saving,
                          ),
                          TextField(
                            controller: addressCtrl,
                            decoration: const InputDecoration(labelText: 'Address'),
                            enabled: !saving,
                          ),
                          TextField(
                            controller: locationCtrl,
                            decoration: const InputDecoration(labelText: 'Location'),
                            enabled: !saving,
                          ),
                          TextField(
                            controller: cityCtrl,
                            decoration: const InputDecoration(labelText: 'City / branch'),
                            enabled: !saving,
                          ),
                          TextField(
                            controller: passCtrl,
                            decoration: const InputDecoration(labelText: 'Password *'),
                            obscureText: true,
                            enabled: !saving,
                          ),
                        ],
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                    child: Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: saving ? null : () => Navigator.pop(ctx),
                            child: const Text('Cancel'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: FilledButton(
                            onPressed: saving
                                ? null
                                : () async {
                                    if (nameCtrl.text.trim().isEmpty ||
                                        codeCtrl.text.trim().isEmpty ||
                                        mobileCtrl.text.trim().isEmpty) {
                                      setSheetState(() => error = 'Name, code, and mobile are required');
                                      return;
                                    }
                                    setSheetState(() {
                                      saving = true;
                                      error = null;
                                    });
                                    try {
                                      final created = await GodownApi.createGodown({
                                        'name': nameCtrl.text.trim(),
                                        'code': codeCtrl.text.trim(),
                                        'mobile': mobileCtrl.text.trim(),
                                        'address': addressCtrl.text.trim().isEmpty
                                            ? null
                                            : addressCtrl.text.trim(),
                                        'location': locationCtrl.text.trim().isEmpty
                                            ? null
                                            : locationCtrl.text.trim(),
                                        'city': cityCtrl.text.trim().isEmpty
                                            ? null
                                            : cityCtrl.text.trim(),
                                        'password': passCtrl.text,
                                      });
                                      if (ctx.mounted) Navigator.pop(ctx, created);
                                    } catch (e) {
                                      setSheetState(() {
                                        saving = false;
                                        error = e
                                            .toString()
                                            .replaceFirst('ApiException: ', '')
                                            .replaceFirst('Exception: ', '');
                                      });
                                    }
                                  },
                            child: Text(saving ? 'Creating…' : 'Create'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      );
    },
  ).whenComplete(() {
    nameCtrl.dispose();
    codeCtrl.dispose();
    mobileCtrl.dispose();
    addressCtrl.dispose();
    locationCtrl.dispose();
    cityCtrl.dispose();
    passCtrl.dispose();
  });
}

/// Tappable field that opens a bottom sheet to pick one or more godowns.
class GodownMultiSelectPicker extends StatelessWidget {
  final String label;
  final List<GodownRow> godowns;
  final Set<String> selectedIds;
  final ValueChanged<Set<String>> onChanged;
  final Map<String, int>? stockByGodown;

  const GodownMultiSelectPicker({
    super.key,
    this.label = 'Godown sources',
    required this.godowns,
    required this.selectedIds,
    required this.onChanged,
    this.stockByGodown,
  });

  String get _displayValue {
    final n = selectedIds.length;
    if (n == 0) return 'Tap to select godowns';
    if (n == 1) {
      final id = selectedIds.first;
      for (final g in godowns) {
        if (g.id == id) return g.name;
      }
      return '1 godown selected';
    }
    return '$n godowns selected';
  }

  Future<void> _openSheet(BuildContext context) async {
    final result = await showModalBottomSheet<Set<String>?>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _GodownMultiSelectSheet(
        label: label,
        godowns: godowns,
        initialSelected: Set<String>.from(selectedIds),
        stockByGodown: stockByGodown,
      ),
    );
    if (!context.mounted || result == null) return;
    onChanged(result);
  }

  @override
  Widget build(BuildContext context) {
    final hasSelection = selectedIds.isNotEmpty;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _openSheet(context),
        borderRadius: BorderRadius.circular(12),
        child: Ink(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: hasSelection
                  ? AppColors.primary.withValues(alpha: 0.45)
                  : AppColors.border,
              width: hasSelection ? 1.5 : 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.warehouse_outlined,
                    color: AppColors.primary,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        label,
                        style: GoogleFonts.inter(
                          color: AppColors.subtext,
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _displayValue,
                        style: GoogleFonts.inter(
                          color: AppColors.text,
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                if (hasSelection)
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    icon: const Icon(Icons.close, size: 18, color: AppColors.subtext),
                    onPressed: () => onChanged({}),
                    tooltip: 'Clear selection',
                  ),
                const Icon(Icons.expand_more, color: AppColors.subtext),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _GodownMultiSelectSheet extends StatefulWidget {
  final String label;
  final List<GodownRow> godowns;
  final Set<String> initialSelected;
  final Map<String, int>? stockByGodown;

  const _GodownMultiSelectSheet({
    required this.label,
    required this.godowns,
    required this.initialSelected,
    this.stockByGodown,
  });

  @override
  State<_GodownMultiSelectSheet> createState() => _GodownMultiSelectSheetState();
}

class _GodownMultiSelectSheetState extends State<_GodownMultiSelectSheet> {
  late Set<String> _selected;
  String _q = '';

  @override
  void initState() {
    super.initState();
    _selected = Set<String>.from(widget.initialSelected);
  }

  List<GodownRow> get _filtered {
    final s = _q.trim().toLowerCase();
    if (s.isEmpty) return widget.godowns;
    return widget.godowns.where((g) {
      final hay = [g.name, g.code, g.address, g.mobile, g.city, g.location]
          .whereType<String>()
          .join(' ')
          .toLowerCase();
      return hay.contains(s);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final maxH = MediaQuery.sizeOf(context).height * 0.75;
    final bottom = MediaQuery.paddingOf(context).bottom;
    return Container(
      constraints: BoxConstraints(maxHeight: maxH),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 10),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 12, 8),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    widget.label,
                    style: GoogleFonts.spaceGrotesk(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.text,
                    ),
                  ),
                ),
                Text(
                  '${_selected.length} selected',
                  style: GoogleFonts.inter(fontSize: 13, color: AppColors.subtext),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close, color: AppColors.subtext),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search godowns…',
                prefixIcon: Icon(Icons.search, color: AppColors.subtext),
                isDense: true,
              ),
              onChanged: (v) => setState(() => _q = v),
            ),
          ),
          const SizedBox(height: 8),
          Flexible(
            child: _filtered.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        'No godowns match your search',
                        style: GoogleFonts.inter(color: AppColors.subtext),
                      ),
                    ),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    padding: EdgeInsets.fromLTRB(12, 0, 12, 8 + bottom),
                    itemCount: _filtered.length,
                    itemBuilder: (_, i) {
                      final g = _filtered[i];
                      final sel = _selected.contains(g.id);
                      final stock = widget.stockByGodown?[g.id] ?? 0;
                      final branch = godownBranch(g);
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Material(
                          color: sel
                              ? AppColors.primary.withValues(alpha: 0.08)
                              : AppColors.bg,
                          borderRadius: BorderRadius.circular(12),
                          child: InkWell(
                            onTap: () => setState(() {
                              if (sel) {
                                _selected.remove(g.id);
                              } else {
                                _selected.add(g.id);
                              }
                            }),
                            borderRadius: BorderRadius.circular(12),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              child: Row(
                                children: [
                                  Icon(
                                    sel ? Icons.check_box : Icons.check_box_outline_blank,
                                    color: sel ? AppColors.primary : AppColors.subtext,
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          g.name,
                                          style: GoogleFonts.inter(
                                            fontSize: 15,
                                            fontWeight: sel ? FontWeight.w600 : FontWeight.w500,
                                            color: AppColors.text,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          [
                                            if (g.code != null && g.code!.isNotEmpty) g.code,
                                            branch,
                                            '$stock units',
                                          ].join(' · '),
                                          style: GoogleFonts.inter(
                                            fontSize: 12,
                                            color: AppColors.subtext,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(16, 8, 16, 12 + bottom),
            child: FilledButton(
              onPressed: _selected.isEmpty
                  ? null
                  : () => Navigator.pop(context, _selected),
              child: Text(
                _selected.isEmpty ? 'Select at least one' : 'Done (${_selected.length})',
              ),
            ),
          ),
        ],
      ),
    );
  }
}
