package com.nlscan.uhf.demo.util.log;

import android.util.Log;

public class LogUtil {
    private static boolean LogEnabled = false;

    public static void d(String TAG, String msg) {
        if (LogEnabled)
            Log.d(TAG, msg);
    }

    public static void e(String TAG, String msg) {
        if (LogEnabled)
            Log.e(TAG, msg);
    }

    public static void i(String TAG, String msg) {
        if (LogEnabled)
            Log.i(TAG, msg);
    }

    public static void v(String TAG, String msg) {
        if (LogEnabled)
            Log.v(TAG, msg);
    }
}
