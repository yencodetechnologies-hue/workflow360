package com.nlscan.uhf.demo.util;

import android.content.Context;
import android.content.res.Resources;
import android.text.TextUtils;
import android.util.Log;

import com.nlscan.android.uhf.UHFManager;
import com.nlscan.android.uhf.UHFModuleInfo;
import com.nlscan.uhf.demo.R;

import java.io.File;
import java.lang.reflect.Method;
import java.util.List;

/**
 * Created by zhouyi on 2019/2/26.
 */

public class Constant {

    /**
     * Tag result's action
     */
    public final static String ACTION_UHF_RESULT_SEND = "nlscan.intent.action.uhf.ACTION_RESULT";
    /**
     * 读码结果发送的广播Extra
     */
    public final static String EXTRA_TAG_INFO = "tag_info";

    /**
     * Extra: parameter of select device's serial path or bt mac
     */
    public final static String EXTRA_DEVICE_PATH_OR_MAC = "path_or_mac";
    public final static String EXTRA_DEVICE_PLUGIN_TYPE = "EXTRA_DEVICE_PLUGIN_TYPE";
    //Extra device model
    public final static String EXTRA_DEVICE_MODEL_KEY = "EXTRA_DEVICE_MODEL_KEY";
    //Extra device types
    public final static String EXTRA_DEVICE_TYPES = "EXTRA_DEVICE_TYPES";

    //URM_R2[芯联创：MODOULE_SLR1200]
    public final static String NEWLAND_MODULE_NAME_URM_R2 = "URM_R2";
    public final static String NEWLAND_MODULE_SERIAL_TYPE = "SERIAL";
    public final static String NEWLAND_MODULE_BLUETOOTH_TYPE = "BLUETOOTH";
    public final static String NEWLAND_MODULE_NET_TYPE = "NETWORK";
    //[芯联创：MODOULE_SLR1200]
    public final static String SILION_MODULE_NAME_SLR1200 = "MODOULE_SLR1200";

    //URM_E7[芯联创：MODOULE_SIM7100]
    public final static String NEWLAND_MODULE_NAME_URM_E7 = "URM_E7";
    //[芯联创：MODOULE_SIM7100]
    public final static String SILION_MODULE_NAME_SIM7100 = "MODOULE_SIM7100";

    //Model: BU10/BU20
    public final static String NEWLAND_MODULE_NAME_BU10_OR_BU20 = "BU10_BU20";
    //Model :ST
    public final static String NEWLAND_MODULE_NAME_URM300 = "URM300";
    public final static String NEWLAND_MODULE_NAME_URF520 = "URF520";
    public final static String NEWLAND_MODULE_NAME_URM500 = "URM500";
    public final static String NEWLAND_MODULE_NAME_NLS_URM500 = "NLS-URM500";
    public final static String NEWLAND_MODULE_NAME_URF100 = "URF100";

    //==============================

    //当前模块名称（芯联创的型号）
    public static String mCurSilionModuleName = SILION_MODULE_NAME_SLR1200;

    //是否是URM_E7[芯联创：MODOULE_SIM7100]
    public static boolean isSIM7100(String moduleName) {
        return SILION_MODULE_NAME_SIM7100.equals(moduleName) || NEWLAND_MODULE_NAME_URM_E7.equals(moduleName);
    }

    //是否是URM_R2[Silion：MODOULE_SLR1200]
    public static boolean isSLR1200(String moduleName) {
        return SILION_MODULE_NAME_SLR1200.equals(moduleName) || NEWLAND_MODULE_NAME_URM_R2.equals(moduleName);
    }

    //Is it URM_E7[AS：MODOULE_SIM7100]
    public static boolean isURM_E7(String moduleName) {
        return SILION_MODULE_NAME_SIM7100.equals(moduleName) || NEWLAND_MODULE_NAME_URM_E7.equals(moduleName);
    }

    //Is it URM_R2[Silion：MODOULE_SLR1200]
    public static boolean isURM_R2(String moduleName) {
        return SILION_MODULE_NAME_SLR1200.equals(moduleName) || NEWLAND_MODULE_NAME_URM_R2.equals(moduleName);
    }


    //Is it BU10/BU20
    public static boolean isBU10_or_BU20(String moduleName) {
        if (moduleName == null)
            return false;
        return NEWLAND_MODULE_NAME_BU10_OR_BU20.contains(moduleName);
    }

    public static boolean isURM300(String moduleName) {
        return NEWLAND_MODULE_NAME_URM300.equalsIgnoreCase(moduleName);
    }

    public static boolean isURF520(String moduleName) {
        if (moduleName != null&&moduleName.contains("520")) {
            return true;
        }
        return false;
    }

    public static boolean isURM500(String moduleName) {
        return NEWLAND_MODULE_NAME_URM500.equalsIgnoreCase(moduleName) || NEWLAND_MODULE_NAME_NLS_URM500.equalsIgnoreCase(moduleName);
    }

    public static boolean isURF100(String moduleName){
        return NEWLAND_MODULE_NAME_URF100.equals(moduleName);
    }

    /**
     * Is Newland pda device
     *
     * @return
     */
    public static boolean isNewlandPDA() {
        try {
            Class<?> scanMgrCls = Class.forName("com.nlscan.android.scan.ScanManager");
            return scanMgrCls != null;
        } catch (Exception e) {
        }
        return false;
    }

    public static boolean isUnionCmd(String moduleName) {
        return isURF520(moduleName) || isURM500(moduleName) || isURF100(moduleName) || isURM300(moduleName);
    }

    public static int[] stringToIntArray(String sValue, String splitc) {
        if (TextUtils.isEmpty(sValue))
            return null;
        String[] sArray = sValue.split(splitc);
        int[] res = new int[sArray.length];
        for (int i = 0; i < sArray.length; i++) {
            res[i] = Integer.parseInt(sArray[i]);
        }

        return res;
    }

    /**
     * 是否支持选择设备进行连接
     *
     * @return true/false
     */
    public static boolean isSupportSelectDevice() {
        try {
            Class<?> cls = UHFManager.class;
            Method method = cls.getMethod("isConnect");
            return method != null;
        } catch (Exception e) {

        }
        return false;
    }

    public static boolean isInt(String str) {
        try {
            Integer.parseInt(str);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public static String converToString(int[] intArray) {
        if (intArray != null && intArray.length > 0) {
            String line = "";
            for (int i = 0; i < intArray.length; i++) {
                line += String.valueOf(intArray[i]);
                if (i < intArray.length - 1)
                    line += ",";
            }
            return line;
        }

        return null;
    }
    /**
     * MT95L platform
     *
     * @return
     */
    public static boolean isMT95L() {
        return "MT95L_DROI_SDK30".equals(getSystemProperty("persist.sys.type", ""))
                || "MT95L_MT87XX_Bird_SDK33".equals(getSystemProperty("persist.sys.type", ""))
                || getSystemProperty("persist.sys.type", "").contains("MT95L");
    }

    public static String getSystemProperty(String property, String defvalue) {
        try {
            Class<?> cls = Class.forName("android.os.SystemProperties");
            Method getPropertyMethod_1 = cls.getMethod("get", String.class);
            Method getPropertyMethod_2 = cls.getMethod("get", String.class, String.class);
            if (defvalue == null)
                return (String) getPropertyMethod_1.invoke(cls, property);
            else
                return (String) getPropertyMethod_2.invoke(cls, property, defvalue);
        } catch (Exception e) {
        }

        return defvalue;
    }

    /**
     * load serial path on Newland pda
     */
    public static String getDevPathOnNewlandPDA() {
        if (Constant.isNewlandPDA()) {
            //uhf配置文件（配置的上电路径，串口，型号名字，UHF服务的action等）
            final String settingsFilePath = "uhf/uhf_module_config.xml";
            final String unrecoverableFilePath = "/unrecoverable/"+settingsFilePath;
            final String persistFilePath = "/persist/"+settingsFilePath;
            final String systemFilePath = "/system/usr/"+settingsFilePath;
            final String systemExtFilePath = "/system_ext/usr/"+settingsFilePath;
            final String newlandFilePath = "/newland/usr/"+settingsFilePath;
            File configFile = new File(unrecoverableFilePath); //unrecoverable/uhf/uhf_module_config.xml
            if(!configFile.exists())
                configFile = new File(persistFilePath); //persist/uhf/uhf_module_config.xml

            if(!configFile.exists())
                configFile = new File(systemFilePath); //system/usr/uhf/uhf_module_config.xml

            if(!configFile.exists())
                configFile = new File(systemExtFilePath); //system_ext/usr/uhf/uhf_module_config.xml

            if(!configFile.exists())
                configFile = new File(newlandFilePath); //newland/usr/uhf/uhf_module_config.xml

            String configFilePath = configFile.getAbsolutePath();

            List<UHFModuleInfo> infoList = UHFModuleInfo.parseUHFModuleInfo(configFilePath);
            if (infoList != null && infoList.size() > 0) {
                UHFModuleInfo info = infoList.get(0);
                String devpath = info.serial_path;
                return devpath;
            }
        }
        return "";
    }

    private static String regionInt2String(Context context, String sRegion) {
        switch (sRegion) {
            default:
            case "0":
                //获取String资源
                return context.getResources().getString(R.string.region_item_north_america_label);
            case "7":
                //获取String资源
                return context.getResources().getString(R.string.region_item_euro3_label);
            case "10":
                //获取String资源
                return context.getResources().getString(R.string.region_item_china_label);
            case "255":
                //获取String资源
                return context.getResources().getString(R.string.region_item_all_label);
        }
    }

    public static  String[] intA2StringA(Context context, String[] arr) {
        String[] strArr = new String[arr.length];
        for (int i = 0; i < arr.length; i++) {
            strArr[i] = regionInt2String(context,arr[i]);
        }
        return strArr;
    }

    public static String[] getRegionLabels(Context mContext,String mModelName)
    {
        UHFManager mUHFMgr = UHFManager.getInstance();
        String supportedFreqRegions = mUHFMgr.getParam("supported_freq_regions", "", "");
        //Log.d(TAG, "--initRegionView, support regions:="+supportedFreqRegions);//0,7,10,255
        String[] regionLabels = null;
        if(!TextUtils.isEmpty(supportedFreqRegions))
        {
            //0,7,10,255 to String[]
            String[] regionValues = supportedFreqRegions.split(",");
            regionLabels = Constant.intA2StringA(mContext,regionValues);
        }else{
            if(Constant.isURM300(mModelName) || Constant.isUnionCmd(mModelName))
                regionLabels = mContext.getResources().getStringArray(R.array.region_item_labels_URF520);
            else
                regionLabels = mContext.getResources().getStringArray(R.array.region_item_labels);
        }
        return regionLabels;
    }

    public static String[] getInventoryPolicyLabels(Context mContext,String mModelName)
    {
        String[] invPolicyLabels = mContext.getResources().getStringArray(R.array.inv_policy_labels);
        /*if(Constant.isUnionCmd(mModelName)){
            invPolicyLabels = new String[]{
                    mContext.getString(R.string.inv_policy_normal_label),
                    mContext.getString(R.string.inv_policy_mass_label),
                    mContext.getString(R.string.inv_policy_few_label),
            };
        }*/

        if(Constant.isURF100(mModelName)){
            invPolicyLabels = new String[]{
                    mContext.getString(R.string.inv_policy_normal_label)
            };
        }

        return invPolicyLabels;
    }

    public static int[] getInventoryPolicyValues(Context mContext,String mModelName)
    {
        int[] invPolicyValues = mContext.getResources().getIntArray(R.array.inv_policy_values);
        if(Constant.isUnionCmd(mModelName)){
            invPolicyValues = new int[]{
                    mContext.getResources().getInteger(R.integer.inv_policy_normal_value),
                    mContext.getResources().getInteger(R.integer.inv_policy_mass_value),
                    mContext.getResources().getInteger(R.integer.inv_policy_few_value),
            };
        }

        if(Constant.isURF100(mModelName)){
            invPolicyValues = new int[]{
                    mContext.getResources().getInteger(R.integer.inv_policy_normal_value)
            };
        }

        return invPolicyValues;
    }
}
