package com.nlscan.uhf.demo.activity;

import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.provider.Settings;
import android.support.annotation.Nullable;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

import com.nlscan.android.uhf.UHFManager;
import com.nlscan.uhf.demo.R;
import com.nlscan.uhf.demo.util.Constant;
import com.nlscan.uhf.demo.util.permission.PermissionUtils;

import java.util.List;
import java.util.Set;

/**
 * Bluetooth device list window,select device to connect
 */
public class BTDeviceListActivity extends Activity {

    private static final String TAG = BTDeviceListActivity.class.getSimpleName();
    private final int REQUEST_ENABLE_BT = 0x01;

    private Context mContext;

    private ListView lv_devices;
    private TextView btn_connect;
    private View empty_listview;

    private BtDeviceAdapter mAdapter;
    private BluetoothDevice[] mBTdevArray;

    private View mSelectItemView;

    private BluetoothDevice mSelectedBTDevice;
    private BluetoothLeScanner mLeScanner;

    private final int REQUEST_CODE_LOCATION_SETTING = 1003;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_bt_list);
        mContext = getApplicationContext();

        initView();
        if (!PermissionUtils.isLocationEnabled(this)) {
            // 弹窗提示：位置服务权限授予的请求
            gotoLocationSetting();
            return;
        }
        searchBoundBTDevices();
        scanBleDevice();
    }

    private void gotoLocationSetting() {
        // 位置服务未开启，跳转到设置页面
        try {
            Intent intent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
            startActivityForResult(intent, REQUEST_CODE_LOCATION_SETTING);
        } catch (ActivityNotFoundException e) {
            Toast.makeText(mContext,    "无法打开位置设置，请手动进入设置页面开启位置服务", Toast.LENGTH_SHORT).show();
        }
    }

    private void initView() {
        initActionBar();
        lv_devices = (ListView) findViewById(R.id.lv_devices);
        btn_connect = (Button) findViewById(R.id.btn_connect);
        empty_listview = findViewById(R.id.empty_listview);

        lv_devices.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
                if (mBTdevArray != null && mBTdevArray.length > 0) {
                    mSelectedBTDevice = mBTdevArray[position];
                    if (mSelectItemView != view && mSelectItemView != null) {
                        mSelectItemView.setBackground(null);
                    }
                    mSelectItemView = view;
                    view.setBackgroundColor(Color.CYAN);
                }
            }
        });

        btn_connect.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (mSelectedBTDevice != null) {
                    Intent mainIntent = new Intent(mContext, MainActivity.class);
                    mainIntent.putExtra(Constant.EXTRA_DEVICE_PATH_OR_MAC, mSelectedBTDevice.getAddress());
                    mainIntent.putExtra(Constant.EXTRA_DEVICE_PLUGIN_TYPE, UHFManager.PLUGIN_TYPE_BLE);
                    startActivity(mainIntent);
                    setResult(RESULT_OK);
                    finish();
                } else {
                    Toast.makeText(mContext, "No bluetooth device select.", Toast.LENGTH_SHORT).show();
                    searchBoundBTDevices();
                }
            }
        });
    }

    private void initActionBar() {
        TextView tv_title = (TextView) findViewById(R.id.header_center_name_text_view);
        TextView header_model_name = (TextView) findViewById(R.id.header_model_name);
        View im_actionbar_settings = findViewById(R.id.im_actionbar_settings);

        tv_title.setText(R.string.bt_device);
        header_model_name.setVisibility(View.INVISIBLE);
        im_actionbar_settings.setVisibility(View.INVISIBLE);
    }

    private void searchBoundBTDevices() {
        if (requestOpenBT()) {
            BluetoothAdapter btAdapter = BluetoothAdapter.getDefaultAdapter();
            Set<BluetoothDevice> boundDevSet = btAdapter.getBondedDevices();
            if (boundDevSet != null && boundDevSet.size() > 0) {
                mBTdevArray = new BluetoothDevice[boundDevSet.size()];
                boundDevSet.toArray(mBTdevArray);
                empty_listview.setVisibility(View.GONE);
            } else
                empty_listview.setVisibility(View.VISIBLE);

            mAdapter = new BtDeviceAdapter();
            lv_devices.setAdapter(mAdapter);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_ENABLE_BT) {
            if (resultCode == RESULT_CANCELED) {

                Toast.makeText(mContext, "Bluetooth open failed.", Toast.LENGTH_SHORT).show();

            }else if (requestCode == REQUEST_CODE_LOCATION_SETTING) {
                searchBoundBTDevices();
                scanBleDevice();
            } else {
                Toast.makeText(mContext, "Bluetooth open success.", Toast.LENGTH_SHORT).show();
                searchBoundBTDevices();
            }
        }
    }

    private boolean requestOpenBT() {
        BluetoothAdapter btAdapter = BluetoothAdapter.getDefaultAdapter();
        if (!btAdapter.isEnabled()) {
            Intent enableBtIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
            startActivityForResult(enableBtIntent, REQUEST_ENABLE_BT);
            return false;
        }

        return true;
    }

    //----------------------------------------------
    //Inner Class
    //----------------------------------------------

    private class BtDeviceAdapter extends BaseAdapter {

        @Override
        public int getCount() {
            return mBTdevArray == null ? 0 : mBTdevArray.length;
        }

        @Override
        public Object getItem(int position) {
            return mBTdevArray == null ? null : mBTdevArray[position];
        }

        @Override
        public long getItemId(int position) {
            return position;
        }

        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            BluetoothDevice btDev = mBTdevArray[position];
            if (convertView == null) {
                convertView = LayoutInflater.from(mContext).inflate(android.R.layout.simple_list_item_2, null);
            }

            TextView tv_name = (TextView) convertView.findViewById(android.R.id.text1);
            TextView tv_mac = (TextView) convertView.findViewById(android.R.id.text2);
            tv_name.setText(btDev.getName());
            tv_mac.setText(btDev.getAddress());
            return convertView;
        }

    }//End class BtDeviceAdapter

    //scan ble device

    private void scanBleDevice() {
        Log.d(TAG, "scanBleDevice: start scan ble device.");
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter == null || !adapter.isEnabled()) {
            Log.d(TAG, "蓝牙未开启或者不支持");// 蓝牙未开启或者不支持
            return;
        }

        // 启动蓝牙扫描
        mLeScanner = adapter.getBluetoothLeScanner();
        if (mLeScanner == null) {
            Log.d(TAG, "scanBleDevice:  mLeScanner is null.");
            return;
        }
        // 设置模式
        ScanSettings scanSettings = null;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            scanSettings = new ScanSettings.Builder()
                    .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY) //低延迟模式
                    .setCallbackType(ScanSettings.CALLBACK_TYPE_ALL_MATCHES) // 全匹配
                    .setMatchMode(ScanSettings.MATCH_MODE_STICKY)// 粘性匹配，设备满足一定强度时才被要求匹配
                    .build();
        } else {
            scanSettings = new ScanSettings.Builder()
                    .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY) //低延迟模式
                    .build();
        }
        mLeScanner.startScan(null, scanSettings, mScanCallback);
        Log.d(TAG, "scanBleDevice: ---->start scan ble device.");
    }

    private ScanCallback mScanCallback = new ScanCallback() {
        @Override
        public void onScanResult(int callbackType, ScanResult result) {
            Log.d(TAG, "onScanResult: " + result.getDevice().getName() + "-" + result.getDevice().getAddress());
            super.onScanResult(callbackType, result);
            BluetoothDevice device = result.getDevice();
            //判断是否符合正则表达式 SR开头后面跟6位数字
            if (device == null || device.getName() == null || !device.getName().matches("SR\\d{6}")) {
                return;
            }

            //如果 mBTdevArray 不存在，向 mBTdevArray 添加设备
            if (mBTdevArray == null) {
                mBTdevArray = new BluetoothDevice[1];
                mBTdevArray[0] = device;
            } else {
                //如果 mBTdevArray 存在，判断是否已经存在该设备
                boolean isExist = false;
                for (BluetoothDevice bt : mBTdevArray) {
                    if (bt.getAddress().equals(device.getAddress())) {
                        isExist = true;
                        break;
                    }
                }
                //如果不存在，添加设备
                if (!isExist) {
                    BluetoothDevice[] temp = new BluetoothDevice[mBTdevArray.length + 1];
                    System.arraycopy(mBTdevArray, 0, temp, 0, mBTdevArray.length);
                    temp[mBTdevArray.length] = device;
                    mBTdevArray = temp;
                }
            }
            empty_listview.setVisibility(View.GONE);
            //更新列表
            mAdapter.notifyDataSetChanged();
            Log.d(TAG, "onScanResult: " + device.getName() + "-" + device.getAddress());
        }

        @Override
        public void onBatchScanResults(List<ScanResult> results) {
            Log.d(TAG, "onBatchScanResults: " + results.size());
        }

        @Override
        public void onScanFailed(int errorCode) {
            Log.d(TAG, "onScanFailed: errorCode: " + errorCode);
        }
    };

    @Override
    protected void onStop() {
        super.onStop();
        if (mLeScanner != null) {
            mLeScanner.stopScan(mScanCallback);
        }
    }
}
