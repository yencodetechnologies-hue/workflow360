package com.nlscan.uhf.demo.util.permission;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.NameNotFoundException;
import android.content.pm.PermissionInfo;
import android.location.LocationManager;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.util.Log;

import java.util.ArrayList;
import java.util.List;

public class PermissionUtils {
	 
	private final static String TAG = "PermissionUtils";

    /**
     * 请求所有的动态权限
     * @param activity
     * @return
     */
    public static boolean requestAllRuntimePermission(Activity activity,int requestCode)
	{
    	if(android.os.Build.VERSION.SDK_INT < 23) //SDK >= 23之后才需要动态申请permission;
    		return true;
    	
    	Context ctx = activity.getApplicationContext();
		PackageManager pm = ctx.getPackageManager();
		String packageName = ctx.getPackageName();
		
		try {
			PackageInfo pkgInfo = pm.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS);
			if(pkgInfo == null)
				return false;
			
			String[] permissions = pkgInfo.requestedPermissions;
			
			return requestRuntimePermission(activity, permissions,requestCode);
			
		} catch (Exception e) {
			Log.w(TAG, "Request all runtime permission failed.", e);
		}
		
		return false;
	}
    
	public static boolean requestRuntimePermission(Activity activity,String[] permissions,int requestCode) throws Exception
	{
		if(permissions != null && permissions.length > 0)
		{
			List<String> rumtimePermissionList = new ArrayList<String>();
			for(String permissionName : permissions)
			{
				if(isRuntime(activity.getApplicationContext(),permissionName)){ //动态权限
					Log.d(TAG, "Runtime permission : "+permissionName);
					rumtimePermissionList.add(permissionName);
				}
			}
			
			rumtimePermissionList.remove(Manifest.permission.READ_EXTERNAL_STORAGE);
			rumtimePermissionList.remove(Manifest.permission.WRITE_EXTERNAL_STORAGE);
			
			rumtimePermissionList.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
			rumtimePermissionList.add(Manifest.permission.READ_EXTERNAL_STORAGE);
			if(rumtimePermissionList.contains(Manifest.permission.WRITE_EXTERNAL_STORAGE)){
				
			}
			
			if(rumtimePermissionList.size() > 0)
			{
				String[] REQUEST_RUNTIME_PERMISSIONS = new String[rumtimePermissionList.size()];
				rumtimePermissionList.toArray(REQUEST_RUNTIME_PERMISSIONS);
				 ActivityCompat.requestPermissions(activity, REQUEST_RUNTIME_PERMISSIONS,
						 requestCode);
			}
		}
		
		return true;
		
	}//end requestRuntimePermission
	
    public  static boolean isRuntime(Context ctx,String permissionName){
		PackageManager pm = ctx.getPackageManager();
		try {
			PermissionInfo permissionInfo = pm.getPermissionInfo(permissionName, 0);
			if(permissionInfo != null)
			{
				int protectionLevel = permissionInfo.protectionLevel;
				
				return (protectionLevel & PermissionInfo.PROTECTION_MASK_BASE)
		                == PermissionInfo.PROTECTION_DANGEROUS;
			}
		} catch (NameNotFoundException e) {
			e.printStackTrace();
		}
		return false;
	}

	public static boolean checkRequestRuntimePermissions(Context context)
	{
		if(android.os.Build.VERSION.SDK_INT < 23) //SDK >= 23之后才需要动态申请permission;
			return false;

		Context ctx = context;
		PackageManager pm = ctx.getPackageManager();
		String packageName = ctx.getPackageName();

		try {
			PackageInfo pkgInfo = pm.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS);
			if(pkgInfo == null)
				return false;

			String[] permissions = pkgInfo.requestedPermissions;
			for(String permission : permissions)
			{
				if(isRuntime(ctx,permission))
				{
					int grant = ContextCompat.checkSelfPermission(ctx,permission);
					if(grant != PackageManager.PERMISSION_GRANTED)
						return true;
				}
			}

		} catch (Exception e) {
			Log.w(TAG, "Request all runtime permission failed.", e);
		}

		return false;
	}

	public static boolean isLocationEnabled(Context context) {
		// 检查位置服务是否开启
		LocationManager locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
		return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
				|| locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
	}
}
