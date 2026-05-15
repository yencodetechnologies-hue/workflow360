package com.nlscan.uhf.demo.view;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.support.annotation.Nullable;
import android.util.AttributeSet;
import android.widget.TextView;

public class MyRectFrameTextView extends TextView {

    private Paint paint;

    public MyRectFrameTextView(Context context) {
        super(context);
    }

    public MyRectFrameTextView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
    }

    public MyRectFrameTextView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    public MyRectFrameTextView(Context context, @Nullable AttributeSet attrs, int defStyleAttr, int defStyleRes) {
        super(context, attrs, defStyleAttr, defStyleRes);
    }

    @Override
    protected void dispatchDraw(Canvas canvas) {
        super.dispatchDraw(canvas);
        if(paint == null){
            paint = new Paint(); //设置一个笔刷大小是3的黄色的画笔
            paint.setColor(Color.WHITE);
            paint.setStrokeWidth(0);
            paint.setStyle(Paint.Style.STROKE);
        }

        canvas.drawRect(0,0,getMeasuredWidth(),getMeasuredHeight(),paint);
    }
}
