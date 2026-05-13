# Workflow360 RFID (Flutter)

## API
- Base URL: `https://workflow360.octosofttechnologies.in/workflow360/api`
- Products: `GET /products`
- Assign tag: `POST /assign-tag`
- Scan: `POST /scan`
- Bulk assign: `POST /bulk-assign`
- Scan history: `GET /scan-history`

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

## Chainway UHF SDK hookup
Right now the Android side emits **fake EPCs** so you can test the app flow without the vendor SDK.

To connect the real Chainway SDK, update Android implementation in:
- `android/app/src/main/kotlin/com/octosoft/workflow360/workflow360_rfid_app/MainActivity.kt`

The Flutter side expects:
- Method channel: `workflow360/rfid/methods` with methods `init`, `startInventory`, `stopInventory`, `setPower`
- Event channel: `workflow360/rfid/events` emitting maps like `{ "epc": "...", "rssi": -45 }`

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
