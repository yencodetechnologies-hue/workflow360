package com.nlscan.uhf.demo.util;

import android.content.Context;

import java.util.HashMap;
import java.util.LinkedHashMap;

public class ResourceValueParser {
    public static HashMap<String, Byte> parseGen2ProtocolCfgSetting(Context ctx, int resId) {
        String[] stringArray = ctx.getResources().getStringArray(resId);
        HashMap outputArray = new LinkedHashMap(stringArray.length);
        for (String entry : stringArray) {
            String[] splitResult = entry.split("\\|", 2);
            outputArray.put(splitResult[0], splitResult[1]);
        }
        System.out.println("rst len : " + (outputArray == null ? "null" : outputArray.size()));
        return outputArray;
    }
}