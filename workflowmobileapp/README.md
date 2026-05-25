# RFID Product Manager
### Flutter + Newland NLS-MT95L UHF RFID (URM-500-SDK-V12.1)

---

## Features

| Screen | What it does |
|---|---|
| **Products** | Select one of 5 demo products to assign to tags |
| **Scan** | Start UHF inventory — discovers all tags in range |
| **Tag → Read** | Reads user memory bank, shows HEX + decoded text |
| **Tag → Write** | Writes selected product data (SKU+name) as hex |
| **Tag → Identify** | Reads tag + looks up SKU in product database |
| **Tag → Delete** | Clear user memory (soft) or Kill tag (hard/permanent) |

---

## Quick Start

**Default (real UHF reader):** no mock flag — the app talks to the Newland SDK on device.

```bash
flutter pub get
flutter run
```

**No hardware / emulator (mock mode):** simulates 1–3 random tags per scan.

```bash
flutter run --dart-define=RFID_MOCK=true
```

Mock read/write/identify use in-memory state only.

---

## Real Device Setup (NLS-MT95L)

### 1. Add the URM-500 SDK

```
android/app/libs/
└── urm500sdk.aar      ← copy your .aar here
```

### 2. Confirm `android/app/build.gradle` has:

```groovy
dependencies {
    implementation fileTree(dir: "libs", include: ["*.aar", "*.jar"])
}
```

### 3. Verify SDK import package names

Unzip the .aar and check the class paths. Update the imports at the
top of `android/app/src/main/kotlin/.../rfid/RfidPlugin.kt`:

```kotlin
// Adjust to match your actual SDK package
import com.newland.sdk.uhf.UHFManager
import com.newland.sdk.uhf.UHFManager.OnInventoryListener
import com.newland.sdk.uhf.bean.TagInfo
import com.newland.sdk.uhf.bean.ReadWriteResult
```

### 4. Real vs mock

Release builds use the **real reader by default** (do not pass `RFID_MOCK=true`).
For a simulator build with fake tags:

```bash
flutter run --dart-define=RFID_MOCK=true
```

### 5. Build and install

```bash
flutter build apk --release
adb install build/app/outputs/flutter-apk/app-release.apk
```

---

## The 5 Demo Products

| # | SKU | Name | Price |
|---|---|---|---|
| 1 | APPL-001 | iPhone 15 Pro | $1,199.99 |
| 2 | SAMG-002 | Galaxy S24 Ultra | $1,299.99 |
| 3 | SONY-003 | WH-1000XM5 | $349.99 |
| 4 | DELL-004 | Dell XPS 15 | $2,199.99 |
| 5 | NIKE-005 | Air Max 270 | $149.99 |

---

## Data Format on Tag

Product data is stored in user memory (Bank 3) as ASCII hex:

```
"APPL-001|iPhone 15 Pro"
 │         │
 SKU       Product name
```

Example hex written to tag:  
`4150504C2D3030317C6950686F6E652031352050726F`

---

## Operations Reference

```dart
final rfid = RfidService();

// Open
await rfid.openReader();

// Scan (tags arrive via stream)
rfid.tagStream.listen((tag) => print('${tag.epc} @ ${tag.rssi} dBm'));
await rfid.startInventory();
await rfid.stopInventory();

// Read raw hex from user bank
final read = await rfid.readTag(epc: epc);
print(read.hexData);      // "4150504C2D303031..."
print(read.decodedData);  // "APPL-001|iPhone 15 Pro"

// Write a product
await rfid.writeProduct(epc: epc, product: kProducts[0]);

// Fetch + identify in one call
final record = await rfid.fetchAndIdentify(epc: epc, rssi: -60, pc: '3000');
print(record.product?.name);  // "iPhone 15 Pro"

// Soft delete (clear memory)
await rfid.clearTag(epc: epc);

// Hard delete (permanent kill)
await rfid.killTag(epc: epc, killPassword: '12345678');
```

---

## Project Structure

```
lib/
├── main.dart                    App entry + bottom nav
├── models/
│   ├── product.dart             Product model + 5 demo products
│   └── rfid_tag_data.dart       Tag record + operation result models
├── services/
│   ├── rfid_service.dart        MethodChannel wrapper (mock + real)
│   └── app_state.dart           ChangeNotifier state manager
├── screens/
│   ├── product_list_screen.dart Product selection
│   ├── scan_screen.dart         UHF inventory + tag list
│   └── operations_screen.dart   Read / Write / Identify / Delete per tag
├── widgets/
│   └── shared_widgets.dart      Status bar, hex card, RSSI, banners
└── utils/
    └── app_theme.dart           Dark theme + color constants

android/app/
├── libs/                        ← Place URM-500 .aar here
└── src/main/kotlin/.../
    ├── MainActivity.kt
    └── rfid/
        └── RfidPlugin.kt        Native UHF bridge
```

---

## Troubleshooting

| Error | Fix |
|---|---|
| Build fails: class not found | Check .aar is in `libs/`, check package names in `RfidPlugin.kt` |
| `OPEN_FAILED` at runtime | Hardware not available or permissions missing |
| `READ_FAILED` code 0x04 | Tag has access password — enter it in the password field |
| Tags not found | Increase TX power: add `mgr.setPower(30)` after `open()` in Kotlin |
| Kill fails | Tag kill password is 00000000 (disabled) — must be set before killing |
