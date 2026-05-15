package com.nlscan.uhf.demo.util.view;

import android.content.Context;
import android.os.Handler;
import android.os.Message;
import android.os.SystemClock;
import android.support.annotation.Nullable;
import android.util.AttributeSet;
import android.widget.TextView;

public class TimerTextView extends TextView {

    private boolean mCounting = false;
    private boolean mForceStop = true;

    private long mStartTime = 0l;
    private final int MSG_UPDATE = 0x01;

    private long mPassTime = 0l;

    private Handler mUIHander = new Handler(){
        @Override
        public void handleMessage(Message msg) {
            switch (msg.what){
                case MSG_UPDATE:
                    mPassTime = SystemClock.uptimeMillis() - mStartTime;
                    float sec = ((float)mPassTime)/1000;
                    String sData = String.format("%2.2f",sec);
                    setText(sData+" ");
                    break;
            }
        }
    };

    public TimerTextView(Context context) {
        super(context);
    }

    public TimerTextView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
    }

    public TimerTextView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    public TimerTextView(Context context, @Nullable AttributeSet attrs, int defStyleAttr, int defStyleRes) {
        super(context, attrs, defStyleAttr, defStyleRes);
    }

    public void startTimeCounter()
    {
        synchronized (this){

            if(mCounting)
                return ;

            mCounting = true;
            mStartTime = 0;
            mPassTime = 0;
            mForceStop = false;

            new Thread(new Runnable() {
                @Override
                public void run() {
                    mStartTime = SystemClock.uptimeMillis();
                    while (!mForceStop)
                    {
                        try{
                            mUIHander.sendEmptyMessage(MSG_UPDATE);
                            Thread.sleep(100);
                        }catch (Exception e){
                        }
                        mPassTime = SystemClock.uptimeMillis() - mStartTime;
                    }
                    mCounting = false;
                }
            }).start();
        }
    }

    public void stopTimeCounter()
    {
        mForceStop = true;

    }

    public long getPassTime()
    {
        return mPassTime;
    }

}
