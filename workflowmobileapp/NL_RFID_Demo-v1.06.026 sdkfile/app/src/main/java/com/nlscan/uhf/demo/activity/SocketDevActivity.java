package com.nlscan.uhf.demo.activity;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.support.annotation.Nullable;
import android.text.TextUtils;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

import com.nlscan.android.uhf.UHFManager;
import com.nlscan.uhf.demo.R;
import com.nlscan.uhf.demo.util.Constant;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SocketDevActivity extends Activity {

    private final static String TAG = "SocketDevActivity";
    private Context mContext;
    private Button mBtnConnect;
    private EditText mEtPath;
    private ListView lv_devices;
    private DeviceAdapater mDevAdapter;
    private View emptyView;
    private TextView tv_empty_text;
    private View mSelectItemView;
    private List<DeviceInfo> mDeviceList = new ArrayList<>();
    private NetworkStateReceiver mNetworkStateReceiver;
    private DatagramSocket mReceiveSocket  = null;
    private boolean mExitReceive = true;
    private boolean mExitSend = true;

    private final static int MSG_UPDATE_DEV_LIST = 0x01;

    private Handler mUIHandler = new Handler(){
        @Override
        public void handleMessage(Message msg) {
            switch (msg.what){
                case MSG_UPDATE_DEV_LIST:
                    if(mDeviceList != null && mDeviceList.size() > 0)
                        emptyView.setVisibility(View.GONE);
                    if(mDevAdapter != null)
                        mDevAdapter.notifyDataSetChanged();
                    break;
            }
        }
    }; //

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_socket_device);
        mContext = getApplicationContext();
        initV();
        initEvent();
        registerNetworkStateReceiver(); //Network state listener
        if(isNetworkAvailable(mContext)){
            runReceveNetData();
            runSendBroadcastData();
        }
    }

    private void initV() {
        initActionBar();
        ((TextView) findViewById(R.id.tv_dev_type)).setText(getResources().getString(R.string.socket_device));
        mEtPath=((EditText) findViewById(R.id.et_dev_path));
        mEtPath.setHint("192.168.31.187:8058");
        mEtPath.requestFocus();

        mBtnConnect = ((Button) findViewById(R.id.btn_connect));
        lv_devices = (ListView) findViewById(R.id.lv_devices);
        emptyView =  findViewById(R.id.empty_listview);
        tv_empty_text = (TextView) findViewById(R.id.tv_empty_text);

        mDevAdapter = new DeviceAdapater(mDeviceList);
        lv_devices.setAdapter(mDevAdapter);
        lv_devices.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
                DeviceInfo selectDev = mDeviceList.get(position);
                String ip = selectDev.getValue(DeviceInfo.T_Ip_Address);
                String port = selectDev.getValue(DeviceInfo.T_Tcp_Port_Number);
                String ipAndPort = ip + ":" + port;
                mEtPath.setText(ipAndPort);
                mEtPath.setSelection(ipAndPort.length());

                if (mSelectItemView != view && mSelectItemView != null) {
                    mSelectItemView.setBackground(null);
                }
                mSelectItemView = view;
                view.setBackgroundColor(Color.CYAN);
            }
        });
    }

    private void initActionBar() {
        TextView tv_title = (TextView) findViewById(R.id.header_center_name_text_view);
        TextView header_model_name = (TextView) findViewById(R.id.header_model_name);
        View im_actionbar_settings = findViewById(R.id.im_actionbar_settings);

        tv_title.setText(R.string.socket_device);
        header_model_name.setVisibility(View.INVISIBLE);
        im_actionbar_settings.setVisibility(View.INVISIBLE);
    }

    private void initEvent() {
        mBtnConnect.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                connect();
            }
        });

        //No network
        if(!isNetworkAvailable(mContext)){
            tv_empty_text.setText(R.string.no_network_connection);
            tv_empty_text.setTextColor(Color.RED);
            emptyView.setVisibility(View.VISIBLE);

        }
    }

    private void connect() {
        String ipAddr = mEtPath.getText().toString();
        if(TextUtils.isEmpty(ipAddr))
        {
            Toast.makeText(mContext,R.string.no_ip_tip,Toast.LENGTH_SHORT).show();
            return;
        }

        Intent mainIntent = new Intent(mContext,MainActivity.class);
        mainIntent.putExtra(Constant.EXTRA_DEVICE_PATH_OR_MAC,mEtPath.getText().toString());
        mainIntent.putExtra(Constant.EXTRA_DEVICE_PLUGIN_TYPE, UHFManager.PLUGIN_TYPE_NETWORK);
//        startActivity(mainIntent);
        startActivityForResult(mainIntent,120);
        setResult(RESULT_OK);
        finish();
    }

    public boolean isNetworkAvailable(Context context) {
        ConnectivityManager connectivityManager = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (connectivityManager != null) {
            NetworkInfo activeNetworkInfo = connectivityManager.getActiveNetworkInfo();
            return activeNetworkInfo != null && activeNetworkInfo.isConnected();
        }
        return false;
    }

    private void registerNetworkStateReceiver()
    {
        try{

            IntentFilter intentFilter = new IntentFilter();
            intentFilter.addAction(ConnectivityManager.CONNECTIVITY_ACTION);
            mNetworkStateReceiver = new NetworkStateReceiver();
            registerReceiver(mNetworkStateReceiver, intentFilter);
        }catch (Exception e){
        }
    }

    private void unRegisterNetworkStateReceiver()
    {
        try{
            if(mNetworkStateReceiver != null){
                unregisterReceiver(mNetworkStateReceiver);
                mNetworkStateReceiver = null;
            }
        }catch (Exception e){
        }
    }

    private void exitReceiveNetworkData()
    {
        try{
            mExitSend = true;
            mExitReceive = true;
            if(mReceiveSocket != null && !mReceiveSocket.isClosed())
                mReceiveSocket.close();
        }catch (Exception e){
        }
        mReceiveSocket = null;
        Log.d(TAG,"---Exit send/receive socket data.");
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        unRegisterNetworkStateReceiver();
        exitReceiveNetworkData();
    }

    private void runReceveNetData()
    {
        if(mReceiveSocket == null){

            Log.d(TAG,"---Run data receiver");
            new Thread(new Runnable() {

                @Override
                public void run() {

                    mExitReceive = false;
                    int port = 36511; // Listen port

                    try {
                        mReceiveSocket = new DatagramSocket(port);
                        mReceiveSocket.setBroadcast(true); // Allow broadcast

                        byte[] buffer = new byte[1024]; // Data buffer
                        Log.d(TAG, "----Start receive packet");
                        while (!mExitReceive) {
                            DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
                            mReceiveSocket.receive(packet); // receive data packet
                            String message = new String(packet.getData(), 0, packet.getLength());
                            //eg: "NLSCAN*****/Product Name=NLS-URF520-F;Firmware Version=V1.02.022.1.B1;Decoder Version=2022070822070800;rfid=1;Hardware Version=0;Serial Number=TEST100005;Manufacturing Date=;MAC Address=A4:E8:A3:81:AA:A5;Ip Address=192.168.31.187;Tcp Port Number=8058;SubNetmask=255.255.255.0;Gateway Address=192.168.1.1;Use DHCP=0; from 192.168.31.187"
                            Log.d(TAG, "*** Received data broadcast: " + message + " from " + packet.getAddress().getHostAddress());
                            if(packet.getLength() > 12)
                            {
                                byte[] subBytes = Arrays.copyOfRange(packet.getData(), 12, packet.getLength()); //Delete header
                                String sInfo = new String(subBytes);
                                DeviceInfo devInfo = new DeviceInfo(sInfo);
                                int pos = mDeviceList.indexOf(devInfo);
                                if(pos != -1)
                                    mDeviceList.remove(pos);
                                mDeviceList.add(devInfo);
                                mUIHandler.sendEmptyMessage(MSG_UPDATE_DEV_LIST);
                            }
                        }

                    } catch (Exception e) {
                        if(!mExitReceive)
                            Log.d(TAG,"Socket over.",e);
                    } finally{
                        if(mReceiveSocket != null && !mReceiveSocket.isClosed())
                            mReceiveSocket.close();
                        mReceiveSocket = null;
                        mExitReceive = true;
                    }
                    Log.d(TAG,"---Exit data receiver");
                }
            }).start();
        }//
    }//

    private void runSendBroadcastData()
    {
        if(mExitSend){
            mExitSend = false;
            new Thread(new Runnable() {
                @Override
                public void run() {

                    DatagramSocket socket = null;
                    try {

                        socket = new DatagramSocket();
                        socket.setBroadcast(true);

                        //Broadcast cmds
                        byte[] buffer = new byte[]{0x4e,0x4c,0x53,0x43,0x41,0x4e,0x10,0x30,0x00,0x00,0x00,0x12,0x41,0x6e,0x73,0x77,0x65,0x72,0x20,0x50,0x6f,0x72,0x74,0x3d,0x33,0x36,0x35,0x31,0x31,0x3b};

                        //
                        InetAddress broadcastAddress = InetAddress.getByName("255.255.255.255");
                        int port = 36510;

                        DatagramPacket packet = new DatagramPacket(buffer, buffer.length, broadcastAddress, port);

                        //Send packet data
                        while (!mExitSend){
                            socket.send(packet);
                            Log.d(TAG,"---Broadcast message sent.");
                            Thread.sleep(3000);
                        }
                    } catch (Exception e) {
                        Log.d(TAG,"--Send socket packet fail.",e);
                    } finally {
                        if (socket != null && !socket.isClosed()) {
                            socket.close();
                        }
                        mExitSend = true;
                        Log.d(TAG,"--Exit Send socket packet ");
                    }
                }
            }).start();
        }

    }

    //--------------------------------------------
    // Inner Class
    //--------------------------------------------
    public class NetworkStateReceiver extends BroadcastReceiver {

        @Override
        public void onReceive(Context context, Intent intent) {

            ConnectivityManager connectivityManager = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
            NetworkInfo activeNetworkInfo = connectivityManager.getActiveNetworkInfo();

            if (activeNetworkInfo != null && activeNetworkInfo.isConnected()) {
                //Network connected.
                String networkType = activeNetworkInfo.getTypeName();
                if(lv_devices.getCount() <= 0){
                    tv_empty_text.setCompoundDrawablesWithIntrinsicBounds(0,0,0,0);
                    tv_empty_text.setText(R.string.searching_network_device);
                    tv_empty_text.setTextColor(Color.BLACK);
                }else
                    emptyView.setVisibility(View.GONE);
                Log.d("NetworkStateReceiver", "Connected to " + networkType);
                runReceveNetData();
                runSendBroadcastData();
            } else {
                //Network disconnected.
                tv_empty_text.setText(R.string.no_network_connection);
                tv_empty_text.setCompoundDrawablesWithIntrinsicBounds(0,R.drawable.ic_no_network,0,0);
                tv_empty_text.setTextColor(Color.RED);
                emptyView.setVisibility(View.VISIBLE);
                Log.d("NetworkStateReceiver", "No network connection");
                exitReceiveNetworkData();
            }
        }

    }//End class NetworkStateReceiver

    private class DeviceInfo{

        public final static String T_Product_Name = "Product Name";
        public final static String T_Firmware_Version = "Firmware Version";
        public final static String T_Decoder_Version = "Decoder Version";
        public final static String T_rfid = "rfid";
        public final static String T_Hardware_Version = "Hardware Version";
        public final static String T_Serial_Number = "Serial Number";
        public final static String T_Manufacturing_Date = "Manufacturing Date";
        public final static String T_MAC_Address = "MAC Address";
        public final static String T_Ip_Address = "Ip Address";
        public final static String T_Tcp_Port_Number = "Tcp Port Number";
        public final static String T_SubNetmask = "SubNetmask";
        public final static String T_Gateway_Address = "Gateway Address";
        public final static String T_Use_DHCP = "Use DHCP";

        private Map<String,String> mInfoMap;

        public DeviceInfo(String sInfo){
            mInfoMap = parseData(sInfo);
        }
        public void setContent(String sInfo){
            mInfoMap = parseData(sInfo);
        }

        public String getValue(String key){
            return mInfoMap != null ? mInfoMap.get(key) : null;
        }

        public Map<String,String> getAllValue()
        {
            return mInfoMap != null ? mInfoMap : new HashMap<>();
        }

        /**
         * Parse special data
         * @param sInfo eg: "Product Name=NLS-URF520-F;Firmware Version=V1.02.022.1.B1;Decoder Version=2022070822070800;rfid=1;Hardware Version=0;Serial Number=TEST100005;Manufacturing Date=;MAC Address=A4:E8:A3:81:AA:A5;Ip Address=192.168.31.187;Tcp Port Number=8058;SubNetmask=255.255.255.0;Gateway Address=192.168.1.1;Use DHCP=0;"
         * @return
         */
        private Map<String,String> parseData(String sInfo){

            if(TextUtils.isEmpty(sInfo))
                return null;

            Map<String,String> map_values = new HashMap<>();
            String[] sectments = sInfo.split(";");
            for(String sect : sectments)
            {
                String[] fields = sect.split("=");
                String key = fields[0];
                String value = fields.length > 1 ? fields[1] : "";
                map_values.put(key,value);
            }

            return map_values;

        }//End parseData;

        @Override
        public boolean equals(@Nullable Object obj) {

            boolean ys = super.equals(obj);
            if(ys)
                return true;

            DeviceInfo tInfo = (DeviceInfo) obj;
            String tIp = tInfo.getValue(T_Ip_Address);
            String thisIp = getValue(T_Ip_Address);
            if(!TextUtils.isEmpty(tIp) && !TextUtils.isEmpty(thisIp))
                return thisIp.equals(tIp);

            return false;
        }
    }//End class DeviceInfo

    private class DeviceAdapater extends BaseAdapter {

        private List<DeviceInfo> mDevList;
        public DeviceAdapater(List<DeviceInfo> devList){
            mDevList = devList;
        }
        @Override
        public int getCount() {
            return mDevList == null ? 0 : mDevList.size();
        }

        @Override
        public Object getItem(int position) {
            return mDevList == null ? null : (position > mDevList.size() -1 ? null : mDevList.get(position));
        }

        @Override
        public long getItemId(int position) {
            return 0;
        }

        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            DeviceInfo devInfo = (DeviceInfo) getItem(position);
            if(devInfo == null)
                return convertView;

            Holder holder = null;
            if(convertView != null){
                holder = (Holder) convertView.getTag();
            }else{
                holder = new Holder();
                convertView = LayoutInflater.from(mContext).inflate(R.layout.layout_list_view_item_net_device,null);
                holder.tv_name = (TextView) convertView.findViewById(R.id.tv_name);
                holder.tv_ip = (TextView) convertView.findViewById(R.id.tv_ip);
                holder.tv_serial = (TextView) convertView.findViewById(R.id.tv_serial);
                convertView.setTag(holder);
            }
            String name = devInfo.getValue(DeviceInfo.T_Product_Name);
            String ip = devInfo.getValue(DeviceInfo.T_Ip_Address);
            String port = devInfo.getValue(DeviceInfo.T_Tcp_Port_Number);
            String serial = devInfo.getValue(DeviceInfo.T_Serial_Number);
            holder.tv_name.setText(name);
            holder.tv_ip.setText(ip+":"+port);
            holder.tv_serial.setText(serial);
            return convertView;
        }

        private class Holder {
            public TextView tv_name;
            private TextView tv_ip;
            private TextView tv_serial;
        }
    }//End class DeviceAdapater

}//End all





