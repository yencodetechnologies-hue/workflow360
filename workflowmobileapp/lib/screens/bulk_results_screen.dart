// lib/screens/bulk_results_screen.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/rfid_tag_data.dart';
import '../utils/app_theme.dart';

class BulkResultsScreen extends StatelessWidget {
  final BulkOperationReport report;

  const BulkResultsScreen({super.key, required this.report});

  String get _title {
    switch (report.kind) {
      case BulkOperationKind.read:
        return 'Read all';
      case BulkOperationKind.write:
        return 'Write all';
      case BulkOperationKind.identify:
        return 'Identify all';
    }
  }

  @override
  Widget build(BuildContext context) {
    final ok = report.successCount;
    final n = report.total;
    return Scaffold(
      appBar: AppBar(
        title: Text(_title),
        leading: BackButton(
          color: AppColors.cyan,
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              children: [
                Icon(
                  ok == n ? Icons.check_circle : Icons.warning_amber_rounded,
                  color: ok == n ? AppColors.green : AppColors.amber,
                  size: 28,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$ok / $n succeeded',
                        style: GoogleFonts.spaceGrotesk(
                          color: AppColors.text,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        n == 0 ? 'No tags processed' : 'Per-tag results below',
                        style: GoogleFonts.inter(
                          color: AppColors.subtext,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 24),
              itemCount: report.rows.length,
              itemBuilder: (_, i) {
                final row = report.rows[i];
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        row.success ? Icons.check : Icons.close,
                        color: row.success ? AppColors.green : AppColors.red,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              row.shortEpc,
                              style: GoogleFonts.jetBrainsMono(
                                color: AppColors.cyan,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              row.message,
                              style: GoogleFonts.inter(
                                color: AppColors.text,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
