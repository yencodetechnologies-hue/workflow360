package com.nlscan.uhf.demo.util.view;

import android.text.Editable;
import android.text.TextWatcher;
import android.widget.EditText;

public class AddBlankET {
    public static void addTextChangedListener(final EditText editText, final int addBlankNum) {
        editText.addTextChangedListener(new TextWatcher() {
            String setText = "";
            boolean isSetText;//是否是修改字符串,用于判断是否获取起始字符串长度
            int lastCursorIndex;
            int startLength;//记录开始前的长度，用于判断添加还是删除
            int endLength;
            boolean isDoInCenter;//判断是否是在中间操作

            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                if (!isSetText)
                    startLength = s.toString().replace(" ", "").length();
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {

            }

            @Override
            public void afterTextChanged(Editable s) {
                String noBlank = s.toString().replace(" ", "");
                String temp = stringAddBlank(noBlank, addBlankNum);

                //解决无限循环setText()
                if (!setText.equals(s.toString())) {
                    //修改时的参数
                    setText = temp;
                    isSetText = true;
                    endLength = noBlank.length();
                    lastCursorIndex = editText.getSelectionEnd();
                    if (lastCursorIndex != s.length()) {
                        //中间修改,只有空格前的添加数据修改才需要做处理
                        isDoInCenter = true;
//                        afterTV.setText(lastCursorIndex + "");
                    }
                    editText.setText(temp);
                    return;
                }

                //修正光标
                if (startLength <= endLength) {
                    //添加字符
                    if (!isDoInCenter) {
                        //末尾添加数据
                        int sLength = noBlank.length();
                        if (sLength > 1 && sLength % addBlankNum == 1) {
                            editText.setSelection(lastCursorIndex + 1);
                        } else {
                            editText.setSelection(lastCursorIndex);
                        }
                    } else {
                        //中间添加数据并且在空格前
                        if (lastCursorIndex > 1 && lastCursorIndex % (addBlankNum + 1) == 0) {
                            editText.setSelection(lastCursorIndex + 1);
                        } else {
                            editText.setSelection(lastCursorIndex);
                        }
                    }
//                    }
                } else {
                    //删除字符
                    if (!isDoInCenter) {
                        //末尾修改
                        editText.setSelection(s.length());
                    } else {
                        //中间删除
                        if (lastCursorIndex > 1 && lastCursorIndex % (addBlankNum + 1) == 0) {
                            editText.setSelection(lastCursorIndex - 1);
                        } else {
                            editText.setSelection(lastCursorIndex);
                        }
                    }
                }
                isSetText = false;
                isDoInCenter = false;
            }
        });
    }

    //把字符串两两分隔
    private static String stringAddBlank(String temp, int num) {
        if (temp == null)
            return "";
        StringBuilder stringBuilder = new StringBuilder();
        for (int i = 0; i < temp.length(); ) {
            if (i + num > temp.length()) {
                stringBuilder.append(temp.substring(i, temp.length()));
            } else {
                stringBuilder.append(temp.substring(i, i + num));
                stringBuilder.append(" ");
            }

            i += num;
        }
        return stringBuilder.toString().trim();
    }

}
