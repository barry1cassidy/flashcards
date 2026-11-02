package com.zipdeck.app;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;

import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Before the first frame, so Android 12 keeps the launch splash instead of
        // revealing the WebView while it is still blank.
        SplashScreen.installSplashScreen(this);
        registerPlugin(PlayBillingPlugin.class);
        registerPlugin(ListenPlaybackPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onPause() {
        super.onPause();
        keepListenWebViewRunning();
    }

    @Override
    public void onStop() {
        super.onStop();
        keepListenWebViewRunning();
    }

    private void keepListenWebViewRunning() {
        if (!ListenPlaybackService.isRunning() || getBridge() == null || getBridge().getWebView() == null) {
            return;
        }
        WebView webView = getBridge().getWebView();
        webView.onResume();
        webView.resumeTimers();
    }

    @Override
    public void onStart() {
        super.onStart();
        WebView webView = getBridge().getWebView();
        if (webView != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            webView.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_YES);
        }
    }
}
