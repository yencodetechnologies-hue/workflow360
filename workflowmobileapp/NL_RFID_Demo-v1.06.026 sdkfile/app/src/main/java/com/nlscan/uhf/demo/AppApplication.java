package com.nlscan.uhf.demo;

import android.support.multidex.MultiDexApplication;

import com.nlscan.uhf.demo.util.ScreenUtil;
import com.nlscan.uhf.demo.util.constant.SharePreferenceConfig;
import com.nlscan.uhf.demo.util.storage.LocalStorageManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class AppApplication extends MultiDexApplication {
    public static AppApplication instance;

    private boolean isSearchTagEnable = false;

    private List<String> mTagDatas;
    public static AppApplication getInstance() {
        return instance;
    }

    int initLen = 1000;

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        mTagDatas = Collections.synchronizedList(new ArrayList<>(initLen));
        ScreenUtil.resetDensity(getApplicationContext());
        LocalStorageManager.setBoolean(SharePreferenceConfig.Key.SHOULD_REFRESH_LIST, false);
    }

    public List<String> getTagDatas()
    {
        if(mTagDatas == null)
            mTagDatas = Collections.synchronizedList(new ArrayList<>(initLen));
        return mTagDatas;
    }

    public void addTagData(String data)
    {
        if(!mTagDatas.contains(data))
            mTagDatas.add(data);
    }

    public void clearTagData()
    {
        mTagDatas.clear();
    }

    public boolean isSearchTagEnable() {
        return isSearchTagEnable;
    }

    public void setSearchTagEnable(boolean searchTagEnable) {
        isSearchTagEnable = searchTagEnable;
    }
}
