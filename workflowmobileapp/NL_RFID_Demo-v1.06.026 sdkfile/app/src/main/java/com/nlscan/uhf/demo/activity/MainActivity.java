package com.nlscan.uhf.demo.activity;

import static com.nlscan.android.uhf.UHFManager.PLUGIN_TYPE_BLE;
import static com.nlscan.android.uhf.UHFManager.PLUGIN_TYPE_NETWORK;
import static com.nlscan.uhf.demo.util.constant.UHFParams.UHF_STATE_BLE_DISCONNECT;
import static com.nlscan.uhf.demo.util.constant.UHFParams.UHF_STATE_STOP_INVENTORY_BLE;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.app.Fragment;
import android.app.FragmentManager;
import android.app.FragmentTransaction;
import android.app.ProgressDialog;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.text.TextUtils;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.PopupWindow;
import android.widget.RadioGroup;
import android.widget.TextView;
import android.widget.Toast;

import com.nlscan.android.uhf.UHFManager;
import com.nlscan.android.uhf.UHFModuleInfo;
import com.nlscan.android.uhf.UHFReader;
import com.nlscan.uhf.demo.AppApplication;
import com.nlscan.uhf.demo.R;
import com.nlscan.uhf.demo.fragment.BaseFragment;
import com.nlscan.uhf.demo.fragment.InventoryFragment;
import com.nlscan.uhf.demo.fragment.TagWriteFragment;
import com.nlscan.uhf.demo.fragment.UHFSettingsFragment;
import com.nlscan.uhf.demo.util.Constant;
import com.nlscan.uhf.demo.util.constant.UHFParams;
import com.nlscan.uhf.demo.util.permission.PermissionUtils;

import java.util.HashMap;
import java.util.Map;

public class MainActivity extends Activity {

    private final static int REQUEST_RUNTIME_PERMISSION = 0x10;

    private Context mContext;
    private UHFManager mUHFMgr = UHFManager.getInstance();
    private BaseFragment mInventoryFragment;
    private BaseFragment mSettingsFragment;
    private BaseFragment mTagFragment;
    private BaseFragment mCurFragment;

    private TextView tv_inv_mode_label;
    private TextView tv_inventory;
    private TextView tv_settings;
    private TextView tv_tags;
    private ImageView im_actionbar_settings;

    private PopupWindow mInvPolicyPopupWindow;
    private View mInvPolicyContentview;

    private boolean mPaused = false;
    private ProgressDialog mLoadingPD = null;
    private Dialog mReLoadDialog = null;

    //AURT、IP、BT-MAC，Model name
    private String mDevPathOrMac, mDeviceModel;
    //Plugin type
    private int mPluginType = -1;

    private Object mLoadLock = new Object();

    private Dialog mExitConfirmDialog = null;

    private final int MSG_LOAD_MODULE_COMPLETED = 0x01;
    private final int MSG_LOAD_MODULE = 0x02;
    private final int MSG_UPDATE_ACTION_BAR = 0x03;

    private Handler mUIHandler = new Handler() {

        @Override
        public void handleMessage(Message msg) {
            Log.d(TAG, "handleMessage: "+msg.what);
            switch (msg.what) {

                case MSG_LOAD_MODULE_COMPLETED:

                    if (Constant.isSupportSelectDevice()) {
                        if (!mUHFMgr.isConnect())
                            showReloadModuleWindow();
                        else
                            onUhfPowerOn();
                    } else {

                        if (mUHFMgr.getUHFModuleInfo() == null)
                            showReloadModuleWindow();
                        else
                            onUhfPowerOn();
                    }


                    break;
                case MSG_LOAD_MODULE:
                    Log.d(TAG, "MSG_LOAD_MODULE: "+String.format("isSupportSelectDevice:%b,isConnect:%b",Constant.isSupportSelectDevice(),mUHFMgr.isConnect()));
                    boolean connect = Constant.isSupportSelectDevice() ? mUHFMgr.isConnect() : mUHFMgr.isPowerOn();
                    if (!connect) //Load rfid mode
                        loadModule();
                    else
                        sendEmptyMessage(MSG_LOAD_MODULE_COMPLETED);
                    break;
                case MSG_UPDATE_ACTION_BAR:
                    updateActionBarInfo();
                    break;

            }//end switch
        }

    };
    private String TAG= MainActivity.class.getSimpleName();

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        mContext = getApplicationContext();
        mDevPathOrMac = getIntent().getStringExtra(Constant.EXTRA_DEVICE_PATH_OR_MAC);
        mDeviceModel = getIntent().getStringExtra(Constant.EXTRA_DEVICE_MODEL_KEY);
        mPluginType = getIntent().getIntExtra(Constant.EXTRA_DEVICE_PLUGIN_TYPE,-1);
        Log.d("TAG", "mDevPathOrMac:=" + mDevPathOrMac + ",mDeviceModelUserSelected:=" + mDeviceModel);
        initView();
        if (mUHFMgr.isPowerOn())
            showInventoryFragment();

        //动态权限申请
        //PermissionUtils.requestAllRuntimePermission(MainActivity.this);
    }

    private long mLastKeyBackTime = 0;

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {

        Log.d("TAG", "keyCode:=" + keyCode);
        /*if (keyCode == KeyEvent.KEYCODE_BACK) {
            if (mLastKeyBackTime == 0 || (System.currentTimeMillis() - mLastKeyBackTime) > 1000) {
                Toast.makeText(mContext, getString(R.string.exit_confirm_tip), Toast.LENGTH_SHORT).show();
                mLastKeyBackTime = System.currentTimeMillis();
                return true;
            }
        }*/
        if (keyCode == 243 && mCurFragment != null ) {
            mCurFragment.onKeyDown(keyCode, event);
        }

        return super.onKeyDown(keyCode, event);
    }

    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event) {
        if (keyCode == 243 && mCurFragment != null ) {
            mCurFragment.onKeyUp(keyCode, event);
        }

        if(keyCode == KeyEvent.KEYCODE_BACK)
        {
            if(mUHFMgr.isPowerOn())
            {
                showExitPromptWindow();
                return true;
            }
        }

        return super.onKeyUp(keyCode, event);
    }

    @Override
    protected void onResume() {
        super.onResume();
        mPaused = false;

        Log.d(TAG, "onResume: "+String.format("isSupportSelectDevice:%b,isConnect:%b",Constant.isSupportSelectDevice(),mUHFMgr.isConnect()));
        registerUHFStateReceiver();
        if (!mUIHandler.hasMessages(MSG_LOAD_MODULE)) {
            mUIHandler.sendEmptyMessageDelayed(MSG_LOAD_MODULE, 50);
        }

    }

    @Override
    protected void onPause() {
        super.onPause();
        mPaused = true;
        unRegisterUHFStateReceiver();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        Log.d("TAG", "Request permission result, request code: " + requestCode);
        if (requestCode == REQUEST_RUNTIME_PERMISSION) {
            mUIHandler.sendEmptyMessageDelayed(MSG_LOAD_MODULE, 50);
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        //Clear datas of this inventory period
        AppApplication.getInstance().clearTagData();
        //mUHFMgr.powerOff();
    }

    private void initView() {
        tv_inventory = (TextView) findViewById(R.id.tv_inventory);
        tv_settings = (TextView) findViewById(R.id.tv_settings);
        tv_tags = (TextView) findViewById(R.id.tv_tags);
        im_actionbar_settings = (ImageView) findViewById(R.id.im_actionbar_settings);
        tv_inv_mode_label = (TextView) findViewById(R.id.tv_inv_mode_label);

        View.OnClickListener mClick = new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                switch (v.getId()) {
                    case R.id.tv_inventory:
                        showInventoryFragment();
                        break;
                    case R.id.tv_settings:
                        showSettingsFragment();
                        break;
                    case R.id.tv_tags:
                        showTagsFragment();
                        break;
                    case R.id.im_actionbar_settings:
                        showInvPolicyPopWindow();
                        break;
                }
            }
        };

        tv_inventory.setOnClickListener(mClick);
        tv_settings.setOnClickListener(mClick);
        tv_tags.setOnClickListener(mClick);
        im_actionbar_settings.setOnClickListener(mClick);
    }

    private void updateActionBarInfo() {
        //Device model name
        String devModelName = mUHFMgr.getUHFDeviceModel();

        String invModeName = null;
        //--SLR1200[URM_R2] part
        if (Constant.isSLR1200(devModelName) || Constant.isBU10_or_BU20(devModelName)) {
            int iQuickMode = getUHFIntSetting(UHFParams.INV_QUICK_MODE.KEY, 0);
            int[] iGenSessions = getUHFIntArraySetting(UHFParams.POTL_GEN2_SESSION.KEY);
            iGenSessions = iGenSessions == null ? new int[]{-1} : iGenSessions;
            boolean q1enable1200 = (iQuickMode == 1 && iGenSessions[0] > 0);
            boolean q0enable1200 = (iQuickMode == 1 && iGenSessions[0] == 0);
            if (q1enable1200)
                invModeName = getString(R.string.start_quick_mode_s1);
            else if (q0enable1200)
                invModeName = getString(R.string.start_quick_mode_s0);
            else
                invModeName = getString(R.string.uhf_inv_mode_normal);
        }

        //--SIM7100[URM_E7] part
        if (Constant.isSIM7100(devModelName)||Constant.isURM500(devModelName)||Constant.isURM300(devModelName)||Constant.isURF520(devModelName)) {
            int curInvPolicy = getUHFIntSetting(UHFParams.INV_POLICY.KEY, mContext.getResources().getInteger(R.integer.inv_policy_balance_value));
            int normalPolicy = mContext.getResources().getInteger(R.integer.inv_policy_normal_value);
            int balancePolicy = mContext.getResources().getInteger(R.integer.inv_policy_balance_value);
            int quickPolicy = mContext.getResources().getInteger(R.integer.inv_policy_quickly_value);

            if (curInvPolicy == normalPolicy)
                invModeName = getString(R.string.inv_policy_normal_label);
            else if (curInvPolicy == balancePolicy)
                invModeName = getString(R.string.inv_policy_balance_label);
            else if (curInvPolicy == quickPolicy)
                invModeName = getString(R.string.inv_policy_quickly_label);
            else
                invModeName = getString(R.string.inv_policy_normal_label);
        }




        invModeName = invModeName == null ? "" : invModeName;
        tv_inv_mode_label.setText(invModeName);

        //Device model name
        TextView header_model_name = (TextView) findViewById(R.id.header_model_name);
        String sdk_ver = mUHFMgr.getParam(UHFParams.SDK.KEY, UHFParams.SDK.VERSION_NAME, "");
        header_model_name.setText("[ " + devModelName + "_sdk-" + sdk_ver + " ]");
    }

    private void focusTab(int id) {
        View v = findViewById(id);
        tv_inventory.setTextColor(Color.WHITE);
        tv_settings.setTextColor(Color.WHITE);
        tv_tags.setTextColor(Color.WHITE);
        switch (id) {
            case R.id.tv_inventory:
                tv_inventory.setTextColor(getResources().getColor(R.color.dark_blue));
                break;
            case R.id.tv_settings:
                tv_settings.setTextColor(getResources().getColor(R.color.dark_blue));
                break;
            case R.id.tv_tags:
                tv_tags.setTextColor(getResources().getColor(R.color.dark_blue));
                break;
        }
    }

    private void showInventoryFragment() {
        String fragTag = "inventory";
        FragmentManager fm = getFragmentManager();
        mInventoryFragment = (BaseFragment) fm.findFragmentByTag(fragTag);
        FragmentTransaction transaction = fm.beginTransaction();
        if (mCurFragment != null)
            transaction.hide(mCurFragment);

        if (mInventoryFragment == null) {
            mInventoryFragment = new InventoryFragment();
            transaction.add(R.id.body, mInventoryFragment, fragTag);
        }
        transaction.show(mInventoryFragment);
        if(Build.VERSION.SDK_INT > 24)
            transaction.commitNowAllowingStateLoss();
        else
            transaction.commit();

        im_actionbar_settings.setVisibility(View.INVISIBLE);
        tv_inv_mode_label.setVisibility(View.INVISIBLE);
        focusTab(R.id.tv_inventory);
        mCurFragment = mInventoryFragment;

        updateActionBarInfo();
    }

    private void showSettingsFragment() {
        String fragTag = "settings";
        FragmentManager fm = getFragmentManager();
        mSettingsFragment = (BaseFragment) fm.findFragmentByTag(fragTag);
        FragmentTransaction transaction = fm.beginTransaction();
        if (mCurFragment != null)
            transaction.hide(mCurFragment);

        if (mSettingsFragment == null) {
            mSettingsFragment = new UHFSettingsFragment();
            transaction.add(R.id.body, mSettingsFragment, fragTag);
        }
        transaction.show(mSettingsFragment);
        if(Build.VERSION.SDK_INT > 24)
            transaction.commitNowAllowingStateLoss();
        else
            transaction.commit();
        im_actionbar_settings.setVisibility(View.INVISIBLE);
        tv_inv_mode_label.setVisibility(View.INVISIBLE);
        focusTab(R.id.tv_settings);
        mCurFragment = mSettingsFragment;

    }

    private void showTagsFragment() {
        String fragTag = "tagWriter";
        FragmentManager fm = getFragmentManager();
        mTagFragment = (BaseFragment) fm.findFragmentByTag(fragTag);
        FragmentTransaction transaction = fm.beginTransaction();
        if (mCurFragment != null)
            transaction.hide(mCurFragment);

        if (mTagFragment == null) {
            mTagFragment = new TagWriteFragment();
            transaction.add(R.id.body, mTagFragment, fragTag);
        }
        transaction.show(mTagFragment);
        if(Build.VERSION.SDK_INT > 24)
            transaction.commitNowAllowingStateLoss();
        else
            transaction.commit();
        im_actionbar_settings.setVisibility(View.INVISIBLE);
        tv_inv_mode_label.setVisibility(View.INVISIBLE);
        focusTab(R.id.tv_tags);
        mCurFragment = mTagFragment;
    }

    private void showInvPolicyPopWindow() {
        if (mUHFMgr.isInInventory()) {
            Toast.makeText(mContext, getString(R.string.stop_inventory_first), Toast.LENGTH_SHORT).show();
            return;
        }

        initInvModePopupView();
        if (mInvPolicyPopupWindow == null) {
            mInvPolicyPopupWindow = new PopupWindow(mInvPolicyContentview, ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            mInvPolicyPopupWindow.setBackgroundDrawable(mContext.getDrawable(android.R.drawable.spinner_dropdown_background));
            mInvPolicyPopupWindow.setOutsideTouchable(true);
            mInvPolicyPopupWindow.setFocusable(true);
        }

        mInvPolicyPopupWindow.showAsDropDown(im_actionbar_settings, -80, 0);
    }//

    private void initInvModePopupView() {
        if (mInvPolicyContentview == null)
            mInvPolicyContentview = getLayoutInflater().inflate(R.layout.layout_inv_policy, null);
        RadioGroup rg_inv_policy_slr1200 = (RadioGroup) mInvPolicyContentview.findViewById(R.id.rg_inv_policy_slr1200);
        RadioGroup rg_inv_policy_sim7100 = (RadioGroup) mInvPolicyContentview.findViewById(R.id.rg_inv_policy_sim7100);
        RadioGroup rg_inv_policy_urf520 = (RadioGroup) mInvPolicyContentview.findViewById(R.id.rg_inv_policy_urf520);

        String modelName = mUHFMgr.getUHFDeviceModel();
        boolean isURM_R2 = Constant.isURM_R2(modelName);
        boolean isBU_x0 = Constant.isBU10_or_BU20(modelName);
        boolean isURM_E7 = Constant.isURM_E7(modelName);
        boolean isURM300 = Constant.isURM300(modelName);
        boolean isURF520 = Constant.isURF520(modelName);
        boolean isURM500 = Constant.isURM500(modelName);
        Log.d(TAG, "initInvModePopupView: "+modelName+" isURM_R2:"+isURM_R2+" isBU_x0:"+isBU_x0+" isURM_E7:"+isURM_E7+" isURM300:"+isURM300+" isURF520:"+isURF520+" isURM500:"+isURM500+" modelName:"+modelName);

        rg_inv_policy_slr1200.setVisibility(isURM_R2 ? View.VISIBLE : View.GONE);
        rg_inv_policy_sim7100.setVisibility(isURM_E7 || isURM500||isURF520||isURM300 ? View.VISIBLE : View.GONE);
        rg_inv_policy_urf520.setVisibility(View.GONE);


        if (isURM_R2 || isBU_x0)
            initPopuViewURM_R2();//--SLR1200[URM_R2]/BU10/BU20 part
        else if (isURM_E7 || isURM300||isURM500||isURF520)
            initPopuViewURM_E7();//--SIM7100[URM_E7] part
    }

    private void initPopuViewURM_R2() {
        //--SLR1200[URM_R2] part
        RadioGroup rg_inv_policy_slr1200 = (RadioGroup) mInvPolicyContentview.findViewById(R.id.rg_inv_policy_slr1200);
        int iQuickMode = getUHFIntSetting(UHFParams.INV_QUICK_MODE.KEY, 0);
        int[] iGenSessions = getUHFIntArraySetting(UHFParams.POTL_GEN2_SESSION.KEY);
        iGenSessions = iGenSessions == null ? new int[]{-1} : iGenSessions;
        boolean q1enable1200 = (iQuickMode == 1 && iGenSessions[0] > 0);
        boolean q0enable1200 = (iQuickMode == 1 && iGenSessions[0] == 0);
        if (q1enable1200)
            rg_inv_policy_slr1200.check(R.id.rb_item_inv_quickly_s1);
        else if (q0enable1200)
            rg_inv_policy_slr1200.check(R.id.rb_item_inv_quickly_s0);
        else
            rg_inv_policy_slr1200.check(R.id.rb_item_inv_quickly_normal);

        rg_inv_policy_slr1200.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(RadioGroup group, int checkedId) {
                selectInvPolicy(checkedId);
                mInvPolicyPopupWindow.dismiss();
            }
        });
    }

    private void initPopuViewURM_E7() {
        Log.d(TAG, "initPopuViewURM_E7: ");
        //--SIM7100[URM_E7] part
        RadioGroup rg_inv_policy_sim7100 = (RadioGroup) mInvPolicyContentview.findViewById(R.id.rg_inv_policy_sim7100);
        int curInvPolicy = getUHFIntSetting(UHFParams.INV_POLICY.KEY, mContext.getResources().getInteger(R.integer.inv_policy_balance_value));
        int normalPolicy = mContext.getResources().getInteger(R.integer.inv_policy_normal_value);
        int balancePolicy = mContext.getResources().getInteger(R.integer.inv_policy_balance_value);
        int quickPolicy = mContext.getResources().getInteger(R.integer.inv_policy_quickly_value);

        Log.d(TAG, "initPopuViewURM_E7: "+
                String.format("curInvPolicy:%d,normalPolicy:%d,balancePolicy:%d,quickPolicy:%d"
                        ,curInvPolicy,normalPolicy,balancePolicy,quickPolicy));

        if (Constant.isURM300(mUHFMgr.getUHFDeviceModel())) {
            View viewById = findViewById(R.id.rb_item_inv_quickly);
            if (viewById != null) {
                viewById.setVisibility(View.GONE);
            }
        }

        if (curInvPolicy == normalPolicy)
            rg_inv_policy_sim7100.check(R.id.rb_item_inv_normal);
        else if (curInvPolicy == balancePolicy)
            rg_inv_policy_sim7100.check(R.id.rb_item_inv_balance);
        else if (curInvPolicy == quickPolicy)
            rg_inv_policy_sim7100.check(R.id.rb_item_inv_quickly);
        else
            rg_inv_policy_sim7100.check(R.id.rb_item_inv_normal);

        rg_inv_policy_sim7100.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(RadioGroup group, int checkedId) {
                selectInvPolicy(checkedId);
                mInvPolicyPopupWindow.dismiss();
            }
        });

    }//End initPopuViewSIM7100

    /**
     * urf 520 support normal mass few inv policy which are not the same as URM_E7 or urm300
     */
    private void initPopuViewURF520() {
        RadioGroup rg_inv_policy_urf520 = (RadioGroup) mInvPolicyContentview.findViewById(R.id.rg_inv_policy_urf520);
        int curInvPolicy = getUHFIntSetting(UHFParams.INV_POLICY.KEY, mContext.getResources().getInteger(R.integer.inv_policy_normal_value));
        int normalPolicy = mContext.getResources().getInteger(R.integer.inv_policy_normal_value);
        int massPolicy = mContext.getResources().getInteger(R.integer.inv_policy_mass_value);
        int fewPolicy = mContext.getResources().getInteger(R.integer.inv_policy_few_value);


        if (curInvPolicy == normalPolicy)
            rg_inv_policy_urf520.check(R.id.rb_item_inv_urf520_normal);
        else if (curInvPolicy == massPolicy)
            rg_inv_policy_urf520.check(R.id.rb_item_inv_urf520_mass);
        else if (curInvPolicy == fewPolicy)
            rg_inv_policy_urf520.check(R.id.rb_item_inv_urf520_few);
        else
            rg_inv_policy_urf520.check(R.id.rb_item_inv_urf520_normal);

        rg_inv_policy_urf520.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(RadioGroup group, int checkedId) {
                selectInvPolicy(checkedId);
                mInvPolicyPopupWindow.dismiss();
            }
        });
    }

    //Select inventory strategy
    private void selectInvPolicy(int vId) {
        UHFReader.READER_STATE er = UHFReader.READER_STATE.CMD_FAILED_ERR;
        //--SLR1200[URM_R2] part
        if (vId == R.id.rb_item_inv_quickly_normal ||
                vId == R.id.rb_item_inv_quickly_s1 ||
                vId == R.id.rb_item_inv_quickly_s0) {
            boolean enableQuickMode = (vId == R.id.rb_item_inv_quickly_s1 || vId == R.id.rb_item_inv_quickly_s0);
            er = mUHFMgr.setParam(UHFParams.INV_QUICK_MODE.KEY, UHFParams.INV_QUICK_MODE.PARAM_INV_QUICK_MODE, enableQuickMode ? "1" : "0");
            if (enableQuickMode && er == UHFReader.READER_STATE.OK_ERR) {
                String session = vId == R.id.rb_item_inv_quickly_s1 ? "1" : "0";
                er = mUHFMgr.setParam(UHFParams.POTL_GEN2_SESSION.KEY, UHFParams.POTL_GEN2_SESSION.PARAM_POTL_GEN2_SESSION, session);
            }
            if (er != UHFReader.READER_STATE.OK_ERR)
                Toast.makeText(mContext, getString(R.string.setting_fail) + " : " + er.toString(), Toast.LENGTH_SHORT).show();
        }

        //--SIM7100[URM_E7] part
        if (vId == R.id.rb_item_inv_normal ||
                vId == R.id.rb_item_inv_balance ||
                vId == R.id.rb_item_inv_quickly) {
            int iValue = mContext.getResources().getInteger(R.integer.inv_policy_balance_value);
            if (vId == R.id.rb_item_inv_normal)
                iValue = mContext.getResources().getInteger(R.integer.inv_policy_normal_value);
            if (vId == R.id.rb_item_inv_quickly)
                iValue = mContext.getResources().getInteger(R.integer.inv_policy_quickly_value);
            er = mUHFMgr.setParam(UHFParams.INV_POLICY.KEY, UHFParams.INV_POLICY.PARAM_INV_POLICY, String.valueOf(iValue));
            if (er != UHFReader.READER_STATE.OK_ERR) {
                Toast.makeText(mContext, getString(R.string.setting_fail) + ",err: " + er.name(), Toast.LENGTH_SHORT).show();
            }
        }

        //Update action bar's information
        if (er == UHFReader.READER_STATE.OK_ERR)
            updateActionBarInfo();

        //Notify inventory to update view state
        if (mCurFragment instanceof InventoryFragment)
            ((InventoryFragment) mCurFragment).updateViewData();
    }

    protected void registerUHFStateReceiver() {
        IntentFilter iFilter = new IntentFilter(UHFManager.ACTOIN_UHF_STATE_CHANGE);
        mContext.registerReceiver(mUHFStateReceiver, iFilter);

        IntentFilter batteryFilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
        mContext.registerReceiver(mBatteryStateReceiver, batteryFilter);

    }

    protected void unRegisterUHFStateReceiver() {
        Log.d(TAG, "unRegisterUHFStateReceiver: ");
        try {
            mContext.unregisterReceiver(mUHFStateReceiver);
            mContext.unregisterReceiver(mBatteryStateReceiver);
        } catch (Exception e) {
        }
    }

    protected void showLoadingWindow() {
        if (mPaused)
            return;

        if (mLoadingPD != null && mLoadingPD.isShowing())
            return;

        mLoadingPD = new ProgressDialog(MainActivity.this);
        mLoadingPD.setProgressStyle(ProgressDialog.STYLE_SPINNER);
        mLoadingPD.setCancelable(true);
        mLoadingPD.setCanceledOnTouchOutside(false);
        mLoadingPD.setMessage(getString(R.string.power_oning));
        mLoadingPD.show();
    }

    //Reload module information
    private void loadModule() {
        synchronized (this) {



            if (mPaused)
                return;

            //Reload dialog is showing, do not reload
            if(isReloadDialogShowing())
                return;

            showLoadingWindow();
            new Thread(new Runnable() {

                @Override
                public void run() {

                    synchronized (mLoadLock) {

                        try {
                            Log.d(TAG, "isSupportSelectDevice: "+Constant.isSupportSelectDevice());
                            if (Constant.isSupportSelectDevice()) {
                                mUHFMgr.disconnect();
                                Thread.sleep(500);
                                UHFReader.READER_STATE er = mUHFMgr.asyncConnect(mDevPathOrMac,
                                                                    mPluginType,
                                                                    mDeviceModel,
                                                                    null);
                                Log.d(TAG, "Start asyncConnect,mDevPathOrMac:=" + mDevPathOrMac + ",mDeviceModel:=" + mDeviceModel + ", er:=" + er.name());
                                if (er == UHFReader.READER_STATE.OK_ERR)
                                    mLoadLock.wait(30000);
                            } else {
                                mUHFMgr.loadUHFModule();
                            }

                        } catch (Exception e) {
                        }
                        mUIHandler.sendEmptyMessage(MSG_LOAD_MODULE_COMPLETED);
                        Log.d(TAG, "loadModule: after send MSG_LOAD_MODULE_COMPLETED");
                    }

                }

            }).start();
        }
    }

    //Module not exists , show window
    private void showReloadModuleWindow() {
        synchronized (this) {

            if (mReLoadDialog != null) {
                if (!mReLoadDialog.isShowing() && !mPaused) {
                    mReLoadDialog.show();
                } else
                    return;
            }

            AlertDialog.Builder builder = new AlertDialog.Builder(MainActivity.this);
            builder.setTitle(R.string.common_tip);
            builder.setMessage(getString(R.string.uhf_module_unavailable));
            builder.setPositiveButton(R.string.search_again, new DialogInterface.OnClickListener() {

                @Override
                public void onClick(DialogInterface dialog, int which) {
                    dialog.dismiss();
                    mUIHandler.sendEmptyMessageDelayed(MSG_LOAD_MODULE, 50);
                }
            }).setNegativeButton(R.string.common_exit, new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    dialog.dismiss();
                    finish();
                }
            });

            mReLoadDialog = builder.create();
            mReLoadDialog.setCanceledOnTouchOutside(false);
            if (!mPaused)
                mReLoadDialog.show();
            else
                mReLoadDialog = null;
        }
    }

    private boolean isReloadDialogShowing()
    {
        return mReLoadDialog != null && mReLoadDialog.isShowing();
    }

    //Power oning
    protected void onUhfPowerOning() {
        Log.d("TAG", "---power oning---");
        showLoadingWindow();
        if (mCurFragment != null && mCurFragment.isResumed())
            mCurFragment.onUhfPowerOning();
    }

    /**
     * Power on complete
     */
    protected void onUhfPowerOn() {
        Log.d(TAG, "---power on---");

        synchronized (mLoadLock) {
            mLoadLock.notifyAll();
        }

        if (mLoadingPD != null)
            mLoadingPD.dismiss();
        if (mCurFragment != null && mCurFragment.isResumed())
            mCurFragment.onUhfPowerOn();
        else
            showInventoryFragment();
        updateActionBarInfo();

        String modelName = mUHFMgr.getUHFDeviceModel();
        if (Constant.isBU10_or_BU20(modelName)) //BU10/BU20 not support tag writing
            tv_tags.setVisibility(View.GONE);
        else
            tv_tags.setVisibility(View.VISIBLE);
    }


    private void onBleDisconnect() {

        if (Constant.isURM300(mUHFMgr.getUHFDeviceModel())) {
            mUHFMgr.disconnect();

            AlertDialog.Builder builder = new AlertDialog.Builder(MainActivity.this);
            builder.setTitle(R.string.common_tip);
            builder.setMessage(getString(R.string.uhf_module_unavailable));
            builder.setPositiveButton(R.string.search_again, new DialogInterface.OnClickListener() {

                @Override
                public void onClick(DialogInterface dialog, int which) {
                    dialog.dismiss();
                    mUIHandler.sendEmptyMessageDelayed(MSG_LOAD_MODULE, 50);
                }
            }).setNegativeButton(R.string.common_exit, new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    dialog.dismiss();
                    finish();
                }
            });
            builder.create().show();

        }
    }

    /**
     * Power off complete
     */
    protected void onUhfPowerOff() {
        Log.d(TAG, "---power off---");

        synchronized (mLoadLock) {
            mLoadLock.notifyAll();
        }


        if (mLoadingPD != null)
            mLoadingPD.dismiss();
        if (mCurFragment != null && mCurFragment.isResumed())
            mCurFragment.onUhfPowerOff();
    }

    /**
     * It's starting inventory
     */
    public void onUhfStartInventory() {
        if (mCurFragment != null && mCurFragment.isResumed())
            mCurFragment.onUhfStartInventory();
    }

    /**
     * It's stoping inventory
     */
    public void onUhfStopInventory() {
        if (mCurFragment != null && mCurFragment.isResumed())
            mCurFragment.onUhfStopInventory();
        updateActionBarInfo();
    }

    private int getUHFIntSetting(String key, int defaultValue) {
        Map<String, Object> settingsMap = mUHFMgr.getAllParams();
        int result = defaultValue;
        if (settingsMap != null && settingsMap.get(key) != null) {
            result = (Integer) settingsMap.get(key);
        }
        return result;
    }

    private int[] getUHFIntArraySetting(String key) {
        Map<String, Object> settingsMap = mUHFMgr.getAllParams();
        int[] result = null;
        if (settingsMap != null && settingsMap.get(key) != null)
            result = (int[]) settingsMap.get(key);
        return result;
    }

    /**
     * 上电状态下退出时,提示是否下电
     */
    private void showExitPromptWindow()
    {
        synchronized (this) {

            if(mExitConfirmDialog != null)
            {
                if(!mExitConfirmDialog.isShowing())
                    mExitConfirmDialog.show();
                return ;
            }

            AlertDialog.Builder builder = new AlertDialog.Builder(MainActivity.this);
            builder.setTitle(R.string.common_tip);
            builder.setMessage(getString(R.string.power_off_prompt));
            builder.setPositiveButton(R.string.do_power_down, new DialogInterface.OnClickListener() {

                @Override
                public void onClick(DialogInterface dialog, int which) {

                    finish();
                    if(Constant.isSupportSelectDevice())
                        mUHFMgr.disconnect();
                    else
                        mUHFMgr.powerOff();

                }
            });

            builder.setNegativeButton(R.string.common_no, new DialogInterface.OnClickListener() {

                @Override
                public void onClick(DialogInterface dialog, int which) {
                    dialog.dismiss();
                    finish();
                }
            });

            mExitConfirmDialog = builder.create();
            mExitConfirmDialog.show();
        }
    }//End showExitPromptWindow

    //---------------------------------------------------------
    // Inner Class
    //---------------------------------------------------------
    private BroadcastReceiver mUHFStateReceiver = new BroadcastReceiver() {

        @Override
        public void onReceive(Context context, Intent intent) {
            Log.d(TAG, "mUHFStateReceiver: "+String.format("action:%s",intent.getAction()));

            if (intent == null)
                return;
            if (UHFManager.ACTOIN_UHF_STATE_CHANGE.equals(intent.getAction())) {
                int uhf_state = intent.getIntExtra(UHFManager.EXTRA_UHF_STATE, -1);
                Log.d(TAG, "mUHFStateReceiver: "+uhf_state);
                switch (uhf_state) {
                    case UHFParams.UHF_STATE_POWER_ONING:
                        onUhfPowerOning();
                        break;
                    case UHFParams.UHF_STATE_POWER_ON:
                        onUhfPowerOn();
                        break;
                    case UHFParams.UHF_STATE_POWER_OFF:
                        onUhfPowerOff();
                        break;
                    case UHFParams.UHF_STATE_START_INVENTORY:
                        onUhfStartInventory();
                        break;
                    case UHFParams.UHF_STATE_STOP_INVENTORY:
                        onUhfStopInventory();
                        break;
                    case UHF_STATE_BLE_DISCONNECT:
                        onBleDisconnect();
                        break;
                    case UHFParams.UHF_STATE_START_INVENTORY_BLE:
                        if (InventoryFragment.class.getSimpleName().equals(mCurFragment.getClass().getSimpleName())) {
                            long l = System.currentTimeMillis();
                            ((InventoryFragment) mCurFragment).startInventory();
                            Log.d(TAG, "mUHFStateReceiver: "+String.format("startInventory cost:%d",System.currentTimeMillis()-l));
                        }
                        break;
                    case UHF_STATE_STOP_INVENTORY_BLE:
                        if (InventoryFragment.class.getSimpleName().equals(mCurFragment.getClass().getSimpleName())) {
                            long l = System.currentTimeMillis();
                            ((InventoryFragment) mCurFragment).stopInventory();
                            Log.d(TAG, "mUHFStateReceiver: "+String.format("stopInventory cost:%d",System.currentTimeMillis()-l));
                        }
                        break;
                }
            }
        }
    };



    private BroadcastReceiver mBatteryStateReceiver = new BroadcastReceiver() {

        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (Intent.ACTION_BATTERY_CHANGED.equals(action)) {
                int btemperature = intent.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0);
                float fbtemperature = (float) btemperature / 10;

                String sHighestTemper = mUHFMgr.getParam(UHFParams.HIGH_TEMPERATURE.KEY,
                        UHFParams.HIGH_TEMPERATURE.PARAM_HIGH_TEMPERATURE_VALUE,
                        String.valueOf(UHFParams.HIGH_TEMPERATURE.DEFAULT_TEMPERATURE_VALUE));

                int highestTemper = 100;
                if (sHighestTemper != null && TextUtils.isDigitsOnly(sHighestTemper))
                    highestTemper = Integer.parseInt(sHighestTemper);

                if (fbtemperature > highestTemper) //Higher than settings most temperature
                {
                    mUIHandler.sendEmptyMessageDelayed(MSG_UPDATE_ACTION_BAR, 500);
                }
            }
        }
    };//End BatteryStateReceiver

}
