import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:rfid_product_manager/main.dart';
import 'package:rfid_product_manager/services/app_state.dart';

void main() {
  testWidgets('Workflow360 app loads', (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AppState(),
        child: const Workflow360App(),
      ),
    );
    await tester.pump();
    expect(find.text('Workflow 360'), findsWidgets);
  });
}
