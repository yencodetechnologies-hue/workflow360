package com.nlscan.uhf.demo.fragment.urx;


import static com.nlscan.uhf.demo.util.Constant.converToString;
import static com.nlscan.uhf.demo.util.Constant.isURM300;
import static com.nlscan.uhf.demo.util.Constant.isURM500;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.os.Parcelable;
import android.support.annotation.Nullable;
import android.text.TextUtils;
import android.util.AttributeSet;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.CompoundButton;
import android.widget.EditText;
import android.widget.ListAdapter;
import android.widget.ListView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.ToggleButton;

import com.nlscan.android.uhf.UHFReader;
import com.nlscan.uhf.demo.R;
import com.nlscan.uhf.demo.fragment.BaseFragment;
import com.nlscan.uhf.demo.util.Constant;
import com.nlscan.uhf.demo.util.constant.UHFParams;
import com.nlscan.uhf.demo.view.IndustryTextSpinnerView;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

/**
 * 通用指令问答界面
 */
public class CommonCmdFragment extends BaseFragment implements View.OnClickListener, CompoundButton.OnCheckedChangeListener, TimeOutListener {
    private static final String TAG = CommonCmdFragment.class.getSimpleName();
    private String cmdResult, swrAppend;
    private Button send, clear, sendInv, sendSWR, switchBaud, sendSWRInbox;
    private EditText cmdSendEt, timeout;//, cmdResultEt
    private ToggleButton isAsc;
    private TextView tvSwr, moduleInfo;
    private CheckBox cbPlaidMode;
    private int count = 0;
    View mLayoutView;

    //swr
    private IndustryTextSpinnerView antSpinner, regionSpinner, powerSpinner;

    SwrAdapter mSwrAdapter;
    List<String> list = new ArrayList<>();

    private BroadcastReceiver mUhfBR = new BroadcastReceiver() {

        @Override
        public void onReceive(Context context, Intent intent) {
            Log.d(TAG, "onReceive---: ");
            String action = intent.getAction();
            if (!Constant.ACTION_UHF_RESULT_SEND.equals(action))
                return;

            String p = intent.getStringExtra(Constant.EXTRA_TAG_INFO);

            Log.d(TAG, "onReceive: " + p);
            list.add(p);
            mSwrAdapter.updateData(list);


        }
    };
    private CustomListView swrList;



    @Nullable
    @Override

    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, Bundle savedInstanceState) {
        mLayoutView = inflater.inflate(R.layout.layout_common_cmd_fragment, null);
        return mLayoutView;
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        initViews();
        initEvents();
        getModuleInfo();
    }

    private void initViews() {
        send = (Button) mLayoutView.findViewById(R.id.cmd_send);
        clear = (Button) mLayoutView.findViewById(R.id.cmd_clear);
        cmdSendEt = (EditText) mLayoutView.findViewById(R.id.cmd_input);
//        cmdResultEt = (EditText) mLayoutView.findViewById(R.id.cmd_output);
        timeout = (EditText) mLayoutView.findViewById(R.id.timeout_inv);
        sendInv = (Button) mLayoutView.findViewById(R.id.cmd_send_inv);
        isAsc = (ToggleButton) mLayoutView.findViewById(R.id.is_ascii);
        sendSWR = (Button) mLayoutView.findViewById(R.id.btn_swr);
        tvSwr = (TextView) mLayoutView.findViewById(R.id.txt_swr);
        switchBaud = (Button) mLayoutView.findViewById(R.id.switch_baud);
        sendSWRInbox = (Button) mLayoutView.findViewById(R.id.btn_swr_send);
        //swr
        antSpinner = (IndustryTextSpinnerView) mLayoutView.findViewById(R.id.swr_antenna);
        regionSpinner = (IndustryTextSpinnerView) mLayoutView.findViewById(R.id.swr_region);
        powerSpinner = (IndustryTextSpinnerView) mLayoutView.findViewById(R.id.swr_power);
        // module info
        moduleInfo = (TextView) mLayoutView.findViewById(R.id.tv_module_info);
        //plaid mode
        cbPlaidMode = (CheckBox) mLayoutView.findViewById(R.id.cb_plaid_mode);
        swrList = mLayoutView.findViewById(R.id.swr_list);
        mSwrAdapter = new SwrAdapter(mContext);
        swrList.setAdapter(mSwrAdapter);


        initAirInterfaceParameters();
    }

    @Override
    public void onResume() {
        super.onResume();
        registerB();

        String is_plaid_mode = mUHFMgr.getParam("IS_PLAID_MODE", "", "");
        Log.d(TAG, "onResume: " + is_plaid_mode);
        if ("true".equals(is_plaid_mode)) {
            cbPlaidMode.setChecked(true);
        } else {
            cbPlaidMode.setChecked(false);
        }
        //
        // update air interface parameters
        updateSessionData();
        updateTargetData();
        if (Constant.isURF520(mModelName) || Constant.isURM500(mModelName)) {
            updateEncodeDataURF520();
        } else if(Constant.isURF100(mModelName) || Constant.isURM300(mModelName)){
            updateEncodeDataURF100();
        } else
            updateEncodeData();
        updateQvalueData();
    }

    @Override
    public void onPause() {
        super.onPause();
        //
        unRegisterB();
    }

    void registerB() {
        IntentFilter iFilter = new IntentFilter(Constant.ACTION_UHF_RESULT_SEND);
        mContext.registerReceiver(mUhfBR, iFilter);
    }

    void unRegisterB() {
        mContext.unregisterReceiver(mUhfBR);
    }

    private void initEvents() {
        send.setOnClickListener(this);
        clear.setOnClickListener(this);
        sendInv.setOnClickListener(this);
        isAsc.setOnClickListener(this);
        sendSWR.setOnClickListener(this);
        switchBaud.setOnClickListener(this);
        sendSWRInbox.setOnClickListener(this);
        cbPlaidMode.setOnCheckedChangeListener(this);
    }

    @Override
    public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
        Log.d(TAG, "onCheckedChanged: " + isChecked);
        if (isChecked) {
            mUHFMgr.setParam(UHFParams.RF_ANTPOWER.KEY, UHFParams.RF_ANTPOWER.PARAM_RF_ANTPOWER, "[{\"antid\":1,\"readPower\":34,\"writePower\":34}]");
        } else {
            String param = mUHFMgr.getParam(UHFParams.RF_ANTPOWER.KEY, UHFParams.RF_ANTPOWER.PARAM_RF_ANTPOWER, "");
            if (!"".equals(param)) {
                mUHFMgr.setParam(UHFParams.RF_ANTPOWER.KEY, UHFParams.RF_ANTPOWER.PARAM_RF_ANTPOWER, param);
            }
        }
    }

    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.cmd_send:
                sendCmd(COMMON_CMD.KEY, (cmdSendEt.getText().toString()), "failed");
                break;
            case R.id.cmd_clear:
                cmdSendEt.setText("");
//                cmdResultEt.setText("");
                tvSwr.setText("");
                swrAppend = "";
//                timeout.setText("");
                break;
            case R.id.cmd_send_inv:
//                swrList.clear();
                tvSwr.setText("");
                swrAppend = "";
                count = 0;
                sendCmd(COMMON_CMD_INV_Start.KEY, genCmd(cmdSendEt.getText().toString()), "");
                int time = Integer.parseInt((timeout == null || timeout.getText() == null || timeout.getText().equals("")) ? "1" : timeout.getText().toString());
                countDown(time, this);
                break;
            case R.id.is_ascii:
                Log.i(TAG, "onClick: " + String.format("isAsc:%s", isAsc.isChecked()));
                if (isAsc.isChecked()) {
                    isAsc.setText("USING ASCII(TAG-SUBTAG-DATA)");
                } else {
                    isAsc.setText("USING HEX(Full byte command)");
                }
                break;
            case R.id.btn_swr:
//                sendSwr(1, 0, 30);
                break;

            case R.id.switch_baud:
                String s = switchBaud();
                tvSwr.setText(s);
                break;

            case R.id.btn_swr_send:
                sendSwr(antSpinner.getSelectedValue(), regionSpinner.getSelectedValue(), powerSpinner.getSelectedValue());
                break;
        }
    }

    private void getModuleInfo() {
        String moduleInfo = mUHFMgr.getParam(UHFParams.MODULE_INFO.KEY, "", "");
        Log.i(TAG, "getModuleInfo: " + moduleInfo);
        this.moduleInfo.setText(moduleInfo);
    }

    private void sendSwr(int ant, int region, int power) {
        Log.d(TAG, "sendSwr: " + ant + " " + region + " " + power);
        list.clear();
        mUHFMgr.getParam(GET_SWR.KEY, 1 + "|" + region + "|" + power, "");
    }

    private String switchBaud() {
        return mUHFMgr.getParam(URM_BAUD_SWITCH.KEY, "", "failed");
    }

    private void sendCmd(String type, String cmdSend, String defRst) {
        if (cmdSend != null && !cmdSend.equals("")) {
            Log.i(TAG, "onClick: " + String.format("cmdSend:%s", cmdSend));
            cmdResult = mUHFMgr.getParam(type, cmdSend, defRst);
            tvSwr.setText(cmdResult);
        }
    }

    private void countDown(int time, TimeOutListener listener) {
        final Timer timer = new Timer();
        timer.schedule(new TimerTask() {
            int i = time;

            @Override
            public void run() {
                if (i == 0) {
                    timer.cancel();
                    listener.timeOut();
                } else {
                    i--;
                }
            }
        }, 1000, 1000);
    }


    @Override
    public void timeOut() {
        mUHFMgr.getParam(COMMON_CMD_INV_STOP.KEY, "", "");
    }

    private String genCmd(String cmd) {
        final String store = "23";//40 or 23
        String rst = "";
        if (!isAsc.isChecked()) {
            rst = cmd;
        } else {
            rst = "7E0130303030" + store + stringToHex(cmd) + "3B03";
        }
        Log.i(TAG, "genCmd: " + String.format("cmd:%s", rst));
        return rst;
    }

    public String stringToHex(String ascString) {
        StringBuilder hexBuilder = new StringBuilder();
        for (int i = 0; i < ascString.length(); i++) {
            char ch = ascString.charAt(i);
            String hex = Integer.toHexString((int) ch);
            hexBuilder.append(hex);
        }
        return hexBuilder.toString();
    }

    public String hexToString(String hexString) {
        StringBuilder ascBuilder = new StringBuilder();
        for (int i = 0; i < hexString.length() - 1; i += 2) {
            String hex = hexString.substring(i, i + 2);
            int ch = Integer.parseInt(hex, 16);
            ascBuilder.append((char) ch);
        }
        return ascBuilder.toString();
    }


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
        spinner_session = (Spinner) mLayoutView.findViewById(R.id.spinner_session);
        btn_get_session = (Button) mLayoutView.findViewById(R.id.btn_get_session);
        btn_set_session = (Button) mLayoutView.findViewById(R.id.btn_set_session);

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
        spinner_target = (Spinner) mLayoutView.findViewById(R.id.spinner_target);
        btn_get_target = (Button) mLayoutView.findViewById(R.id.btn_get_target);
        btn_set_target = (Button) mLayoutView.findViewById(R.id.btn_set_target);

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
        spinner_encode = (Spinner) mLayoutView.findViewById(R.id.spinner_encode);
        btn_get_encode = (Button) mLayoutView.findViewById(R.id.btn_get_encode);
        btn_set_encode = (Button) mLayoutView.findViewById(R.id.btn_set_encode);

        Log.d(TAG, "initEncodeView: "+mModelName);
        if (Constant.isURM_E7(mModelName)) {
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
//        else if (Constant.isURM300(mModelName)) {
//            tagEncodes = new String[]{
//                    "PROF1",
//                    "PROF2",
//                    "PROF3",
//                    "PROF4",
//                    "RFM_0"
//            };
//        }
        else if (Constant.isURF520(mModelName) || Constant.isURM500(mModelName)) {
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
        } else if (Constant.isURF100(mModelName) || Constant.isURM300(mModelName)) {
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
                if(Constant.isURF100(mModelName) || Constant.isURM300(mModelName)) {
                    updateEncodeDataURF100();
                }if (Constant.isURF520(mModelName) || Constant.isURM500(mModelName) ) {
                    updateEncodeDataURF520();
                } else {
                    updateEncodeData();
                }
            }
        });
        btn_set_encode.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if(Constant.isURF100(mModelName) || Constant.isURM300(mModelName)) {
                    setEncodeDataURF100();
                }else if (Constant.isURF520(mModelName) || Constant.isURM500(mModelName) ) {
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
        spinner_q_value = (Spinner) mLayoutView.findViewById(R.id.spinner_q_value);
        btn_get_q_value = (Button) mLayoutView.findViewById(R.id.btn_get_q_value);
        btn_set_q_value = (Button) mLayoutView.findViewById(R.id.btn_set_q_value);

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
        if (Constant.isURF520(mModelName) || isURM500(mModelName)|| Constant.isURM300(mUHFMgr.getUHFDeviceModel())) {
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


    private void setEncodeDataURF100() {
        final int OFFSET = 7;
        int index = spinner_encode.getSelectedItemPosition();
        int value = index + OFFSET;
        int[] realVal = new int[]{value};
        setToModule(realVal);
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

    private int[] getIntArrayParam(String paramKey, String paramName, int[] defValue) {
        String sValue = mUHFMgr.getParam(paramKey, paramName, "");
        if (!TextUtils.isEmpty(sValue)) {
            int[] iArray = Constant.stringToIntArray(sValue, ",");
            return iArray;
        }
        return defValue;
    }



}

interface TimeOutListener {
    void timeOut();
}

/**
 * 通用指令一问一答
 */
class COMMON_CMD {
    public final static String KEY = "COMMON_CMD";
    public final static String PARAM_COMMON_CMD = "PARAM_COMMON_CMD";
}

/**
 * 通用指令盘点类型,数据会写入指定文件
 */
class COMMON_CMD_INV_Start {
    public final static String KEY = "COMMON_CMD_INV_Start";
    public final static String PARAM_COMMON_CMD_INV_START = "PARAM_COMMON_CMD_INV_START";
}

class URM_BAUD_SWITCH {
    public final static String KEY = "URM_BAUD_SWITCH";
    public final static String PARAM_URM_BAUTRATE_SWITCH = "PARAM_URM_BAUTRATE_SWITCH";
}

class COMMON_CMD_INV_STOP {
    public final static String KEY = "COMMON_CMD_INV_STOP";
    public final static String PARAM_COMMON_CMD_INV_STOP = "PARAM_COMMON_CMD_INV_STOP";
}

class GET_SWR {
    public final static String KEY = "GET_YJY_BEAN";
    public final static String PARAM_GET_YJY_BEAN = "PARAM_GET_YJY_BEAN";
}

class SwrAdapter extends BaseAdapter {
    private LayoutInflater mInflater;
    private List<String> dataList = new ArrayList<String>();

    public SwrAdapter(Context context) {
        this.mInflater = LayoutInflater.from(context);
    }

    public void updateData(List<String> swrList) {
        dataList.clear();
        if (swrList != null) {
            dataList.addAll(swrList);
        }
        notifyDataSetChanged();
    }


    @Override
    public int getCount() {
        return dataList.size();
    }

    @Override
    public String getItem(int position) {
        if (position >= getCount()) {
            return null;
        }
        return dataList.get(position);
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        final ViewHolder holder;
        if (convertView == null) {
            convertView = mInflater.inflate(R.layout.item_swr, parent, false);
            holder = new ViewHolder();
            holder.mTvData = convertView.findViewById(R.id.tv_swr_data);
            convertView.setTag(holder);
        } else {
            holder = (ViewHolder) convertView.getTag();
        }
        String data = dataList.get(position);
        if (!TextUtils.isEmpty(data)) {
            holder.mTvData.setText(data);
        }

        return convertView;
    }

    public static class ViewHolder {
        TextView mTvData;
    }



}



