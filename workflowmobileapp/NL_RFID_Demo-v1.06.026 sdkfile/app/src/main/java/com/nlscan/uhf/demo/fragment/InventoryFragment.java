package com.nlscan.uhf.demo.fragment;

import static android.widget.AbsListView.OnScrollListener.SCROLL_STATE_IDLE;
import static android.widget.AbsListView.OnScrollListener.SCROLL_STATE_TOUCH_SCROLL;

import static com.nlscan.uhf.demo.util.Constant.isInt;
import static com.nlscan.uhf.demo.util.Constant.isURM500;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.app.Fragment;
import android.app.ProgressDialog;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.res.Configuration;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.Looper;
import android.os.Message;
import android.os.Parcelable;
import android.os.Process;
import android.support.annotation.Nullable;
import android.text.TextUtils;
import android.util.Log;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.AbsListView;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.CompoundButton;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.ImageView;
import android.widget.ListView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import com.nlscan.android.uhf.TagInfo;
import com.nlscan.android.uhf.UHFManager;
import com.nlscan.android.uhf.UHFReader;
import com.nlscan.uhf.demo.AppApplication;
import com.nlscan.uhf.demo.R;
import com.nlscan.uhf.demo.adapter.TableItemInfo;
import com.nlscan.uhf.demo.adapter.UhfDataListAdapter;
import com.nlscan.uhf.demo.util.Constant;
import com.nlscan.uhf.demo.util.constant.UHFParams;
import com.nlscan.uhf.demo.util.storage.LocalStorageManager;
import com.nlscan.uhf.demo.util.view.TimerTextView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.lang.reflect.Field;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

public class InventoryFragment extends BaseFragment {

    private final String TAG = InventoryFragment.class.getSimpleName();

    private Context mContext;
    private UHFManager mUHFMgr = UHFManager.getInstance();
    private View mLayoutView;
    private HorizontalScrollView mHorizontalScrollView;
    private ListView lv_data_list;
    private View btn_start_inventory;
    private ImageView im_toggle_inventory;
    private TextView tv_toggle_inventory;

    private View btn_export_data;
    private View btn_clean;
    private CheckBox cb_max_rssi;
    private CheckBox cb_mutip_tags;
    private CheckBox cb_tid;
    private CheckBox cb_rssi;
    private CheckBox cb_protocal;
    private CheckBox cb_frequence;
    //Total data count
    private TextView tv_total_count;
    //Total tag count
    private TextView tv_total_tags_count;
    //Inventory speed
    private TextView tv_speed;
    private EditText et_time;
    private TimerTextView tv_inv_span_time;
    //Battery Temperature
    private TextView tv_battery_temperature;
    private UhfDataListAdapter mAdapter;

    private List<TableItemInfo> mUhfDataList;//tag datas
    private Map<String, TableItemInfo> mTableItemMap = new HashMap<>();

    private int mListViewScrollState = SCROLL_STATE_IDLE;
    private Map<String, Integer> mTagCountMap;
    private int mMaxRssi = -1000;
    private long mStartReadingTime = 0;
    private int readTotalCount = 0;
    private AtomicInteger readTotalCountSafe = new AtomicInteger(0);

    private int tagCount = 0;
    private int speed = 0;
    private boolean mHidden = false;

    private BroadcastReceiver mBatteryStateReceiver;
    private boolean invStopping = true;
    //
    private boolean mIsEmbedDataEnable = false;

    private final int MSG_UPDATE_VIEW = 0x01;
    private final int MSG_UPDATE_DATA_LIST_VIEW = 0x02;
    private final int MSG_UPDATE_DATA_LIST_VIEW_2 = 0x22;
    private final int MSG_STOP_INVENTORY = 0x03;
    private final int MSG_CLEAR_COMPLETE = 0x04;
    private final int MSG_TAGS_PUSH_TO_CACHE_AND_HANDLE = 0x05;
    private final int MSG_UPDATE_INVENTORY_PARAMS = 0x06;
    private final int MSG_EXPORT_DATA_COMPLETE = 0x07;

    private final int MSG_UI_UPDATE_ONLY_INV_STATISTIC = 0x08;


    private Handler mUIHandler;
    private Handler mTagsReceivedHandler;
    private HandlerThread mTagsReceivedHandlerThread;

    private HandlerThread mInvDataHandlerThread;
    private Handler mInvDataHandler;
    private final static int MSG_RUN_GET_TAGS_DATA = 0x01;
    private final static int MSG_START_CLEAR_DATA = 0x02;
    private int mFirstVisibleItem = -1;
    private int mVisibleItemCount = -1;

    Spinner spinner_read_power,spinner_write_power, spinner_inv_policy, spinner_region;
    private View content_params_bar, content_ant_power, content_policy_region;
    private ExecutorService mExecutorService = Executors.newFixedThreadPool(8);

    private ArrayAdapter<String> adapter_inv_policy;

    private ArrayAdapter<String> adapter_ant_power;
    String[] spipow = {"5", "6", "7", "8", "9", "10", "11",
            "12", "13", "14", "15", "16", "17", "18", "19",
            "20", "21", "22", "23", "24", "25", "26", "27",
            "28", "29", "30", "31", "32", "33"};

    private class InvDataHandler extends Handler {
        public InvDataHandler(Looper looper) {
            super(looper);
        }

        @Override
        public void handleMessage(Message msg) {
            switch (msg.what) {
                case MSG_RUN_GET_TAGS_DATA:
                    Parcelable[] tagInfos = (Parcelable[]) msg.obj;
                    runUpdateViewThread(tagInfos);
                    break;
                case MSG_START_CLEAR_DATA:
                    startClear();
                    break;
            }
        }
    }

    @Override
    public void onAttach(Context context) {
        super.onAttach(context);
        mContext = context;
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mTagCountMap = new ConcurrentHashMap<>();
        mUIHandler = new CustomHandler(Looper.getMainLooper());

        mInvDataHandlerThread = new HandlerThread("InvHandlerThread", Process.THREAD_PRIORITY_BACKGROUND);
        mInvDataHandlerThread.start();
        mInvDataHandler = new InvDataHandler(mInvDataHandlerThread.getLooper());

        mTagsReceivedHandlerThread = new HandlerThread("tags_receiver_handler", Process.THREAD_PRIORITY_BACKGROUND);
        mTagsReceivedHandlerThread.start();
        mTagsReceivedHandler = new CustomHandler(mTagsReceivedHandlerThread.getLooper());

    }

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, Bundle savedInstanceState) {
        mLayoutView = inflater.inflate(R.layout.layout_inv_main, null);
        return mLayoutView;
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        initView();
    }

    @Override
    public void onKeyDown(int keyCode, KeyEvent event) {

        if (mHidden)
            return;

        if (keyCode == 243) {
            if (event.getRepeatCount() == 0) {
                Log.d(TAG, "keycode: " + keyCode + ", invStopping: " + invStopping);
                if (invStopping)
                    startInventory();
            }
        }
    }

    @Override
    public void onKeyUp(int keyCode, KeyEvent event) {

        if (mHidden)
            return;

        if (keyCode == 243) {
            stopInventory();
        }
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);

        //Large size screen
        boolean isLargeScreen = (getResources().getConfiguration().screenLayout
                & Configuration.SCREENLAYOUT_SIZE_MASK) >= Configuration.SCREENLAYOUT_SIZE_LARGE;
        if(!isLargeScreen)
        {
            if(content_params_bar != null)
                content_params_bar.setVisibility(newConfig.orientation == Configuration.ORIENTATION_LANDSCAPE ? View.GONE : View.VISIBLE);
        }


    }

    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG, "Fragment onResume.");
        if (!mHidden)
            handleResumeEvent();
    }

    @Override
    public void onPause() {
        super.onPause();
        Log.d(TAG, "Fragment onPause.");
        handlePauseEvent();
    }

    @Override
    public void onHiddenChanged(boolean hidden) {
        super.onHiddenChanged(hidden);
        Log.d(TAG, "Fragment hidden: " + hidden);
        mHidden = hidden;
        if (hidden) {
            handlePauseEvent();
        } else {
            handleResumeEvent();
        }
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        mExecutorService.shutdown();
    }

    @Override
    public void onAttach(Activity activity) {
        super.onAttach(activity);
    }

    @Override
    public void onAttachFragment(Fragment childFragment) {
        super.onAttachFragment(childFragment);
    }

    @Override
    public void onDetach() {
        super.onDetach();
    }

    @Override
    public void onUhfPowerOning() {
        super.onUhfPowerOning();
    }

    @Override
    public void onUhfPowerOn() {
        super.onUhfPowerOn();
        Log.d(TAG,"---onUhfPowerOn---");
        if(!mUIHandler.hasMessages(MSG_UPDATE_VIEW))
            mUIHandler.sendEmptyMessage(MSG_UPDATE_VIEW);
    }

    @Override
    public void onUhfPowerOff() {
        super.onUhfPowerOff();
    }

    @Override
    public void onUhfStartInventory() {
        super.onUhfStartInventory();
        updateStateOnStartInventroy();
        Log.d(TAG, "onUhfStartInventory: ");
//        mUHFMgr.setParam("INVENTORY_IDLE_TIME", "PARAM_INVENTORY_IDLE_TIME", "200");
//        mUHFMgr.setParam("INVENTORY_REGULAR_TIME", "PARAM_INVENTORY_REGULAR_TIME", "{\n" +
//                "\"nominal\": 50,\n" +
//                "\"extended\": 180,\n" +
//                "\"regulatory\": 200,\n" +
//                "\"offSameChannel\": 0\n" +
//                "}");
//        mUHFMgr.setParam("INVENTORY_SCENE", "PARAM_INVENTORY_SCENE", "0");
    }

    @Override
    public void onUhfStopInventory() {
        super.onUhfStopInventory();
        updateStateOnStopInventroy();
    }

    private void handleResumeEvent() {
        if (mUHFMgr.isPowerOn()) {
            if(!mUIHandler.hasMessages(MSG_UPDATE_VIEW))
                mUIHandler.sendEmptyMessage(MSG_UPDATE_VIEW);
        }
        registerResultReceiver();
        wakeupScreen();
    }

    private void handlePauseEvent() {
        unRegisterResultReceiver();
        stopInventory();
        clearWakeup();
    }

    private void wakeupScreen() {
        clearWakeup();
        getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    private void clearWakeup() {
        getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    private void initView() {
        mHorizontalScrollView = (HorizontalScrollView) mLayoutView.findViewById(R.id.horizontalScrollView1);
        lv_data_list = (ListView) mLayoutView.findViewById(R.id.lv_data_list);
        btn_start_inventory = mLayoutView.findViewById(R.id.btn_start_inventory);
        im_toggle_inventory = (ImageView) mLayoutView.findViewById(R.id.im_toggle_inventory);
        tv_toggle_inventory = (TextView) mLayoutView.findViewById(R.id.tv_toggle_inventory);

        btn_export_data = mLayoutView.findViewById(R.id.btn_export_data);
        btn_clean = mLayoutView.findViewById(R.id.btn_clean);
        cb_max_rssi = (CheckBox) mLayoutView.findViewById(R.id.cb_max_rssi);
        cb_mutip_tags = (CheckBox) mLayoutView.findViewById(R.id.cb_mutip_tags);
        cb_tid = (CheckBox) mLayoutView.findViewById(R.id.cb_tid);
        cb_rssi = (CheckBox) mLayoutView.findViewById(R.id.cb_rssi);
        cb_frequence = (CheckBox) mLayoutView.findViewById(R.id.cb_frequence);
        cb_protocal = (CheckBox) mLayoutView.findViewById(R.id.cb_protocal);

        //Total data count
        tv_total_count = (TextView) mLayoutView.findViewById(R.id.tv_total_count);
        //Total tag count
        tv_total_tags_count = (TextView) mLayoutView.findViewById(R.id.tv_total_tags_count);
        //Inventory speed
        tv_speed = (TextView) mLayoutView.findViewById(R.id.tv_speed);
        et_time = (EditText) mLayoutView.findViewById(R.id.et_time);
        tv_inv_span_time = (TimerTextView) mLayoutView.findViewById(R.id.tv_inv_span_time);
        tv_battery_temperature = (TextView) mLayoutView.findViewById(R.id.tv_battery_temperature);

        cb_mutip_tags.setChecked(true);
        tv_total_count.setText(getString(R.string.uhf_total_count, ""));
        tv_total_tags_count.setText(getString(R.string.uhf_total_tag, ""));
        tv_speed.setText(getString(R.string.uhf_inv_speed, ""));
        tv_battery_temperature.setText(getString(R.string.battery_temperature, ""));

        mUhfDataList = Collections.synchronizedList(new ArrayList<TableItemInfo>(1000));
//        TableItemInfo headItemInfo = new TableItemInfo(mContext);
//        mUhfDataList.add(headItemInfo);
        mAdapter = new UhfDataListAdapter(mContext, mUhfDataList);
        lv_data_list.setAdapter(mAdapter);
        lv_data_list.setOnScrollListener(new AbsListView.OnScrollListener() {
            @Override
            public void onScrollStateChanged(AbsListView view, int scrollState) {
                mListViewScrollState = scrollState;
            }

            @Override
            public void onScroll(AbsListView view, int firstVisibleItem, int visibleItemCount, int totalItemCount) {

                mFirstVisibleItem = firstVisibleItem;
                mVisibleItemCount = visibleItemCount;

            }
        });
        View.OnClickListener onClick = new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                switch (v.getId()) {
                    case R.id.btn_start_inventory:
                        toggleInventoryButton();
                        break;
                    case R.id.btn_export_data:
                        exportTagData();
                        break;
                    case R.id.btn_clean:
                        mInvDataHandler.sendEmptyMessage(MSG_START_CLEAR_DATA);
                        break;
                }
            }
        };

        btn_start_inventory.setOnClickListener(onClick);
        btn_export_data.setOnClickListener(onClick);
        btn_clean.setOnClickListener(onClick);

        //Params bar
        content_params_bar = mLayoutView.findViewById(R.id.content_params_bar);

        //Invalid settings,
        cb_max_rssi.setVisibility(View.GONE);

        //Ant views
        content_ant_power = mLayoutView.findViewById(R.id.content_ant_power);
        content_policy_region = mLayoutView.findViewById(R.id.content_policy_region);
        spinner_read_power= (Spinner) mLayoutView.findViewById(R.id.spinner_read_power);
        spinner_write_power= (Spinner) mLayoutView.findViewById(R.id.spinner_write_power);
        spinner_inv_policy = (Spinner) mLayoutView.findViewById(R.id.spinner_inv_policy);

        spinner_read_power.setOnTouchListener(mSpinnerTouchListener);
        spinner_write_power.setOnTouchListener(mSpinnerTouchListener);
        spinner_inv_policy.setOnTouchListener(mSpinnerTouchListener);

        //Ant power
        Map<String, Object> settings = mUHFMgr.getAllParams();
        int[] maxpowerArr = settings == null ? null : ((int[]) settings.get(UHFParams.RF_MAXPOWER.KEY));
        int maxpower = (maxpowerArr == null || maxpowerArr.length < 1) ? 3000 : maxpowerArr[0];//set default value if read from config failed
        if (Constant.isURM_E7(mModelName) && maxpower > 3000) { //URM_E7[SIM7100] support 33db
            spipow = new String[]{"500", "600", "700", "800", "900", "1000", "1100",
                    "1200", "1300", "1400", "1500", "1600", "1700", "1800", "1900",
                    "2000", "2100", "2200", "2300", "2400", "2500", "2600", "2700",
                    "2800", "2900", "3000", "3100", "3200", "3300"};
        } else if(Constant.isURM_R2(mModelName)){
            spipow = new String[]{"500", "600", "700", "800", "900", "1000", "1100",
                    "1200", "1300", "1400", "1500", "1600", "1700", "1800", "1900",
                    "2000", "2100", "2200", "2300", "2400", "2500", "2600", "2700",
                    "2800", "2900", "3000"};
        }else if (Constant.isURF520(mModelName) || Constant.isURM500(mModelName)) { //URF520 support 33db
            spipow = new String[35];//support 34db
            for (int i = 0; i < spipow.length; i++) {
                spipow[i] = i + "";
            }
        }else if(Constant.isURF100(mModelName)){
            spipow = new String[31];//support 30db
            for (int i = 0; i < spipow.length; i++) {
                spipow[i] = i + "";
            }
        }

        String[] invPolicyLabels = Constant.getInventoryPolicyLabels(mContext,mModelName);
        adapter_inv_policy = new ArrayAdapter<String>(mContext, android.R.layout.simple_spinner_item, invPolicyLabels);
        adapter_inv_policy.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner_inv_policy.setAdapter(adapter_inv_policy);

        adapter_ant_power = new ArrayAdapter<String>(mContext, android.R.layout.simple_spinner_item, spipow);
        adapter_ant_power.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner_read_power.setAdapter(adapter_ant_power);
        spinner_write_power.setAdapter(adapter_ant_power);

        spinner_read_power.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int i, long l) {
                if(!isUserClick)
                    return;
                Log.d(TAG,"----spinner_read_power.onItemSelected.----");
                setAntPowerData();
            }

            @Override
            public void onNothingSelected(AdapterView<?> adapterView) {

            }
        });
        spinner_write_power.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int i, long l) {
                if(!isUserClick)
                    return;
                Log.d(TAG,"----spinner_write_power.onItemSelected.----");
                setAntPowerData();
            }

            @Override
            public void onNothingSelected(AdapterView<?> adapterView) {

            }
        });
        spinner_inv_policy.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int i, long l) {
                if(!isUserClick)
                    return;
                Log.d(TAG,"----spinner_inv_policy.onItemSelected.----");
                setInventoryPolicyData();
            }

            @Override
            public void onNothingSelected(AdapterView<?> adapterView) {

            }
        });

        initRegionView();

    }//End initView

    private void initInventoryPolicyView()
    {

    }

    private void initRegionView() {

        spinner_region= (Spinner) mLayoutView.findViewById(R.id.spinner_region);
        spinner_region.setOnTouchListener(mSpinnerTouchListener);
        spinner_region.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int i, long l) {
                if(!isUserClick)
                    return;
                Log.d(TAG,"----spinner_region.onItemSelected.----");
                setRegionData();
            }

            @Override
            public void onNothingSelected(AdapterView<?> adapterView) {

            }
        });

        String[] regionLabels = Constant.getRegionLabels(mContext,mModelName);

        ArrayAdapter adapter_regions = new ArrayAdapter<String>(mContext, android.R.layout.simple_spinner_item, regionLabels);
        adapter_regions.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner_region.setAdapter(adapter_regions);
    }

    private void setInventoryPolicyData() {
        if (setInventoryPolicyDataNotSilion()) {
            UHFReader.READER_STATE er = UHFReader.READER_STATE.INVALID_PARA;
            int index = spinner_inv_policy.getSelectedItemPosition();
            int[] policyValues = Constant.getInventoryPolicyValues(mContext,mModelName);
            if (policyValues != null && index >= 0 && index < policyValues.length) {
                int iValue = policyValues[index];
                er = mUHFMgr.setParam(UHFParams.INV_POLICY.KEY, UHFParams.INV_POLICY.PARAM_INV_POLICY, String.valueOf(iValue));
            } else
                er = UHFReader.READER_STATE.INVALID_PARA;

            if (er == UHFReader.READER_STATE.OK_ERR) { //Update ant power datas
                updateAntPowerData();
            }
            Log.d(TAG,"--setInventoryPolicyData, accured.---");
        }
    }
    private boolean setInventoryPolicyDataNotSilion() {
        if (!Constant.isSLR1200(mUHFMgr.getUHFDeviceModel())) {
            return true;
        }
        return false;
    }


    private void setAntPowerData() {
        int antportc =1;
        int[] rpower = new int[antportc];
        int[] wpower = new int[antportc];
        for (int i = 0; i < antportc; i++) {
            rpower[i] = spinner_read_power.getSelectedItemPosition();
            wpower[i] = spinner_write_power.getSelectedItemPosition();
        }

        try {

            JSONArray jsItemArray = new JSONArray();

            for (int i = 0; i < antportc; i++) {
                int antid = i + 1;
                int readPower = (short) (500 + 100 * rpower[i]);
                int writePower = (short) (500 + 100 * wpower[i]);

                if (!Constant.isURM_R2(mUHFMgr.getUHFDeviceModel())
                        && !Constant.isURM_E7(mUHFMgr.getUHFDeviceModel())) {
                    readPower = isInt(spipow[rpower[i]]) ? Integer.parseInt(spipow[rpower[i]]) : readPower;
                    writePower = isInt(spipow[wpower[i]]) ? Integer.parseInt(spipow[wpower[i]]) : writePower;
                }

                JSONObject jsItem = new JSONObject();
                jsItem.put("antid", antid);
                jsItem.put("readPower", readPower);
                jsItem.put("writePower", writePower);

                jsItemArray.put(jsItem);
            }
            Log.d(TAG, "Ant datas: " + jsItemArray.toString());

            UHFReader.READER_STATE er = mUHFMgr.setParam(UHFParams.RF_ANTPOWER.KEY, UHFParams.RF_ANTPOWER.PARAM_RF_ANTPOWER, jsItemArray.toString());

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void updateAntPowerData() {
        try {

            //加载"读写器发射功率JSONArray的字符串形式[{"antid":1,"readPower":2600,"writePower":2700},...]格式
            String sValue = getStringParam(UHFParams.RF_ANTPOWER.KEY, UHFParams.RF_ANTPOWER.PARAM_RF_ANTPOWER, null);
            Log.d(TAG, "Ant power data: " + sValue);
            if (!TextUtils.isEmpty(sValue)) {
                JSONArray jsArray = new JSONArray(sValue);
                int len = jsArray.length();
                if (len > 0) {
                    for (int i = 0; i < len; i++) {
                        JSONObject jobj = jsArray.optJSONObject(i);
                        int antid = jobj.optInt("antid");//天线ID
                        short readPower = (short) jobj.optInt("readPower");//读功率
                        short writePower = (short) jobj.optInt("writePower");//写功率
                        Log.d(TAG, "readPower: " + readPower + ", writePower: " + writePower);
                        if (i == 0) {
                            int offset = 0;
                            int rpIndex = readPower > 100 ? (readPower - 500) / 100 : (readPower - offset);
                            int wpIndex = writePower > 100 ? (writePower - 500) / 100 : (writePower - offset);

                            Log.d(TAG, "rpIndex: " + rpIndex + ", wpIndex: " + wpIndex);

                            if (rpIndex >= spipow.length || wpIndex >= spipow.length) {
                                if (!Constant.isURM_R2(mUHFMgr.getUHFDeviceModel())
                                        && !Constant.isURM_E7(mUHFMgr.getUHFDeviceModel())
                                        && spipow != null && spipow.length > 0) {
                                    rpIndex = spipow.length - 1;
                                    wpIndex = spipow.length - 1;
                                } else {
                                    continue;
                                }
                            }

                            AdapterView.OnItemSelectedListener rlistener = spinner_read_power.getOnItemSelectedListener();
                            AdapterView.OnItemSelectedListener wlistener = spinner_write_power.getOnItemSelectedListener();
                            spinner_read_power.setOnItemSelectedListener(null);
                            spinner_write_power.setOnItemSelectedListener(null);
                            spinner_read_power.setSelection(rpIndex);
                            spinner_write_power.setSelection(wpIndex);
                            spinner_read_power.setOnItemSelectedListener(rlistener);
                            spinner_write_power.setOnItemSelectedListener(wlistener);

                        }
                    }
                }

            } else
                Toast.makeText(mContext, "updateAntPowerData: " + getString(R.string.no_data), Toast.LENGTH_SHORT).show();

        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(mContext,
                            "Exception:" + e.getMessage(), Toast.LENGTH_SHORT)
                    .show();
        }
    }

    private void updateURM_E7InventoryPolicyData() {
        int curInvPolicy = getIntParam(UHFParams.INV_POLICY.KEY,
                UHFParams.INV_POLICY.PARAM_INV_POLICY,
                mContext.getResources().getInteger(R.integer.inv_policy_normal_value));
        int[] allInvPolicy = mContext.getResources().getIntArray(R.array.inv_policy_values);
        int invPoclicyIndex = 0;
        for (int i = 0; i < allInvPolicy.length; i++) {
            if (allInvPolicy[i] == curInvPolicy) {
                invPoclicyIndex = i;
                break;
            }
        }
        Log.d(TAG,"---updateURM_E7InventoryPolicyData, accured---");
        spinner_inv_policy.setSelection(invPoclicyIndex);
    }

    private void updateRegionData() {
        spinner_region.setSelection(-1);
        int region = getIntParam(UHFParams.FREQUENCY_REGION.KEY, "", -1);
        if (region != -1) {
            UHFParams.Region_Conf regionEnum = UHFParams.Region_Conf.valueOf(region);
            String[] regionLabels = Constant.getRegionLabels(mContext,mModelName);
            List<String> listRegion = Arrays.asList(regionLabels);
            int index = 0;
            Log.d(TAG,"---updateRegionData, regionEnum:="+regionEnum);
            switch (regionEnum) {
                case RG_NA: //North america
                    index = listRegion.indexOf(mContext.getString(R.string.region_item_north_america_label));
                    break;
                case RG_EU3: //Europe3
                    index = listRegion.indexOf(mContext.getString(R.string.region_item_euro3_label));
                    break;
                case RG_PRC: //China
                    index = listRegion.indexOf(mContext.getString(R.string.region_item_china_label));
                    break;
                case RG_PRC2: //China２
                    index = listRegion.indexOf(mContext.getString(R.string.region_item_china2_label));
                    break;
                case RG_IN: //India
                    index = listRegion.indexOf(mContext.getString(R.string.region_item_india_label));
                    break;
                case RG_KR: //Korea
                    index = listRegion.indexOf(mContext.getString(R.string.region_item_korea_label));
                    break;
                case RG_OPEN://All
                    index = listRegion.indexOf(mContext.getString(R.string.region_item_all_label));
                    break;
            }
            spinner_region.setSelection(index);

            String sregionCert = getStringParam(UHFParams.REGION_CERTIFICATION.KEY,
                    UHFParams.REGION_CERTIFICATION.PARAM_REGION_CERTIFICATION,
                    "");
            if (!TextUtils.isEmpty(sregionCert)) {
                int regionCert = Integer.parseInt(sregionCert);
                UHFParams.Region_Conf regionc = UHFParams.Region_Conf.valueOf(regionCert);
                Log.d("TAG", "Region certification: " + regionc.name());
                if (regionc != UHFParams.Region_Conf.RG_PRC && regionc != UHFParams.Region_Conf.RG_PRC2)
                    spinner_region.setEnabled(false);
            }

        } else
            Toast.makeText(mContext, "updateRegionData: " + getString(R.string.no_data), Toast.LENGTH_SHORT).show();

    }

    /**
     * Set region datas
     */
    private void setRegionData() {
        UHFParams.Region_Conf rre;

        String[] regionLabels = Constant.getRegionLabels(mContext,mModelName);

        List<String> listRegion = Arrays.asList(regionLabels);
        final int china = listRegion.indexOf(mContext.getString(R.string.region_item_china_label));
        final int china2 = listRegion.indexOf(mContext.getString(R.string.region_item_china2_label));
        final int northAmerica = listRegion.indexOf(mContext.getString(R.string.region_item_north_america_label));
        final int europe3 = listRegion.indexOf(mContext.getString(R.string.region_item_euro3_label));
        final int india = listRegion.indexOf(mContext.getString(R.string.region_item_india_label));
        final int korea = listRegion.indexOf(mContext.getString(R.string.region_item_korea_label));
        final int all = listRegion.indexOf(mContext.getString(R.string.region_item_all_label));

        int index = spinner_region.getSelectedItemPosition();
        if (index == china) {
            rre = UHFParams.Region_Conf.RG_PRC;//China
        } else if (index == china2) {
            rre = UHFParams.Region_Conf.RG_PRC2;//China２
        } else if (index == northAmerica) {
            rre = UHFParams.Region_Conf.RG_NA;//North america
        } else if (index == europe3) {
            rre = UHFParams.Region_Conf.RG_EU3;//Europe3
        } else if (index == india) {
            rre = UHFParams.Region_Conf.RG_IN;//India
        } else if (index == korea) {
            rre = UHFParams.Region_Conf.RG_KR;//Korea
        } else if (index == all) {
            rre = UHFParams.Region_Conf.RG_OPEN;//All
        } else
            rre = UHFParams.Region_Conf.RG_NONE;

        if (rre == UHFParams.Region_Conf.RG_NONE) {
            Toast.makeText(mContext, R.string.unsupport_region, Toast.LENGTH_SHORT).show();
            return;
        }

        int iRegion = rre.value();
        UHFReader.READER_STATE er = mUHFMgr.setParam(UHFParams.FREQUENCY_REGION.KEY, UHFParams.FREQUENCY_REGION.PARAM_FREQUENCY_REGION, String.valueOf(iRegion));
        if (er != UHFReader.READER_STATE.OK_ERR) {
            Toast.makeText(mContext, getString(R.string.setting_fail) + " : " + er.toString(), Toast.LENGTH_SHORT).show();
        }
    }

    public void updateViewData() {
        if (!mUHFMgr.isPowerOn())
            return;

        //inventory button
        btn_start_inventory.setEnabled(!mUHFMgr.isInInventory());
        //--MAX RSSI
        String sValue = mUHFMgr.getParam(UHFParams.TAGDATA_RECORDHIGHESTRSSI.KEY, UHFParams.TAGDATA_RECORDHIGHESTRSSI.PARAM_TAGDATA_RECORDHIGHESTRSSI, "");
        if (!TextUtils.isEmpty(sValue)) {
            int[] hightrssi = Constant.stringToIntArray(sValue, ",");
            boolean bRecordRssi = hightrssi == null ? false : hightrssi[0] == 1;
            cb_max_rssi.setOnCheckedChangeListener(null);
            cb_max_rssi.setChecked(bRecordRssi);//Record hightest rssi
        }

        //--EMBDED DATA TID
        boolean isTidEnable = isTidEnable();
        cb_tid.setOnCheckedChangeListener(null);
        cb_tid.setChecked(isTidEnable);

        String sRssi = mUHFMgr.getParam(UHFParams.INV_FIELD_RSSI.KEY,
                UHFParams.INV_FIELD_RSSI.PARAM_INV_FIELD_RSSI,
                "0");
        String sFrequnce = mUHFMgr.getParam(UHFParams.INV_FIELD_FREQUENCE.KEY,
                UHFParams.INV_FIELD_FREQUENCE.PARAM_INV_FIELD_FREQUENCE,
                "0");
        String sProtocal = mUHFMgr.getParam(UHFParams.INV_FIELD_PROTOCAL.KEY,
                UHFParams.INV_FIELD_PROTOCAL.PARAM_INV_FIELD_PROTOCAL,
                "0");

        boolean isNormalMode = true;
        if (Constant.isSLR1200(mUHFMgr.getUHFDeviceModel())) //URM_R2[MODOULE_SLR1200]
        {
            int iQuickMode = getIntParam(UHFParams.INV_QUICK_MODE.KEY, UHFParams.INV_QUICK_MODE.PARAM_INV_QUICK_MODE, 0);
            int[] iGenSessions = getIntArrayParam(UHFParams.POTL_GEN2_SESSION.KEY, UHFParams.POTL_GEN2_SESSION.PARAM_POTL_GEN2_SESSION, new int[]{-1});
            boolean q1enable1200 = (iQuickMode == 1 && iGenSessions[0] > 0);
            boolean q0enable1200 = (iQuickMode == 1 && iGenSessions[0] == 0);
            if (q1enable1200 || q0enable1200)
                isNormalMode = false;

        } else {
            int invPolicy = getIntParam(UHFParams.INV_POLICY.KEY, UHFParams.INV_POLICY.PARAM_INV_POLICY, mContext.getResources().getInteger(R.integer.inv_policy_balance_value));
            isNormalMode = (invPolicy == mContext.getResources().getInteger(R.integer.inv_policy_normal_value));
        }

        //Normal mode,disable rssi,frequence
        boolean brssi = (!"0".equals(sRssi));
        boolean bfrequnce = (!"0".equals(sFrequnce));
        boolean bprotocal = (!"0".equals(sProtocal));


        cb_rssi.setOnCheckedChangeListener(null);
        cb_frequence.setOnCheckedChangeListener(null);
        cb_protocal.setOnCheckedChangeListener(null);
        cb_rssi.setChecked(brssi);
        cb_frequence.setChecked(bfrequnce);
        cb_protocal.setChecked(bprotocal);


        CompoundButton.OnCheckedChangeListener mOnCheck = new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                switch (buttonView.getId()) {
                    case R.id.cb_max_rssi:
                        mUHFMgr.setParam(UHFParams.TAGDATA_RECORDHIGHESTRSSI.KEY, UHFParams.TAGDATA_RECORDHIGHESTRSSI.PARAM_TAGDATA_RECORDHIGHESTRSSI, isChecked ? "1" : "0");
                        break;
                    case R.id.cb_tid:
                        enableTIDEmbeded(isChecked);
                        break;
                    case R.id.cb_rssi:
                        mUHFMgr.setParam(UHFParams.INV_FIELD_RSSI.KEY, UHFParams.INV_FIELD_RSSI.PARAM_INV_FIELD_RSSI, isChecked ? "1" : "0");
                        break;
                    case R.id.cb_frequence:
                        mUHFMgr.setParam(UHFParams.INV_FIELD_FREQUENCE.KEY, UHFParams.INV_FIELD_FREQUENCE.PARAM_INV_FIELD_FREQUENCE, isChecked ? "1" : "0");
                        break;
                    case R.id.cb_protocal:
                        mUHFMgr.setParam(UHFParams.INV_FIELD_PROTOCAL.KEY, UHFParams.INV_FIELD_PROTOCAL.PARAM_INV_FIELD_PROTOCAL, isChecked ? "1" : "0");
                        break;
                }
            }
        };

        cb_max_rssi.setOnCheckedChangeListener(mOnCheck);
        cb_tid.setOnCheckedChangeListener(mOnCheck);
        cb_rssi.setOnCheckedChangeListener(mOnCheck);
        cb_frequence.setOnCheckedChangeListener(mOnCheck);
        cb_protocal.setOnCheckedChangeListener(mOnCheck);

        //Update ant power views data
        updateAntPowerData();
        //Update inventory policy views data
        updateURM_E7InventoryPolicyData();
        //Update region views data
        updateRegionData();
    }


    private boolean isTidEnable() {
        try {
            String sValue = getStringParam(UHFParams.TAG_EMBEDEDDATA.KEY, UHFParams.TAG_EMBEDEDDATA.PARAM_TAG_EMBEDEDDATA, "");
            if (TextUtils.isEmpty(sValue))
                return false;

            JSONObject jsItem = new JSONObject(sValue);
            int bank = jsItem.optInt("bank");
            String sHexAccesspwd = jsItem.optString("accesspwd");
            int bytecnt = jsItem.optInt("bytecnt");
            int startaddr = jsItem.optInt("startaddr");
            if (bytecnt > 0 && bank == UHFReader.BANK_TYPE.TID.value())
                return true;
        } catch (Exception e) {
        }

        return false;
    }

    private void enableTIDEmbeded(boolean enable) {
        UHFManager mUHFMgr = UHFManager.getInstance();
        int bank = UHFReader.BANK_TYPE.TID.value();//TID Bank
        int startaddr = 0;//start address(block count)
        int bytecnt = 12;
        try {
            JSONObject jsItem = new JSONObject();
            jsItem.put("bank", bank);
            jsItem.put("startaddr", startaddr);
            jsItem.put("bytecnt", bytecnt);
            String sValue = jsItem.toString();
            //set embeded datas
            if (enable) {
                mUHFMgr.setParam(UHFParams.TAG_EMBEDEDDATA.KEY,
                        UHFParams.TAG_EMBEDEDDATA.PARAM_TAG_EMBEDEDDATA,
                        sValue);
            } else {
                mUHFMgr.setParam(UHFParams.TAG_EMBEDEDDATA.KEY,
                        UHFParams.TAG_EMBEDEDDATA.PARAM_TAG_EMBEDEDDATA,
                        null);
            }


        } catch (Exception e) {

        }

    }

    private void toggleInventoryButton() {
        Log.d(TAG, "Toggle inventory...");
        if (!mUHFMgr.isInInventory()) {
            startInventory();
        } else
            stopInventory();
    }

    public UHFReader.READER_STATE startInventory() {
        invStopping = false;
        if (!mUHFMgr.isPowerOn()) {
            Toast.makeText(mContext, getString(R.string.uhf_not_available), Toast.LENGTH_SHORT).show();
            return UHFReader.READER_STATE.UNKNOWN_READER_TYPE;
        }

        mIsEmbedDataEnable = isEmbedEnable();
        UHFReader.READER_STATE er = doStartInventory();
        //Keep screen on
        if (er == UHFReader.READER_STATE.OK_ERR) {
            updateStateOnStartInventroy();
        }
        mExecutorService.execute(new Runnable() {
            @Override
            public void run() {
                for (; !invStopping; ) {
                    try {
                        onlyUIHandle.removeCallbacksAndMessages(null);
                        onlyUIHandle.sendMessage(Message.obtain(onlyUIHandle, MSG_UI_UPDATE_ONLY_INV_STATISTIC));
                        Thread.sleep(50);
                    } catch (Exception e) {
                    }
                }
            }
        });

        mExecutorService.execute(new Runnable() {
            @Override
            public void run() {
                for (; !invStopping; ) {
                    try {
//                        if (lVUpdateTimeoutMs.get() < 1) {
//                            Thread.sleep(LV_TIME_OUT_MS / 2);
//                            continue;
//                        }
                        lVUpdateTimeoutMs.decrementAndGet();
                        Thread.sleep(LV_TIME_OUT_MS);
                    } catch (Exception e) {
                    }
                }
            }
        });
        return er;
    }

    private void updateStateOnStartInventroy() {
        //mInvDataHandler.sendEmptyMessage(MSG_START_CLEAR_DATA);
        mStartReadingTime = System.currentTimeMillis();
        tv_inv_span_time.startTimeCounter();
        startTimeLimit();
        disableOrEnableViewOnInventory(false);

        im_toggle_inventory.setImageResource(R.drawable.inv_stop);
        tv_toggle_inventory.setText(R.string.uhf_main_stop_tag_inventory);

    }

    private void disableOrEnableViewOnInventory(boolean enable) {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {

                btn_export_data.setEnabled(enable);
                btn_clean.setEnabled(enable);
                cb_max_rssi.setEnabled(enable);
                cb_mutip_tags.setEnabled(enable);
                cb_tid.setEnabled(enable);
                et_time.setEnabled(enable);

                cb_rssi.setEnabled(enable);
                cb_protocal.setEnabled(enable);
                cb_frequence.setEnabled(enable);
            }
        });
    }

    public UHFReader.READER_STATE stopInventory() {
        invStopping = true;
        UHFReader.READER_STATE er = doStopInventory();
        if (er == UHFReader.READER_STATE.OK_ERR)
            updateStateOnStopInventroy();


        return er;
    }

    private void updateStateOnStopInventroy() {
        tv_inv_span_time.stopTimeCounter();
        disableOrEnableViewOnInventory(true);

        im_toggle_inventory.setImageResource(R.drawable.inv_start);
        tv_toggle_inventory.setText(R.string.uhf_main_start_tag_inventory);
    }


    private UHFReader.READER_STATE doStartInventory() {
        AppApplication.getInstance().getTagDatas().clear();
        AppApplication.getInstance().getTagDatas().add(0,mContext.getString(R.string.none));
        long l = System.currentTimeMillis();
        UHFReader.READER_STATE er = mUHFMgr.startTagInventory();
        Log.d(TAG, "startTagInventory cost: " + (System.currentTimeMillis() - l) + "ms");
        return er;
    }

    private UHFReader.READER_STATE doStopInventory() {
        return mUHFMgr.stopTagInventory();
    }

//    private void updateListView()
//    {
//        /**第一个可见的位置**/
//        int firstVisiblePosition = lv_data_list.getFirstVisiblePosition();
//        /**最后一个可见的位置**/
//        int lastVisiblePosition = firstVisiblePosition + 15 ;
//        if(mUhfDataList.size() < lastVisiblePosition -1)
//            lastVisiblePosition = mUhfDataList.size() - 1;
//
//        for(int i = firstVisiblePosition; i < lastVisiblePosition + 1; i++)
//        {
//            int position = i;
//            View convertView = lv_data_list.getChildAt(position);
//            boolean needadd = convertView == null;
//            if(needadd)
//                mAdapter.addList();
//            else
//                mAdapter.getView(position,convertView,lv_data_list);
//        }
//
//    }

    private void runUpdateViewThread(Parcelable[] tagInfos) {
        if (tagInfos == null)
            return;

        try {
            boolean handleComplete = false;
            while (!handleComplete && !mHidden) {
                //It's scrolling,don't update view imediatly
                if (mListViewScrollState == SCROLL_STATE_IDLE) {
                    Message.obtain(mUIHandler, MSG_UPDATE_DATA_LIST_VIEW, tagInfos).sendToTarget();
                    handleComplete = true;
                }
                if (!handleComplete)
                    Thread.sleep(1);
            }

        } catch (Exception e) {
            Log.w("TAG", "err:", e);
        }

    }

    private void getDataFromList(Parcelable[] tagInfos) {
        if (tagInfos == null) {
            return;
        } else {

            boolean isMultipTag = cb_mutip_tags.isChecked();
            for (Parcelable parcel : tagInfos) {
                TagInfo tagInfo = (TagInfo) parcel;
                tagInfo.Epclen = tagInfo.Epclen == 0 ? (short) tagInfo.EpcId.length : tagInfo.Epclen;
                if (!isMultipTag) {
                    int rssi = tagInfo.RSSI;
                    if (rssi < mMaxRssi)
                        continue;
                    else {
                        mMaxRssi = rssi;
                        mUhfDataList.clear();
                    }
                }

                //unavailable tag
                String indexKey = getTagKey(tagInfo);
                //Log.i(TAG, "getDataFromList: " + format("indexKey:%s", indexKey));
                if (TextUtils.isEmpty(indexKey))
                    continue;

                //Remote repeatitive EPC
                boolean tagExist = mTagCountMap.containsKey(indexKey);
                int lastReadCnt = tagExist ? mTagCountMap.get(indexKey) : 0;
                lastReadCnt += tagInfo.ReadCnt;
                tagInfo.ReadCnt = lastReadCnt;
                mTagCountMap.put(indexKey, lastReadCnt);

                if (tagExist) //Already exist
                {
                    TableItemInfo oldItemInfo = mTableItemMap.get(indexKey);//mUhfDataList.get(index);
                    TagInfo oldTagInfo = oldItemInfo.tagInfo;
                    TagInfo newTagInfo = tagInfo;
                    oldTagInfo.AntennaID = newTagInfo.AntennaID;
                    oldTagInfo.Frequency = newTagInfo.Frequency;
                    oldTagInfo.TimeStamp = newTagInfo.TimeStamp;
                    //oldTagInfo.EmbededDatalen = newTagInfo.EmbededDatalen;
                    //oldTagInfo.EmbededData = newTagInfo.EmbededData;
                    oldTagInfo.Res = newTagInfo.Res;
                    oldTagInfo.Epclen = newTagInfo.Epclen;
                    oldTagInfo.PC = newTagInfo.PC;
                    oldTagInfo.CRC = newTagInfo.CRC;
                    oldTagInfo.EpcId = newTagInfo.EpcId;
                    oldTagInfo.Phase = newTagInfo.Phase;
                    oldTagInfo.protocol = newTagInfo.protocol;
                    oldTagInfo.ReadCnt = newTagInfo.ReadCnt;
                    oldTagInfo.RSSI = newTagInfo.RSSI;


                    if (newTagInfo.EmbededDatalen > 0) {
                        oldTagInfo.EmbededDatalen = newTagInfo.EmbededDatalen;
                        oldTagInfo.EmbededData = newTagInfo.EmbededData;
                    }

                    if (!isMultipTag)
                        mUhfDataList.add(oldItemInfo);
                    //mUhfDataList.remove(index);
                    //mUhfDataList.add(index,itemInfo);
                } else {
                    final TableItemInfo itemInfo = new TableItemInfo(mContext);
                    itemInfo.tagInfo = tagInfo;
                    mTableItemMap.put(indexKey, itemInfo);
                    //Add data to global cache
                    byte[] epcIdBytes = Arrays.copyOfRange(tagInfo.EpcId, 0, tagInfo.Epclen);
                    String epcIdHex = UHFReader.bytes_Hexstr(epcIdBytes);
                    AppApplication.getInstance().addTagData(epcIdHex);
                    mUhfDataList.add(itemInfo);
                }
            }//End for
            tagCount = mUhfDataList.size(); //Non duplicate tags count
        }
    }

    private synchronized String getTagKey(TagInfo tagInfo) {
        if (mIsEmbedDataEnable && tagInfo.EmbededDatalen == 0)
            return null;

        byte[] epcIdBytes = Arrays.copyOfRange(tagInfo.EpcId, 0, tagInfo.Epclen);
        byte[] embedDataBytes = tagInfo.EmbededDatalen > 0 ? Arrays.copyOfRange(tagInfo.EmbededData, 0, tagInfo.EmbededDatalen) : null;

        String epcIdHex = UHFReader.bytes_Hexstr(epcIdBytes);
        String embededDataHex = UHFReader.bytes_Hexstr(embedDataBytes);
        epcIdHex = epcIdHex == null ? "" : epcIdHex.trim();
        embededDataHex = embededDataHex == null ? "" : embededDataHex.trim();
        return epcIdHex + embededDataHex;
    }


    private boolean isEmbedEnable() {
        try {
            String sValue = getStringParam(UHFParams.TAG_EMBEDEDDATA.KEY, UHFParams.TAG_EMBEDEDDATA.PARAM_TAG_EMBEDEDDATA, "");
            if (TextUtils.isEmpty(sValue))
                return false;

            JSONObject jsItem = new JSONObject(sValue);
            int bank = jsItem.optInt("bank");
            String sHexAccesspwd = jsItem.optString("accesspwd");
            int bytecnt = jsItem.optInt("bytecnt");
            int startaddr = jsItem.optInt("startaddr");
            if (bytecnt > 0)
                return true;
        } catch (Exception e) {
        }

        return false;
    }

    private void startClear() {

        while (mListViewScrollState != SCROLL_STATE_IDLE) {
            try {
                Thread.sleep(50);
            } catch (Exception e) {
            }
        }

        mTableItemMap.clear();
        mTagCountMap.clear();
        mAdapter.clearAll();
        readTotalCount = 0;
        tagCount = 0;
        speed = 0;
        mMaxRssi = -1000;
        //
        readTotalCountSafe.set(0);
        coreLvData.clear();
        hsMap.clear();
//        mUhfDataList.clear();
        //Clear tag's cache(must be invoked)
        mUHFMgr.setParam(UHFParams.INV_CLEAR_CACHE.KEY, UHFParams.INV_CLEAR_CACHE.PARAM_INV_CLEAR_CACHE, "1");
        //Clear ShunFeng's tags cache
        mUHFMgr.setParam(UHFParams.INV_CLEAR_SF_CACHE.KEY, UHFParams.INV_CLEAR_SF_CACHE.PARAM_INV_CLEAR_SF_CACHE, "1");

        mUIHandler.sendEmptyMessage(MSG_CLEAR_COMPLETE);
        try {
            Thread.sleep(50);
        } catch (Exception e) {

        }
    }

    /**
     * Start time count
     */
    private void startTimeLimit() {
        String sTimeLimit = et_time.getText().toString();
        long lTimeSec = 0;
        if (!TextUtils.isEmpty(sTimeLimit) && TextUtils.isDigitsOnly(sTimeLimit)) {
            int maxLen = String.valueOf(Long.MAX_VALUE).length();
            if (sTimeLimit.length() > maxLen)
                sTimeLimit = sTimeLimit.substring(0, maxLen);
            lTimeSec = Long.parseLong(sTimeLimit);
        }

        if (lTimeSec <= 0)
            return;

        final long fLtime = lTimeSec * 1000;

        new Thread(new Runnable() {
            @Override
            public void run() {

                try {
                    long passTime = tv_inv_span_time.getPassTime();
                    while (true) {
                        Thread.sleep(100);
                        if (passTime > fLtime || invStopping) {
                            break;
                        } else {
                            passTime = tv_inv_span_time.getPassTime();
                        }
                    }

                    if (mUHFMgr.isInInventory())
                        mUIHandler.sendEmptyMessage(MSG_STOP_INVENTORY);

                } catch (Exception e) {
                }
            }
        }).start();
    }

    private void registerResultReceiver() {
        try {
            IntentFilter iFilter = new IntentFilter(Constant.ACTION_UHF_RESULT_SEND);
            mContext.registerReceiver(mUhfBR, iFilter);

            mBatteryStateReceiver = new BatteryStateReceiver();
            IntentFilter iFilter_battery = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            mContext.registerReceiver(mBatteryStateReceiver, iFilter_battery);

            Log.d(TAG, "---registerResultReceiver, result receiver, battery receiver.");

        } catch (Exception e) {
        }

    }

    private void unRegisterResultReceiver() {
        try {
            mContext.unregisterReceiver(mUhfBR);
            if (mBatteryStateReceiver != null)
                mContext.unregisterReceiver(mBatteryStateReceiver);
            Log.d(TAG, "---unRegisterResultReceiver, result receiver, battery receiver.");
        } catch (Exception e) {
        }
    }


    private void updateInventoryParams() {
        if (getActivity() == null)
            return;

        tv_total_count.setText(getString(R.string.uhf_total_count, " " + readTotalCount));
        tv_total_tags_count.setText(getString(R.string.uhf_total_tag, " " + tagCount));
        tv_speed.setText(getString(R.string.uhf_inv_speed, " " + speed + "/S"));
    }

    /**
     * Push recevied tag's informations to cache,for handler later
     */
    private void pushTagsToCacheAndHandle(Parcelable[] tagInfos) {
        synchronized (this) {

            //It's stoped, do nothing
            if (mHidden)
                return;

            //Tags read count
            updateTagCountViewDatas(tagInfos);

            //Cached first
            //runUpdateViewThread(tagInfos);
            Message msg = Message.obtain(mInvDataHandler, MSG_RUN_GET_TAGS_DATA, tagInfos);
            msg.sendToTarget();
        }
    }


    private ProgressDialog mExportPD = null;
    private Dialog mExportDialog = null;

    /**
     * Export tag data to *.cvs file
     */
    private void exportTagData() {
        if (mExportDialog != null)
            mExportDialog.dismiss();

        if (mUhfDataList == null || mUhfDataList.size() == 0) {
            Toast.makeText(mContext, R.string.no_data, Toast.LENGTH_SHORT).show();
            return;
        }

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd_HH_mm_ss");
        Date now = new Date();
        String sTime = sdf.format(now);
        File file = new File(Environment.getExternalStorageDirectory(), Environment.DIRECTORY_DOCUMENTS+"/uhf/export_tags_data_" + sTime + ".csv");
        final String filePath = file.getAbsolutePath();
        AlertDialog.Builder builder = new AlertDialog.Builder(getActivity());
        builder.setTitle(R.string.export_data);
        builder.setMessage(getString(R.string.export_data_prompt_conent, filePath));
        builder.setPositiveButton(R.string.export_confirm, new DialogInterface.OnClickListener() {

            @Override
            public void onClick(DialogInterface dialog, int which) {
                dialog.dismiss();
                mExportDialog = null;

                btn_export_data.setEnabled(false);
                mExportPD = new ProgressDialog(getActivity());
                mExportPD.setMessage(getString(R.string.exporting));
                mExportPD.show();
                startExportTagDataInThread(filePath);
            }
        }).setNegativeButton(R.string.common_cancel, new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                dialog.dismiss();
            }
        });

        mExportDialog = builder.create();
        mExportDialog.show();
    }

    private void startExportTagDataInThread(final String filePath) {
        new Thread(new Runnable() {
            @Override
            public void run() {

                int saveState = LocalStorageManager.exportDataToFile(mUhfDataList, filePath);
                Message.obtain(mUIHandler, MSG_EXPORT_DATA_COMPLETE, saveState, 0).sendToTarget();
            }
        }).start();

    }

    private int getIntParam(String paramKey, String paramName, int defValue) {
        String sValue = mUHFMgr.getParam(paramKey, paramName, String.valueOf(defValue));
        if (!TextUtils.isEmpty(sValue)) {
            int iValue = Integer.parseInt(sValue);
            return iValue;
        }
        return defValue;
    }

    private int[] getIntArrayParam(String paramKey, String paramName, int[] defValue) {
        String sValue = mUHFMgr.getParam(paramKey, paramName, "");
        if (!TextUtils.isEmpty(sValue)) {
            int[] iArray = Constant.stringToIntArray(sValue, ",");
            return iArray;
        }
        return defValue;
    }

    private String getStringParam(String paramKey, String paramName, String defValue) {
        return mUHFMgr.getParam(paramKey, paramName, defValue);
    }

    private void updateTagCountViewDatas(Parcelable[] tagInfos) {

        Map<String, Integer> copyMap = new HashMap<>();
        copyMap.putAll(mTagCountMap);

        if (tagInfos != null) {
            for (Parcelable parcel : tagInfos) {
                TagInfo tag = (TagInfo) parcel;
                String indexKey = getTagKey(tag);
                if (TextUtils.isEmpty(indexKey))
                    continue;

                int curTagCnt = tag.ReadCnt == 0 ? 1 : tag.ReadCnt;
                //Log.d(TAG,"curTagCnt:="+curTagCnt);

                int cnt = copyMap.containsKey(indexKey) ? copyMap.get(indexKey) + curTagCnt : 1;
                copyMap.put(indexKey, cnt);
            }
        }

        tagCount = copyMap.size();
        int tempTotal = 0;
        Collection<Integer> values = copyMap.values();
        for (Integer cnt : values) {
            tempTotal += cnt;
        }
        readTotalCount = tempTotal;

        if (mStartReadingTime != 0) {
            long readTime = tv_inv_span_time.getPassTime(); //System.currentTimeMillis() - mStartReadingTime;
            speed = readTotalCount / (int) (readTime / 1000 == 0 ? 1 : readTime / 1000);
        }

        //Update inventory's parameters
        mUIHandler.sendEmptyMessage(MSG_UPDATE_INVENTORY_PARAMS);
    }

    //--------------------------------------------------------------------------------
    // Inner Class
    //--------------------------------------------------------------------------------

    private BroadcastReceiver mUhfBR = new BroadcastReceiver() {

        @Override
        public void onReceive(Context context, Intent intent) {
            Log.d(TAG, "onReceive:  "+"rfid received");
            String action = intent.getAction();
            if (!Constant.ACTION_UHF_RESULT_SEND.equals(action))
                return;

            Parcelable[] tagInfos = intent.getParcelableArrayExtra(Constant.EXTRA_TAG_INFO);
            long startReadingTime = intent.getLongExtra("extra_start_reading_time", 0l);
            mStartReadingTime = startReadingTime == 0 ? mStartReadingTime : startReadingTime;
            if (mStartReadingTime == 0)
                mStartReadingTime = System.currentTimeMillis();


            mExecutorService.execute(new Runnable() {
                @Override
                public void run() {
                    startAnalysis(tagInfos);
                }
            });
//            Message msg = Message.obtain(mTagsReceivedHandler, MSG_TAGS_PUSH_TO_CACHE_AND_HANDLE, tagInfos);
//            msg.sendToTarget();


        }
    };

    //
//    AtomicInteger hitCount = new AtomicInteger(0);
    final int LV_TIME_OUT_INIT_VALUE = 1;
    final int LV_TIME_OUT_MS = 40;

    AtomicInteger lVUpdateTimeoutMs = new AtomicInteger(LV_TIME_OUT_INIT_VALUE);//ms

    List<TableItemInfo> coreLvData = Collections.synchronizedList(new ArrayList<>(1000));
    Map<String, Integer> hsMap = new ConcurrentHashMap(1000);
    Map<Integer, Boolean> hsMapHit = new ConcurrentHashMap(10);


    Handler onlyUIHandle = new Handler() {
        @Override
        public void handleMessage(Message msg) {
            switch (msg.what) {
                case MSG_UI_UPDATE_ONLY_INV_STATISTIC:
                    tv_total_count.setText(getString(R.string.uhf_total_count, " " + readTotalCountSafe));
                    tv_total_tags_count.setText(getString(R.string.uhf_total_tag, " " + (coreLvData == null ? 0 : coreLvData.size())));
                    tv_speed.setText(getString(R.string.uhf_inv_speed, " " + readTotalCountSafe.get() / (int) (tv_inv_span_time.getPassTime() / 1000 == 0 ? 1 : tv_inv_span_time.getPassTime() / 1000) + "/S"));
                    break;
            }
        }
    };


    void startAnalysis(Parcelable[] tags) {
        for (int i = 0; tags != null && i < tags.length; i++) {
            TagInfo tag = (TagInfo) tags[i];
            readTotalCountSafe.addAndGet(tag.ReadCnt);

            if (!cb_mutip_tags.isChecked()) {
                if (tag.RSSI >= mMaxRssi) {
                    mMaxRssi = tag.RSSI;
                    TableItemInfo tableItemInfo = new TableItemInfo(getActivity());
                    tableItemInfo.tagInfo = tag;
                    coreLvData.clear();
                    coreLvData.add(tableItemInfo);
                    updateListviewVisiblePart();
                }
                continue;
            }

            String tagKey = getTagKey(tag);
            if (tagKey == null) {
                return;
            }
            int lsDataIdx = getIdx(hsMap, tagKey);
            if (lsDataIdx == -1) {
                TableItemInfo tableItemInfo = new TableItemInfo(getActivity());
                tableItemInfo.tagInfo = tag;
                lsDataIdx = addWithIdx(coreLvData, tableItemInfo);
                hsMap.put(tagKey, lsDataIdx);
                AppApplication.getInstance().addTagData(UHFReader.bytes_Hexstr(tag.EpcId));
            } else {
                int index = getIdx(hsMap, tagKey);
                coreLvData.get(index).tagInfo.ReadCnt += tag.ReadCnt;
                CloneUtils.clone(tag, ((TableItemInfo) coreLvData.get(index)).tagInfo, "ReadCnt");
            }

            updateHit(lsDataIdx);

            boolean updateUI = isUpdateUI(lsDataIdx);
            if (updateUI) {
                updateListviewVisiblePart();//in UI thread
            }
        }
    }


    boolean isCountSatisfyOrTimeout() {
        if (hsMapHit.size() > 5 || (lVUpdateTimeoutMs.get() < LV_TIME_OUT_INIT_VALUE && hsMapHit.size() > 0)) {
            hsMapHit.clear();
            lVUpdateTimeoutMs.set(LV_TIME_OUT_INIT_VALUE);
            return true;
        } else {
            return false;
        }
    }

    void updateHit(int idx) {
        if (isInScreenRegion(idx)) {
            if (!hsMapHit.containsKey(new Integer(idx))) {
                hsMapHit.put(new Integer(idx), true);
            }
        }
    }


    void updateListviewVisiblePart() {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (!coreLvData.isEmpty()) {
                    //ui线程仅执行以下3行代码。
                    mUhfDataList.clear();
                    mUhfDataList.addAll(coreLvData);
                    mAdapter.notifyDataSetChanged();
                }
            }
        });
    }


    boolean isUpdateUI(int idx) {
        if (isListviewStateUpdate()) {
//            return isInScreenRegion(idx);
            return isCountSatisfyOrTimeout();
        }
        return false;
    }


    boolean isListviewStateUpdate() {
        return mListViewScrollState == SCROLL_STATE_IDLE || mListViewScrollState == SCROLL_STATE_TOUCH_SCROLL;
    }

    boolean isInScreenRegion(int idx) {
        if (lv_data_list.getFirstVisiblePosition() == 0 || (lv_data_list.getLastVisiblePosition() - lv_data_list.getFirstVisiblePosition() + 1) == 0) {
            return true;
        }
        if (idx < lv_data_list.getFirstVisiblePosition()) {
            return false;
        } else if (idx >= mUhfDataList.size()) {
            return true;
        } else if (idx >= lv_data_list.getLastVisiblePosition()) {
            return false;
        } else {
            return true;
        }
    }


    int getIdx(Map<String, Integer> m, String key) {
        Integer integer = m.get(key);
        if (integer == null) {
            return -1;
        } else {
            return integer.intValue();
        }
    }

    <T> int addWithIdx(List<T> list, T t) {
        boolean add = list.add(t);
        if (add) {
            return list.size() - 1;
        } else {
            return -1;
        }
    }


    public class BatteryStateReceiver extends BroadcastReceiver {

        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (Intent.ACTION_BATTERY_CHANGED.equals(action)) {
                int mainlevel = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, 0);
                int scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, 100);
                int percent = (mainlevel * 100) / scale; //eg: 56%

                int btemperature = intent.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0);
                float fbtemperature = (float) btemperature / 10;
                String sbtemperature = String.format("%3.1f", fbtemperature);
                String text = getString(R.string.battery_temperature, sbtemperature);
                Log.d(TAG, "--Temperature: " + text);
                tv_battery_temperature.setText(text);
            }
        }
    }//End BatteryStateReceiver

    private class CustomHandler extends Handler {
        public CustomHandler(Looper looper) {
            super(looper);
        }

        @Override
        public void handleMessage(Message msg) {
            //UI handler part
            switch (msg.what) {
                case MSG_UPDATE_VIEW://ui
                    updateViewData();
                    disableOrEnableViewOnInventory(!mUHFMgr.isInInventory());
                    break;
                case MSG_UPDATE_DATA_LIST_VIEW://ui
                    Parcelable[] tagInfos = (Parcelable[]) msg.obj;
                    getDataFromList(tagInfos);
                    mAdapter.addList();
                    updateTagCountViewDatas(null);
                    break;
                case MSG_UPDATE_INVENTORY_PARAMS:
                    updateInventoryParams();//ui
                    break;
                case MSG_STOP_INVENTORY:// ui
                    stopInventory();
                    break;
                case MSG_CLEAR_COMPLETE:// ui
                    mAdapter.notifyDataSetChanged();
                    tv_total_count.setText(mContext.getString(R.string.uhf_total_count, ""));
                    tv_total_tags_count.setText(mContext.getString(R.string.uhf_total_tag, ""));
                    tv_speed.setText(mContext.getString(R.string.uhf_inv_speed, ""));
                    tv_inv_span_time.setText("");
                    break;
                case MSG_EXPORT_DATA_COMPLETE://ui
                    mExportPD.dismiss();
                    mExportPD = null;

                    int exportState = msg.arg1;
                    if (exportState == LocalStorageManager.EXPORT_DATA_STATE_FAILED)
                        Toast.makeText(mContext, R.string.export_state_fail, Toast.LENGTH_SHORT).show();
                    else if (exportState == LocalStorageManager.EXPORT_DATA_STATE_CREATE_FILE_FAILED)
                        Toast.makeText(mContext, R.string.export_state_create_file_fail, Toast.LENGTH_SHORT).show();
                    else if (exportState == LocalStorageManager.EXPORT_DATA_STATE_SUCCESS)
                        Toast.makeText(mContext, R.string.export_state_success, Toast.LENGTH_SHORT).show();
                    btn_export_data.setEnabled(true);
                    break;
            }//End switch


            //Third thread handler part
            switch (msg.what) {
                case MSG_TAGS_PUSH_TO_CACHE_AND_HANDLE:
                    Parcelable[] tagInfos = (Parcelable[]) msg.obj;
                    pushTagsToCacheAndHandle(tagInfos);
                    break;
            }//End switch

        }//end handleMessage
    }//End class CustomHandler


    public static class CloneUtils {
        public synchronized static <T> T clone(T from, T to, String... ignoreFields) {
            if (from == null || to == null) {
                return null;
            }
            Field[] fields = from.getClass().getDeclaredFields();
            a:
            for (Field field : fields) {
                field.setAccessible(true);
                try {
                    String simpleName = field.getName();
                    for (int i = 0; ignoreFields != null && i < ignoreFields.length; i++) {
                        if (simpleName.equals(ignoreFields[i])) {
                            continue a;
                        }
                    }
                    Class<?> type = field.getType();
                    if (field.getType().isArray()) {
                        byte[] fromArray = (byte[]) field.get(from);
                        byte[] toArray = (byte[]) field.get(to);
                        if (fromArray != null) {
                            System.arraycopy(fromArray, 0, toArray, 0, fromArray.length);
                        }
                    } else if (type.isPrimitive()) {
                        field.set(to, field.get(from));
                    }
                } catch (IllegalAccessException e) {
                    e.printStackTrace();
                }
            }
            return to;
        }
    }

    private boolean isUserClick = false;
    private View.OnTouchListener mSpinnerTouchListener = new View.OnTouchListener() {
        @Override
        public boolean onTouch(View v, MotionEvent event) {
            isUserClick = true;
            v.performClick();
            return false;
        }
    };
}
