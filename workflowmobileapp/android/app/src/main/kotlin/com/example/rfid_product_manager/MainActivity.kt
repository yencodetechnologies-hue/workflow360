// android/app/src/main/kotlin/com/example/rfid_product_manager/MainActivity.kt
package com.example.rfid_product_manager

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import com.example.rfid_product_manager.rfid.RfidPlugin

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        flutterEngine.plugins.add(RfidPlugin())
    }
}
