package com.nlscan.uhf.demo.util;

import android.content.Context;
import android.content.res.Resources;
import android.graphics.Point;
import android.os.Build;
import android.os.PowerManager;
import android.util.DisplayMetrics;
import android.view.ViewConfiguration;
import android.view.WindowManager;

import java.lang.reflect.Method;

/**
 * 在Application中初始化
 */
public class ScreenUtil {
    public static float sDensity;
    public static int sDensityDpi;
    public static float sFontDensity;
    public static int sHeightPixels;
    public static int sWidthPixels;
    public static int navBarHeightPixels;

    public static void resetDensity(Context context) {
        if (context != null && context.getResources() != null) {
            DisplayMetrics displayMetrics = context.getResources().getDisplayMetrics();
            sDensity = displayMetrics.density;
            sFontDensity = displayMetrics.scaledDensity;
            sWidthPixels = displayMetrics.widthPixels;
            sHeightPixels = displayMetrics.heightPixels;
            if (ScreenUtil.hasNavBar(context)) {
                navBarHeightPixels = getNavigationBarHeight(context);
            }
            sDensityDpi = displayMetrics.densityDpi;
        }
    }

    /**
     * 获得状态栏高度
     *
     * @param context
     * @return
     */
    public static int getStatusBarHeight(Context context) {
        int resourceId = context.getResources().getIdentifier("status_bar_height", "dimen", "android");
        return context.getResources().getDimensionPixelSize(resourceId);
    }
    
    public static int getPhoneHeight(Context context) {
        int height = sHeightPixels;

        WindowManager windowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
        Point localPoint = new Point();
        windowManager.getDefaultDisplay().getRealSize(localPoint);
        if (localPoint.y > height) {
            height = localPoint.y;
        }

        return height;
    }

    /**
     * 获取虚拟按键高度
     */
    public static int getNavigationBarHeight(Context context) {
        if (null == context) {
            return 0;
        }
        Resources localResources = context.getResources();
        if (!hasNavBar(context)) {
            return 0;
        }
        int i = localResources.getIdentifier("navigation_bar_height", "dimen", "android");
        if (i > 0) {
            return localResources.getDimensionPixelSize(i);
        }
        i = localResources.getIdentifier("navigation_bar_height_landscape", "dimen", "android");
        if (i > 0) {
            return localResources.getDimensionPixelSize(i);
        }
        return 0;
    }

    //是否有虛擬按鍵
    public static boolean hasNavBar(Context paramContext) {
        boolean bool = true;
        String sNavBarOverride;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            try {
                Object localObject = Class.forName("android.os.SystemProperties").getDeclaredMethod("get", String.class);
                ((Method) localObject).setAccessible(true);
                sNavBarOverride = (String) ((Method) localObject).invoke(null, "qemu.hw.mainkeys");
                localObject = paramContext.getResources();
                int i = ((Resources) localObject).getIdentifier("config_showNavigationBar", "bool", "android");
                if (i != 0) {
                    bool = ((Resources) localObject).getBoolean(i);
                    if ("1".equals(sNavBarOverride)) {
                        return false;
                    }
                }
            } catch (Throwable localThrowable) {
            }
        }
        if (!ViewConfiguration.get(paramContext).hasPermanentMenuKey()) {
            return bool;
        }
        return false;
    }

    public static int dp2px(float value) {
        return (int) ((sDensity * value) + 0.5f);
    }

    public static int px2dp(float value) {
        return (int) ((value / sDensity) + 0.5f);
    }

    public static int sp2px(float value) {
        return (int) (sDensity * value);
    }

    public static int px2sp(float value) {
        return (int) (value / sDensity);
    }

    public static boolean isScreenOn(Context context) {
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);

        boolean screenOn;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT_WATCH) {
            screenOn = pm.isInteractive();
        } else {
            screenOn = pm.isScreenOn();
        }

        return screenOn;
    }
}
