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
