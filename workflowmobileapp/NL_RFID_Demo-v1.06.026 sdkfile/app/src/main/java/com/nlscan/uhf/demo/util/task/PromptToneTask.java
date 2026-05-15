package com.nlscan.uhf.demo.util.task;

import android.content.Context;
import android.media.AudioManager;
import android.media.SoundPool;
import android.util.Log;

/**
 * 提示音任务
 * 在蓝牙上下线时播放提示音
 */
public class PromptToneTask implements Runnable {
    private final String TAG = PromptToneTask.class.getSimpleName();
    protected AudioListener mListener;
    protected Context mContext;
    protected SoundPool soundPool;
    protected int mAudioResourceId;

    public PromptToneTask(Context context, AudioListener listener) {
        this.mContext = context;
        this.mListener = listener;
        soundPool = new SoundPool(10, AudioManager.STREAM_RING, 5);
    }

    @Override
    public void run() {
        if (mListener != null) {
            mListener.onStart();
        }
        boolean soundEnable = false;

        AudioManager am = (AudioManager) mContext.getSystemService(Context.AUDIO_SERVICE);
        // 获取最大音量值（获取媒体音量最大值）
        float audioMaxVolumn = am.getStreamMaxVolume(AudioManager.STREAM_RING);
        // 不断获取当前的音量值(当前系统媒体的音量)
        float audioCurrentVolumn = am.getStreamVolume(AudioManager.STREAM_RING);
        //最终影响音量
        float volumnRatio = audioCurrentVolumn / audioMaxVolumn;
        Log.d(TAG, "getVolumn init volumnRatio:" + volumnRatio);
        soundPool.play(mAudioResourceId, volumnRatio, volumnRatio, 0, 0, 1);

        if (mListener != null) {
            mListener.onStop();
        }
    }

    public interface AudioListener {
        void onStart();

        void onStop();
    }

}
