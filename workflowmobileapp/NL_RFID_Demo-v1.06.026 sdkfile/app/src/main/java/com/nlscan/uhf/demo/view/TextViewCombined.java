package com.nlscan.uhf.demo.view;

import android.content.Context;
import android.graphics.Color;
import android.support.annotation.Nullable;
import android.util.AttributeSet;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.nlscan.uhf.demo.R;

public class TextViewCombined extends LinearLayout {
    private final TextView aboveTv;
    private final TextView belowTv;


    public TextViewCombined(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        LayoutInflater.from(context).inflate(R.layout.textview_combined, this, true);
        aboveTv = (TextView) findViewById(R.id.above);
        belowTv = (TextView) findViewById(R.id.below);
    }

    public void setAboveTv(String s) {
        aboveTv.setText(s);
    }

    public void setBelowTv(String s) {
        belowTv.setText(s);
    }

    public void setBelowVisibility(int visibility) {
        belowTv.setVisibility(visibility);
    }

    public void setBelowBackgroundColor(int color) {
        belowTv.setBackgroundColor(getResources().getColor(color));
    }

    //#E2E0E0
    public void setBelowBackgroundColorX(String rgb)
    {
        belowTv.setBackgroundColor(Color.parseColor(rgb));
    }

    public void setBothGravityCenter() {
        aboveTv.setGravity(Gravity.CENTER);
        belowTv.setGravity(Gravity.CENTER);
    }


}
