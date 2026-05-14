package com.octosoft.workflow360.workflow360_rfid_app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.util.Log
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodChannel
import java.util.concurrent.atomic.AtomicBoolean

class MainActivity : FlutterActivity() {
  private val TAG = "Workflow360_Native"

  // Flutter channel names — must match rfid_service.dart exactly
  private val methodChannelName = "workflow360/rfid/methods"
  private val eventChannelName = "workflow360/rfid/events"

  // Newland Intent constants
  private val actionScannerResult = "nlscan.action.SCANNER_RESULT"
  private val actionScannerTrig = "nlscan.action.SCANNER_TRIG"
  private val actionScannerStop = "nlscan.action.STOP_SCAN"
  private val extraBarcode1 = "SCAN_BARCODE1"
  private val extraScanState = "SCAN_STATE"

  private var eventSink: EventChannel.EventSink? = null
  private val inventoryRunning = AtomicBoolean(false)

  // Receiver for Newland scanner broadcasts
  private val scanReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      if (intent?.action == actionScannerResult) {
        val scanState = intent.getStringExtra(extraScanState)
        println("DEBUG NATIVE: Received scan broadcast. State: $scanState")
        Log.d(TAG, "Received scan broadcast. State: $scanState")

        if (scanState == "fail") return

        val barcode = intent.getStringExtra(extraBarcode1)
        if (barcode != null) {
          println("DEBUG NATIVE: Tag read: $barcode")
          Log.d(TAG, "Tag read: $barcode")
          val payload = mapOf("epc" to barcode, "rssi" to -45)
          runOnUiThread { eventSink?.success(payload) }
        }
      }
    }
  }

  override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
    super.configureFlutterEngine(flutterEngine)

    MethodChannel(
      flutterEngine.dartExecutor.binaryMessenger,
      methodChannelName
    ).setMethodCallHandler { call, result ->
      when (call.method) {
        "init" -> {
          println("DEBUG NATIVE: init called")
          result.success(true)
        }

        "startInventory" -> {
          println("DEBUG NATIVE: startInventory called")
          if (inventoryRunning.compareAndSet(false, true)) {
            val intent = Intent(actionScannerTrig)
            intent.putExtra("SCAN_TYPE", 2) // Multi-read
            intent.putExtra("SCAN_TIMEOUT", 9)
            sendBroadcast(intent)
          }
          result.success(true)
        }

        "stopInventory" -> {
          println("DEBUG NATIVE: stopInventory called")
          inventoryRunning.set(false)
          sendBroadcast(Intent(actionScannerStop))
          result.success(true)
        }

        "setPower" -> {
          println("DEBUG NATIVE: setPower called")
          result.success(true)
        }

        else -> result.notImplemented()
      }
    }

    EventChannel(
      flutterEngine.dartExecutor.binaryMessenger,
      eventChannelName
    ).setStreamHandler(object : EventChannel.StreamHandler {
      override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
        println("DEBUG NATIVE: EventChannel listen started")
        eventSink = events
        val filter = IntentFilter(actionScannerResult)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          registerReceiver(scanReceiver, filter, Context.RECEIVER_EXPORTED)
        } else {
          registerReceiver(scanReceiver, filter)
        }
      }

      override fun onCancel(arguments: Any?) {
        println("DEBUG NATIVE: EventChannel listen cancelled")
        eventSink = null
        try {
          unregisterReceiver(scanReceiver)
        } catch (e: Exception) {
          Log.e(TAG, "Error unregistering receiver: ${e.message}")
        }
      }
    })
  }

  override fun onDestroy() {
    println("DEBUG NATIVE: onDestroy called")
    try {
      sendBroadcast(Intent(actionScannerStop))
      unregisterReceiver(scanReceiver)
    } catch (e: Exception) {}
    super.onDestroy()
  }
}
