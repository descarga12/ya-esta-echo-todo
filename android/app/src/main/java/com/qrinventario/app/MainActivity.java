package com.qrinventario.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceInstanceState) {
        registerPlugin(com.getcapacitor.community.barcodescanner.BarcodeScanner.class);
        super.onCreate(savedInstanceInstanceState);
    }
}
