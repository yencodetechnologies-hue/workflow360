package com.nlscan.uhf.demo.view;

import android.content.Context;
import android.graphics.drawable.Drawable;
import android.support.annotation.Nullable;
import android.support.v7.widget.AppCompatTextView;
import android.util.AttributeSet;
import android.widget.TextView;

import com.nlscan.uhf.demo.util.ScreenUtil;

public class BottomTabTextView extends AppCompatTextView {

    public BottomTabTextView(Context context) {
        super(context);
    }

    public BottomTabTextView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
    }

    public BottomTabTextView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    @Override
    public void setCompoundDrawables(@Nullable Drawable left, @Nullable Drawable top, @Nullable Drawable right, @Nullable Drawable bottom) {

        int width = getMeasuredWidth();
        int iconWidth = ScreenUtil.dp2px(20f);
        int left_pos = (width - iconWidth) / 2;
        top.setBounds(0, 0, iconWidth, iconWidth);

        super.setCompoundDrawables(left, top, right, bottom);
    }
}
