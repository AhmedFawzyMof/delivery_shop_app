package online.webmadeeasy.delivery_shop;

import com.getcapacitor.BridgeActivity;
import cordova.plugin.foreground.service.ForegroundServicePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onStart() {
        super.onStart();
        // ⬇️ Register the Foreground Service plugin manually
        registerPlugin(ForegroundServicePlugin.class);
    }
}