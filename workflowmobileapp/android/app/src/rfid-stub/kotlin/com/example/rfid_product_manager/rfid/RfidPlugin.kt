// Stub native bridge when android/app/libs/ has no .aar, or when rfid.forceStub=true in android/gradle.properties.
// Drop the vendor .aar(s) into libs/ and rebuild to compile src/rfid-sdk/ instead.

package com.example.rfid_product_manager.rfid

import androidx.annotation.NonNull
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugin.common.MethodChannel.MethodCallHandler
import io.flutter.plugin.common.MethodChannel.Result

class RfidPlugin : FlutterPlugin, MethodCallHandler {

    companion object {
        const val METHOD_CH = "com.example.rfid/method"
        const val EVENT_CH = "com.example.rfid/event"

        const val BANK_RESERVED = 0
        const val BANK_EPC = 1
        const val BANK_TID = 2
        const val BANK_USER = 3

        const val DEFAULT_PWD = "00000000"
    }

    private lateinit var methodChannel: MethodChannel
    private lateinit var eventChannel: EventChannel

    override fun onAttachedToEngine(@NonNull binding: FlutterPlugin.FlutterPluginBinding) {
        methodChannel = MethodChannel(binding.binaryMessenger, METHOD_CH)
        methodChannel.setMethodCallHandler(this)

        eventChannel = EventChannel(binding.binaryMessenger, EVENT_CH)
        eventChannel.setStreamHandler(object : EventChannel.StreamHandler {
            override fun onListen(args: Any?, sink: EventChannel.EventSink?) {}
            override fun onCancel(args: Any?) {}
        })
    }

    override fun onDetachedFromEngine(@NonNull binding: FlutterPlugin.FlutterPluginBinding) {
        methodChannel.setMethodCallHandler(null)
    }

    override fun onMethodCall(@NonNull call: MethodCall, @NonNull result: Result) {
        when (call.method) {
            "openReader" -> result.error(
                "NO_SDK",
                "RFID SDK not installed. Place the Newland URM-500 vendor .aar inside android/app/libs/ and rebuild.",
                null,
            )
            "closeReader" -> result.success(true)
            "startInventory" -> result.error(
                "NO_SDK",
                "RFID SDK not installed.",
                null,
            )
            "stopInventory" -> result.success(true)
            "readTag" -> result.error("NO_SDK", "RFID SDK not installed.", null)
            "writeTag" -> result.error("NO_SDK", "RFID SDK not installed.", null)
            "killTag" -> result.error("NO_SDK", "RFID SDK not installed.", null)
            else -> result.notImplemented()
        }
    }
}
