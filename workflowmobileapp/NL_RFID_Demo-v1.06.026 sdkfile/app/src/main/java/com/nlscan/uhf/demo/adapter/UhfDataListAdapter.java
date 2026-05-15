package com.nlscan.uhf.demo.adapter;

import static android.view.View.GONE;
import static android.view.View.INVISIBLE;
import static android.view.View.VISIBLE;

import android.content.Context;
import android.graphics.Color;
import android.text.TextUtils;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.nlscan.android.uhf.TagInfo;
import com.nlscan.android.uhf.UHFManager;
import com.nlscan.android.uhf.UHFReader;
import com.nlscan.uhf.demo.AppApplication;
import com.nlscan.uhf.demo.R;
import com.nlscan.uhf.demo.util.constant.UHFParams;
import com.nlscan.uhf.demo.view.TextViewCombined;


import java.util.Arrays;
import java.util.List;

public class UhfDataListAdapter extends BaseAdapter {

    private Context mContext;
    private List<TableItemInfo> mUhfDataList;
    private MyOnItemClickListner myOnItemClickListner;
    private String TAG = UhfDataListAdapter.class.getSimpleName();

    public UhfDataListAdapter(Context context, List<TableItemInfo> uhfDataList) {
        mContext = context;
        mUhfDataList = uhfDataList;

    }

    @Override
    public int getCount() {
        int count = mUhfDataList == null ? 0 : mUhfDataList.size();
        Log.i(TAG, String.format("mUhfDataList count : %d",count));
        return count;
    }

    @Override
    public Object getItem(int position) {
        synchronized (mUhfDataList){
            if(mUhfDataList.size() == 0 || position > mUhfDataList.size() -1)
                return null;
        }
        TableItemInfo itemInfo = mUhfDataList.get(position);
        return itemInfo;
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        final TableItemInfo itemInfo = ((TableItemInfo) getItem(position));
        Holder holder = null;
        if (convertView != null) {
            holder = (Holder) convertView.getTag();
        } else {
            holder = new Holder();
            convertView = LayoutInflater.from(parent.getContext()).inflate(R.layout.uhf_data_recycle_view_item_layout, null, false);
            holder.uhf_data_item_epc_textview = (TextViewCombined) convertView.findViewById(R.id.uhf_data_item_epc_textview);
            holder.uhf_data_item_num_textview = (TextViewCombined) convertView.findViewById(R.id.uhf_data_item_num_textview);
            holder.uhf_data_item_count_textview = (TextViewCombined) convertView.findViewById(R.id.uhf_data_item_count_textview);
            holder.uhf_data_item_ant_textview = (TextView) convertView.findViewById(R.id.uhf_data_item_ant_textview);
            holder.uhf_data_item_protocol_textview = (TextView) convertView.findViewById(R.id.uhf_data_item_protocol_textview);
            holder.uhf_data_item_rssi_textview = (TextViewCombined) convertView.findViewById(R.id.uhf_data_item_rssi_textview);
            holder.uhf_data_item_freq_textview = (TextViewCombined) convertView.findViewById(R.id.uhf_data_item_freq_textview);
            holder.uhf_data_item_embeddata_textview = (TextView) convertView.findViewById(R.id.uhf_data_item_embeddata_textview);
            holder.uhf_data_item_rssi_strength = ((ProgressBar) convertView.findViewById(R.id.uhf_data_item_rssi_strength));

            if (AppApplication.getInstance().isSearchTagEnable()) {
                holder.uhf_data_item_rssi_strength.setVisibility(VISIBLE);
            }else {
                holder.uhf_data_item_rssi_strength.setVisibility(GONE);
            }

            holder.uhf_data_item_ant_textview.setVisibility(View.GONE);
            holder.uhf_data_item_protocol_textview.setVisibility(View.GONE);

            convertView.setTag(holder);
        }



        holder.uhf_data_item_num_textview.setAboveTv("" + (position + 1));
        holder.uhf_data_item_num_textview.setBelowTv("Tid:");
        holder.uhf_data_item_num_textview.setBelowVisibility(VISIBLE);

        holder.uhf_data_item_num_textview.setBothGravityCenter();
        holder.uhf_data_item_count_textview.setBothGravityCenter();
        holder.uhf_data_item_rssi_textview.setBothGravityCenter();
        holder.uhf_data_item_freq_textview.setBothGravityCenter();

        if(itemInfo != null)
        {
            final TagInfo tagInfo = itemInfo.tagInfo;
            Log.i(TAG, String.format("position : %d,tagInfo : %d",position,tagInfo.RSSI));
            String epcStr = encodeStringBySettings(tagInfo.EpcId);
            holder.uhf_data_item_epc_textview.setAboveTv(epcStr);
            holder.uhf_data_item_epc_textview.setBelowTv(UHFReader.bytes_Hexstr(tagInfo.EmbededData));
            holder.uhf_data_item_count_textview.setAboveTv(String.valueOf(tagInfo.ReadCnt));
            holder.uhf_data_item_ant_textview.setText(String.valueOf(tagInfo.AntennaID));
            holder.uhf_data_item_protocol_textview.setText(getProtocol(tagInfo.protocol.value()));
            holder.uhf_data_item_rssi_textview.setAboveTv(String.valueOf(tagInfo.RSSI));
            holder.uhf_data_item_rssi_strength.setProgress(tagInfo.RSSI);
            holder.uhf_data_item_freq_textview.setAboveTv(String.valueOf(tagInfo.Frequency));
            String hexEmbedStr = "";
            if (tagInfo.EmbededDatalen > 0) {
                byte[] embededDataBytes = Arrays.copyOfRange(tagInfo.EmbededData,0,tagInfo.EmbededDatalen);
                hexEmbedStr = UHFReader.bytes_Hexstr(embededDataBytes);
            }
            Log.i(TAG, "Embed len: "+tagInfo.EmbededDatalen+", hexEmbedStr: " + hexEmbedStr);
            holder.uhf_data_item_embeddata_textview.setText(hexEmbedStr);

            holder.uhf_data_item_num_textview.setBelowVisibility("".equals(hexEmbedStr) ? GONE : VISIBLE);
            holder.uhf_data_item_epc_textview.setBelowVisibility("".equals(hexEmbedStr) ? GONE : VISIBLE);

            convertView.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    if (myOnItemClickListner != null)
                        myOnItemClickListner.onClick(tagInfo);
                }
            });
        }

        holder.uhf_data_item_count_textview.setBelowVisibility(GONE);
        holder.uhf_data_item_rssi_textview.setBelowVisibility(GONE);
        holder.uhf_data_item_freq_textview.setBelowVisibility(GONE);
        holder.uhf_data_item_epc_textview.setBelowBackgroundColor(R.color.dark_blue);

        return convertView;
    }//End getView

    public void setItemClickListner(MyOnItemClickListner myOnItemClickListner) {
        this.myOnItemClickListner = myOnItemClickListner;
    }

    public void clearAll() {
        if (mUhfDataList != null && mUhfDataList.size() > 0) {
            mUhfDataList.clear();
        }
    }

    public void addList() {
        /*if (mUhfDataList.size() == listSize) {
            return;
        }*/
        notifyDataSetChanged();
    }

    private String getProtocol(int val) {
        String strProtocol = "";
        switch (val) {
            case 0:
                strProtocol = "NONE";
                break;
            case 3:
                strProtocol = "ISO180006B";
                break;
            case 5:
                strProtocol = "GEN2";
                break;
            case 6:
                strProtocol = "ISO180006B_UCODE";
                break;
            case 7:
                strProtocol = "IPX64";
                break;
            case 8:
                strProtocol = "IPX256";
                break;
        }
        return strProtocol;
    }

    /**
     * Convert data into a specified encoded string
     * @param dataBytes
     * @return
     */
    private String encodeStringBySettings(byte[] dataBytes)
    {
        if(dataBytes == null || dataBytes.length == 0)
            return null;

        UHFManager uhfManager = UHFManager.getInstance();
        String sEncode = uhfManager.getParam(UHFParams.DATA_ENCODE.KEY,
                UHFParams.DATA_ENCODE.PARAM_DATA_ENCODE,
                String.valueOf(UHFParams.DATA_ENCODE.VALUE_ENCODE_HEX));

        String result = "";
        try{

            int iEncode = UHFParams.DATA_ENCODE.VALUE_ENCODE_HEX;
            if(!TextUtils.isEmpty(sEncode) && TextUtils.isDigitsOnly(sEncode))
                iEncode = Integer.parseInt(sEncode);

            switch (iEncode){
                case UHFParams.DATA_ENCODE.VALUE_ENCODE_ASCII:
                    result = new String(dataBytes,"US-ASCII");
                    break;
                case UHFParams.DATA_ENCODE.VALUE_ENCODE_GBK:
                    result = new String(dataBytes, "GBK");
                    break;
                case UHFParams.DATA_ENCODE.VALUE_ENCODE_UTF8:
                    result = new String(dataBytes,"UTF-8");
                    break;
                default:
                    result = UHFReader.bytes_Hexstr(dataBytes);
                    break;
            }

        }catch (Exception e){
        }

        return result;

    }

    //-------------------------------------Inner class---------------------------------------

    private class Holder {
        public TextViewCombined uhf_data_item_num_textview;
        public TextViewCombined uhf_data_item_epc_textview;
        public TextViewCombined uhf_data_item_count_textview;
        public TextView uhf_data_item_ant_textview;
        public TextView uhf_data_item_protocol_textview;
        public TextViewCombined uhf_data_item_rssi_textview;
        public TextViewCombined uhf_data_item_freq_textview;
        public TextView uhf_data_item_embeddata_textview;

        public ProgressBar uhf_data_item_rssi_strength;
    }

    public interface MyOnItemClickListner {
        void onClick(TagInfo tagInfo);
    }
}

