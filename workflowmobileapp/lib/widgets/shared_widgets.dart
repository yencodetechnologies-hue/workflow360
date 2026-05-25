// lib/widgets/shared_widgets.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../utils/app_theme.dart';
import '../services/app_state.dart';

// ── Status bar ───────────────────────────────────────────────

class ReaderStatusBar extends StatelessWidget {
  final AppState state;
  const ReaderStatusBar({super.key, required this.state});

  @override
  Widget build(BuildContext context) {
    final color = _color(state.status);
    final icon  = _icon(state.status);
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        border: Border(bottom: BorderSide(color: color.withOpacity(0.25))),
      ),
      child: Row(children: [
        _led(color),
        const SizedBox(width: 10),
        Icon(icon, color: color, size: 15),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            state.statusMessage ?? '',
            style: GoogleFonts.inter(color: color, fontSize: 12),
            maxLines: state.status == ReaderStatus.error ? 4 : 1,
            overflow: TextOverflow.ellipsis,
            softWrap: true,
          ),
        ),
        if (state.isBusy)
          SizedBox(
            width: 14,
            height: 14,
            child: CircularProgressIndicator(
                strokeWidth: 2, color: color),
          ),
      ]),
    );
  }

  Widget _led(Color color) => Container(
        width: 8,
        height: 8,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: color,
          boxShadow: [BoxShadow(color: color.withOpacity(0.7), blurRadius: 6)],
        ),
      );

  Color _color(ReaderStatus s) => switch (s) {
        ReaderStatus.ready    => AppColors.green,
        ReaderStatus.scanning => AppColors.amber,
        ReaderStatus.busy     => AppColors.cyan,
        ReaderStatus.error    => AppColors.red,
        _                     => AppColors.subtext,
      };

  IconData _icon(ReaderStatus s) => switch (s) {
        ReaderStatus.ready    => Icons.check_circle_outline,
        ReaderStatus.scanning => Icons.radar,
        ReaderStatus.busy     => Icons.sync,
        ReaderStatus.error    => Icons.error_outline,
        _                     => Icons.radio_button_unchecked,
      };
}

// ── Section header ───────────────────────────────────────────

class SectionHeader extends StatelessWidget {
  final String title;
  final Widget? trailing;
  const SectionHeader({super.key, required this.title, this.trailing});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 10, top: 4),
        child: Row(children: [
          Text(title.toUpperCase(),
              style: GoogleFonts.inter(
                  color: AppColors.subtext,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.5)),
          const SizedBox(width: 8),
          const Expanded(child: Divider(height: 1)),
          if (trailing != null) ...[const SizedBox(width: 8), trailing!],
        ]),
      );
}

// ── EPC chip with copy ───────────────────────────────────────

class EpcChip extends StatelessWidget {
  final String epc;
  const EpcChip({super.key, required this.epc});

  @override
  Widget build(BuildContext context) {
    final short = epc.length > 16
        ? '${epc.substring(0, 8)}…${epc.substring(epc.length - 4)}'
        : epc;
    return GestureDetector(
      onTap: () {
        Clipboard.setData(ClipboardData(text: epc));
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('EPC copied'), duration: Duration(seconds: 1)));
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: AppColors.cyan.withOpacity(0.08),
          border: Border.all(color: AppColors.cyan.withOpacity(0.35)),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.nfc, color: AppColors.cyan, size: 13),
          const SizedBox(width: 5),
          Text(
            short,
            style: GoogleFonts.jetBrainsMono(
                color: AppColors.cyan, fontSize: 11),
          ),
          const SizedBox(width: 5),
          const Icon(Icons.copy, color: AppColors.cyan, size: 11),
        ]),
      ),
    );
  }
}

// ── Hex data display ─────────────────────────────────────────

class HexDataCard extends StatelessWidget {
  final String hex;
  final String decoded;
  const HexDataCard({super.key, required this.hex, required this.decoded});

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('HEX DATA',
              style: GoogleFonts.inter(
                  color: AppColors.subtext, fontSize: 9, letterSpacing: 1.5)),
          const SizedBox(height: 4),
          Text(
            hex.isEmpty ? '(empty)' : _formatHex(hex),
            style: GoogleFonts.jetBrainsMono(
                color: AppColors.mono,
                fontSize: 11,
                height: 1.6),
          ),
          if (decoded.isNotEmpty) ...[
            const SizedBox(height: 8),
            const Divider(height: 1),
            const SizedBox(height: 8),
            Text('DECODED',
                style: GoogleFonts.inter(
                    color: AppColors.subtext, fontSize: 9, letterSpacing: 1.5)),
            const SizedBox(height: 4),
            Text(decoded,
                style: GoogleFonts.inter(
                    color: AppColors.green,
                    fontSize: 13,
                    fontWeight: FontWeight.w600)),
          ],
        ]),
      );

  String _formatHex(String hex) {
    final chunks = <String>[];
    for (var i = 0; i < hex.length; i += 8) {
      chunks.add(hex.substring(i, i + 8 > hex.length ? hex.length : i + 8));
    }
    return chunks.join('  ');
  }
}

// ── Operation result banner ──────────────────────────────────

class OperationBanner extends StatelessWidget {
  final bool success;
  final String message;
  final String? detail;
  const OperationBanner({
    super.key,
    required this.success,
    required this.message,
    this.detail,
  });

  @override
  Widget build(BuildContext context) {
    final color = success ? AppColors.green : AppColors.red;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        border: Border.all(color: color.withOpacity(0.4)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(children: [
        Icon(
            success ? Icons.check_circle : Icons.cancel,
            color: color,
            size: 20),
        const SizedBox(width: 10),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(message,
                style: GoogleFonts.inter(
                    color: color,
                    fontWeight: FontWeight.w700,
                    fontSize: 13)),
            if (detail != null)
              Text(detail!,
                  style: GoogleFonts.inter(
                      color: color.withOpacity(0.7), fontSize: 11)),
          ]),
        ),
      ]),
    );
  }
}

// ── RSSI signal strength ─────────────────────────────────────

class RssiIndicator extends StatelessWidget {
  final int rssi;
  const RssiIndicator({super.key, required this.rssi});

  @override
  Widget build(BuildContext context) {
    final bars = rssi > -55 ? 4 : rssi > -65 ? 3 : rssi > -75 ? 2 : 1;
    final color = rssi > -55
        ? AppColors.green
        : rssi > -65
            ? AppColors.amber
            : AppColors.red;
    return Row(mainAxisSize: MainAxisSize.min, children: [
      for (var i = 1; i <= 4; i++)
        Container(
          margin: const EdgeInsets.only(right: 2),
          width: 4,
          height: 6.0 + i * 3,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(2),
            color: i <= bars ? color : AppColors.border,
          ),
        ),
      const SizedBox(width: 4),
      Text('$rssi dBm',
          style: GoogleFonts.jetBrainsMono(color: color, fontSize: 10)),
    ]);
  }
}

// ── Branch / city filter (godown lists) ──────────────────────

/// Mobile-friendly branch filter: tappable field opens a bottom sheet list.
class BranchFilterPicker extends StatelessWidget {
  final String label;
  final String? value;
  final List<String> options;
  final ValueChanged<String?> onChanged;
  final Map<String, int>? counts;

  const BranchFilterPicker({
    super.key,
    this.label = 'Branch / city',
    required this.value,
    required this.options,
    required this.onChanged,
    this.counts,
  });

  String get _displayValue {
    final v = value?.trim();
    if (v == null || v.isEmpty) return 'All branches';
    return v;
  }

  bool get _hasFilter {
    final v = value?.trim();
    return v != null && v.isNotEmpty;
  }

  Future<void> _openSheet(BuildContext context) async {
    final picked = await showModalBottomSheet<String?>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _BranchFilterSheet(
        label: label,
        selected: value?.trim().isEmpty == true ? null : value?.trim(),
        options: options,
        counts: counts,
      ),
    );
    if (!context.mounted || picked == null) return;
    onChanged(picked.isEmpty ? null : picked);
  }

  @override
  Widget build(BuildContext context) {
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
              color: _hasFilter
                  ? AppColors.primary.withValues(alpha: 0.45)
                  : AppColors.border,
              width: _hasFilter ? 1.5 : 1,
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
                    Icons.location_city_outlined,
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
                if (_hasFilter)
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    icon: const Icon(Icons.close, size: 18, color: AppColors.subtext),
                    onPressed: () => onChanged(null),
                    tooltip: 'Clear filter',
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

class _BranchFilterSheet extends StatelessWidget {
  final String label;
  final String? selected;
  final List<String> options;
  final Map<String, int>? counts;

  const _BranchFilterSheet({
    required this.label,
    required this.selected,
    required this.options,
    this.counts,
  });

  @override
  Widget build(BuildContext context) {
    final maxH = MediaQuery.sizeOf(context).height * 0.55;
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
                    label,
                    style: GoogleFonts.spaceGrotesk(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.text,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close, color: AppColors.subtext),
                ),
              ],
            ),
          ),
          Flexible(
            child: ListView(
              shrinkWrap: true,
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 24),
              children: [
                _BranchTile(
                  title: 'All branches',
                  subtitle: 'Show every godown',
                  icon: Icons.warehouse_outlined,
                  selected: selected == null || selected!.isEmpty,
                  onTap: () => Navigator.pop(context, ''),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 4),
                  child: Divider(height: 1),
                ),
                ...options.map((b) {
                  final n = counts?[b];
                  return _BranchTile(
                    title: b,
                    subtitle: n != null ? '$n godown${n == 1 ? '' : 's'}' : null,
                    icon: Icons.place_outlined,
                    selected: selected == b,
                    onTap: () => Navigator.pop(context, b),
                  );
                }),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BranchTile extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _BranchTile({
    required this.title,
    this.subtitle,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Material(
        color: selected
            ? AppColors.primary.withValues(alpha: 0.08)
            : AppColors.bg,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                Icon(
                  icon,
                  size: 22,
                  color: selected ? AppColors.primary : AppColors.subtext,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                          color: AppColors.text,
                        ),
                      ),
                      if (subtitle != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          subtitle!,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: AppColors.subtext,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                if (selected)
                  const Icon(Icons.check_circle, color: AppColors.primary, size: 22),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Confirm bottom sheet ─────────────────────────────────────

Future<bool> showConfirmSheet(
  BuildContext context, {
  required String title,
  required String body,
  required String confirmLabel,
  bool destructive = false,
}) async {
  final result = await showModalBottomSheet<bool>(
    context: context,
    backgroundColor: AppColors.card,
    shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
    builder: (_) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
              width: 40, height: 4,
              decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 20),
          Text(title,
              style: GoogleFonts.spaceGrotesk(
                  color: destructive ? AppColors.red : AppColors.text,
                  fontSize: 18,
                  fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Text(body,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                  color: AppColors.subtext, fontSize: 14)),
          const SizedBox(height: 24),
          Row(children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Cancel'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                    backgroundColor:
                        destructive ? AppColors.red : AppColors.cyan,
                    foregroundColor: Colors.white),
                onPressed: () => Navigator.pop(context, true),
                child: Text(confirmLabel),
              ),
            ),
          ]),
        ]),
      ),
    ),
  );
  return result ?? false;
}
