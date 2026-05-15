package com.nlscan.uhf.demo.view;

import android.content.Context;
import android.content.res.TypedArray;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.constraint.ConstraintLayout;
import android.text.TextUtils;
import android.util.AttributeSet;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Spinner;
import android.widget.TextView;


import com.nlscan.uhf.demo.R;
import com.nlscan.uhf.demo.util.ResourceValueParser;

import java.util.ArrayList;
import java.util.HashMap;

public class IndustryTextSpinnerView extends ConstraintLayout implements AdapterView.OnItemSelectedListener {

    private TextView tv;
    private Spinner spinner;
    private HashMap<String, Byte> mMap;
    private int selectedValue;
    private Context mCtx;
    private String TAG = IndustryTextSpinnerView.class.getSimpleName();
    ArrayAdapter<String> mSpinnerAdapter;

    //attr
    private String mText;
    private int mArrayResId;

    public IndustryTextSpinnerView(@NonNull Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        TypedArray typedArray = context.obtainStyledAttributes(attrs, R.styleable.IndustryTextSpinnerView);
        mText = typedArray.getString(R.styleable.IndustryTextSpinnerView_android_name);
        typedArray.recycle();


        mArrayResId = attrs.getAttributeResourceValue(R.styleable.IndustryTextSpinnerView_android_entries, 0);
        mMap = ResourceValueParser.parseGen2ProtocolCfgSetting(context, mArrayResId);

        mCtx = context;
        initView(context);
        initEvent();

        setText(mText);
        setMap(mMap);
    }


    private void initView(Context ctx) {
        LayoutInflater.from(ctx).inflate(R.layout.view_industry_text_spinner, this, true);
        tv = ((TextView) findViewById(R.id.view_txt));
        spinner = ((Spinner) findViewById(R.id.view_spinner));
    }

    private void initEvent() {
        spinner.setOnItemSelectedListener(this);
    }

    public void setMap(HashMap<String, Byte> map) {
        this.mMap = map;
        mSpinnerAdapter = new ArrayAdapter<String>(mCtx, android.R.layout.simple_spinner_item, new ArrayList<>(mMap.keySet()));
        spinner.setAdapter(mSpinnerAdapter);
    }

    public void setText(String s) {
        if (!TextUtils.isEmpty(s)) {
            tv.setText(s);
        }
    }

    /**
     * @param mapValue value in map rather than key in map
     */
    public void updateSpinnerSelected(int mapValue) {
        for (String s : mMap.keySet()) {
            int v = Integer.parseInt(String.valueOf(mMap.get(s)));
            Log.i(TAG, "updateSpinnerSelected: " + String.format("s:%s,v:%s,mapValue:%s", s, v + "", mapValue + ""));
            if (mapValue == v) {
                int position = mSpinnerAdapter.getPosition(s);
                spinner.setSelection(position);
                Log.i(TAG, "updateSpinnerSelected: break");
                break;
            }
        }
    }


    public int getSelectedValue() {
        return selectedValue;
    }

    @Override
    public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
        Log.i(TAG, "onItemSelected: ");
        switch (parent.getId()) {
            case R.id.view_spinner:
                String s = parent.getItemAtPosition(position).toString();
                Log.i(TAG, "onItemSelected: " + mMap.get(s));
                selectedValue = Integer.parseInt(String.valueOf(mMap.get(s)));
                Log.i(TAG, "onItemSelected: " + String.format("selectedValue:%s", selectedValue + ""));//String.format("selectedValue:%s",selectedValue)
                break;
        }
    }

    @Override
    public void onNothingSelected(AdapterView<?> parent) {

    }


}
