package com.octosoft.workflow360.workflow360_rfid_app

import android.os.Handler
import android.os.Looper
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodChannel
import java.util.concurrent.atomic.AtomicBoolean

class MainActivity : FlutterActivity() {
  private val methodChannelName = "workflow360/rfid/methods"
  private val eventChannelName = "workflow360/rfid/events"

  private val handler = Handler(Looper.getMainLooper())
  private var eventSink: EventChannel.EventSink? = null
  private val inventoryRunning = AtomicBoolean(false)

  override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
    super.configureFlutterEngine(flutterEngine)

    MethodChannel(
      flutterEngine.dartExecutor.binaryMessenger,
      methodChannelName
    ).setMethodCallHandler { call, result ->
      when (call.method) {
        "init" -> {
          // Placeholder: real Chainway SDK init will be added when SDK is present.
          result.success(true)
        }

        "startInventory" -> {
          if (inventoryRunning.compareAndSet(false, true)) {
            startFakeInventory()
          }
          result.success(true)
        }

        "stopInventory" -> {
          inventoryRunning.set(false)
          result.success(true)
        }

        "setPower" -> {
          // Placeholder.
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
        eventSink = events
      }

      override fun onCancel(arguments: Any?) {
        eventSink = null
      }
    })
  }

  private fun startFakeInventory() {
    // Emits fake EPCs periodically so the Flutter side can be tested now.
    // When Chainway SDK is added, replace this with real inventory callbacks.
    val epcs = listOf(
      "300833B2DDD9014000000000",
      "300833B2DDD9014000000001",
      "300833B2DDD9014000000002"
    )
    fun tick(i: Int) {
      if (!inventoryRunning.get()) return
      val epc = epcs[i % epcs.size]
      val payload = mapOf("epc" to epc, "rssi" to -45)
      eventSink?.success(payload)
      handler.postDelayed({ tick(i + 1) }, 800)
    }
    tick(0)
  }
}
