# Workflow360 RFID (Flutter)

## API
- Base URL: `https://workflow360.octosofttechnologies.in/workflow360/api`
- Products: `GET /products`
- Assign tag: `POST /products/assign-tag`
- Identify tag (lookup): `POST /products/scan` with body `{ "tagId": "..." }`
- Unassign tag: `POST /products/unassign-tag`
- Bulk assign: `POST /products/bulk-assign`
- Scan history: `GET /products/scan-history`

Full paths, response shapes, and Flutter channel names: [docs/rfid_mobile_integration.md](docs/rfid_mobile_integration.md).

## Run
```bash
flutter pub get
flutter run
```

## Build APK (release)
```bash
flutter build apk --release
```

APK output:
- `build/app/outputs/flutter-apk/app-release.apk`

## UHF RFID (Newland-style PDA)
Android integrates **nlscan** intents (e.g. Newland MT95L): see `MainActivity.kt` for `SCANNER_TRIG` / `SCANNER_RESULT` and EPC extraction.

The Flutter side expects:
- Method channel: `workflow360/rfid/methods` — `init`, `startInventory`, `stopInventory`, `setPower`
- Event channel: `workflow360/rfid/events` — maps like `{ "epc": "...", "rssi": -45 }`

For other OEM readers, replace the Kotlin broadcast handling; keep the same channel contract so Dart code stays unchanged.

# workflow360_rfid_app

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.
