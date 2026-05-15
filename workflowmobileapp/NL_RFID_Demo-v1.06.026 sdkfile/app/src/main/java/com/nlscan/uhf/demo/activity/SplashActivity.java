package com.nlscan.uhf.demo.activity;

import android.animation.ObjectAnimator;
import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.text.TextUtils;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.View;
import android.widget.TextView;

import com.nlscan.android.uhf.UHFManager;
import com.nlscan.uhf.demo.BuildConfig;
import com.nlscan.uhf.demo.R;
import com.nlscan.uhf.demo.util.Constant;
import com.nlscan.uhf.demo.util.permission.PermissionUtils;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

public class SplashActivity extends Activity {

    private final String TAG = "SplashActivity";

    private final static int REQUEST_RUNTIME_PERMISSION = 0x10;

    private String[] mDeviceTypes = new String[]{
        Constant.NEWLAND_MODULE_SERIAL_TYPE,
        Constant.NEWLAND_MODULE_BLUETOOTH_TYPE,
        Constant.NEWLAND_MODULE_NET_TYPE
    };

    private final static int MSG_GO_TO_NEXT = 0x01;
    private Handler mUIHandler = new Handler(){
        @Override
        public void handleMessage(Message msg) {
            switch (msg.what){
                case MSG_GO_TO_NEXT:
                    delayedGoToNext();
                    break;
            }
        }
    };
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);
        printScreenDpi();
        View content_main = findViewById(R.id.content_main);
        TextView tv_center_title = (TextView) findViewById(R.id.tv_center_title);
        TextView tv_app_version =  (TextView) findViewById(R.id.tv_app_version);
        tv_app_version.setText(BuildConfig.VERSION_NAME);
        ObjectAnimator fadeIn = ObjectAnimator.ofFloat(content_main,"alpha",0f,1f);
        fadeIn.setDuration(1000);
        fadeIn.start();

        PermissionUtils.requestAllRuntimePermission(SplashActivity.this,REQUEST_RUNTIME_PERMISSION);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        Log.d("TAG", "Request permission result, request code: " + requestCode);
        if (requestCode == REQUEST_RUNTIME_PERMISSION) {
            mUIHandler.sendEmptyMessageDelayed(MSG_GO_TO_NEXT,1500);
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
    }

    private void printScreenDpi()
    {
        DisplayMetrics dm = new DisplayMetrics();
        getWindowManager().getDefaultDisplay().getMetrics(dm);
        int densityDpi = dm.densityDpi;

        String density = "";
        if(densityDpi >= DisplayMetrics.DENSITY_LOW && densityDpi < DisplayMetrics.DENSITY_MEDIUM)
            density = "ldpi";
        else if(densityDpi >= DisplayMetrics.DENSITY_MEDIUM && densityDpi < DisplayMetrics.DENSITY_HIGH)
            density = "mdpi";
        else if(densityDpi >= DisplayMetrics.DENSITY_HIGH && densityDpi < DisplayMetrics.DENSITY_XHIGH)
            density = "hdpi";
        else if(densityDpi >= DisplayMetrics.DENSITY_XHIGH && densityDpi < DisplayMetrics.DENSITY_XXHIGH)
            density = "xhdpi";
        else if(densityDpi >= DisplayMetrics.DENSITY_XXHIGH && densityDpi < DisplayMetrics.DENSITY_XXXHIGH)
            density = "xxhdpi";
        else if(densityDpi >= DisplayMetrics.DENSITY_XXXHIGH)
            density = "xxxhdpi";

        Log.d(TAG,String.format("Screen densityDpi:=[%d],density:=[%s]",densityDpi,density));
    }

    private void delayedGoToNext()
    {
        //Already power on, go to main
        if(UHFManager.getInstance().isPowerOn())
        {
            gotoMainFace();
            finish();
            return;
        }

        mDeviceTypes= loadSupportDeviceTypes();
        if(mDeviceTypes == null || mDeviceTypes.length == 0)
            gotoMainFace();
        else if(mDeviceTypes.length == 1){
            String type = mDeviceTypes[0];
            Log.d(TAG,"type == "+ type);
            if(type.equals(Constant.NEWLAND_MODULE_SERIAL_TYPE))
                gotoMainFace();
            else
                gotoSelectDeviceFace();
        }else {
            Log.d(TAG,"mDeviceTypes = "+ Arrays.toString(mDeviceTypes));
            gotoSelectDeviceFace();
        }

        finish();
    }

    private void gotoMainFace()
    {

        String devPath = Constant.getDevPathOnNewlandPDA();
        Log.d(TAG,"--devPath:="+devPath);
        Intent mainIntent = new Intent(getApplicationContext(), MainActivity.class);
        mainIntent.putExtra(Constant.EXTRA_DEVICE_PATH_OR_MAC, devPath);
        mainIntent.putExtra(Constant.EXTRA_DEVICE_PLUGIN_TYPE, UHFManager.PLUGIN_TYPE_SERIEL);
        //mainIntent.putExtra(Constant.EXTRA_DEVICE_MODEL_KEY, "");
        startActivity(mainIntent);
    }

    private void gotoSelectDeviceFace()
    {
        Intent deviceIntent = new Intent(getApplicationContext(), SelectDeviceActivity.class);
        deviceIntent.putExtra(Constant.EXTRA_DEVICE_TYPES, mDeviceTypes);
        startActivity(deviceIntent);
    }

    private String[] loadSupportDeviceTypes()
    {
        String typesOfProp = Constant.getSystemProperty("persist.sys.nls.uhf.type","");
        if(!TextUtils.isEmpty(typesOfProp))
        {
            String[] devTypes= typesOfProp.split(",");
            return devTypes;
        }

        final String UNRECOVERABLE_PATH = "/unrecoverable/uhf";
        final String NEWLAND_PATH="/newland/usr/uhf";
        final String SYSTEM_PATH="/system/usr/uhf";
        final String UHF_SUPPORT_MODULES_FILE = "uhf_support_modules.xml";

        File configFile = new File(UNRECOVERABLE_PATH,UHF_SUPPORT_MODULES_FILE); // /unrecoverable/uhf
        if(!configFile.exists())
            configFile = new File(NEWLAND_PATH,UHF_SUPPORT_MODULES_FILE);// /newland/usr/uhf
        if(!configFile.exists())
            configFile = new File(SYSTEM_PATH,UHF_SUPPORT_MODULES_FILE);// /system/usr/uhf

        if (!configFile.exists()) {
            return null;
        } else {
            DocumentBuilderFactory factory = null;
            DocumentBuilder builder = null;
            Document document = null;
            InputStream inputStream = null;
            factory = DocumentBuilderFactory.newInstance();

            try {
                builder = factory.newDocumentBuilder();
                inputStream = new FileInputStream(configFile);
                document = builder.parse(inputStream);
                Element root = document.getDocumentElement();
                NodeList supportTypeNodes = root.getElementsByTagName("support-module-type");
                if(supportTypeNodes.getLength() > 0)
                {
                    Node spNode = supportTypeNodes.item(0);
                    Element spEle = (Element)spNode;
                    NodeList typeList = spEle.getElementsByTagName("type");
                    if(typeList.getLength() > 0)
                    {
                        List<String> resultList = new ArrayList<>();
                        Log.d(TAG, "----------------------------------------------------------------------------");
                        for(int i = 0; i < typeList.getLength(); i++)
                        {
                            Node typeNode = typeList.item(i);
                            String typeName = typeNode.getFirstChild() == null ? "" : typeNode.getFirstChild().getNodeValue();
                            if(!TextUtils.isEmpty(typeName)) {
                                resultList.add(typeName);
                                Log.d(TAG,"Type:="+typeName);
                            }
                        }
                        Log.d(TAG, "----------------------------------------------------------------------------");
                        String[] result = resultList.toArray(new String[1]);
                        return result;
                    }
                }

            } catch (Exception e) {
                Log.w(TAG, "parse uhf module config failed", e);
            } finally {
                try {
                    inputStream.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }

            }

            return null;
        }

    }//End loadSupportDeviceTypes


}
