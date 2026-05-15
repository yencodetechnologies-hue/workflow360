import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:rfid_product_manager/main.dart';
import 'package:rfid_product_manager/services/app_state.dart';

void main() {
  testWidgets('RFID app loads', (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AppState(),
        child: const RfidApp(),
      ),
    );
    await tester.pump();
    // AppState opens the reader in mock mode with an 800ms delay.
    await tester.pump(const Duration(milliseconds: 900));
    expect(find.byType(RfidApp), findsOneWidget);
  });
}
