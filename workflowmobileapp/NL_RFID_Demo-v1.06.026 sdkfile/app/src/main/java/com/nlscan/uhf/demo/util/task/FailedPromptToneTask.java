package com.nlscan.uhf.demo.util.task;

import android.content.Context;

import com.nlscan.uhf.demo.R;


public class FailedPromptToneTask extends PromptToneTask {
    public FailedPromptToneTask(Context context, AudioListener listener) {
        super(context, listener);
        mAudioResourceId = soundPool.load(mContext, R.raw.failed, 1);
    }
}
