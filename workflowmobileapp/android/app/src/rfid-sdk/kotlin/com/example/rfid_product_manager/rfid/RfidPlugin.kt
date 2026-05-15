// android/app/src/rfid-sdk/kotlin/.../RfidPlugin.kt
//
// Built against nls_uhf_lib.jar (SDK v13.1) from android/app/libs/.
// Compiled only when that JAR is present — see build.gradle.kts.

package com.example.rfid_product_manager.rfid

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Handler
import android.os.Looper
import android.os.Parcelable
import androidx.annotation.NonNull
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugin.common.MethodChannel.MethodCallHandler
import io.flutter.plugin.common.MethodChannel.Result

import com.nlscan.uhf.lib.TagInfo
import com.nlscan.uhf.lib.UHFConstants
import com.nlscan.uhf.lib.UHFManager
import com.nlscan.uhf.lib.UHFReader

import org.json.JSONArray
import org.json.JSONObject

class RfidPlugin : FlutterPlugin, MethodCallHandler {

    companion object {
        const val METHOD_CH = "com.example.rfid/method"
        const val EVENT_CH  = "com.example.rfid/event"
    }

    private lateinit var methodChannel: MethodChannel
    private lateinit var eventChannel: EventChannel

    private var appContext: Context? = null
    private var eventSink: EventChannel.EventSink? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    // Initialised lazily after we have a context.
    private var mgr: UHFManager? = null
    private var receiverRegistered = false

    // ── Tag broadcast receiver ──────────────────────────────────

    private val tagReceiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context, intent: Intent) {
            android.util.Log.d("RfidPlugin", "onReceive: ${intent.action}")
            if (UHFConstants.ACTION_UHF_RESULT_SEND != intent.action) return
            val tags = intent.getParcelableArrayExtra(UHFManager.EXTRA_TAG_INFO)
            android.util.Log.d("RfidPlugin", "Tags found in broadcast: ${tags?.size ?: 0}")
            if (tags == null) return
            
            for (parcel in tags) {
                val tag = parcel as? TagInfo ?: continue
                val len = if (tag.Epclen > 0) tag.Epclen.toInt()
                          else tag.EpcId?.size ?: 0
                val raw = tag.EpcId ?: continue
                val epcBytes = raw.copyOfRange(0, len.coerceAtMost(raw.size))
                val epc = UHFReader.bytes_Hexstr(epcBytes)?.trim() ?: continue
                if (epc.isEmpty()) continue
                val pc = tag.PC?.let { UHFReader.bytes_Hexstr(it)?.trim()?.uppercase() } ?: "3000"
                
                android.util.Log.d("RfidPlugin", "Tag: $epc, RSSI: ${tag.RSSI}")
                
                mainHandler.post {
                    eventSink?.success(mapOf(
                        "type" to "tag",
                        "epc"  to epc,
                        "rssi" to tag.RSSI,
                        "pc"   to pc,
                    ))
                }
            }
        }
    }

    // ── FlutterPlugin ───────────────────────────────────────────

    override fun onAttachedToEngine(@NonNull binding: FlutterPlugin.FlutterPluginBinding) {
        appContext = binding.applicationContext
        mgr = UHFManager.getInstance(binding.applicationContext)

        methodChannel = MethodChannel(binding.binaryMessenger, METHOD_CH)
        methodChannel.setMethodCallHandler(this)

        eventChannel = EventChannel(binding.binaryMessenger, EVENT_CH)
        eventChannel.setStreamHandler(object : EventChannel.StreamHandler {
            override fun onListen(args: Any?, sink: EventChannel.EventSink?) { eventSink = sink }
            override fun onCancel(args: Any?) { eventSink = null }
        })
    }

    override fun onDetachedFromEngine(@NonNull binding: FlutterPlugin.FlutterPluginBinding) {
        methodChannel.setMethodCallHandler(null)
        unregisterReceiver()
        appContext = null
        mgr = null
    }

    // ── Method dispatch ─────────────────────────────────────────

    override fun onMethodCall(@NonNull call: MethodCall, @NonNull result: Result) {
        when (call.method) {
            "openReader"     -> openReader(result)
            "closeReader"    -> closeReader(result)
            "startInventory" -> startInventory(result)
            "stopInventory"  -> stopInventory(result)
            "readTag"        -> readTag(call, result)
            "writeTag"       -> writeTag(call, result)
            "killTag"        -> killTag(call, result)
            else             -> result.notImplemented()
        }
    }

    // ── Reader lifecycle ────────────────────────────────────────

    private fun openReader(result: Result) {
        val m = mgr ?: return result.success(false)
        Thread {
            android.util.Log.d("RfidPlugin", "loadUHFModule start")
            val moduleInfo = m.loadUHFModule()
            android.util.Log.d("RfidPlugin", "loadUHFModule result: $moduleInfo, isPowerOn: ${m.isPowerOn()}")
            if (moduleInfo == null) {
                mainHandler.post { result.success(false) }
                return@Thread
            }
            // Clear any stuck inventory state left by a previous session.
            val stopState = m.stopTagInventory()
            android.util.Log.d("RfidPlugin", "pre-open stopTagInventory: $stopState")
            // powerOn() establishes the application-level SDK connection to the UHF module.
            val powerState = m.powerOn()
            android.util.Log.d("RfidPlugin", "powerOn result: $powerState, isPowerOn: ${m.isPowerOn()}")
            // Set mandatory RF parameters (matching Newland demo defaults).
            setDefaultParams(m)
            val ok = m.isPowerOn()
            if (ok) registerReceiver()
            mainHandler.post { result.success(ok) }
        }.start()
    }

    private fun closeReader(result: Result) {
        android.util.Log.d("RfidPlugin", "Closing reader")
        unregisterReceiver()
        result.success(true)
    }

    // ── Inventory ───────────────────────────────────────────────

    private fun startInventory(result: Result) {
        val m = mgr ?: return result.success(false)
        Thread {
            android.util.Log.d("RfidPlugin", "startTagInventory called")
            val state = m.startTagInventory()
            android.util.Log.d("RfidPlugin", "startTagInventory result: $state")
            mainHandler.post { result.success(state == UHFReader.READER_STATE.OK_ERR) }
        }.start()
    }

    private fun stopInventory(result: Result) {
        val m = mgr ?: return result.success(true)
        Thread {
            android.util.Log.d("RfidPlugin", "stopTagInventory called")
            val state = m.stopTagInventory()
            android.util.Log.d("RfidPlugin", "stopTagInventory result: $state")
            mainHandler.post { result.success(state == UHFReader.READER_STATE.OK_ERR) }
        }.start()
    }

    // ── Read ────────────────────────────────────────────────────

    private fun readTag(call: MethodCall, result: Result) {
        val m         = mgr ?: return result.error("NO_READER", "Reader not open", null)
        val bank      = call.argument<Int>("bank")      ?: 3
        val startAddr = call.argument<Int>("startAddr") ?: 0
        val length    = call.argument<Int>("length")    ?: 8
        val password  = call.argument<String>("password")?.takeIf { it.isNotEmpty() }
        Thread {
            val data = m.GetTagData(bank, startAddr, length, password)
            val hex  = data?.let { UHFReader.bytes_Hexstr(it)?.trim() } ?: ""
            mainHandler.post {
                result.success(mapOf("success" to (data != null), "data" to hex))
            }
        }.start()
    }

    // ── Write ───────────────────────────────────────────────────

    private fun writeTag(call: MethodCall, result: Result) {
        val m         = mgr ?: return result.error("NO_READER", "Reader not open", null)
        val hexData   = call.argument<String>("data")
            ?: return result.error("BAD_ARG", "data required", null)
        val bank      = call.argument<Int>("bank")      ?: 3
        val startAddr = call.argument<Int>("startAddr") ?: 0
        val password  = call.argument<String>("password")?.takeIf { it.isNotEmpty() }
        Thread {
            val bytes = UHFReader.Str2Hex(hexData)
            val state = m.writeTagData(bank, startAddr, bytes, password)
            val ok    = state == UHFReader.READER_STATE.OK_ERR
            mainHandler.post { result.success(mapOf("success" to ok)) }
        }.start()
    }

    // ── Kill ────────────────────────────────────────────────────

    private fun killTag(call: MethodCall, result: Result) {
        val m       = mgr ?: return result.error("NO_READER", "Reader not open", null)
        val killPwd = call.argument<String>("killPassword")
            ?: return result.error("BAD_ARG", "killPassword required", null)
        Thread {
            val state = m.destroyTag(killPwd)
            val ok    = state == UHFReader.READER_STATE.OK_ERR
            mainHandler.post { result.success(mapOf("success" to ok)) }
        }.start()
    }

    // ── RF parameter initialisation ─────────────────────────────

    private fun setDefaultParams(m: UHFManager) {
        try {
            // Antenna power: read 26 dBm, write 26 dBm, antenna port 0
            val antArray = JSONArray()
            val antObj = JSONObject()
            antObj.put("antid", 0)
            antObj.put("readPower", 26)
            antObj.put("writePower", 26)
            antArray.put(antObj)
            val powerState = m.setParam("RF_ANTPOWER", "PARAM_RF_ANTPOWER", antArray.toString())
            android.util.Log.d("RfidPlugin", "setParam RF_ANTPOWER: $powerState")

            // Antenna check
            m.setParam("READER_IS_CHK_ANT", "PARAM_READER_IS_CHK_ANT", "1")

            // Inventory timing: 100 ms scan window, 0 ms pause
            m.setParam("INV_TIME_OUT",  "PARAM_INV_TIME_OUT",        "100")
            m.setParam("INV_INTERVAL",  "PARAM_INV_INTERVAL_TIME",   "0")

            // Quick inventory mode (de-duplicate, highest RSSI)
            m.setParam("INV_QUICK_MODE",              "PARAM_INV_QUICK_MODE",              "1")
            m.setParam("POTL_GEN2_SESSION",           "PARAM_POTL_GEN2_SESSION",           "1")
            m.setParam("TAGDATA_RECORDHIGHESTRSSI",   "PARAM_TAGDATA_RECORDHIGHESTRSSI",   "1")
            m.setParam("TAGDATA_UNIQUEBYEMDDATA",     "PARAM_TAGDATA_UNIQUEBYEMDDATA",     "0")
            m.setParam("POTL_GEN2_TARGET",            "PARAM_POTL_GEN2_TARGET",            "0")
            android.util.Log.d("RfidPlugin", "Default RF params set")
        } catch (e: Exception) {
            android.util.Log.w("RfidPlugin", "setDefaultParams error: $e")
        }
    }

    // ── BroadcastReceiver helpers ───────────────────────────────

    private fun registerReceiver() {
        if (receiverRegistered) return
        appContext?.registerReceiver(
            tagReceiver,
            IntentFilter(UHFConstants.ACTION_UHF_RESULT_SEND)
        )
        receiverRegistered = true
    }

    private fun unregisterReceiver() {
        if (!receiverRegistered) return
        try { appContext?.unregisterReceiver(tagReceiver) } catch (_: Exception) {}
        receiverRegistered = false
    }
}
