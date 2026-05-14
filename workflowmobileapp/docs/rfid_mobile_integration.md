# RFID mobile integration (Workflow360)

This replaces older tutorial snippets that used wrong URL paths or non-existent endpoints. The production app uses **Dio**, **Riverpod**, and native **Newland MT95L / nlscan-style** UHF broadcasts.

## Base URL

Production example:

`https://workflow360.octosofttechnologies.in/workflow360/api`

All product and RFID routes are under **`/products`** (the Express router is mounted at `/workflow360/api/products`).

## REST endpoints (correct paths)

| Action | Method | Path (relative to base URL) | Body |
|--------|--------|------------------------------|------|
| List products | `GET` | `/products` | — |
| Assign tag | `POST` | `/products/assign-tag` | `{ "productId": "...", "tagId": "..." }` |
| Identify tag (lookup product) | `POST` | `/products/scan` | `{ "tagId": "..." }` |
| Unassign tag | `POST` | `/products/unassign-tag` | `{ "tagId": "..." }` |
| Bulk assign | `POST` | `/products/bulk-assign` | JSON array of `{ "productId", "tagId" }` |
| Scan history | `GET` | `/products/scan-history` | — |

**Do not use** (they do not exist on this backend):

- `POST /assign-tag` (missing `/products`)
- `GET /identify/:tagId`
- `DELETE /remove-tag/:tagId`

### Example responses

**`POST /products/assign-tag`** — success:

```json
{ "status": "success", "message": "Tag assigned", "product": { ... } }
```

**`POST /products/scan`** — found / not found:

```json
{ "status": "success", "product": { ... } }
```

```json
{ "status": "not_found" }
```

**`POST /products/unassign-tag`** — success:

```json
{ "status": "success", "message": "Tag unassigned", "product": { ... } }
```

## Flutter ↔ Android (UHF)

The Dart side talks to Android through:

| Channel | Purpose |
|---------|---------|
| `workflow360/rfid/methods` | `init`, `startInventory`, `stopInventory`, `setPower` |
| `workflow360/rfid/events` | Stream of maps: `{ "epc": "<string>", "rssi": <int> }` |

Implementation reference:

- Dart: `lib/rfid/rfid_service.dart`
- Kotlin: `android/app/src/main/kotlin/.../MainActivity.kt` (nlscan `SCANNER_TRIG` / `SCANNER_RESULT`)

Older tutorials used a single `MethodChannel('rfid_channel')` and `invokeMethod('scanRFID')`; that is **not** what this app uses.

## NFC permission

**UHF** inventory on supported PDAs uses the vendor scan pipeline (e.g. nlscan intents), not Android NFC APIs. Do **not** add `android.permission.NFC` unless you implement separate NFC (NDEF) features. See comment in `AndroidManifest.xml`.

## Code map

- HTTP client and models: `lib/api/workflow360_api.dart`, `lib/api/api_models.dart`, `lib/api/api_config.dart`
- RFID: `lib/rfid/rfid_service.dart`, `lib/rfid/rfid_models.dart`
- Management UI (assign / unassign / identify): `lib/features/management/management_screen.dart`
