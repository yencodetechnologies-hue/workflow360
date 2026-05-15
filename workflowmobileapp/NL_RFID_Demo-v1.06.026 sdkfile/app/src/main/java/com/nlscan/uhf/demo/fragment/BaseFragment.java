package com.nlscan.uhf.demo.fragment;


import android.app.Activity;
import android.app.Fragment;
import android.content.Context;
import android.content.res.Configuration;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.util.Log;
import android.view.KeyEvent;

import com.nlscan.android.uhf.UHFManager;

public class BaseFragment extends Fragment {

    private final static String TAG = "BaseFragment";
    protected String mModelName;
    protected UHFManager mUHFMgr;
    protected Context mContext;

    @Override
    public void onAttach(Activity activity) {
        super.onAttach(activity);
        mContext = activity.getApplicationContext();
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mUHFMgr = UHFManager.getInstance();
        Log.i(TAG, "onCreate: "+String.format("mMName:%s,mUhfMgr:%s",mModelName,mUHFMgr));
        mModelName = mUHFMgr.getUHFDeviceModel();
    }

    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG,this.getClass().getSimpleName()+" onResume.");
    }

    @Override
    public void onPause() {
        super.onPause();
        Log.d(TAG,this.getClass().getSimpleName()+" onPause.");
    }

    @Override
    public void onHiddenChanged(boolean hidden) {
        super.onHiddenChanged(hidden);
        Log.d(TAG,this.getClass().getSimpleName()+" onHiddenChanged, hidden: "+hidden);
    }

    @Override
    public void onDetach() {
        super.onDetach();
        Log.d(TAG,this.getClass().getSimpleName()+" onDetach.");
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        Log.d(TAG,this.getClass().getSimpleName()+" onDestroyView.");
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG,this.getClass().getSimpleName()+" onDestroy.");
    }

    //------------------------------------------------------------------------
    public void onUhfPowerOning()
    {
    }

    public void onUhfPowerOn()
    {
    }

    public void onUhfPowerOff()
    {
    }

    public void onUhfStartInventory()
    {
    }

    public void onUhfStopInventory()
    {
    }

    public void onKeyDown(int keyCode, KeyEvent event){

    }

    public void onKeyUp(int keyCode, KeyEvent event){

    }

}
