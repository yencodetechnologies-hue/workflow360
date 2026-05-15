package com.nlscan.uhf.demo.adapter;

import android.content.Context;
import android.support.annotation.Nullable;

import com.nlscan.android.uhf.TagInfo;
import com.nlscan.android.uhf.UHFReader;
import com.nlscan.uhf.demo.R;

public class TableItemInfo {

    public TagInfo tagInfo;
    public TableHeaderItemInfo headerInfo;
    public TableItemInfo(Context context)
    {
        headerInfo = new TableHeaderItemInfo(context);
    }

    @Override
    public boolean equals(@Nullable Object obj) {
        if(obj instanceof TableItemInfo)
        {
            TableItemInfo target = (TableItemInfo) obj;
            if(target.tagInfo != null && this.tagInfo != null)
            {

                try{
                    String targetEpcId = UHFReader.bytes_Hexstr(target.tagInfo.EpcId);
                    String thisEpcId = UHFReader.bytes_Hexstr(this.tagInfo.EpcId);
                    String targetEmbedData = "";
                    String thisEmbedData = "";
                    if(target.tagInfo.EmbededDatalen > 0 && target.tagInfo.EmbededData != null)
                        targetEmbedData = UHFReader.bytes_Hexstr(target.tagInfo.EmbededData);
                    if(this.tagInfo.EmbededDatalen > 0 && this.tagInfo.EmbededData != null)
                        thisEmbedData = UHFReader.bytes_Hexstr(this.tagInfo.EmbededData);

                    String targetKey =  targetEpcId + targetEmbedData;
                    String thisKey = thisEpcId + thisEmbedData;
                    return targetKey.equals(thisKey);
                }catch (Exception e){
                }
            }

        }
        return super.equals(obj);
    }

    public static class TableHeaderItemInfo{
        public String mNumStr;
        public String mEpcStr;
        public String mCountStr;
        public String mAntStr;
        public String mProtocolStr;
        public String mRSSIStr;
        public String mFreqStr;
        public String mEmbedDataStr;
        public TableHeaderItemInfo(Context context)
        {
            mNumStr = context.getString(R.string.uhf_num);
            mEpcStr = context.getString(R.string.uhf_epc_data);
            mCountStr = context.getString(R.string.uhf_count);
            mAntStr = context.getString(R.string.uhf_ant);
            mProtocolStr = context.getString(R.string.uhf_protocol);
            mRSSIStr = context.getString(R.string.uhf_rssi);
            mFreqStr = context.getString(R.string.uhf_freq);
            mEmbedDataStr = context.getString(R.string.uhf_embeddata);
        }
    }
}
