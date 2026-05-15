package com.nlscan.uhf.demo;

public class UhfSetParams {
    private int anInt;
    private int readPower;
    private int wrtitePower;

    public int getAnInt() {
        return anInt;
    }

    public void setAnInt(int anInt) {
        this.anInt = anInt;
    }

    public int getReadPower() {
        return readPower;
    }

    public void setReadPower(int readPower) {
        this.readPower = readPower;
    }

    public int getWrtitePower() {
        return wrtitePower;
    }

    public void setWrtitePower(int wrtitePower) {
        this.wrtitePower = wrtitePower;
    }

    public int getCheckTime() {
        return checkTime;
    }

    public void setCheckTime(int checkTime) {
        this.checkTime = checkTime;
    }

    public int getCheckIntervalTime() {
        return checkIntervalTime;
    }

    public void setCheckIntervalTime(int checkIntervalTime) {
        this.checkIntervalTime = checkIntervalTime;
    }

    public int getRegional() {
        return regional;
    }

    public void setRegional(int regional) {
        this.regional = regional;
    }

    public int[] getFrequency() {
        return frequency;
    }

    public void setFrequency(int[] frequency) {
        this.frequency = frequency;
    }

    private int checkTime;
    private int checkIntervalTime;
    private int regional;
    private int[] frequency;

    public void setDefault() {
        this.anInt = 1;
        this.readPower = 2700;
        this.wrtitePower = 2000;
        this.checkTime = 50;
        this.checkIntervalTime = 0;
        this.regional = 1;
        this.frequency = new int[]{
                915750, 915250, 903250, 926750, 926250, 904250, 927250,
                920250, 919250, 909250, 918750, 917750, 905250, 904750,
                925250, 921750, 914750, 906750, 913750, 922250, 911250,
                911750, 903750, 908750, 905750, 912250, 906250, 917250,
                914250, 907250, 918250, 916250, 910250, 910750, 907750,
                924750, 909750, 919750, 916750, 913250, 923750, 908250,
                925750, 912750, 924250, 921250, 920750, 922750, 902750,
                923250
        };
    }
}
