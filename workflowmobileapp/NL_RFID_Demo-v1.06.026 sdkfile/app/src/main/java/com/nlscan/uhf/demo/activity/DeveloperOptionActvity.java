package com.nlscan.uhf.demo.activity;

import static com.nlscan.uhf.demo.util.Constant.converToString;
import static com.nlscan.uhf.demo.util.Constant.isURM300;
import static com.nlscan.uhf.demo.util.Constant.isURM500;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import com.nlscan.android.uhf.UHFManager;
import com.nlscan.android.uhf.UHFReader;
import com.nlscan.uhf.demo.R;
import com.nlscan.uhf.demo.util.Constant;
import com.nlscan.uhf.demo.util.constant.UHFParams;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Arrays;
import java.util.Map;

public class DeveloperOptionActvity extends Activity {

    private final static String TAG = "DeveloperOptionActvity";
    private Context mContext;

    //--Inventory fae mode----
    private Spinner spinner_inv_fae_mode;
    private Button btn_set_inv_fae_mode;

    private String[] mURM_E7InvFaeModeLabels;
    private String[] mURM_E7InvFaeModeValues;
    private ArrayAdapter adapter_URM_E7_inv_fae_mode;

    private UHFManager mUHFMgr = UHFManager.getInstance();
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_developer_option);
        mContext = getApplicationContext();
        initView();
    }

    private void initView()
    {
        initActionBarView();
        initInventoryURM_E7();
        initAirInterfaceParameters();
    }

   





    private void updateViewData()
    {
        updateURM_E7_InventoryPolicyDetailData();
        //
        //update air interface parameters
        updateSessionData();
        updateTargetData();
        Log.d(TAG, "--updateEncodeData--");
        String mModelName = mUHFMgr.getUHFDeviceModel();
        if (Constant.isURF520(mModelName) || Constant.isURM500(mModelName)) {
            updateEncodeDataURF520();
        } else if(Constant.isURF100(mModelName) || Constant.isURM300(mModelName)){
            updateEncodeDataURF100();
        } else
            updateEncodeData();
        updateQvalueData();
    }

    private void initActionBarView()
    {
        ImageView im_actionbar_settings = (ImageView) findViewById(R.id.im_actionbar_settings);
        im_actionbar_settings.setVisibility(View.INVISIBLE);

        TextView header_center_name_text_view = (TextView) findViewById(R.id.header_center_name_text_view);
        header_center_name_text_view.setText(R.string.developer_options);
    }

    private void initInventoryURM_E7()
    {
        View content_inv_policy = findViewById(R.id.content_urm_e7_inv_policy);
        spinner_inv_fae_mode = (Spinner) findViewById(R.id.spinner_inv_fae_mode);
        btn_set_inv_fae_mode = (Button) findViewById(R.id.btn_set_inv_fae_mode);

        //---Inventory detail datas--------------
        spinner_inv_fae_mode = (Spinner) findViewById(R.id.spinner_inv_fae_mode);
        btn_set_inv_fae_mode = (Button) findViewById(R.id.btn_set_inv_fae_mode);

        mURM_E7InvFaeModeLabels = mContext.getResources().getStringArray(R.array.urm_e7_inv_fae_mode_labels);
        mURM_E7InvFaeModeValues = mContext.getResources().getStringArray(R.array.urm_e7_inv_fae_mode_values);
        adapter_URM_E7_inv_fae_mode = new ArrayAdapter<String>(mContext, android.R.layout.simple_spinner_item, mURM_E7InvFaeModeLabels);
        adapter_URM_E7_inv_fae_mode.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner_inv_fae_mode.setAdapter(adapter_URM_E7_inv_fae_mode);

        btn_set_inv_fae_mode.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                int faeMode = spinner_inv_fae_mode.getSelectedItemPosition();
                UHFReader.READER_STATE er = mUHFMgr.setParam(UHFParams.INV_QUICK_MODE_EX.KEY,UHFParams.INV_QUICK_MODE_EX.PARAM_INV_QUICK_MODE,String.valueOf(faeMode));
                String msg = er == UHFReader.READER_STATE.OK_ERR ? getString(R.string.setting_success) : getString(R.string.setting_fail) + ",err: " + er.value();
                Toast.makeText(mContext, msg, Toast.LENGTH_SHORT).show();
            }
        });

        String uhfmodel = mUHFMgr.getUHFDeviceModel();
        if(!Constant.isURM_E7(uhfmodel)) //Only URM_E7 support
            content_inv_policy.setVisibility(View.GONE);

        //---End inventory detail datas--------------

    }


    private void updateURM_E7_InventoryPolicyDetailData()
    {
        String uhfmodel = mUHFMgr.getUHFDeviceModel();
        if(!Constant.isURM_E7(uhfmodel)) //Only URM_E7 support
            return;

        //---Inventory detail datas--------------
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

        String sInvFaeMode = mUHFMgr.getParam(UHFParams.INV_QUICK_MODE_EX.KEY,UHFParams.INV_QUICK_MODE_EX.PARAM_INV_QUICK_MODE,"0");
        int iInvFaeMode = Integer.parseInt(sInvFaeMode);
        spinner_inv_fae_mode.setSelection(iInvFaeMode);

        String sInvDetailData = mUHFMgr.getParam(UHFParams.INV_POLICY_DATA.KEY,UHFParams.INV_POLICY_DATA.PARAM_INV_POLICY_DATA,"");
        if(!TextUtils.isEmpty(sInvDetailData))
        {
            JSONArray jsonArray;
            try{
                jsonArray = new JSONArray(sInvDetailData);
                int len = jsonArray.length();
                for(int i = 0; i < len; i++)
                {
                    JSONObject jobj = jsonArray.optJSONObject(i);
                    String sPolicy = jobj.optString(UHFParams.INV_POLICY_DATA.INV_POLICY);
                    int iPolicy = Integer.parseInt(sPolicy);
                    if(iPolicy == curInvPolicy)
                    {
                        String readPower = jobj.optString(UHFParams.INV_POLICY_DATA.INV_POLICY_READ_POWER);
                        String faeMode = jobj.optString(UHFParams.INV_POLICY_DATA.INV_POLICY_FAE_MODE);
                        int iFaeMode = Integer.parseInt(faeMode);
                        String faeMode_label = mURM_E7InvFaeModeLabels[iFaeMode];

                        readPower = readPower.replaceAll("00","") + " dBm";
                        break;
                    }
                }

            }catch (Exception e){

            }
        }
        //---End inventory detail datas--------------
    }


    @Override
    protected void onResume() {
        super.onResume();

        updateViewData();
    }


    //Power oning
    protected void onUhfPowerOning()
    {
        Log.d("TAG","---power oning---");
    }

    /**
     * Power on complete
     */
    protected void onUhfPowerOn()
    {
    }

    /**
     * Power off complete
     */
    protected void onUhfPowerOff()
    {
    }

    /**
     * It's starting inventory
     */
    public void onUhfStartInventory()
    {
    }

    /**
     * It's stoping inventory
     */
    public void onUhfStopInventory()
    {

    }

    private int getIntParam(String paramKey,String paramName,int defValue)
    {
        String sValue = mUHFMgr.getParam(paramKey,paramName,String.valueOf(defValue));
        if(!TextUtils.isEmpty(sValue))
        {
            int iValue = Integer.parseInt(sValue);
            return iValue;
        }
        return defValue;
    }

    private int[] getIntArrayParam(String paramKey,String paramName,int[] defValue)
    {
        String sValue = mUHFMgr.getParam(paramKey,paramName,"");
        if(!TextUtils.isEmpty(sValue))
        {
            int[] iArray = Constant.stringToIntArray(sValue,",");
            return iArray;
        }
        return defValue;
    }

    private String getStringParam(String paramKey,String paramName,String defValue)
    {
        return mUHFMgr.getParam(paramKey,paramName,defValue);
    }

    //---------------------------------------------------------
    // Inner Class
    //---------------------------------------------------------
    private BroadcastReceiver mUHFStateReceiver = new BroadcastReceiver() {

        @Override
        public void onReceive(Context context, Intent intent) {

            if(intent == null)
                return ;
            if(UHFManager.ACTOIN_UHF_STATE_CHANGE.equals(intent.getAction()))
            {
                int uhf_state = intent.getIntExtra(UHFManager.EXTRA_UHF_STATE, -1);
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
                }
            }
        }
    };





    //AirInterfaceParameters
    private void initAirInterfaceParameters() {
        initSessionView();
        initTargetView();
        initEncodeView();
        initQvalueView();
    }

    private Spinner spinner_session;
    private Button btn_get_session;
    private Button btn_set_session;
    private ArrayAdapter<String> adapter_session;
    String[] sessions = {"S0", "S1", "S2", "S3"};

    //---Target part---
    private Spinner spinner_target;
    private Button btn_get_target;
    private Button btn_set_target;
    String[] targets = {"A", "B", "A-B", "B-A"};
    private ArrayAdapter<String> adapter_target;

    //---Reader encode part---
    private Spinner spinner_encode;
    private Button btn_get_encode;
    private Button btn_set_encode;
    private ArrayAdapter<String> adapter_tag_encode;
    String[] tagEncodes = {"FM0", "M2", "M4", "M8"};

    //---Q value part---
    private Spinner spinner_q_value;
    private Button btn_get_q_value;
    private Button btn_set_q_value;
    private ArrayAdapter<String> adapter_q_value;
    String[] qValues = {"Auto", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
            "10", "11", "12", "13", "14", "15"};

    private void initSessionView() {
        spinner_session = (Spinner) findViewById(R.id.spinner_session);
        btn_get_session = (Button) findViewById(R.id.btn_get_session);
        btn_set_session = (Button) findViewById(R.id.btn_set_session);

        adapter_session = new ArrayAdapter<String>(mContext, android.R.layout.simple_spinner_item, sessions);
        adapter_session.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner_session.setAdapter(adapter_session);
        btn_get_session.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                updateSessionData();
            }
        });
        btn_set_session.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                setSessionData();
            }
        });
    }

    /**
     * Init target views
     */
    private void initTargetView() {
        spinner_target = (Spinner) findViewById(R.id.spinner_target);
        btn_get_target = (Button) findViewById(R.id.btn_get_target);
        btn_set_target = (Button) findViewById(R.id.btn_set_target);

        adapter_target = new ArrayAdapter<String>(mContext, android.R.layout.simple_spinner_item, targets);
        adapter_target.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner_target.setAdapter(adapter_target);
        btn_get_target.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                updateTargetData();
            }
        });
        btn_set_target.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                setTargetData();
            }
        });

    }


    /**
     * Init reader encode views
     */
    private void initEncodeView() {
        spinner_encode = (Spinner) findViewById(R.id.spinner_encode);
        btn_get_encode = (Button) findViewById(R.id.btn_get_encode);
        btn_set_encode = (Button) findViewById(R.id.btn_set_encode);

        String moduleName = mUHFMgr.getUHFDeviceModel();
        Log.d(TAG, "initEncodeView: "+moduleName);
        if (Constant.isURM_E7(moduleName)) {
            tagEncodes = new String[]{"FM0", "M2", "M4", "M8", "PROF0",
                    "PROF1",
                    "PROF2",
                    "PROF3",
                    "PROF4",
                    "PROF5",
                    "RFM_1",
                    "RFM_3",
                    "RFM_5",
                    "RFM_7",
                    "RFM_11",
                    "RFM_12",
                    "RFM_13",
                    "RFM_15",

            };
        }
//        else if (Constant.isURM300(mUHFMgr.getUHFDeviceModel())) {
//            tagEncodes = new String[]{
//                    "PROF1",
//                    "PROF2",
//                    "PROF3",
//                    "PROF4",
//                    "RFM_0"
//            };
//        }
        else if (Constant.isURF520(moduleName) || Constant.isURM500(moduleName)) {
            tagEncodes = new String[]{
                    "MODE_103",
                    "MODE_302",
                    "MODE_120",
                    "MODE_323",
                    "MODE_202",
                    "MODE_345",
                    "MODE_344",
                    "MODE_223",
                    "MODE_222",
                    "MODE_241",
                    "MODE_244",
                    "MODE_285"
            };
        } else if (Constant.isURF100(moduleName) || Constant.isURM300(moduleName)) {
            tagEncodes = new String[]{
                    "MODE_223",
                    "MODE_222",
                    "MODE_241",
                    "MODE_244",
                    "MODE_285"
            };
        }
        String encodes = Arrays.toString(tagEncodes);
        Log.d(TAG,"---initEncodeView, encodes:="+encodes);
        adapter_tag_encode = new ArrayAdapter<String>(mContext, android.R.layout.simple_spinner_item, tagEncodes);
        adapter_tag_encode.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner_encode.setAdapter(adapter_tag_encode);
        btn_get_encode.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (Constant.isURF520(mUHFMgr.getUHFDeviceModel()) || isURM500(mUHFMgr.getUHFDeviceModel())|| Constant.isURM300(mUHFMgr.getUHFDeviceModel())) {
                    updateEncodeDataURF520();
                } else {
                    updateEncodeData();
                }
            }
        });
        btn_set_encode.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (Constant.isURF520(mUHFMgr.getUHFDeviceModel()) || isURM500(mUHFMgr.getUHFDeviceModel())|| Constant.isURM300(mUHFMgr.getUHFDeviceModel())) {
                    setEncodeDataURF520();
                } else {
                    setEncodeData();
                }
            }
        });
    }

    /**
     * Init Q value views
     */
    private void initQvalueView() {
        spinner_q_value = (Spinner) findViewById(R.id.spinner_q_value);
        btn_get_q_value = (Button) findViewById(R.id.btn_get_q_value);
        btn_set_q_value = (Button) findViewById(R.id.btn_set_q_value);

        adapter_q_value = new ArrayAdapter<String>(mContext, android.R.layout.simple_spinner_item, qValues);
        adapter_q_value.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner_q_value.setAdapter(adapter_q_value);
        btn_get_q_value.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                updateQvalueData();
            }
        });
        btn_set_q_value.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                setQvalueData();
            }
        });
    }

    private void updateTargetData() {
        try {

            int[] val = getIntArrayParam(UHFParams.POTL_GEN2_TARGET.KEY,
                    UHFParams.POTL_GEN2_TARGET.PARAM_POTL_GEN2_TARGET,
                    null);
            if (val != null && val.length > 0) {
                if (val[0] < spinner_target.getCount())
                    spinner_target.setSelection(val[0]);
            } else
                Toast.makeText(mContext, "updateTargetData: " + getString(R.string.no_data), Toast.LENGTH_SHORT).show();

        } catch (Exception e) {
            Toast.makeText(mContext,
                            "Exception:" + e.getMessage(), Toast.LENGTH_SHORT)
                    .show();
            e.printStackTrace();
        }
    }

    /**
     * Set target datas
     */
    private void setTargetData() {
        int[] val = new int[]{spinner_target.getSelectedItemPosition()};

        String sValue = converToString(val);
        UHFReader.READER_STATE er = mUHFMgr.setParam(UHFParams.POTL_GEN2_TARGET.KEY, UHFParams.POTL_GEN2_TARGET.PARAM_POTL_GEN2_TARGET, sValue);

        if (er == UHFReader.READER_STATE.OK_ERR) {
            Toast.makeText(mContext, R.string.setting_success, Toast.LENGTH_SHORT).show();
        } else
            Toast.makeText(mContext, getString(R.string.setting_fail) + " : " + er.toString(), Toast.LENGTH_SHORT).show();
    }

    private void updateEncodeDataURF520() {
        if (Constant.isURF520(mUHFMgr.getUHFDeviceModel()) || isURM500(mUHFMgr.getUHFDeviceModel())|| Constant.isURM300(mUHFMgr.getUHFDeviceModel())) {
            Map<String, Object> settingsMap = mUHFMgr.getAllParams();
            Object obj = settingsMap.get(UHFParams.POTL_GEN2_TAGENCODING.KEY);
            int[] val = (int[]) obj;
            Log.d(TAG, "updateEncodeDataURF520: "+ Arrays.toString(val));

            if (val != null && val.length > 0) {
                int idx = val[0];
                if (idx<0||idx>tagEncodes.length-1) {
                    idx = 0;
                }
                spinner_encode.setSelection(idx);
            } else
                Toast.makeText(mContext, "EncodeData: " + getString(R.string.no_data), Toast.LENGTH_SHORT).show();
        }
    }

    /**
     * Update encode datas
     */
    private void updateEncodeDataURF100() {
        Map<String, Object> settingsMap = mUHFMgr.getAllParams();
        Object obj = settingsMap.get(UHFParams.POTL_GEN2_TAGENCODING.KEY);
        int[] val = (int[]) obj;
        Log.d(TAG,"---Get encode data:="+Arrays.toString(val));
        if (val != null && val.length > 0) {
            int i = val[0];
            final int OFFSET=7;
            int index = i - OFFSET;
            index = index < 0 ? 0 : index;
            spinner_encode.setSelection(index);
        } else
            Toast.makeText(mContext, "EncodeData: " + getString(R.string.no_data), Toast.LENGTH_SHORT).show();
    }

    /**
     * Update encode datas
     */
    private void updateEncodeData() {
        int[] val = getIntArrayParam(UHFParams.POTL_GEN2_TAGENCODING.KEY,
                UHFParams.POTL_GEN2_TAGENCODING.PARAM_POTL_GEN2_TAGENCODING,
                null);

        if (val != null && val.length > 0) {

            Log.d(TAG, "updateEncodeData(), encoding: " + Arrays.toString(val));
            if (val[0] <= 3)
                spinner_encode.setSelection(val[0]);
            else if (val[0] > 100) {
                if (tagEncodes.length < 17) {
                    spinner_encode.setSelection(0);
                    return;
                }
                if (val[0] == 101)
                    spinner_encode.setSelection(10);
                if (val[0] == 103)
                    spinner_encode.setSelection(11);
                if (val[0] == 105)
                    spinner_encode.setSelection(12);
                if (val[0] == 107)
                    spinner_encode.setSelection(13);
                if (val[0] == 111)
                    spinner_encode.setSelection(14);
                if (val[0] == 112)
                    spinner_encode.setSelection(15);
                if (val[0] == 113)
                    spinner_encode.setSelection(16);
                if (val[0] == 115)
                    spinner_encode.setSelection(17);
            } else
                spinner_encode.setSelection(4 + val[0] - 0x10);

        } else
            Toast.makeText(mContext, "updateEncodeData: " + getString(R.string.no_data), Toast.LENGTH_SHORT).show();
    }

    private void setEncodeDataURF520() {
        int[] realVal = new int[]{spinner_encode.getSelectedItemPosition()};
        setToModule(realVal);
    }

    /**
     * Set encode datas
     */
    private void setEncodeData() {
        int[] val = new int[]{spinner_encode.getSelectedItemPosition()};
        if (val[0] > 3 && val[0] <= 9) {
            val[0] = 0x10 + val[0] - 4;
        } else if (val[0] > 9) {
            if (val[0] == 10)
                val[0] = 101;
            else if (val[0] == 11)
                val[0] = 103;
            else if (val[0] == 12)
                val[0] = 105;
            else if (val[0] == 13)
                val[0] = 107;
            else if (val[0] == 14)
                val[0] = 111;
            else if (val[0] == 15)
                val[0] = 112;
            else if (val[0] == 16)
                val[0] = 113;
            else if (val[0] == 17)
                val[0] = 115;
        }

        int[] realVal = {val[0]};

        String sValue = converToString(realVal);
        UHFReader.READER_STATE er = mUHFMgr.setParam(UHFParams.POTL_GEN2_TAGENCODING.KEY, UHFParams.POTL_GEN2_TAGENCODING.PARAM_POTL_GEN2_TAGENCODING, sValue);

        if (er == UHFReader.READER_STATE.OK_ERR) {
            Toast.makeText(mContext, R.string.setting_success, Toast.LENGTH_SHORT).show();
        } else
            Toast.makeText(mContext, getString(R.string.setting_fail) + " : " + er.toString(), Toast.LENGTH_SHORT).show();
    }


    private void setToModule(int[] realVal) {
        String sValue = converToString(realVal);
        UHFReader.READER_STATE er = mUHFMgr.setParam(UHFParams.POTL_GEN2_TAGENCODING.KEY, UHFParams.POTL_GEN2_TAGENCODING.PARAM_POTL_GEN2_TAGENCODING, sValue);
        if (er == UHFReader.READER_STATE.OK_ERR) {
            Toast.makeText(mContext, R.string.setting_success, Toast.LENGTH_SHORT).show();
        } else
            Toast.makeText(mContext, getString(R.string.setting_fail) + " : " + er.toString(), Toast.LENGTH_SHORT).show();
    }






    /**
     * Update Q-value datas
     */
    private void updateQvalueData() {
        try {
            int[] val = getIntArrayParam(UHFParams.POTL_GEN2_Q.KEY,
                    UHFParams.POTL_GEN2_Q.PARAM_POTL_GEN2_Q,
                    null);

            if (val != null && val.length > 0) {
                spinner_q_value.setSelection(val[0] + 1);
            } else
                Toast.makeText(mContext, "updateQvalueData: " + getString(R.string.no_data), Toast.LENGTH_SHORT).show();

        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(mContext,
                            "Exception:" + e.getMessage(), Toast.LENGTH_SHORT)
                    .show();
        }
    }

    /**
     * Set Q-value datas
     */
    private void setQvalueData() {
        try {
            int[] val = new int[]{-1};
            val[0] = spinner_q_value.getSelectedItemPosition() - 1;
            String sValue = converToString(val);
            UHFReader.READER_STATE er = mUHFMgr.setParam(UHFParams.POTL_GEN2_Q.KEY, UHFParams.POTL_GEN2_Q.PARAM_POTL_GEN2_Q, sValue);
            if (er == UHFReader.READER_STATE.OK_ERR) {
                Toast.makeText(mContext, R.string.setting_success, Toast.LENGTH_SHORT).show();
            } else
                Toast.makeText(mContext, getString(R.string.setting_fail) + " : " + er.toString(), Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(mContext,
                            "Exception:" + e.getMessage(), Toast.LENGTH_SHORT)
                    .show();
            return;
        }
    }


    /**
     * Update session datas
     */
    private void updateSessionData() {
        try {
            int[] val2 = getIntArrayParam(UHFParams.POTL_GEN2_SESSION.KEY, UHFParams.POTL_GEN2_SESSION.PARAM_POTL_GEN2_SESSION, new int[]{-1});
            if (val2 != null && val2.length > 0) {
                if (val2[0] < spinner_session.getCount())
                    spinner_session.setSelection(val2[0]);
            } else
                Toast.makeText(mContext, "updateSessionData: " + getString(R.string.no_data), Toast.LENGTH_SHORT).show();

        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(mContext, "Exception:" + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    /**
     * Set session datas
     */
    private void setSessionData() {
        try {
            int[] val = new int[]{-1};
            val[0] = spinner_session.getSelectedItemPosition();

            UHFReader.READER_STATE er = mUHFMgr.setParam(UHFParams.POTL_GEN2_SESSION.KEY, UHFParams.POTL_GEN2_SESSION.PARAM_POTL_GEN2_SESSION, String.valueOf(val[0]));

            if (er == UHFReader.READER_STATE.OK_ERR) {
                Toast.makeText(mContext, R.string.setting_success, Toast.LENGTH_SHORT).show();
            } else
                Toast.makeText(mContext, getString(R.string.setting_fail) + " : " + er.toString(), Toast.LENGTH_SHORT).show();

        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(mContext, "Exception:" + e.getMessage(), Toast.LENGTH_SHORT).show();
            return;
        }
    }
    
}
