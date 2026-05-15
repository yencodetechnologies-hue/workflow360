package com.nlscan.uhf.demo.activity;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.drawable.AnimatedVectorDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.os.Parcelable;
import android.support.annotation.Nullable;
import android.view.View;
import android.widget.AdapterView;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.PopupWindow;
import android.widget.RadioGroup;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.nlscan.android.uhf.TagInfo;
import com.nlscan.android.uhf.UHFManager;
import com.nlscan.android.uhf.UHFReader;
import com.nlscan.uhf.demo.R;
import com.nlscan.uhf.demo.adapter.TableItemInfo;
import com.nlscan.uhf.demo.adapter.UhfDataListAdapter;
import com.nlscan.uhf.demo.manager.MyUhfManager;
import com.nlscan.uhf.demo.util.Constant;
import com.nlscan.uhf.demo.util.ScreenUtil;
import com.nlscan.uhf.demo.util.constant.SharePreferenceConfig;
import com.nlscan.uhf.demo.util.storage.LocalStorageManager;
import com.nlscan.uhf.demo.util.view.SpinerPopWindow;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

public class MainActivityOld extends Activity {

    private Context mContext;

    Button startInventoryBT;

    Button stopInventoryBT;

    Button clearDataBT;

    TextView writePowerSpinnerTV;
    SpinerPopWindow writePowerSP;

    TextView readPowerSpinnerTV;
    SpinerPopWindow readPowerSP;

    LinearLayout writePowerLL;

    LinearLayout readPowerll;

    TextView tag_read_time;

    TextView tag_read_num_once;

    private enum SPType {
        READ_LIST,
        WRITE_LIST
    }

    ListView uhfDataRV;

    RadioGroup uhfFrequencyRG;
    private int regionalChoose;

    RelativeLayout initUHFProgress;

    TextView tagNumTV;

    List<String> readPowerList;
    List<String> writePowerList;
    private int readPower;
    private int writePower;

    TextView testTV;

    ImageView writePowerSpinnerIV;
    ImageView readPowerSpinnerIV;
    //两个箭头的动画
    private AnimatedVectorDrawable readPowerArrowDown, readPowerArrowUp, writePowerArrowDown, writePowerArrowUp;

    //Uhf标签读取数据
    UhfDataListAdapter uhfDataAdapter;
    List<TableItemInfo> uhfDataList;//存储EPC，用于界面显示
    public final static String TAG_EPC = "tag epc";
    public final static String TAG_TID = "tag tid";
    HashSet<String> uhfDataHS;

    //收到标签
    private static final int GET_UHF_DATA = 1;
    //检查UHF完毕
    private static final int CHECK_UHF_FINISH = 2;
    //用户没有按枪把了
    private static final int USER_FREE_BACK_KEY = 3;
    //初始化UHF完毕
    private static final int INIT_UHF_FINISH = 4;
    //上电完成
    private static final int PWER_ON_FINISH = 5;
    //清空数据完毕
    private static final int CLEAR_DATA_FINISH = 6;
    //Reading time counter
    private static final int READING_TIME_UPDATE = 7;

    private MyUhfManager myUhfManager;
    private boolean isStartTest;

    public static final String SEND_DATA_TO_WRITE_EPC = "mainactivity send data to write epc";
    public static final String SEND_DATA_TO_WRITE_TID = "mainactivity send data to write tid";

    //监控枪把线程
    private volatile boolean isChecking;



    @Override
    protected void onResume() {
        super.onResume();
        myUhfManager.removeFilter(new MyUhfManager.SetParamsListner() {
            @Override
            public void result(boolean result) {

            }
        });
        if (LocalStorageManager.getBoolean(SharePreferenceConfig.Key.SHOULD_REFRESH_LIST, false)) {
            startClear();
            LocalStorageManager.setBoolean(SharePreferenceConfig.Key.SHOULD_REFRESH_LIST, false);
        }

        registerResultReceiver();
        /*if (!myUhfManager.isPowerOn()) {
            myUhfManager.powerOn(new MyUhfManager.SetParamsListner() {
                @Override
                public void result(boolean result) {
                    Message message = Message.obtain();
                    message.what = PWER_ON_FINISH;
                    message.obj = result;
                    mUIHandler.sendMessage(message);
                }
            });
        }*/

    }

    @Override
    protected void onPause() {
        super.onPause();
        unRegisterResultReceiver();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        UHFManager.getInstance().powerOff();
    }

    private void registerResultReceiver() {
        try {
            IntentFilter iFilter = new IntentFilter(Constant.ACTION_UHF_RESULT_SEND);
            registerReceiver(mUhfBR, iFilter);
        } catch (Exception e) {
        }

    }

    private void unRegisterResultReceiver() {
        try {
            unregisterReceiver(mUhfBR);
        } catch (Exception e) {
        }

    }

    @Override
    protected void onStop() {
        super.onStop();
        stopTest();
    }

    public void initParams(Bundle params) {
        readPowerList = new ArrayList<>();
        writePowerList = new ArrayList<>();
        uhfDataList = new ArrayList<TableItemInfo>(70000);
        TableItemInfo headItemInfo = new TableItemInfo(mContext);
        uhfDataList.add(headItemInfo);
        isStartTest = false;
        readPower = 3000;
        writePower = 1500;
        regionalChoose = 1;
        uhfDataHS = new HashSet<>(70000);
        initTestData();

        readPowerArrowDown = (AnimatedVectorDrawable) this.getDrawable(R.drawable.down_arrow_vector);
        readPowerArrowUp = (AnimatedVectorDrawable) this.getDrawable(R.drawable.up_arrow_vector);
        writePowerArrowDown = (AnimatedVectorDrawable) this.getDrawable(R.drawable.down_arrow_vector);
        writePowerArrowUp = (AnimatedVectorDrawable) this.getDrawable(R.drawable.up_arrow_vector);

        uhfDataAdapter = new UhfDataListAdapter(mContext, uhfDataList);
        myUhfManager = MyUhfManager.getInstance();
    }

    private void initTestData() {
        readPowerList.add("5");
        readPowerList.add("6");
        readPowerList.add("7");
        readPowerList.add("8");
        readPowerList.add("9");
        readPowerList.add("10");
        readPowerList.add("11");
        readPowerList.add("12");
        readPowerList.add("13");
        readPowerList.add("14");
        readPowerList.add("15");
        readPowerList.add("16");
        readPowerList.add("17");
        readPowerList.add("18");
        readPowerList.add("19");
        readPowerList.add("20");
        readPowerList.add("21");
        readPowerList.add("22");
        readPowerList.add("23");
        readPowerList.add("24");
        readPowerList.add("25");
        readPowerList.add("26");
        readPowerList.add("27");
        readPowerList.add("28");
        readPowerList.add("29");
        readPowerList.add("30");

        writePowerList.add("5");
        writePowerList.add("6");
        writePowerList.add("7");
        writePowerList.add("8");
        writePowerList.add("9");
        writePowerList.add("10");
        writePowerList.add("11");
        writePowerList.add("12");
        writePowerList.add("13");
        writePowerList.add("14");
        writePowerList.add("15");
        writePowerList.add("16");
        writePowerList.add("17");
        writePowerList.add("18");
        writePowerList.add("19");
        writePowerList.add("20");
        writePowerList.add("21");
        writePowerList.add("22");
        writePowerList.add("23");
        writePowerList.add("24");
        writePowerList.add("25");
        writePowerList.add("26");
        writePowerList.add("27");
        writePowerList.add("28");
        writePowerList.add("29");
        writePowerList.add("30");
    }

    public int bindLayout() {
        return R.layout.activity_main;
    }

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        uhfDataRV.setAdapter(uhfDataAdapter);
        readPowerSpinnerTV.setText("30");
        writePowerSpinnerTV.setText("15");

        myUhfManager.initUhf(readPower, writePower, regionalChoose, new MyUhfManager.InitUhftListner()
        {
            @Override
            public void result(MyUhfManager.InitUhfResultEnum r) {
                Message message = Message.obtain();
                message.what = INIT_UHF_FINISH;
                message.obj = r;
                mUIHandler.sendMessage(message);
            }
        });

        tag_read_time.setText(getString(R.string.uhf_read_time,"0s"));
        tag_read_num_once.setText(getString(R.string.uhf_read_count_once,""));
    }

    public void onClick(View view) {
        /*switch (view.getId()) {
            case R.id.uhf_start_inventory_button:
                startTest();
                new TestThread().start();
                break;
            case R.id.uhf_stop_inventory_button:
                stopTest();
                break;
            case R.id.uhf_clear_data_button:
                startClear();
                break;
        }*/
    }

    private void showPowerList(SPType writeList) {
        switch (writeList) {
            case READ_LIST:
                readPowerSP.setWidth(readPowerll.getWidth());
                readPowerSP.setHeight(ScreenUtil.dp2px(128));
                readPowerSP.showAsDropDown(readPowerSpinnerTV);
                break;
            case WRITE_LIST:
                writePowerSP.setWidth(writePowerLL.getWidth());
                writePowerSP.setHeight(ScreenUtil.dp2px(128));
                writePowerSP.showAsDropDown(writePowerSpinnerTV);
                break;
        }
    }

    private void startClear() {
        stopInventoryBT.setEnabled(false);
        startInventoryBT.setEnabled(false);
        clearDataBT.setEnabled(false);
        myUhfManager.cancleScanKey();
        new ClearDataThread().start();
    }


    class ClearDataThread extends Thread {

        @Override
        public void run() {
//            try {
            uhfDataHS.clear();
            uhfDataAdapter.clearAll();
//                Thread.sleep(500);
            mUIHandler.sendEmptyMessage(CLEAR_DATA_FINISH);
//            } catch (InterruptedException e) {
//                e.printStackTrace();
//            }
        }
    }

    private void stopTest() {
        isStartTest = false;
        isChecking = false;
        myUhfManager.stopInventory();
        startInventoryBT.setEnabled(true);
        clearDataBT.setEnabled(true);
        myUhfManager.setScanKey();

        mUIHandler.removeMessages(READING_TIME_UPDATE);
    }

    private void startTest() {
        tag_read_time.setText(getString(R.string.uhf_read_time,"0s"));
        startInventoryBT.setEnabled(false);
        clearDataBT.setEnabled(false);
        myUhfManager.cancleScanKey();
        Message message = Message.obtain();
        message.what = CHECK_UHF_FINISH;
        message.obj = "OK";
        mUIHandler.sendMessage(message);
    }

    private int mReadingTimes = 0;
    private Handler mUIHandler = new Handler() {

        @Override
        public void handleMessage(Message msg) {

            switch (msg.what) {
                case CHECK_UHF_FINISH:
                    MyUhfManager.CheckUhfResultEnum r = (MyUhfManager.CheckUhfResultEnum) msg.obj;
                    switch (r) {
                        case OK:
                            myUhfManager.startInventory();
                            isStartTest = true;
                            mReadingTimes = 0 ;
                            sendEmptyMessage(READING_TIME_UPDATE);
                            break;
                        case POWER_ON_ERR:
                            startInventoryBT.setEnabled(true);
                            clearDataBT.setEnabled(true);
                            Toast.makeText(mContext, R.string.uhf_poweron_failed, Toast.LENGTH_SHORT).show();
                            break;
                        case NO_UHF_DEVICE:
                            startInventoryBT.setEnabled(true);
                            clearDataBT.setEnabled(true);
                            Toast.makeText(mContext, R.string.uhf_not_available, Toast.LENGTH_SHORT).show();
                            break;
                        case SET_PARAMS_ERR:
                            startInventoryBT.setEnabled(true);
                            clearDataBT.setEnabled(true);
                            Toast.makeText(mContext, R.string.uhf_set_power_failed, Toast.LENGTH_SHORT).show();
                            break;
                    }
                    break;
                case GET_UHF_DATA:
                    Bundle result = (Bundle) msg.obj;
                    Parcelable[] tagInfos = result.getParcelableArray("tag");
                    long time = result.getLong("readtime");
                    tag_read_num_once.setText(getString(R.string.uhf_read_count_once,""+tagInfos.length));
                    getDataFromList(tagInfos);

//                    for (int i = 0; i < 50; i++) {
//                        String temp = "TEST";
//                        String temp2 = mainActivity.test[new Random().nextInt(5)] + new Random().nextInt(100000) + "ABDEFG";
//                        long start = System.currentTimeMillis();
//                        //排除重复的EPC
//                        if (!temp2.contains("000000000000000000000000000000000")
//                                && mainActivity.uhfDataHS.add(temp2)) {
//                            Map<String, String> tempMap = new HashMap<>(4);
//                            tempMap.put(TAG_EPC, temp);
//                            tempMap.put(TAG_TID, temp2);
//                            long end = System.currentTimeMillis();
//                            tempMap.put("useTime", (end - start) + "");
//                            mainActivity.uhfDataList.add(tempMap);
//                        }
//                    }

                    uhfDataAdapter.addList();
                    tagNumTV.setText(mContext.getString(R.string.uhf_tag_total_count) + ":" + (uhfDataList.size() - 1));
//                    mainActivity.testTV.setText(mainActivity.uhfDataList.size() + "");
                    break;
                case USER_FREE_BACK_KEY:
                    startInventoryBT.setEnabled(true);
                    stopInventoryBT.setEnabled(true);
                    clearDataBT.setEnabled(true);
                    break;
                case INIT_UHF_FINISH:
                    initUHFProgress.setVisibility(View.GONE);
                    MyUhfManager.InitUhfResultEnum r1 = (MyUhfManager.InitUhfResultEnum) msg.obj;
                    switch (r1) {
                        case OK:
                            Toast.makeText(mContext, R.string.uhf_init_complete, Toast.LENGTH_SHORT).show();
                            break;
                        case POWER_ON_ERR:
                            Toast.makeText(mContext, R.string.uhf_poweron_failed, Toast.LENGTH_SHORT).show();
                            break;
                        case NO_UHF_DEVICE:
                            Toast.makeText(mContext, R.string.uhf_not_available, Toast.LENGTH_SHORT).show();
                            break;
                        case SET_POWER_ERR:
                            Toast.makeText(mContext, R.string.uhf_set_power_failed, Toast.LENGTH_SHORT).show();
                            break;
                        case SET_TIME_ERR:
                            Toast.makeText(mContext, R.string.uhf_set_interval_time_failed, Toast.LENGTH_SHORT).show();
                            break;
                        case SET_TID_ERR:
                            Toast.makeText(mContext, R.string.uhf_set_embeddata_failed, Toast.LENGTH_SHORT).show();
                            break;
                        case STOP_QUICK_ERR:
                            Toast.makeText(mContext, R.string.uhf_close_fastmode_failed, Toast.LENGTH_SHORT).show();
                            break;
                    }
                    break;
                case PWER_ON_FINISH:
                    if (!(boolean) msg.obj)
                        Toast.makeText(mContext, R.string.uhf_poweron_failed_ex, Toast.LENGTH_SHORT).show();
                    break;
                case CLEAR_DATA_FINISH:
                    uhfDataAdapter.notifyDataSetChanged();
                    myUhfManager.setScanKey();
                    startInventoryBT.setEnabled(true);
                    stopInventoryBT.setEnabled(true);
                    clearDataBT.setEnabled(true);
                    mReadingTimes = 0;
                    tag_read_time.setText(getString(R.string.uhf_read_time,mReadingTimes + "s"));
                    tagNumTV.setText(mContext.getString(R.string.uhf_tag_total_count) + ":" + 0);
                    tag_read_num_once.setText(getString(R.string.uhf_read_count_once,""));
                    break;
                case READING_TIME_UPDATE:
                    if(!isStartTest)
                        break;
                    tag_read_time.setText(getString(R.string.uhf_read_time,(mReadingTimes++) + "s"));
                    sendEmptyMessageDelayed(READING_TIME_UPDATE,1000L);
                    break;
            }

        }

        private void getDataFromList(Parcelable[] tagInfos) {
            if (tagInfos == null) {
                Toast.makeText(mContext, R.string.uhf_read_nothing, Toast.LENGTH_SHORT).show();
                return;
            } else {
                for (Parcelable parcel : tagInfos) {
                    TagInfo tagInfo = (TagInfo) parcel;
                    String temp = UHFReader.bytes_Hexstr(tagInfo.EpcId);
                    String temp2 = UHFReader.bytes_Hexstr(tagInfo.EmbededData);
                    long start = System.currentTimeMillis();
                    //排除重复的EPC
                    uhfDataHS.remove(temp);
                    uhfDataHS.add(temp);
                    TableItemInfo itemInfo = new TableItemInfo(mContext);
                    itemInfo.tagInfo = tagInfo;
                    int index = uhfDataList.indexOf(itemInfo);
                    if(index != -1)
                    {
                        TableItemInfo oldItemInfo = uhfDataList.get(index);
                        int oldCount = oldItemInfo.tagInfo.ReadCnt;
                        itemInfo.tagInfo.ReadCnt += oldCount;

                        uhfDataList.remove(index);
                        uhfDataList.add(index,itemInfo);
                    }else
                        uhfDataList.add(itemInfo);

                    long end = System.currentTimeMillis();


                    /*if (!uhfDataHS.contains(temp2)) {
                        uhfDataHS.add(temp2);
                        TableItemInfo itemInfo = new TableItemInfo(mContext);
                        itemInfo.tagInfo = tagInfo;
                        long end = System.currentTimeMillis();
                        uhfDataList.add(itemInfo);

                    }*/
//                    Toast.makeText(mainActivity,"get " + temp2,Toast.LENGTH_SHORT).show();
                }
            }
        }
    };

    private class FoucusBackKeyThread extends Thread {
        @Override
        public void run() {
            try {
                while (true) {
                    Thread.sleep(1000);
                    if (!isChecking) {
                        mUIHandler.sendEmptyMessage(USER_FREE_BACK_KEY);
                        break;
                    }
                    Thread.sleep(1000);
                    isChecking = false;
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    private class TestThread extends Thread {
        @Override
        public void run() {
            int i = 0;
            try {
                while (i < 2000) {
                    Thread.sleep(15);

                    mUIHandler.sendEmptyMessage(GET_UHF_DATA);

                    Thread.sleep(15);

                    i++;
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    private BroadcastReceiver mUhfBR = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (!Constant.ACTION_UHF_RESULT_SEND.equals(action))
                return;
            if (!isChecking && myUhfManager.isScanKeyOn()) {
                startInventoryBT.setEnabled(false);
                stopInventoryBT.setEnabled(false);
                clearDataBT.setEnabled(false);
                new FoucusBackKeyThread().start();
            }
            isChecking = true;
            Parcelable[] tagInfos = intent.getParcelableArrayExtra(Constant.EXTRA_TAG_INFO);
            long startReading = intent.getLongExtra("extra_start_reading_time", 0l);
            long stopReading = System.currentTimeMillis();
            long readTime = stopReading - startReading;
            Message msg = Message.obtain(mUIHandler, GET_UHF_DATA);
            Bundle bundle = new Bundle();
            bundle.putParcelableArray("tag", tagInfos);
            bundle.putLong("readtime", readTime);
            msg.obj = bundle;
            mUIHandler.sendMessage(msg);
        }
    };
}
