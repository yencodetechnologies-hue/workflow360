package com.nlscan.uhf.demo.manager;


import android.util.Log;
import android.widget.Toast;

import com.nlscan.android.uhf.UHFCommonParams;
import com.nlscan.android.uhf.UHFManager;
import com.nlscan.android.uhf.UHFReader;
import com.nlscan.uhf.demo.UhfSetParams;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class MyUhfManager {
    private final static MyUhfManager manager = new MyUhfManager();
    private static UHFManager uhfManager = UHFManager.getInstance();
    private static UhfSetParams uhfSetParams = new UhfSetParams();

    public enum CheckUhfResultEnum {
        OK,
        POWER_ON_ERR,
        NO_UHF_DEVICE,
        SET_PARAMS_ERR
    }

    public enum InitUhfResultEnum {
        OK,
        POWER_ON_ERR,
        NO_UHF_DEVICE,
        SET_POWER_ERR,
        SET_TID_ERR, SET_TIME_ERR,
        STOP_QUICK_ERR,
        START_QUICK_ERR
    }

    private MyUhfManager() {
    }

    public static MyUhfManager getInstance() {
        return manager;
    }

    //启用枪把键
    public void setScanKey() {
        uhfManager.setTrigger(UHFCommonParams.TRIGGER_MODE.TRIGGER_MODE_BACK, true);
    }

    //禁用枪把键
    public void cancleScanKey() {
        uhfManager.setTrigger(UHFCommonParams.TRIGGER_MODE.TRIGGER_MODE_BACK, false);
    }

    public boolean isScanKeyOn() {
        return uhfManager.isTriggerOn(UHFCommonParams.TRIGGER_MODE.TRIGGER_MODE_BACK);
    }

    public void checkAndSetUHF(final int readPower, final int writePower, final int regional, final CheckUhfResultListner mListner) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                if (uhfManager.loadUHFModule() == null) {
                    mListner.result(CheckUhfResultEnum.NO_UHF_DEVICE);
                } else {
                    if (uhfManager.powerOn() == UHFReader.READER_STATE.OK_ERR) {
                        if (!setPower(readPower, writePower, regional))
                            mListner.result(CheckUhfResultEnum.SET_PARAMS_ERR);
                        else
                            mListner.result(CheckUhfResultEnum.OK);
                    } else {
                        mListner.result(CheckUhfResultEnum.POWER_ON_ERR);
                    }
                }
            }
        }).start();
    }

    //设置读取功率
    public void setReadPower(int readPower, final SetParamsListner setParamsListner) {
        uhfSetParams.setReadPower(readPower);
        new Thread(new Runnable() {
            @Override
            public void run() {
                setParamsListner.result(setReadWritePower());
            }
        }).start();
    }

    //设置写入功率
    public void setWritePower(int writePower, final SetParamsListner setParamsListner) {
        uhfSetParams.setWrtitePower(writePower);
        new Thread(new Runnable() {
            @Override
            public void run() {
                setParamsListner.result(setReadWritePower());
            }
        }).start();
    }

    //设置区域
    public void setRegional(int regional, final SetParamsListner setParamsListner) {
        uhfSetParams.setRegional(regional);
        new Thread(new Runnable() {
            @Override
            public void run() {
                setParamsListner.result(setRegional());
            }
        }).start();
    }

    public void initUhf(final int readPower, final int writePower, final int reginal, final InitUhftListner mListner) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                if (uhfManager.loadUHFModule() == null) {
                    mListner.result(InitUhfResultEnum.NO_UHF_DEVICE);
                } else {
                    if (uhfManager.powerOn() == UHFReader.READER_STATE.OK_ERR)
                    {
                        UHFReader.READER_STATE er3 = uhfManager.setParam("READER_IS_CHK_ANT", "PARAM_READER_IS_CHK_ANT", "1");

                        if (!setPower(readPower, writePower, reginal))
                            mListner.result(InitUhfResultEnum.SET_POWER_ERR);
                        else {
                            if (!setInventoryTime(100, 0))
                                mListner.result(InitUhfResultEnum.SET_TIME_ERR);
                            else {
                                if (!setGetTIData())
                                    mListner.result(InitUhfResultEnum.SET_TID_ERR);
                                else {
                                    if (!startQuick())
                                        mListner.result(InitUhfResultEnum.START_QUICK_ERR);
                                    else
                                        mListner.result(InitUhfResultEnum.OK);
                                }
                            }
                        }

                        //设置Q值
                        UHFReader.READER_STATE er = uhfManager.setParam("POTL_GEN2_Q","PARAM_POTL_GEN2_Q","-1");
                        if(er == UHFReader.READER_STATE.OK_ERR )
                            Log.d("TAG","set POTL_GEN2_Q = -1 : success. ");

                    } else {
                        mListner.result(InitUhfResultEnum.POWER_ON_ERR);
                    }
                }
            }
        }).start();
    }

    //开启快速模式
    private boolean startQuick() {

        UHFReader.READER_STATE er1 = uhfManager.setParam("TAGDATA_RECORDHIGHESTRSSI", "PARAM_TAGDATA_RECORDHIGHESTRSSI", "1");
        UHFReader.READER_STATE er2 = uhfManager.setParam("TAGDATA_UNIQUEBYEMDDATA", "PARAM_TAGDATA_UNIQUEBYEMDDATA", "0");
        UHFReader.READER_STATE er4 = uhfManager.setParam("POTL_GEN2_TARGET", "PARAM_POTL_GEN2_TARGET", "0");

        UHFReader.READER_STATE er = uhfManager.setParam("INV_QUICK_MODE", "PARAM_INV_QUICK_MODE", "1");
        if (er == UHFReader.READER_STATE.OK_ERR) {
            Log.d("TAG","set INV_QUICK_MODE = 1 : success. ");
            er = uhfManager.setParam("POTL_GEN2_SESSION", "PARAM_POTL_GEN2_SESSION", "1");
            if (er == UHFReader.READER_STATE.OK_ERR) {
                Log.d("TAG","set POTL_GEN2_SESSION = 1 : success. ");
                return true;
            }
        }


        return false;
    }

    //关闭快速模式
    private boolean stopQuick() {
        UHFReader.READER_STATE er = uhfManager.setParam("INV_QUICK_MODE", "PARAM_INV_QUICK_MODE", "0");
        if (er == UHFReader.READER_STATE.OK_ERR)
            return true;
        else
            return false;
    }

    //添加附加数据
    private boolean setGetTIData() {
        try {
            if(true)
            return true;

            int bank = UHFReader.BANK_TYPE.TID.value();//TID分区i
            int startaddr = 0;//起始地址（块）
            int bytecnt = 14;
            String sHexAccesspwd = null;//16进制字符串
            JSONObject jsItem = new JSONObject();

            jsItem.put("bank", bank);
            jsItem.put("startaddr", startaddr);
            jsItem.put("bytecnt", bytecnt);
            jsItem.put("accesspwd", sHexAccesspwd);

            String sValue = jsItem.toString();
            //设置附加数据
            UHFReader.READER_STATE er = uhfManager.setParam("TAG_EMBEDEDDATA",
                    "PARAM_TAG_EMBEDEDDATA",
                    sValue);
            if (er == UHFReader.READER_STATE.OK_ERR)
                return true;
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return false;
    }

    private boolean setInventoryTime(int inventoryTime, int pauseTime) {
        return setCheckIntervalTime(pauseTime) && setCheckTime(inventoryTime);
    }

    //设置盘点间隔时间
    private boolean setCheckIntervalTime(int uhfReadCheckIntervalTime) {
        UHFReader.READER_STATE er = uhfManager.setParam("INV_INTERVAL",
                "PARAM_INV_INTERVAL_TIME",
                String.valueOf(uhfReadCheckIntervalTime));
        if (er != UHFReader.READER_STATE.OK_ERR) {
            return false;
        }
        return true;
    }

    //设置盘点时间
    private boolean setCheckTime(int checkTime) {
        UHFReader.READER_STATE er = uhfManager.setParam("INV_TIME_OUT",
                "PARAM_INV_TIME_OUT",
                String.valueOf(checkTime)
        );
        if (er != UHFReader.READER_STATE.OK_ERR) {
            return false;
        }
        return true;
    }


    public void startInventory() {
        uhfManager.startTagInventory();
    }

    public void stopInventory() {
        uhfManager.stopTagInventory();
    }

    //直接写数据到EPC
    public void writeDataToEPC(final String value, final String password, final WriteDataListner writeDataListner) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                UHFReader.READER_STATE er;
                int tryCount = 3;
                do {
                    er = writeEPCtoCar(value, password);
                    tryCount--;
                    if (tryCount < 0)
                        break;
                } while (er != UHFReader.READER_STATE.OK_ERR);

                if (er == UHFReader.READER_STATE.OK_ERR) {
                    writeDataListner.result(true, er);
                } else {
                    writeDataListner.result(false, er);
                }
            }
        }).start();
    }

    //写数据到用户区
    public void writeDataToUser(final String value, final String password, final WriteDataListner writeDataListner) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                UHFReader.READER_STATE er;
                int tryCount = 3;
                do {
                    er = writeDatatoCar(UHFReader.BANK_TYPE.USER.value(), value, password);
                    tryCount--;
                    if (tryCount < 0)
                        break;
                } while (er != UHFReader.READER_STATE.OK_ERR);

                if (er == UHFReader.READER_STATE.OK_ERR) {
                    writeDataListner.result(true, er);
                } else {
                    writeDataListner.result(false, er);
                }
            }
        }).start();
    }

    //写数据到保留区
    public void writeDataToHold(final String value, final String password, final WriteDataListner writeDataListner) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                UHFReader.READER_STATE er;
                int tryCount = 3;
                do {
                    er = writeDatatoCar(UHFReader.BANK_TYPE.RESERVED.value(), value, password);
                    tryCount--;
                    if (tryCount < 0)
                        break;
                } while (er != UHFReader.READER_STATE.OK_ERR);

                if (er == UHFReader.READER_STATE.OK_ERR) {
                    writeDataListner.result(true, er);
                } else {
                    writeDataListner.result(false, er);
                }
            }
        }).start();
    }

    //添加过滤条件
    public void setFilterTID(final String filterText, final SetParamsListner setParamsListner) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    JSONObject jsItem = new JSONObject();
                    int bank = UHFReader.BANK_TYPE.TID.value();
                    String sHexFdata = filterText;
                    int ln = sHexFdata.length();
                    if (ln == 1 || ln % 2 == 1)
                        ln++;
//                    int flen = (ln / 2) * 8;
                    int startaddr = 0;
                    int isInvert = 0;//0匹配：只获得匹配字符串的标签，1不匹配：获得不匹配字符串的标签
                    jsItem.put("bank", bank);
                    jsItem.put("fdata", sHexFdata);
//                    jsItem.put("flen", flen);
                    jsItem.put("startaddr", startaddr);
                    jsItem.put("isInvert", isInvert);
                    String sValue = jsItem.toString();
                    //设置过滤条件
                    UHFReader.READER_STATE er = uhfManager.setParam("TAG_FILTER",
                            "PARAM_TAG_FILTER",
                            sValue);
                    if (er == UHFReader.READER_STATE.OK_ERR) {
                        setParamsListner.result(true);
                    } else {
                        setParamsListner.result(false);
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
        }).start();
    }

    //移除过滤条件
    public void removeFilter(final SetParamsListner setParamsListner) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                UHFReader.READER_STATE er = uhfManager.setParam("TAG_FILTER",
                        "PARAM_TAG_FILTER",
                        null);
                if (er == UHFReader.READER_STATE.OK_ERR) {
                    setParamsListner.result(true);
                } else {
                    setParamsListner.result(false);
                }
            }
        }).start();
    }

    private UHFReader.READER_STATE writeDatatoCar(int bank, String value, String password) {
        int startAddr = 0;//从分区的第0块地址开始
        byte[] data = UHFReader.Str2Hex(value);//写入的数据（16进制转byte[]）
        String sHexPasswd = password;//访问密码（16进制串），如果没有访问密码设置null
        if (password.equals("")) {
            sHexPasswd = null;
        }
        return uhfManager.writeTagData(bank, startAddr, data,
                sHexPasswd);
    }

    //更改标签的EPC
    private UHFReader.READER_STATE writeEPCtoCar(String value, String password) {
        byte[] data = UHFReader.Str2Hex(value);//数据（16进制转byte[]）
        String sHexPasswd = password;//访问密码（16进制串），如果没有访问密码设置null
        if (password.equals("")) {
            sHexPasswd = null;
        }
        return uhfManager.writeTagEpcEx(data, sHexPasswd);
    }

    public boolean setPower(int readPower, int writePower, int regional) {
        uhfSetParams.setDefault();
        uhfSetParams.setReadPower(readPower);
        uhfSetParams.setWrtitePower(writePower);
        uhfSetParams.setRegional(regional);

        if (!setReadWritePower())
            return false;

        if (!setRegional())
            return false;

        setVoiceAndShock();

        return true;
    }

    private void setVoiceAndShock() {
        uhfManager.setPromptSoundEnable(true);
//        uhfManager.setPromptSoundEnable(false);
        //uhfManager.setPromptVibrateEnable(true);
//        uhfManager.setPromptVibrateEnable(false);
    }

    private boolean setRegional() {
        UHFReader.READER_STATE er = uhfManager.setParam("FREQUENCY_REGION",
                "PARAM_FREQUENCY_REGION",
                String.valueOf(uhfSetParams.getRegional()));

        if (er != UHFReader.READER_STATE.OK_ERR) {
            return false;
        }
        return true;
    }


    private byte[] getDataByArea(int area, String password, int blk) {
        //----读标签
        int bank = area;
        int startAddr = 0;//从分区的第0块地址开始
        int blkcnt = blk;
        return uhfManager.GetTagData(bank, startAddr, blkcnt, password);
    }

    public boolean isPowerOn() {
        return uhfManager.isPowerOn();
    }


    public void powerOn(final SetParamsListner listner) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                if (uhfManager.powerOn() == UHFReader.READER_STATE.OK_ERR)
                    listner.result(true);
                else
                    listner.result(false);
            }
        }).start();
    }

    public void getDataFormUser(final String password, final int blk, final ReadTagListner listner) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                //----读标签
                int bank = UHFReader.BANK_TYPE.USER.value();
                int startAddr = 0;//从分区的第0块地址开始
                int blkcnt = blk;
//                if (text == null || text.length() == 0) {
//                    blkcnt = 4;
//                } else {
//                    blkcnt = text.length() / 4;//读取2块数据，即4个字节的数据
//                }
                byte[] rdata = uhfManager.GetTagData(bank, startAddr, blkcnt, password);
                listner.result(rdata);
            }
        }).start();

    }

    public void getDataFormEPC(final String password, final int blk, final ReadTagListner listner) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                //----读标签
                int bank = UHFReader.BANK_TYPE.EPC.value();//EPC 分区
                int startAddr = 0;//从分区的第2块地址开始
                int blkcnt = blk;
//                if (text == null || text.length() == 0) {
//                    blkcnt = 4;
//                } else {
//                    blkcnt = text.length() / 4;//读取2块数据，即4个字节的数据
//                }
                //        String hexAccesspasswd = "00000001";//访问密码（16进制串），如果没有访问密码设置null
                byte[] rdata = uhfManager.GetTagData(bank, startAddr, blkcnt, password);
                listner.result(rdata);
            }
        }).start();

    }

    //设置读写功率
    private boolean setReadWritePower() {
        JSONArray jsAntArray = new JSONArray();
        try {
            JSONObject jobj = new JSONObject();
            jobj.put("antid", uhfSetParams.getAnInt());
            jobj.put("readPower", uhfSetParams.getReadPower());
            jobj.put("writePower", uhfSetParams.getWrtitePower());
            jsAntArray.put(jobj);
        } catch (Exception e) {

        }

        String sAntPowerValue = jsAntArray.toString();
        String paramKey = "RF_ANTPOWER";
        String paramName = "PARAM_RF_ANTPOWER";
        UHFReader.READER_STATE er = uhfManager.setParam(paramKey,
                paramName, sAntPowerValue);

        if (er != UHFReader.READER_STATE.OK_ERR) {
            return false;
        }
        return true;
    }


    public interface CheckUhfResultListner {
        void result(CheckUhfResultEnum r);
    }

    public interface InitUhftListner {
        void result(InitUhfResultEnum r);
    }

    public interface SetParamsListner {
        void result(boolean result);
    }

    public interface WriteDataListner {
        void result(boolean result, UHFReader.READER_STATE type);
    }

    public interface ReadTagListner {
        void result(byte[] data);
    }

    public interface GetTagSizeListner {
        void result(int[] result, byte[] epc, byte[] user, byte[] hold);
    }
}
