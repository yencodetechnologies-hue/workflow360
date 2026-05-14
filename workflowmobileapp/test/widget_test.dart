import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:workflow360_rfid_app/app/app.dart';

void main() {
  testWidgets('App loads management screen', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: Workflow360App(),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Management'), findsOneWidget);
  });
}
