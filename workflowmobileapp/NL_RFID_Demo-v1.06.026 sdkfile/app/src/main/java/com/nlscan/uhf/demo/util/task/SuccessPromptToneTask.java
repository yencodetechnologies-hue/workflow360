package com.nlscan.uhf.demo.util.task;

import android.content.Context;

import com.nlscan.uhf.demo.R;


public class SuccessPromptToneTask extends PromptToneTask {
    public SuccessPromptToneTask(Context context, AudioListener listener) {
        super(context, listener);
        mAudioResourceId = soundPool.load(mContext, R.raw.success, 1);
    }
}
