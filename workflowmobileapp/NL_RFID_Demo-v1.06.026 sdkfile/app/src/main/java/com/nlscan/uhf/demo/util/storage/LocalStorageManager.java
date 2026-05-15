package com.nlscan.uhf.demo.util.storage;

import android.content.Context;
import android.content.SharedPreferences;
import android.nfc.Tag;
import android.util.Log;

import com.nlscan.android.uhf.TagInfo;
import com.nlscan.android.uhf.UHFReader;
import com.nlscan.uhf.demo.AppApplication;
import com.nlscan.uhf.demo.adapter.TableItemInfo;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class LocalStorageManager {

    private final static String TAG = "LocalStorageManager";
    /**
     * 全局范围的SharePreference表名
     **/
    public static final String GLOBAL_SHARED_FILE = "global_shared_file";
    public static final String ACHIEVE_SHARED_FILE = "achieve_shared_file";

    public static final int EXPORT_DATA_STATE_FAILED = -1;
    public static final int EXPORT_DATA_STATE_CREATE_FILE_FAILED = -2;
    public static final int EXPORT_DATA_STATE_SUCCESS = 0 ;


    private static Map<Integer, SharedPreferences> sSharedPreferences = new ConcurrentHashMap<>();
    private static final int DEFAULT_SHARED_PREFERENCE_CAPACITY = 4;

    private static SharedPreferences getSharedPreference(String key) {
        return getHashSharedPreference(key);
    }

    /**
     * 根据hash算法拆分的SharedPreference
     *
     * @param key
     * @return
     */
    private static SharedPreferences getHashSharedPreference(String key) {
        int index = getKeyHash(key);
        SharedPreferences sharedPreferences = sSharedPreferences.get(index);
        if (sharedPreferences == null) {
            sharedPreferences = getHashSharedPreference(index);
            sSharedPreferences.put(index, sharedPreferences);
        }
        return sharedPreferences;
    }

    public static SharedPreferences getHashSharedPreference(int hashCodeIndex) {
        return AppApplication.getInstance().getSharedPreferences(GLOBAL_SHARED_FILE + "_" + hashCodeIndex, Context.MODE_PRIVATE);
    }

    public static int getKeyHash(String key) {
        return Math.abs(key.hashCode()) % DEFAULT_SHARED_PREFERENCE_CAPACITY;
    }

    private static boolean checkMainProcess(String key) {
//        if (BuildConfig.TEST_MODE) {
//            if (AppUtils.isMainProcess(AppApplication.getInstance())) {
//                return true;
//            } else {
//                ToastUtils.showLong("set <" + key + "> in deamon process", Toast.LENGTH_LONG);
//                return false;
//            }
//        }
        return true;
    }

    public static boolean hasKey(String key) {
        if (checkMainProcess(key)) {
            return getSharedPreference(key).contains(key);
        }
        return false;
    }

    public static void setBoolean(String key, boolean value) {
        if (checkMainProcess(key)) {
            getSharedPreference(key).edit().putBoolean(key, value).apply();
        }
    }

    public static void setInt(String key, int value) {
        if (checkMainProcess(key)) {
            getSharedPreference(key).edit().putInt(key, value).apply();
        }
    }

    public static int getAndIncrease(String key) {
        int result = getInt(key, 0);
        int temp = result;
        setInt(key, ++temp);
        return result;
    }

    public static void setLong(String key, Long value) {
        if (checkMainProcess(key)) {
            getSharedPreference(key).edit().putLong(key, value).apply();
        }
    }

    public static void setFloat(String key, float value) {
        if (checkMainProcess(key)) {
            getSharedPreference(key).edit().putFloat(key, value).apply();
        }
    }

    public static void setString(String key, String value) {
        if (checkMainProcess(key)) {
            getSharedPreference(key).edit().putString(key, value).apply();
        }
    }

    public static boolean getBoolean(String key, boolean defaultValue) {
        if (checkMainProcess(key)) {
            return getSharedPreference(key).getBoolean(key, defaultValue);
        }
        return defaultValue;
    }

    public static int getInt(String key, int defaultValue) {
        if (checkMainProcess(key)) {
            return getSharedPreference(key).getInt(key, defaultValue);
        }
        return defaultValue;
    }

    public static long getLong(String key, long defaultValue) {
        if (checkMainProcess(key)) {
            return getSharedPreference(key).getLong(key, defaultValue);
        }
        return defaultValue;
    }

    public static float getFloat(String key, float defaultValue) {
        if (checkMainProcess(key)) {
            return getSharedPreference(key).getFloat(key, defaultValue);
        }
        return defaultValue;
    }

    public static String getString(String key, String defaultValue) {
        if (checkMainProcess(key)) {
            return getSharedPreference(key).getString(key, defaultValue);
        }
        return defaultValue;
    }

    public static Set<String> getStringSet(String key, Set<String> defaultValues) {
        return getSharedPreference(key).getStringSet(key, defaultValues);
    }

    public static boolean contains(String key) {
        return getSharedPreference(key).contains(key);
    }

    public static void remove(String key) {
        getSharedPreference(key).edit().remove(key).apply();
    }

    /**
     * Export data to file
     * @param itemInfoList TableItemInfo list
     * @param filePath Save file path
     * @return Save result
     *  {@link LocalStorageManager#EXPORT_DATA_STATE_FAILED}
     *  {@link LocalStorageManager#EXPORT_DATA_STATE_CREATE_FILE_FAILED}
     *  {@link LocalStorageManager#EXPORT_DATA_STATE_SUCCESS}
     */
    public static int exportDataToFile(List<TableItemInfo> itemInfoList, String filePath)
    {
        if(itemInfoList == null || itemInfoList.size() == 0)
            return EXPORT_DATA_STATE_FAILED;
        File saveFile = new File(filePath);
        boolean isAppend = false;
        if(saveFile.exists())
            isAppend = true;
        else{
            try {
                boolean suc = false;
                File dirFile = saveFile.getParentFile();
                if(!dirFile.exists()) {
                    suc = dirFile.mkdirs();
                    Log.d(TAG,"Create parant dir: "+saveFile.getParentFile().getAbsolutePath()+", suc: "+suc);
                }else{
                    suc = true;
                }

                if(suc) {
                    suc = saveFile.createNewFile();
                    Log.d(TAG,"Create data file: "+saveFile.getAbsolutePath()+", suc: "+suc);
                }

                if(!suc)
                    return EXPORT_DATA_STATE_CREATE_FILE_FAILED;
            } catch (IOException e) {
                Log.d(TAG,"Create data file: "+filePath+", failed.",e);
                return EXPORT_DATA_STATE_CREATE_FILE_FAILED;
            }
        }

        FileOutputStream fos = null;
        FileInputStream fis = null;
        try{
            int lineCount = 0;
            int tagNum = 0;
            if(saveFile.exists())
            {
                fis = new FileInputStream(saveFile);
                BufferedReader br = new BufferedReader(new InputStreamReader(fis));
                while(br.readLine() != null)
                    lineCount ++ ;
                fis.close();
            }

            if(lineCount > 1)
                tagNum = lineCount - 1;
            if(tagNum == 0)
                isAppend = false;

            fos = new FileOutputStream(saveFile,isAppend);
            BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(fos));
            if(!isAppend)
            {
                bw.write("Num,");
                bw.write("EPC,");
                bw.write("Count,");
                bw.write("RSSI,");
                bw.write("Frequence,");
                bw.write("Embed Data");
            }

            for(TableItemInfo itemInfo : itemInfoList)
            {
                TagInfo tagInfo = itemInfo.tagInfo;

                tagNum++;
                byte[] epcBytes = Arrays.copyOfRange(tagInfo.EpcId,0,tagInfo.Epclen);
                String epcStr = tagInfo.Epclen > 0 ? UHFReader.bytes_Hexstr(epcBytes) : "";

                byte[] embedDataBytes = Arrays.copyOfRange(tagInfo.EmbededData,0,tagInfo.EmbededDatalen);
                String embedDataStr = tagInfo.EmbededDatalen > 0 ? UHFReader.bytes_Hexstr(embedDataBytes) : "";

                int tagCnt = tagInfo.ReadCnt;
                int rssi= tagInfo.RSSI;
                int frequence = tagInfo.Frequency;

                bw.newLine();
                bw.write(String.valueOf(tagNum)+",");
                bw.write(epcStr +",");
                bw.write(String.valueOf(tagCnt)+",");
                bw.write(String.valueOf(rssi)+",");
                bw.write(String.valueOf(frequence)+",");
                bw.write(embedDataStr);
            }
            bw.flush();
            return EXPORT_DATA_STATE_SUCCESS;
        }catch (Exception e){
            Log.d(TAG,"Write data to file: "+filePath+", failed.",e);
            return EXPORT_DATA_STATE_FAILED;
        }
    }
}
