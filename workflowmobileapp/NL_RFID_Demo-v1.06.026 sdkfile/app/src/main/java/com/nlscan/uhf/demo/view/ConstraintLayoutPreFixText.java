package com.nlscan.uhf.demo.view;

import android.content.Context;
import android.content.res.TypedArray;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.support.constraint.ConstraintLayout;
import android.util.AttributeSet;

import com.nlscan.uhf.demo.R;


public class ConstraintLayoutPreFixText extends ConstraintLayout {
    private Paint borderPaint, textPaint, textBackgroundPaint;
    private RectF borderRect;
    private String prefixText = "";
    Rect txtBounds = new Rect();

    //attr
    private int txtColor, borderColor, txtBackgroundColor;
    private float textSize, textMarginHorizontal, borderSize;

    private int txtDropLine = 20;//borderX  to textMarginHorizontal start or end


    public ConstraintLayoutPreFixText(Context context) {
        super(context);
        init();
    }

    public ConstraintLayoutPreFixText(Context context, AttributeSet attrs) {
        super(context, attrs);
        TypedArray typedArray = context.obtainStyledAttributes(attrs, R.styleable.ConstraintLayoutPreFixText);

        textSize = typedArray.getDimension(R.styleable.ConstraintLayoutPreFixText_android_textSize, 20);

        txtColor = typedArray.getColor(R.styleable.ConstraintLayoutPreFixText_android_textColor, Color.GRAY);
        borderColor = typedArray.getColor(R.styleable.ConstraintLayoutPreFixText_borderColor, Color.GRAY);
        txtBackgroundColor = typedArray.getColor(R.styleable.ConstraintLayoutPreFixText_borderColor, Color.WHITE);

        textMarginHorizontal = typedArray.getDimension(R.styleable.ConstraintLayoutPreFixText_textMarginHorizontal, 20);
        borderSize = typedArray.getDimension(R.styleable.ConstraintLayoutPreFixText_borderSize, 3);

        prefixText = typedArray.getString(R.styleable.ConstraintLayoutPreFixText_prefixTxt);
        typedArray.recycle();

        init();
    }


    private void init() {
        setWillNotDraw(false);
        // 初始化边框画笔
        borderPaint = new Paint();
        borderPaint.setStyle(Paint.Style.STROKE);
        borderPaint.setColor(borderColor);
        borderPaint.setStrokeWidth(borderSize);

        textBackgroundPaint = new Paint();
        textBackgroundPaint.setStyle(Paint.Style.STROKE);
        textBackgroundPaint.setColor(txtBackgroundColor);
        textBackgroundPaint.setStrokeWidth(borderSize);

        textPaint = new Paint();
        textPaint.setStyle(Paint.Style.FILL);
        textPaint.setColor(txtColor);
        textPaint.setTextSize(textSize);

        borderRect = new RectF();

        textPaint.getTextBounds(prefixText, 0, prefixText.length(), txtBounds);
    }


    @Override
    protected void dispatchDraw(Canvas canvas) {
        super.dispatchDraw(canvas);

        borderRect.set(0, getTopLineY(), getWidth(), getHeight());
        canvas.drawRoundRect(borderRect, 0, 0, borderPaint);

        canvas.drawLine(txtDropLine, getTopLineY(), getTxtBackgroundWidth(), getTopLineY(), textBackgroundPaint);

        canvas.drawText(prefixText, txtDropLine + textMarginHorizontal, txtBounds.height(), textPaint);
    }

    private int getTxtBackgroundWidth() {
        if (textMarginHorizontal * 2 + txtBounds.width() > (getWidth() - txtDropLine * 2)) {
            return getWidth() - txtDropLine * 2;
        } else {
            return (int) (textMarginHorizontal * 2 + txtBounds.width()+txtDropLine);
        }
    }


    private int getTopLineY(){
        return txtBounds.height()/2;
    }

    /**
     * if text is too long, draw part text
     */
    private void drawPartText(){

    }



}
