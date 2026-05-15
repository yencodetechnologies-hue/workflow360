package com.nlscan.uhf.demo.fragment;

import android.app.Fragment;
import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.support.annotation.Nullable;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.Adapter;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.Spinner;
import android.widget.Toast;

import com.nlscan.android.uhf.UHFManager;
import com.nlscan.android.uhf.UHFReader;
import com.nlscan.uhf.demo.AppApplication;
import com.nlscan.uhf.demo.R;
import com.nlscan.uhf.demo.util.Constant;
import com.nlscan.uhf.demo.util.constant.UHFParams;
import com.nlscan.uhf.demo.util.task.FailedPromptToneTask;
import com.nlscan.uhf.demo.util.task.PromptToneTask;
import com.nlscan.uhf.demo.util.task.SuccessPromptToneTask;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class TagWriteFragment extends BaseFragment {

    private final String TAG = "TagWriteFragment";
    private UHFManager mUHFMgr = UHFManager.getInstance();

    private Context mContext;
    private View mLayoutView;

    //--filter tags part
    private EditText et_filter_tag;
    private Spinner spinner_filter_tag;
    private Spinner spinner_filter_bank;
    private RadioGroup rg_match_group;
    private RadioGroup rg_enable_group;
    private List<String> mHistoryTagsList;
    private ArrayAdapter mFilterTagAdapter;
    private ArrayAdapter mFilterBankAdapter;
    private Button btn_set_filter;
    private CheckBox cb_tag_search;
    private String[] bank_filter_labels;
    private int[] bank_filter_values;

    //--Read/Write tag
    private Spinner spinner_read_bank;
    private EditText et_start_addr;
    private EditText et_byte_count;
    private EditText et_access_pwd;
    private EditText et_read_tag_data;
    private EditText et_write_tag_data;
    private View ll_rw_tag_button_bar;
    private Button btn_read_tag;
    private Button btn_write_tag;
    private Button btn_read_tag_recycle;
    private Button btn_stop_read_tag_recycle;
    private String[] bank_labels;
    private int[] bank_values;
    private RadioGroup rg_encoding;

    //--Lock tag part
    private Spinner spinner_lock_bank;
    private Spinner spinner_lock_type;
    private String[] mLockBankLabels;
    private String[] mLockTypeLabels;
    private EditText et_lock_access_pwd;
    private Button btn_lock_tag;

    //--Kill tag part
    private EditText et_kill_pwd;
    private Button btn_kill_tag;

    private boolean mHidden;

    private final int MSG_READ_TAG_COMPLETE = 0x01;
    private final int MSG_WRITE_TAG_COMPLETE = 0x02;
    private final int MSG_LOCK_TAG_COMPLETE = 0x03;
    private final int MSG_KILL_TAG_COMPLETE = 0x04;

    private FailedPromptToneTask mFailedTask;// 成功提示音任务
    private SuccessPromptToneTask mSuccessTask;// 失败提示音任务

    private ExecutorService mPromptToneService ;

    private Handler mUIHandler = new Handler(){
        @Override
        public void handleMessage(Message msg) {
            switch (msg.what)
            {
                case MSG_READ_TAG_COMPLETE:
                    break;
                case MSG_WRITE_TAG_COMPLETE:
                    break;
                case MSG_LOCK_TAG_COMPLETE:
                    break;
                case MSG_KILL_TAG_COMPLETE:
                    break;
            }
        }
    };

    @Override
    public void onAttach(Context context) {
        super.onAttach(context);
        mContext = context;
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);


    }

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, Bundle savedInstanceState) {
        mLayoutView = inflater.inflate(R.layout.layout_tag,null);
        return mLayoutView;
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        initView();
    }

    @Override
    public void onResume() {
        super.onResume();
        if(!mHidden)
            handleResumeEvent();
    }

    @Override
    public void onPause() {
        super.onPause();
        handlePauseEvent();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
    }

    @Override
    public void onUhfPowerOning() {
        super.onUhfPowerOning();
    }

    @Override
    public void onUhfPowerOn() {
        super.onUhfPowerOn();
    }

    @Override
    public void onUhfPowerOff() {
        super.onUhfPowerOff();
    }

    @Override
    public void onUhfStartInventory()
    {
        enableOrDisableAllViews(false);
    }

    @Override
    public void onUhfStopInventory()
    {
        enableOrDisableAllViews(true);
    }

    @Override
    public void onHiddenChanged(boolean hidden) {
        super.onHiddenChanged(hidden);
        mHidden = hidden;
        if(hidden)
            handlePauseEvent();
        else
            handleResumeEvent();
    }

    private void initView()
    {
        //tag filter
        initTagFilter();
        //Read / Write tag part views
        initReadWritePartViews();
        //Lock tag
        initLockTagViews();
        //Kill tag
        initKillTagViews();
        //init encoding
        initViewEncoding();

        mFailedTask = new FailedPromptToneTask(mContext, new PromptToneTask.AudioListener() {
            @Override
            public void onStart() {

            }

            @Override
            public void onStop() {

            }
        });

        mSuccessTask = new SuccessPromptToneTask(mContext, new PromptToneTask.AudioListener() {
            @Override
            public void onStart() {

            }

            @Override
            public void onStop() {

            }
        });
        mPromptToneService = Executors.newFixedThreadPool(6);
    }

    private void updateFilterData()
    {
        if(mHistoryTagsList.size() == 0)
            mHistoryTagsList.add(0,mContext.getString(R.string.none));

        mFilterTagAdapter.notifyDataSetChanged();

        String sJson = getStringParam(UHFParams.TAG_FILTER.KEY,"","");
        Log.d(TAG,"Filter sJson: "+sJson);
        if(!TextUtils.isEmpty(sJson))
        {
            try {
                JSONObject jobj = new JSONObject(sJson);
                int bank = jobj.optInt("bank");
                int startaddr = jobj.optInt("startaddr");
                String sHexData = jobj.optString("fdata");
                int isMatch = jobj.optInt("isInvert");

                int tagIndex = mHistoryTagsList.indexOf(sHexData);
                Log.d(TAG,"sHexData: "+sHexData+",index: "+tagIndex);
                if(tagIndex == -1) {
                    mHistoryTagsList.add(sHexData);
                    tagIndex = mHistoryTagsList.indexOf(sHexData);
                    mFilterTagAdapter.notifyDataSetChanged();
                }

                spinner_filter_tag.setSelection(tagIndex);
                int bankIndex = 0;
                for(int i = 0; i < bank_filter_values.length; i++)
                {
                    int bankId = bank_filter_values[i];
                    if(bankId == bank)
                    {
                        spinner_filter_bank.setSelection(i);
                        break;
                    }
                }

                rg_match_group.check(isMatch == 0 ? R.id.rb_match : R.id.rb_non_match);
                rg_enable_group.check(R.id.rb_tag_filter_enable);

            } catch (Exception e) {
            }

        }else{

            rg_match_group.check(R.id.rb_match);
            rg_enable_group.check(R.id.rb_tag_filter_disable);
        }
    }

    private void enableOrDisableAllViews(boolean enable)
    {
        List<View> viewList = findAllViews(mLayoutView);
        for(View child : viewList)
        {
            child.setEnabled(enable);
        }
    }

    private List<View> findAllViews(View target)
    {
        List<View> viewList = new ArrayList<>();
        if(!(target instanceof ViewGroup))
            viewList.add(target);
        else{
            ViewGroup viewGroup = (ViewGroup) target;
            int count = viewGroup.getChildCount();
            for(int i = 0 ; i < count; i++)
            {
                View child = viewGroup.getChildAt(i);
                List<View> childViewList = findAllViews(child);
                viewList.addAll(childViewList);
            }
        }

        return viewList;
    }

    private void initTagFilter()
    {
        //filter tags
        et_filter_tag = (EditText) mLayoutView.findViewById(R.id.et_filter_tag);
        spinner_filter_tag = (Spinner) mLayoutView.findViewById(R.id.spinner_filter_tag);
        spinner_filter_bank = (Spinner) mLayoutView.findViewById(R.id.spinner_filter_bank);
        rg_match_group = (RadioGroup) mLayoutView.findViewById(R.id.rg_match_group);
        rg_enable_group = (RadioGroup) mLayoutView.findViewById(R.id.rg_enable_group);
        btn_set_filter = (Button) mLayoutView.findViewById(R.id.btn_set_filter);
        cb_tag_search = (CheckBox) mLayoutView.findViewById(R.id.cb_tag_search);

        mHistoryTagsList = AppApplication.getInstance().getTagDatas();
        mHistoryTagsList.add(0,mContext.getString(R.string.none));

        mFilterTagAdapter = new ArrayAdapter<String>(mContext,android.R.layout.simple_spinner_item, mHistoryTagsList);
        mFilterTagAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner_filter_tag.setAdapter(mFilterTagAdapter);
        spinner_filter_tag.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                if(position == 0)
                    et_filter_tag.setText("");
                else{
                    et_filter_tag.setText(mHistoryTagsList.get(position));
                }
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {

            }
        });

        bank_filter_labels = new String[]{
                mContext.getString(R.string.uhf_write_tag_area_epc),
                mContext.getString(R.string.uhf_write_tag_area_tid),
                mContext.getString(R.string.uhf_write_tag_area_user)
        };

        bank_filter_values = new int[]{
                UHFReader.BANK_TYPE.EPC.value(),
                UHFReader.BANK_TYPE.TID.value(),
                UHFReader.BANK_TYPE.USER.value()
        };

        mFilterBankAdapter = new ArrayAdapter<String>(mContext,android.R.layout.simple_spinner_item, bank_filter_labels);
        mFilterBankAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner_filter_bank.setAdapter(mFilterBankAdapter);

        btn_set_filter.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                //tag search enable
                if (cb_tag_search != null) {
                    boolean checked = cb_tag_search.isChecked();
                    AppApplication.getInstance().setSearchTagEnable(checked);
                }
                setTagFilter();
            }
        });
    }

    private void initReadWritePartViews()
    {
        spinner_read_bank = (Spinner) mLayoutView.findViewById(R.id.spinner_read_bank);
        et_start_addr = (EditText) mLayoutView.findViewById(R.id.et_start_addr);
        et_byte_count = (EditText) mLayoutView.findViewById(R.id.et_byte_count);
        et_access_pwd = (EditText) mLayoutView.findViewById(R.id.et_access_pwd);
        et_read_tag_data = (EditText) mLayoutView.findViewById(R.id.et_read_tag_data);
        et_write_tag_data = (EditText) mLayoutView.findViewById(R.id.et_write_tag_data);
        ll_rw_tag_button_bar = mLayoutView.findViewById(R.id.ll_rw_tag_button_bar);
        btn_read_tag = (Button) mLayoutView.findViewById(R.id.btn_read_tag);
        btn_write_tag = (Button) mLayoutView.findViewById(R.id.btn_write_tag);
        btn_read_tag_recycle = (Button) mLayoutView.findViewById(R.id.btn_read_tag_recycle);
        btn_stop_read_tag_recycle = (Button) mLayoutView.findViewById(R.id.btn_stop_read_tag_recycle);

        bank_labels = new String[]{
                mContext.getString(R.string.uhf_write_tag_area_epc),
                mContext.getString(R.string.uhf_write_tag_area_user),
                mContext.getString(R.string.uhf_write_tag_area_hold),
                mContext.getString(R.string.uhf_write_tag_area_tid)
        };

        bank_values = new int[]{
                UHFReader.BANK_TYPE.EPC.value(),
                UHFReader.BANK_TYPE.USER.value(),
                UHFReader.BANK_TYPE.RESERVED.value(),
                UHFReader.BANK_TYPE.TID.value()
        };

        ArrayAdapter adapter_bank = new ArrayAdapter<String>(mContext,android.R.layout.simple_spinner_item, bank_labels);
        adapter_bank.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner_read_bank.setAdapter(adapter_bank);
        spinner_read_bank.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                int bank = bank_values[position];
                if(bank == UHFReader.BANK_TYPE.EPC.value()){
                    et_start_addr.setText("2");
                    et_byte_count.setText("6");
                }else if(bank == UHFReader.BANK_TYPE.USER.value()){
                    et_start_addr.setText("0");
                    et_byte_count.setText("6");
                }else if(bank == UHFReader.BANK_TYPE.RESERVED.value()){
                    et_start_addr.setText("0");
                    et_byte_count.setText("4");
                }else if(bank == UHFReader.BANK_TYPE.TID.value()){
                    et_start_addr.setText("0");
                    et_byte_count.setText("6");
                }
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {

            }
        });

        btn_read_tag.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                readTag();
            }
        });

        btn_write_tag.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                writeTag();
            }
        });

        btn_read_tag_recycle.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                readTagRecycle();
            }
        });

        btn_stop_read_tag_recycle.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                stopReadTagRecycle();
            }
        });

    }//End initReadWritePartViews

    private void initLockTagViews()
    {
        spinner_lock_bank = (Spinner) mLayoutView.findViewById(R.id.spinner_lock_bank);
        spinner_lock_type = (Spinner) mLayoutView.findViewById(R.id.spinner_lock_type);
        btn_lock_tag = (Button) mLayoutView.findViewById(R.id.btn_lock_tag);
        et_lock_access_pwd = (EditText) mLayoutView.findViewById(R.id.et_lock_access_pwd);

        mLockBankLabels = new String[]{
                mContext.getString(R.string.access_pwd),
                mContext.getString(R.string.destroy_pwd),
                mContext.getString(R.string.uhf_write_tag_area_epc),
                mContext.getString(R.string.uhf_write_tag_area_tid),
                mContext.getString(R.string.uhf_write_tag_area_user)};
        ArrayAdapter adapter_bank = new ArrayAdapter<String>(mContext,android.R.layout.simple_spinner_item, mLockBankLabels);
        adapter_bank.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner_lock_bank.setAdapter(adapter_bank);
        spinner_lock_bank.setSelection(2);

        mLockTypeLabels = new String[]{
                getString(R.string.release_lock),
                getString(R.string.temp_lock) ,
                getString(R.string.fix_lock) };
        ArrayAdapter adapter_lock_type = new ArrayAdapter<String>(mContext,android.R.layout.simple_spinner_item, mLockTypeLabels);
        adapter_lock_type.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner_lock_type.setAdapter(adapter_lock_type);


        btn_lock_tag.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                lockTag();
            }
        });

    }//End initLockTagViews

    private void initKillTagViews()
    {
        et_kill_pwd = (EditText) mLayoutView.findViewById(R.id.et_kill_pwd);
        btn_kill_tag = (Button) mLayoutView.findViewById(R.id.btn_kill_tag);

        btn_kill_tag.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                killTag();
            }
        });
    }

    private void initViewEncoding(){

        rg_encoding = ((RadioGroup) mLayoutView.findViewById(R.id.rg_encoding));
        String sValue = mUHFMgr.getParam(UHFParams.DATA_ENCODE.KEY,
                UHFParams.DATA_ENCODE.PARAM_DATA_ENCODE,
                String.valueOf(UHFParams.DATA_ENCODE.VALUE_ENCODE_HEX));
        int encode = UHFParams.DATA_ENCODE.VALUE_ENCODE_HEX;
        if(!TextUtils.isEmpty(sValue) && TextUtils.isDigitsOnly(sValue))
            encode = Integer.parseInt(sValue);

        switch (encode){
            case UHFParams.DATA_ENCODE.VALUE_ENCODE_ASCII:
                rg_encoding.check(R.id.rb_asc);
                break;
            case UHFParams.DATA_ENCODE.VALUE_ENCODE_GBK:
                rg_encoding.check(R.id.rb_gbk);
                break;
            default:
                rg_encoding.check(R.id.rb_hex);
                break;
        }
    }

    /**
     * Set tag filter
     */
    private void setTagFilter()
    {
        //int tagPos = spinner_filter_tag.getSelectedItemPosition();
        String tagDataHex = et_filter_tag.getText().toString(); //mHistoryTagsList.get(tagPos);

        UHFReader.READER_STATE er = UHFReader.READER_STATE.CMD_FAILED_ERR;
        boolean filterEnable = rg_enable_group.getCheckedRadioButtonId() == R.id.rb_tag_filter_enable;
        if(!TextUtils.isEmpty(tagDataHex) && filterEnable)
        {
            int isMatch = rg_match_group.getCheckedRadioButtonId() == R.id.rb_match ? 0 : 1;

            int bankPos = spinner_filter_bank.getSelectedItemPosition();
            int bankId = bank_filter_values[bankPos];
            int startAddrBits = 0;
            if(bankId == UHFReader.BANK_TYPE.EPC.value())
                startAddrBits = 32;

            try {
                //,{"bank":1,"fdata":0A0B,"flen:"8,"startaddr":2,"isInvert":1}
                JSONObject jsFilter = new JSONObject();
                jsFilter.put("bank", bankId);
                jsFilter.put("startaddr", startAddrBits);
                jsFilter.put("fdata", tagDataHex);
                jsFilter.put("isInvert", isMatch);

                String sValue = jsFilter.toString();
                er = mUHFMgr.setParam(UHFParams.TAG_FILTER.KEY, UHFParams.TAG_FILTER.PARAM_TAG_FILTER, sValue);
                Log.d(TAG,"Set tag filter: "+er.name());
            } catch (Exception e) {
            }

        } else{
            er = mUHFMgr.setParam(UHFParams.TAG_FILTER.KEY, UHFParams.TAG_FILTER.PARAM_CLEAR, "1");
        }

        Toast.makeText(mContext,er == UHFReader.READER_STATE.OK_ERR ? R.string.setting_success : R.string.setting_fail,Toast.LENGTH_SHORT).show();
        Log.d(TAG,"Set tag filter: "+er.name());
    }

    private void readTag()
    {
        btn_read_tag.setEnabled(false);
        int checkedRadioButtonId = rg_encoding.getCheckedRadioButtonId();

        try {
            //bank
            int pos = spinner_read_bank.getSelectedItemPosition();
            int bank = bank_values[pos];

            //start address
            String sAddr = et_start_addr.getText().toString();
            int startAddrBlock = 0;
            if(sAddr != null && TextUtils.isDigitsOnly(sAddr))
                startAddrBlock = Integer.parseInt(sAddr);

            UHFReader.READER_STATE er=UHFReader.READER_STATE.CMD_FAILED_ERR;
            int trycount=3;
            byte[] rdata = null;
            do{


                //block count
                String sBlockCount = et_byte_count.getText().toString();
                int blkcnt  = 0;
                if(sBlockCount != null && TextUtils.isDigitsOnly(sBlockCount))
                    blkcnt = Integer.parseInt(sBlockCount);

                //access password
                String sHexPasswd = et_access_pwd.getText().toString();
                if(TextUtils.isEmpty(sHexPasswd))
                    sHexPasswd = "";

                rdata = mUHFMgr.GetTagData(bank, startAddrBlock, blkcnt, sHexPasswd);
                trycount--;
                if(trycount<1)
                    break;

            }while(rdata == null);

            if(rdata != null)
            {
                String tagData="";
                if (R.id.rb_asc==checkedRadioButtonId) {
                    tagData = new String(rdata,"ASCII");
                }else if(R.id.rb_gbk==checkedRadioButtonId){
                    tagData = new String(rdata,"GBK");
                }else{
                    tagData=UHFReader.Hex2Str(rdata);
                }

                et_read_tag_data.setText(tagData);
                //Add to global cache
                AppApplication.getInstance().addTagData(tagData);
                if(!mHistoryTagsList.contains(tagData))
                {
                    mHistoryTagsList.add(1,tagData);
                    mFilterTagAdapter.notifyDataSetChanged();
                }
            }
            Toast.makeText(mContext, rdata != null ? R.string.success : R.string.failed,Toast.LENGTH_SHORT).show();
            if (rdata != null) {
                mPromptToneService.submit(mSuccessTask);
            } else {
                mPromptToneService.submit(mFailedTask);
            }
        } catch (Exception e) {
            Toast.makeText(mContext, "Exception:"+e.getMessage(),Toast.LENGTH_SHORT).show();
            mPromptToneService.submit(mFailedTask);
        }

        btn_read_tag.setEnabled(true);
    }//End readTag

    private String doReadTag(int iPos,
                              int iBank,
                              String sAddress,
                              String sBlockCount,
                              String sHexPasswd)
    {
        try {
            //bank
            int pos = iPos;
            int bank = iBank;

            //start address
            String sAddr = sAddress;
            int startAddrBlock = 0;
            if(sAddr != null && TextUtils.isDigitsOnly(sAddr))
                startAddrBlock = Integer.parseInt(sAddr);

            UHFReader.READER_STATE er=UHFReader.READER_STATE.CMD_FAILED_ERR;
            int trycount=1;
            byte[] rdata = null;
            do{


                //block count
                int blkcnt  = 0;
                if(sBlockCount != null && TextUtils.isDigitsOnly(sBlockCount))
                    blkcnt = Integer.parseInt(sBlockCount);

                //access password
                if(TextUtils.isEmpty(sHexPasswd))
                    sHexPasswd = "";

                rdata = mUHFMgr.GetTagData(bank, startAddrBlock, blkcnt, sHexPasswd);
                trycount--;
                if(trycount<1)
                    break;

            }while(rdata == null);

            String tagData = null;
            if(rdata != null)
                tagData=UHFReader.Hex2Str(rdata);

            return tagData;

        } catch (Exception e) {
            //Toast.makeText(mContext, "Exception:"+e.getMessage(),Toast.LENGTH_SHORT).show();
        }

        return null;

    }//End readTag


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

    private boolean mReadingRecycle = false;
    private Object mLockRead = new Object();
    private void readTagRecycle()
    {
        if(mReadingRecycle)
            return ;
        mReadingRecycle = true;
        btn_read_tag_recycle.setText("In reading...");
        btn_read_tag_recycle.setEnabled(false);
        ll_rw_tag_button_bar.setVisibility(View.GONE);
        wakeupScreen();
        //bank
        final int pos = spinner_read_bank.getSelectedItemPosition();
        final int bank = bank_values[pos];
        //start address
        final String sAddr = et_start_addr.getText().toString();
        final String sBlockCount = et_byte_count.getText().toString();
        //access password
        final String sHexPasswd = et_access_pwd.getText().toString();

        new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (mLockRead){
                    while (mReadingRecycle)
                    {
                        doReadTag(pos,bank,sAddr,sBlockCount,sHexPasswd);
                        /*if(!mUIHandler.hasMessages(MSG_READ_TAG))
                            mUIHandler.sendEmptyMessage(MSG_READ_TAG);
                        else{
                            try{
                                mLockRead.wait(2000);
                                Thread.sleep(200);
                            }catch (Exception e){
                            }
                        }*/
                    }//While
                }//

            }
        }).start();
    }

    private void stopReadTagRecycle()
    {
        mReadingRecycle = false;
        btn_read_tag_recycle.setEnabled(true);
        btn_read_tag_recycle.setText(R.string.uhf_read_tag_recycle);
        ll_rw_tag_button_bar.setVisibility(View.VISIBLE);
        clearWakeup();
    }

    private void writeTag()
    {
        int checkedRadioButtonId = rg_encoding.getCheckedRadioButtonId();
        btn_write_tag.setEnabled(false);
        try {

            //bank
            int pos = spinner_read_bank.getSelectedItemPosition();
            int bank = bank_values[pos];

            //start address
            String sAddr = et_start_addr.getText().toString();
            int startAddrBlock = 0;
            if(sAddr != null && TextUtils.isDigitsOnly(sAddr))
                startAddrBlock = Integer.parseInt(sAddr);

            //block count
            String sBlockCount = et_byte_count.getText().toString();
            int blkcnt  = 0;
            if(sBlockCount != null && TextUtils.isDigitsOnly(sBlockCount))
                blkcnt = Integer.parseInt(sBlockCount);

            //access password
            String sHexPasswd = et_access_pwd.getText().toString();
            if(TextUtils.isEmpty(sHexPasswd))
                sHexPasswd = "";

            //tag data
            String sHexData = et_write_tag_data.getText().toString();
            byte[] data = new byte[0];
            if (R.id.rb_hex==checkedRadioButtonId) {
                 data = UHFReader.Str2Hex(sHexData);
            }else if(R.id.rb_asc==checkedRadioButtonId){
                data = sHexData.getBytes("ASCII");
            }else if (R.id.rb_gbk==checkedRadioButtonId){
                data = sHexData.getBytes("GBK");
            }
            UHFReader.READER_STATE er= UHFReader.READER_STATE.OK_ERR;
            int trycount=3;
            do{
                /*if(bank == UHFReader.BANK_TYPE.EPC.value())
                    er = mUHFMgr.writeTagEpcEx(data,sHexPasswd);
                else*/
                    er = mUHFMgr.writeTagData(bank, startAddrBlock, data, sHexPasswd);
                trycount--;
                if(trycount<1)
                    break;
            }while(er != UHFReader.READER_STATE.OK_ERR);


            if( er == UHFReader.READER_STATE.OK_ERR)
            {
                Toast.makeText(mContext, getString(R.string.success), Toast.LENGTH_SHORT).show();
                mPromptToneService.submit(mSuccessTask);
            }
            else{
                Toast.makeText(mContext, getString(R.string.failed)+" : "+er.toString(), Toast.LENGTH_SHORT).show();
                mPromptToneService.submit(mFailedTask);
            }

        }catch (Exception e) {
            Toast.makeText(mContext, "Exception :"+e.getMessage(), Toast.LENGTH_SHORT).show();
            mPromptToneService.submit(mFailedTask);
        }

        btn_write_tag.setEnabled(true);

    }//writeTag


    private void lockTag()
    {
        try {

            //setTagFilter();
            //access password
            String sHexPasswd = et_lock_access_pwd.getText().toString();
            if(TextUtils.isEmpty(sHexPasswd))
                sHexPasswd = "";

            UHFReader.Lock_Obj lobj = null;
            UHFReader.Lock_Type ltyp=null;
            int lbank=spinner_lock_bank.getSelectedItemPosition();
            int ltype=spinner_lock_type.getSelectedItemPosition();
            if(lbank==0)
            {
                lobj=UHFReader.Lock_Obj.LOCK_OBJECT_ACCESS_PASSWD;
                if(ltype==0)
                    ltyp=UHFReader.Lock_Type.UNLOCK;//解锁定
                else if(ltype==1)
                    ltyp= UHFReader.Lock_Type.LOCK; //暂时锁定
                else if(ltype==2)
                    ltyp= UHFReader.Lock_Type.PERM_LOCK;//永久锁定

            }
            else if(lbank==1)
            {
                lobj= UHFReader.Lock_Obj.LOCK_OBJECT_KILL_PASSWORD;
                if(ltype==0)
                    ltyp= UHFReader.Lock_Type.UNLOCK;
                else if(ltype==1)
                    ltyp= UHFReader.Lock_Type.LOCK;
                else if(ltype==2)
                    ltyp= UHFReader.Lock_Type.PERM_LOCK;
            }
            else if(lbank==2)
            {
                lobj= UHFReader.Lock_Obj.LOCK_OBJECT_BANK1; //EPC分区
                if(ltype==0)
                    ltyp= UHFReader.Lock_Type.UNLOCK;
                else if(ltype==1)
                    ltyp= UHFReader.Lock_Type.LOCK;
                else if(ltype==2)
                    ltyp= UHFReader.Lock_Type.PERM_LOCK;
            }
            else if(lbank==3)
            {
                lobj= UHFReader.Lock_Obj.LOCK_OBJECT_BANK2;//TID分区
                if(ltype==0)
                    ltyp= UHFReader.Lock_Type.UNLOCK;
                else if(ltype==1)
                    ltyp= UHFReader.Lock_Type.LOCK;
                else if(ltype==2)
                    ltyp= UHFReader.Lock_Type.PERM_LOCK;
            }
            else if(lbank==4)
            {
                lobj= UHFReader.Lock_Obj.LOCK_OBJECT_BANK3;//USER分区
                if(ltype==0)
                    ltyp= UHFReader.Lock_Type.UNLOCK;
                else if(ltype==1)
                    ltyp= UHFReader.Lock_Type.LOCK;
                else if(ltype==2)
                    ltyp= UHFReader.Lock_Type.PERM_LOCK;
            }

            UHFReader.READER_STATE er = UHFReader.READER_STATE.CMD_FAILED_ERR;
            er = mUHFMgr.LockTag(lobj.value(), ltyp.value(), sHexPasswd);

            if( er == UHFReader.READER_STATE.OK_ERR)
            {
                Toast.makeText(mContext, getString(R.string.success), Toast.LENGTH_SHORT).show();
                mPromptToneService.submit(mSuccessTask);
            }
            else{
                Toast.makeText(mContext, getString(R.string.failed)+" : "+er.toString(), Toast.LENGTH_SHORT).show();
                mPromptToneService.submit(mFailedTask);
            }

        } catch (Exception e) {
            Toast.makeText(mContext, "Exception :"+e.getMessage(), Toast.LENGTH_SHORT).show();
            mPromptToneService.submit(mFailedTask);
        }
    }

    private void killTag()
    {
        try {
            //setTagFilter();
            //access password
            String sKillPasswd = et_kill_pwd.getText().toString();
            if(TextUtils.isEmpty(sKillPasswd))
            {
                Toast.makeText(mContext, "Error:  need kill password.", Toast.LENGTH_SHORT).show();
                return ;
            }

            UHFReader.READER_STATE er = mUHFMgr.destroyTag(sKillPasswd);

            if( er == UHFReader.READER_STATE.OK_ERR)
            {
                Toast.makeText(mContext, getString(R.string.success), Toast.LENGTH_SHORT).show();
                mPromptToneService.submit(mSuccessTask);
            }
            else{
                Toast.makeText(mContext, getString(R.string.failed)+" : "+er.toString(), Toast.LENGTH_SHORT).show();
                mPromptToneService.submit(mFailedTask);
            }

        } catch(Exception e) {
            Toast.makeText(mContext, "Exception :"+e.getMessage(), Toast.LENGTH_SHORT).show();
            mPromptToneService.submit(mFailedTask);
        }
    }

    private void handleResumeEvent()
    {
        if(mUHFMgr.isPowerOn())
        {
            enableOrDisableAllViews(!mUHFMgr.isInInventory());
            updateFilterData();
            initViewEncoding();
        }

    }

    private void handlePauseEvent()
    {
        stopReadTagRecycle();
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
}
