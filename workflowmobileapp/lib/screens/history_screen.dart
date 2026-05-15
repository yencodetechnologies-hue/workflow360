// lib/screens/history_screen.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../models/rfid_tag_data.dart';
import '../services/app_state.dart';
import '../utils/app_theme.dart';
import '../widgets/shared_widgets.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (_, state, __) => Column(children: [
        ReaderStatusBar(state: state),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Tag History',
                  style: GoogleFonts.spaceGrotesk(
                      color: AppColors.text,
                      fontSize: 20,
                      fontWeight: FontWeight.bold)),
              if (state.tagRecords.isNotEmpty)
                TextButton.icon(
                  onPressed: state.clearRecords,
                  icon: const Icon(Icons.clear_all,
                      size: 16, color: AppColors.subtext),
                  label: Text('Clear',
                      style: GoogleFonts.inter(
                          color: AppColors.subtext, fontSize: 12)),
                ),
            ],
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: state.tagRecords.isEmpty
              ? _empty()
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(14, 10, 14, 80),
                  itemCount: state.tagRecords.length,
                  itemBuilder: (_, i) => _HistoryCard(
                      record: state.tagRecords[i],
                      catalog: state.products,
                    ),
                ),
        ),
      ]),
    );
  }

  Widget _empty() => Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Icon(Icons.history, size: 60, color: AppColors.border),
          const SizedBox(height: 12),
          Text('No tags identified yet',
              style: GoogleFonts.inter(
                  color: AppColors.subtext, fontSize: 14)),
          const SizedBox(height: 4),
          Text('Use Fetch & Identify from the Scan new products tab',
              style: GoogleFonts.inter(
                  color: AppColors.subtext.withOpacity(0.5), fontSize: 12)),
        ]),
      );
}

class _HistoryCard extends StatelessWidget {
  final RfidTagRecord record;
  final List<Product> catalog;

  const _HistoryCard({required this.record, required this.catalog});

  @override
  Widget build(BuildContext context) {
    final resolved = record.resolveProduct(catalog);
    final hasProduct = record.hasProduct;
    final title = hasProduct
        ? (resolved?.name ??
            record.assignedProductName ??
            record.assignedSku ??
            'Unknown')
        : 'Unknown Tag';
    final skuLine = hasProduct ? (record.assignedSku ?? '') : '';
    final priceLine =
        resolved != null ? resolved.priceLabel : (hasProduct ? '—' : '');

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: hasProduct
              ? AppColors.green.withOpacity(0.3)
              : AppColors.border,
        ),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Top row
        Row(children: [
          if (hasProduct)
            Text(resolved?.emoji ?? '📦', style: const TextStyle(fontSize: 22))
          else
            const Icon(Icons.help_outline,
                color: AppColors.subtext, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(
                title,
                style: GoogleFonts.spaceGrotesk(
                    color: hasProduct ? AppColors.green : AppColors.subtext,
                    fontSize: 15,
                    fontWeight: FontWeight.bold),
              ),
              if (hasProduct && skuLine.isNotEmpty)
                Text(skuLine,
                    style: GoogleFonts.jetBrainsMono(
                        color: AppColors.subtext, fontSize: 10)),
            ]),
          ),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            if (hasProduct && priceLine.isNotEmpty)
              Text(
                priceLine,
                style: GoogleFonts.spaceGrotesk(
                    color: AppColors.green,
                    fontSize: 13,
                    fontWeight: FontWeight.bold),
              ),
            Text(record.formattedTime,
                style: GoogleFonts.inter(
                    color: AppColors.subtext, fontSize: 10)),
          ]),
        ]),
        const SizedBox(height: 10),
        // EPC + RSSI
        Row(children: [
          Expanded(child: EpcChip(epc: record.epc)),
          const SizedBox(width: 10),
          RssiIndicator(rssi: record.rssi),
        ]),
        // Raw hex preview
        if (record.rawHex.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(
            record.rawHex.length > 32
                ? '${record.rawHex.substring(0, 32)}…'
                : record.rawHex,
            style: GoogleFonts.jetBrainsMono(
                color: AppColors.mono, fontSize: 10),
          ),
        ],
      ]),
    );
  }
}
