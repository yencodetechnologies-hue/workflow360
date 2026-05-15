package com.nlscan.uhf.demo.util.constant;

import android.text.TextUtils;
import android.util.Log;

import com.nlscan.android.uhf.UHFReader;

/**
 * Settings parameters constants
 */
public class UHFParams {

	public static final int UHF_STATE_POWER_ON = 1;
	public static final int UHF_STATE_POWER_OFF = 2;
	public static final int UHF_STATE_POWER_ONING = 3;
	public static final int UHF_STATE_START_INVENTORY = 4;
	public static final int UHF_STATE_STOP_INVENTORY = 5;

	public static final int UHF_STATE_BLE_DISCONNECT = 6;

	public static final int UHF_STATE_START_INVENTORY_BLE = 0x07;
	//盘点状态: 停止盘点
	public static final int UHF_STATE_STOP_INVENTORY_BLE = 0x08;
	/**
	 * Gen2 Protocal
	 */
	public final static class POTL_GEN2_SESSION{
		public final static String KEY = "POTL_GEN2_SESSION";
		/**Gen2*/
		public final static String PARAM_POTL_GEN2_SESSION = "PARAM_POTL_GEN2_SESSION";
	}
	
	/**
	 * Gen2 Q
	 */
	public final static class POTL_GEN2_Q{
		public final static String KEY = "POTL_GEN2_Q";
		/**Gen2 Q*/
		public final static String PARAM_POTL_GEN2_Q = "PARAM_POTL_GEN2_Q";
	}
	
	/**
	 * Gen2 base encode type
	 */
	public final static class POTL_GEN2_TAGENCODING{
		public final static String KEY = "POTL_GEN2_TAGENCODING";
		/**Gen2 base encode type*/
		public final static String PARAM_POTL_GEN2_TAGENCODING = "PARAM_POTL_GEN2_TAGENCODING";
	}

	/**
	 * Max len of EPC，by bit
	 */
	public final static class POTL_GEN2_MAXEPCLEN{
		public final static String KEY = "POTL_GEN2_MAXEPCLEN";
		public final static String PARAM_POTL_GEN2_MAXEPCLEN = "PARAM_POTL_GEN2_MAXEPCLEN";
	}
	
	/**
	 * Reader's powers(Read power/Write power)
	 */
	public final static class RF_ANTPOWER{
		public final static String KEY = "RF_ANTPOWER";
		/**读写器发射功率,数据格式:天线ID, 读功率,写功率|天线ID, 读功率,写功率*/
		public final static String PARAM_RF_ANTPOWER = "PARAM_RF_ANTPOWER";
	}
	
	/**
	 * Reader's max powers
	 */
	public final static class RF_MAXPOWER{
		public final static String KEY = "RF_MAXPOWER";
		/**读写器最大输出功率 */
		public final static String PARAM_RF_MAXPOWER = "PARAM_RF_MAXPOWER";
	}
	
	/**
	 * Reader's min powers
	 */
	public final static class RF_MINPOWER{

		public final static String KEY = "RF_MINPOWER";

		public final static String PARAM_RF_MINPOWER = "PARAM_RF_MINPOWER";
	}
	
	/**
	 * Tag filter
	 */
	public final static class TAG_FILTER{
		public final static String KEY = "TAG_FILTER";
		public final static String PARAM_TAG_FILTER = "PARAM_TAG_FILTER";
	    /**移除过滤器*/
	    public final static String PARAM_CLEAR = "PARAM_CLEAR";
	}
	
	/**
	 * Additional patition's data
	 */
	public final static class TAG_EMBEDEDDATA{
		public final static String KEY = "TAG_EMBEDEDDATA";
		 public final static String PARAM_TAG_EMBEDEDDATA = "PARAM_TAG_EMBEDEDDATA";
	    
	    /** Clear this setting*/
	    public final static String PARAM_CLEAR = "PARAM_CLEAR";
	}
	
	public final static class TAG_INVPOTL{
		public final static String KEY = "TAG_INVPOTL";

	    public final static String PARAM_TAG_INVPOTL = "PARAM_TAG_INVPOTL";
	}
	
	/**
	 * Number of ants can be found
	 */
	public final static class READER_CONN_ANTS{
		public final static String KEY = "READER_CONN_ANTS";
		public final static String PARAM_CONNECT_ANTS = "PARAM_CONNECT_ANTS";
	}
	
	/**
	 * Ant's ports
	 */
	public final static class READER_AVAILABLE_ANTPORTS{
		public final static String KEY = "READER_AVAILABLE_ANTPORTS";
		/**读写器的天线端口数(*/
		public final static String PARAM_READER_AVAILABLE_ANTPORTS = "PARAM_READER_AVAILABLE_ANTPORTS";
	}
	
	/**
	 * Check ant is ready
	 */
	public final static class READER_IS_CHK_ANT{
		public final static String KEY = "READER_IS_CHK_ANT";
		/**发射功率前要检测天线是否连接*/
		public final static String PARAM_READER_IS_CHK_ANT = "PARAM_READER_IS_CHK_ANT";
	}
	
	/**
	 * IP address of wireless reader
	 */
	public final static class READER_IP{
	    
		public final static String KEY = "READER_IP";
		
		public final static String PARAM_READER_IP = "PARAM_READER_IP";
	}
	
	/**
	 * Region of the reader can be working
	 */
	public final static class FREQUENCY_REGION{
		public final static String KEY = "FREQUENCY_REGION";
		public final static String PARAM_FREQUENCY_REGION = "PARAM_FREQUENCY_REGION";
	}
	
	/**
	 * Frequence table of current region
	 */
	public final static class FREQUENCY_HOPTABLE{
		public final static String KEY = "FREQUENCY_HOPTABLE";
	    public final static String PARAM_HTB = "PARAM_HTB";
	    
	}
	
	/**
	 * Gen2 link speed
	 */
	public final static class POTL_GEN2_BLF{
		public final static String KEY = "POTL_GEN2_BLF";
	    public final static String PARAM_POTL_GEN2_BLF = "PARAM_POTL_GEN2_BLF";
	}
	
	/**
	 * Gen2 writing mode
	 */
	public final static class POTL_GEN2_WRITEMODE{
		public final static String KEY = "POTL_GEN2_WRITEMODE";
	    public final static String PARAM_POTL_GEN2_WRITEMODE = "PARAM_POTL_GEN2_WRITEMODE";
	}
	
	/**
	 * Gen2 target protocal
	 */
	public final static class POTL_GEN2_TARGET{
		public final static String KEY = "POTL_GEN2_TARGET";
	    public final static String PARAM_POTL_GEN2_TARGET = "PARAM_POTL_GEN2_TARGET";
	}
	
	/**
	 * For the same tag, if it is read by different antennas, will it be used as multiple tag data<p>
	 * 0 Indicates that regardless of how many antennas read the same tag, it is treated as one tag data；<p>
	 * 1 Indicates that the same tag will be read by different antennas as multiple tag data<p>
	 */
	public final static class TAGDATA_UNIQUEBYANT{
		public final static String KEY = "TAGDATA_UNIQUEBYANT";
	    public final static String PARAM_TAGDATA_UNIQUEBYANT = "PARAM_TAGDATA_UNIQUEBYANT";
	}
	
	/**
	 * If the same tag reads different bank data when using the embedded inventory read function, is it considered as multiple tag data
	 */
	public final static class TAGDATA_UNIQUEBYEMDDATA{
		public final static String KEY = "TAGDATA_UNIQUEBYEMDDATA";
	    public final static String PARAM_TAGDATA_UNIQUEBYEMDDATA = "PARAM_TAGDATA_UNIQUEBYEMDDATA";
	}
	
	/**
	 * Is only the maximum rssi recorded
	 */
	public final static class TAGDATA_RECORDHIGHESTRSSI{
		public final static String KEY = "TAGDATA_RECORDHIGHESTRSSI";
	    public final static String PARAM_TAGDATA_RECORDHIGHESTRSSI = "PARAM_TAGDATA_RECORDHIGHESTRSSI";
	}
	
	/**
	 * Frequency hopping time
	 */
	public final static class RF_HOPTIME{
		public final static String KEY = "RF_HOPTIME";
	    public final static String PARAM_RF_HOPTIME = "PARAM_RF_HOPTIME";
	}
	
	/**
	 * Enable lbt
	 */
	public final static class RF_LBT_ENABLE{
		public final static String KEY = "RF_LBT_ENABLE";
	    public final static String PARAM_RF_LBT_ENABLE = "PARAM_RF_LBT_ENABLE";
	}
	
	/**
	 * 180006b Protocol Backward Link Rate
	 */
	public final static class POTL_ISO180006B_BLF{
		public final static String KEY = "POTL_ISO180006B_BLF";
	    public final static String PARAM_POTL_ISO180006B_BLF = "PARAM_POTL_ISO180006B_BLF";
	}
	
	/**
	 * Gen2 Tari
	 */
	public final static class POTL_GEN2_TARI{
		public final static String KEY = "POTL_GEN2_TARI";
		/**Gen2协议Tari*/
	    public final static String PARAM_POTL_GEN2_TARI = "PARAM_POTL_GEN2_TARI";
	}
	
	/** Ants */
    public final static class ANTS {
    	public final static String KEY = "ANTS";
		/** Ant group*/
	    public final static String PARAM_ANTS_GROUP= "PARAM_ANTS_GROUP";
	    /** Operated antenna*/
	    public final static String PARAM_OPERATE_ANTS = "PARAM_OPERATE_ANTS";
	    /** Maximum number of supported antennas(read only)*/
	    public final static String PARAM_MAX_ANTS_COUNT = "PARAM_MAX_ANTS_COUNT";
    }
    
    /** Power save mode*/
    public final static class POWERSAVE_MODE {
    	public final static String KEY = "POWERSAVE_MODE";
    	/**The power saving level is 0-3, with a larger number indicating greater power savings, and 0 indicating no power savings at all*/
    	public final static String PARAM_POWERSAVE_MODE = "PARAM_POWERSAVE_MODE";
    }
    
    /** Counting timeout (ms)*/
    public final static class INV_TIME_OUT {
    	public final static String KEY = "INV_TIME_OUT";
	    public final static String PARAM_INV_TIME_OUT = "PARAM_INV_TIME_OUT";
	    /**Default timeout value (ms)*/
	    public final static long DEFAULT_INV_TIMEOUT = 50L;
    }
	
    /** Reading interval */
    public final static class INV_INTERVAL{
    	public final static String KEY = "INV_INTERVAL";
    	/** Reading interval */
	    public final static String PARAM_INV_INTERVAL_TIME = "PARAM_INV_INTERVAL_TIME";
	    /** Default interval(ms)*/
	    public final static long DEFAULT_INV_INTERVAL_TIME = 0L;
    }
    
    /** Quick mode */
    public final static class INV_QUICK_MODE{
    	
    	public final static String KEY = "INV_QUICK_MODE";
	    public final static String PARAM_INV_QUICK_MODE = "PARAM_INV_QUICK_MODE";
    }

	/** Extended quick modes(URM_E7[MODOULE_SIM7100] support)*/
	public final static class INV_QUICK_MODE_EX{

		public final static String KEY = "INV_QUICK_MODE_EX";

		public final static String PARAM_INV_QUICK_MODE = "PARAM_INV_QUICK_MODE";
	}

	/**Smart mode (URM_E7[MODOULE_SIM7100] support)*/
	public final static class INV_SMART_MODE{

		public final static String KEY = "INV_SMART_MODE";

		/**Smart mode */
		//0：IT_MODE_CT,
		//1：IT_MODE_S2,
		//2：IT_MODE_E7,
		//3：IT_MODE_E7v2;
		public final static String PARAM_INV_SMART_MODE = "PARAM_INV_SMART_MODE";
	}

	/**Smart mode details (URM_E7[MODOULE_SIM7100] support)*/
	public final static class INV_SMART_MODE_PARAMS{

		public final static String KEY = "INV_SMART_MODE_PARAMS";

		/**Smart mode params */
		public final static String PARAM_INV_SMART_MODE_PARAMS = "PARAM_INV_SMART_MODE_PARAMS";
	}

	/** Inventory mode，0-normal，1-effective*/
	public final static class TAG_SEARCH_MODE{
		public final static String KEY = "TAG_SEARCH_MODE";

		/**Smart mode params */
		public final static String PARAM_TAG_SEARCH_MODE = "PARAM_TAG_SEARCH_MODE";
	}

	/** Reader informations（eg：Model，硬件版本，软件版本等）*/
	public final static class MODULE_INFO{
		public final static String KEY = "MODULE_INFO";

		/**Module info params */
		public final static String PARAM_MODULE_INFO = "PARAM_MODULE_INFO";
	}

    /** Reader temperature*/
    public final static class TEMPTURE{
    	
    	public final static String KEY = "TEMPTURE";
	    public final static String PARAM_TEMPTURE = "PARAM_TEMPTURE";
    }
    
    /**
     * 低电量时,读功率设置参数
     */
    public final static class LOWER_POWER{
    	
    	public final static String KEY = "LOWER_POWER";
    	/**是否开启低电量时,功率自动调节*/
    	public final static String PARAM_LOWER_POWER_DM_ENABLE = "PARAM_LOWER_POWER_DM_ENABLE";
    	/**低电量标准参数*/
    	public final static String PARAM_LOWER_POWER_LEVEL = "PARAM_LOWER_POWER_LEVEL";
    	/**读功率设置参数*/
	    public final static String PARAM_LOWER_POWER_READ_DBM = "PARAM_LOWER_POWER_DBM";
    }

	/**
	 * 电量警告（到指定的电量时警告提示）
	 */
	public final static class BATTERY_WARNING{
		public final static String KEY = "BATTERY_WARNING";
		//启用电量监视
		public final static String PARAM_BATTERY_WARNING_ENABLE = "PARAM_BATTERY_WARNING_ENABLE";
		//警告1的电量
		public final static String PARAM_BATTERY_WARNING_1 = "PARAM_BATTERY_WARNING_1";
		//警告2的电量
		public final static String PARAM_BATTERY_WARNING_2 = "PARAM_BATTERY_WARNING_2";
	}

	/**
	 * SIM7000 inventory policy
	 * Normal mode：30dBm + Multi tags quick mode
	 * Balance mode：31dBm + Multi tags intelligent (temperature control) mode
	 * Quick mode：33dBm + Multi tags intelligent (temperature control) mode
	 */
	public final static class INV_POLICY{

		public final static String KEY = "INV_POLICY";

		public final static String PARAM_INV_POLICY = "PARAM_INV_POLICY";

	}//End INV_POLICY

	/**
	 * SIM7000 inventory detail datas：json，eg:
	 * [
	 * 	{"inv_policy":"0","inv_policy_read_power":"3000","inv_policy_fae_mode":"2"},
	 * 	{"inv_policy":"1","inv_policy_read_power":"3100","inv_policy_fae_mode":"4"},
	 * 	{"inv_policy":"2","inv_policy_read_power":"3300","inv_policy_fae_mode":"4"}
	 * ]
	 * Normal mode：30dBm + Multi tags quick mode
	 * Balance mode：31dBm + Multi tags intelligent (temperature control) mode
	 * Quick mode：33dBm + Multi tags intelligent (temperature control) mode
	 */
	public final static class INV_POLICY_DATA{

		public final static String KEY = "INV_POLICY_DATA";

		public final static String PARAM_INV_POLICY_DATA = "PARAM_INV_POLICY_DATA";

		//Inventroy policy id
		public final static String INV_POLICY = "inv_policy";
		//Inventroy policy read power
		public final static String INV_POLICY_READ_POWER = "inv_policy_read_power";
		//Inventroy policy FAE mode
		public final static String INV_POLICY_FAE_MODE = "inv_policy_fae_mode";

	}//End INV_POLICY_DATA

	/**
	 * 固件升级
	 */
	public final static class FIRMWARE_UPDATE{

		public final static String KEY = "FIRMWARE_UPDATE";

		public final static String PARAM_FIRMWARE_UPDATE = "PARAM_FIRMWARE_UPDATE";

	}//End FIRMWARE_UPDATE

	public final static class INV_FIELD_RSSI{

		public final static String KEY = "INV_FIELD_RSSI";

		public final static String PARAM_INV_FIELD_RSSI = "PARAM_INV_FIELD_RSSI";

	}//End INV_FIELD_RSSI

	public final static class INV_FIELD_FREQUENCE{

		public final static String KEY = "INV_FIELD_FREQUENCE";

		public final static String PARAM_INV_FIELD_FREQUENCE = "PARAM_INV_FIELD_FREQUENCE";

	}//End INV_FIELD_FREQUENCE

	public final static class INV_FIELD_PROTOCAL{

		public final static String KEY = "INV_FIELD_PROTOCAL";

		public final static String PARAM_INV_FIELD_PROTOCAL = "PARAM_INV_FIELD_PROTOCAL";

	}//End INV_FIELD_PROTOCAL

	/**
	 * Fastid
	 */
	public final static class FAST_ID{

		public final static String KEY = "FAST_ID";

		public final static String PARAM_FAST_ID = "PARAM_FAST_ID";

	}//End FAST_ID

	/** Trigger mode */
	public final static class TRIGGER_MODE {

		public final static String KEY = "trigger_mode";

		/** By main scan key */
		public static final String TRIGGER_MODE_MAIN = "uhf_trigger_mode_main";
		/** By left-side scan key */
		public static final String TRIGGER_MODE_LEFT = "uhf_trigger_mode_left";
		/** By right-side scan key */
		public static final String TRIGGER_MODE_RIGHT = "uhf_trigger_mode_right";
		/** By gun-side scan key */
		public static final String TRIGGER_MODE_BACK = "uhf_trigger_mode_black";
	}

	/**
	 * Output mode and bank
	 * 1-Auto fill
	 * 2-Emulate key
	 */
	public final static class EXTEND_OUTPUT_MODE{

		public final static String KEY = "EXTEND_OUTPUT_MODE";

		public final static String PARAM_EXTEND_OUTPUT_MODE = "PARAM_EXTEND_OUTPUT_MODE";

		public final static String PARAM_EXTEND_OUTPUT_MODE_BANK = "PARAM_EXTEND_OUTPUT_MODE_BANK";

		public final static int VALUE_OUTPUT_MODE_NONE = -1;

		public final static int VALUE_OUTPUT_MODE_AUTO_FILL = 1;

		public final static int VALUE_OUTPUT_MODE_EMULATE_KEY = 2;

	}//End OUTPUT_MODE

	/**
	 * Emulate keycode on send by 'Auto fill' or 'Emulate key'
	 */
	public final static class OUTPUT_CUSTOM_EMULATE_KEY{

		public final static String KEY = "OUTPUT_CUSTOM_EMULATE_KEY";

		public final static String PARAM_OUTPUT_CUSTOM_EMULATE_KEY = "PARAM_OUTPUT_CUSTOM_EMULATE_KEY";

		public final static int VALUE_EMULATE_KEYCODE_NONE = 0;

	}//End OUTPUT_CUSTOM_EMULATE_KEY

	/**
	 * Region certification （eg: China、North america、Europe、India、Kora、Japan）
	 */
	public final static class REGION_CERTIFICATION{

		public final static String KEY = "REGION_CERTIFICATION";

		public final static String PARAM_REGION_CERTIFICATION = "PARAM_REGION_CERTIFICATION";

	}//End REGION_CERTIFICATION

	/**
	 * High temperature settings（As pull down ant power,change to normal mode,when battery temperature higher than the sepecial value）
	 */
	public final static class HIGH_TEMPERATURE{

		public final static String KEY = "HIGH_TEMPERATURE";

		//Enable function
		public final static String PARAM_HIGH_TEMPERATURE_MONITOR_ENABLE = "PARAM_HIGH_TEMPERATURE_MONITOR_ENABLE";

		//Warning temperature
		public final static String PARAM_HIGH_TEMPERATURE_VALUE = "PARAM_HIGH_TEMPERATURE_VALUE";
		//Ant power
		public final static String PARAM_HIGH_TEMPERATURE_ANT_POWER = "PARAM_HIGH_TEMPERATURE_ANT_POWER";
		//Inventory strategy
		public final static String PARAM_HIGH_TEMPERATURE_INV_STRATEGY = "PARAM_HIGH_TEMPERATURE_INV_STRATEGY";

		//Inventory strategy values of URM_R2(SLR1200) on the high-temperature function
		public final static String VALUE_SLR1200_INV_POLICY_NORMAL = "normal";
		public final static String VALUE_SLR1200_INV_POLICY_QUICK_S0 = "q_s0";
		public final static String VALUE_SLR1200_INV_POLICY_QUICK_S1 = "q_s1";

		//Default temperature: 55
		public final static int DEFAULT_TEMPERATURE_VALUE = 55;
		//Defaut ant power: 2000
		public final static int DEFAULT_ANT_POWER_VALUE = 2000;

	}//End HIGH_TEMPERATURE

	/**Clear inventory cache*/
	public final static class INV_CLEAR_CACHE{

		public final static String KEY = "INV_CLEAR_CACHE";

		public final static String PARAM_INV_CLEAR_CACHE = "PARAM_INV_CLEAR_CACHE";
	}

	/** Filte duplicate tags */
	public final static class TAG_DUPLICATE_FILTER{

		public final static String KEY = "TAG_DUPLICATE_FILTER";

		public final static String PARAM_ENABLE_TAG_DUPLICATE_FILTER = "PARAM_ENABLE_TAG_DUPLICATE_FILTER";

		//Enable value
		public final static int VALUE_TAG_DUPLICATE_ENABLE = 1 ;
		//Disable value
		public final static int VALUE_TAG_DUPLICATE_DISABLE = 0 ;
	}

	/**Clear SF tags cache*/
	public final static class INV_CLEAR_SF_CACHE{

		public final static String KEY = "INV_CLEAR_SF_CACHE";

		public final static String PARAM_INV_CLEAR_SF_CACHE = "PARAM_INV_CLEAR_SF_CACHE";
	}

	/** SDK information */
	public final static class SDK {

		public final static String KEY = "SDK";

		/** Verion code */
		public static final String VERSION_CODE = "version_code";
		/** Version name */
		public static final String VERSION_NAME = "version_name";

	}

	/** Data encoding format, directly filled in/simulated key output, converted to specified encoding string output*/
	public final static class DATA_ENCODE{

		public final static String KEY = "DATA_ENCODE";

		public final static String PARAM_DATA_ENCODE = "PARAM_DATA_ENCODE";

		//HEX
		public final static int VALUE_ENCODE_HEX = 1 ;
		//ASCII
		public final static int VALUE_ENCODE_ASCII = 2 ;
		//GBK
		public final static int VALUE_ENCODE_GBK = 3 ;
		//UTF-8
		public final static int VALUE_ENCODE_UTF8 = 4 ;
	}

	//Inventory send delay
	//Timeout or tag's count > xx, that send tags
	public static class TAG_SENDER{
		public final static String KEY = "TAG_SENDER";
		public final static String PARAM_TAG_SENDER_TIMEOUT = "PARAM_TAG_SENDER_TIMEOUT";
		public final static String PARAM_TAG_SENDER_COUNT = "PARAM_TAG_SENDER_COUNT";
	}

	//GIPO control (URF520 fit)
	//eg: {"GPIO_0":1,"GPIO_1":0,"GPIO_2":1,"GPIO_3":0,...}
	public final static class GPIO {
		public final static String KEY = "GIPO";
		public final static String PARAM_GIPO = "PARAM_GIPO_LIST";
		public final static String GPIO_0 = "GPIO_0";
		public final static String GPIO_1 = "GPIO_1";
		public final static String GPIO_2 = "GPIO_2";
		public final static String GPIO_3 = "GPIO_3";
	}

	/**
	 * Connection information
	 */
	public final static class CONNECTION{
		public final static String KEY = "CONNECTION";
		/* Get connection information，eg：
		{
			"devPathOrMacOrIp":"/dev/ttyS0",
			"pluginType":1,
			"modelName":"URM500"
		}
		*/
		public final static String PARAM_GET_CONNECTION_INFO = "PARAM_GET_CONNECTION_INFO";
		//Auto connect to RFID on boot
		public final static String PARAM_CONNECT_ON_BOOT = "PARAM_CONNECT_ON_BOOT";
	}

	public static enum Region_Conf
	{
		RG_NONE(0),
		RG_NA(1), //北美
		RG_EU(2), //欧洲
		RG_EU2(7), //欧洲2
		RG_EU3(8), //欧洲3
		RG_KR(3), //韩国
		RG_PRC(6), //中国
		RG_PRC2(10), //中国２
		RG_OPEN(255),//全屏段

		RG_IN(4),
		RG_JP(5),
		RG_CE_HIGH(12),
		RG_HK(13),
		RG_TAIWAN(14),
		RG_MALAYSIA(15),
		RG_SOUTH_AFRICA(16),
		RG_BRAZIL(17),
		RG_THAILAND(18),
		RG_SINGAPORE(19),
		RG_AUSTRALIA(20),
		RG_URUGUAY(22),
		RG_VIETNAM(23),
		RG_ISRAEL(24),
		RG_PHILIPPINES(25),
		RG_INDONESIA(26),
		RG_NEW_ZEALAND(27),
		RG_PERU(28),
		RG_RUSSIA(29),
		RG_CE_LOW_HIGH(30);

		int p_v;

		private Region_Conf(int v) {
			this.p_v = v;
		}

		public int value() {
			return this.p_v;
		}

		public static Region_Conf valueOf(int value) {
			switch (value) {
				case 0:
					return RG_NONE;
				case 1:
					return RG_NA;
				case 2:
					return RG_EU;
				case 3:
					return RG_KR;
				case 4:
					return RG_IN;
				case 5:
					return RG_JP;
				case 6:
					return RG_PRC;
				case 7:
					return RG_EU2;
				case 8:
					return RG_EU3;
				case 10:
					return RG_PRC2;
				case 12:
					return RG_CE_HIGH;
				case 13:
					return RG_HK;
				case 14:
					return RG_TAIWAN;
				case 15:
					return RG_MALAYSIA;
				case 16:
					return RG_SOUTH_AFRICA;
				case 17:
					return RG_BRAZIL;
				case 18:
					return RG_THAILAND;
				case 19:
					return RG_SINGAPORE;
				case 20:
					return RG_AUSTRALIA;
				case 22:
					return RG_URUGUAY;
				case 23:
					return RG_VIETNAM;
				case 24:
					return RG_ISRAEL;
				case 25:
					return RG_PHILIPPINES;
				case 26:
					return RG_INDONESIA;
				case 27:
					return RG_NEW_ZEALAND;
				case 28:
					return RG_PERU;
				case 29:
					return RG_RUSSIA;
				case 30:
					return RG_CE_LOW_HIGH;
				case 255:
					return RG_OPEN;
				default:
					return null;
			}
		}
	}
	public static boolean strIsMac(String mac) {

		if (TextUtils.isEmpty(mac))
			return false;

		String trueMacAddress = "([A-Fa-f0-9]{2}:){5}[A-Fa-f0-9]{2}";
		// 这是真正的MAV地址；正则表达式；
		if (mac.matches(trueMacAddress)) {
			Log.d("TAG", "[ " + mac + " ] is mac address.");
			return true;
		} else {
			Log.d("TAG", "[ " + mac + " ] is not  mac address.");
			return false;
		}
	}
}
