package com.nlscan.uhf.demo.activity;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import com.nlscan.android.uhf.UHFManager;
import com.nlscan.android.uhf.UHFModuleInfo;
import com.nlscan.uhf.demo.R;
import com.nlscan.uhf.demo.util.Constant;

import java.io.File;
import java.util.List;

public class SerialDevActivity extends Activity {

    private Context mContext;

    private EditText et_dev_path;
    private Button btn_connect;
    private String mDeviceModelUserSelected = "";

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_serial_device);
        mContext = getApplicationContext();
        mDeviceModelUserSelected = getIntent().getStringExtra(Constant.EXTRA_DEVICE_MODEL_KEY);

        initView();

        loadDevPathOnNewlandPDA();
    }

    private void initView() {
        initActionBar();
        et_dev_path = (EditText) findViewById(R.id.et_dev_path);
        btn_connect = (Button) findViewById(R.id.btn_connect);
        et_dev_path.requestFocus();
        btn_connect.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                doConnect();
            }
        });

        et_dev_path.setText("/dev/ttyS0:921600");
    }

    private void initActionBar() {
        TextView tv_title = (TextView) findViewById(R.id.header_center_name_text_view);
        TextView header_model_name = (TextView) findViewById(R.id.header_model_name);
        View im_actionbar_settings = findViewById(R.id.im_actionbar_settings);

        tv_title.setText(R.string.serial_device);
        header_model_name.setVisibility(View.INVISIBLE);
        im_actionbar_settings.setVisibility(View.INVISIBLE);
    }

    private void doConnect() {
        String devPath = et_dev_path.getText().toString();
        if (TextUtils.isEmpty(devPath)) {
            Toast.makeText(mContext, "Please input device path.", Toast.LENGTH_SHORT).show();
        } else {
            Intent mainIntent = new Intent(mContext, MainActivity.class);
            mainIntent.putExtra(Constant.EXTRA_DEVICE_PATH_OR_MAC, devPath);
            mainIntent.putExtra(Constant.EXTRA_DEVICE_PLUGIN_TYPE, UHFManager.PLUGIN_TYPE_SERIEL);
            mainIntent.putExtra(Constant.EXTRA_DEVICE_MODEL_KEY, mDeviceModelUserSelected);
            startActivity(mainIntent);
            setResult(RESULT_OK);
            finish();
        }
    }

    /**
     * load serial path on Newland pda
     */
    private void loadDevPathOnNewlandPDA() {
        if (Constant.isNewlandPDA()) {
            final String DATA_PATH="/system/usr/uhf";
            final String NEWLAND_PATH="/newland/usr/uhf";
            final String UNRECOVERABLE_PATH = "/unrecoverable/uhf";
            final String UHF_MODULE_CONFIG_FILE = "uhf_module_config.xml";
            File uhfconfigfile = new File(UNRECOVERABLE_PATH,UHF_MODULE_CONFIG_FILE);
            if(!uhfconfigfile.exists() || !uhfconfigfile.canRead())
                uhfconfigfile = new File(NEWLAND_PATH,UHF_MODULE_CONFIG_FILE);
            if(!uhfconfigfile.exists() || !uhfconfigfile.canRead())
                uhfconfigfile = new File(DATA_PATH,UHF_MODULE_CONFIG_FILE);

            if(!uhfconfigfile.exists() || !uhfconfigfile.canRead())
                return;

            try{
                List<UHFModuleInfo> infoList = UHFModuleInfo.parseUHFModuleInfo(uhfconfigfile.getAbsolutePath());
                if (infoList != null && infoList.size() > 0) {
                    UHFModuleInfo info = infoList.get(0);
                    String devpath = info.serial_path;
                    et_dev_path.setText(devpath);
                    et_dev_path.setSelection(devpath.length());
                }
            }catch (Exception e){
            }

        }
    }
}
