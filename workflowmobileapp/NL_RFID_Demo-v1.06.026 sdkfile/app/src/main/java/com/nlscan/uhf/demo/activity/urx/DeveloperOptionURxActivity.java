package com.nlscan.uhf.demo.activity.urx;

import android.app.Activity;
import android.app.Fragment;
import android.app.FragmentManager;
import android.app.FragmentTransaction;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.widget.Spinner;

import com.nlscan.uhf.demo.R;
import com.nlscan.uhf.demo.fragment.urx.CommonCmdFragment;


public class DeveloperOptionURxActivity extends Activity {

    private Fragment mFragment=new CommonCmdFragment();

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_developer_option_urx);
    }

    @Override
    protected void onResume() {
        super.onResume();
        attachFragment(mFragment);
    }

    @Override
    protected void onStop() {
        super.onStop();
        detachFragment(mFragment);
    }

    private void attachFragment(Fragment f)
    {
        FragmentManager fm = getFragmentManager();
        FragmentTransaction transaction = fm.beginTransaction();
        transaction.replace(R.id.layout_frame_content, f);
        transaction.commit();
    }

    private void detachFragment(Fragment f)
    {
        FragmentManager fm = getFragmentManager();
        FragmentTransaction transaction = fm.beginTransaction();
        transaction.remove(f);
        transaction.commit();
    }

    private void updateHeader() {

    }


}
