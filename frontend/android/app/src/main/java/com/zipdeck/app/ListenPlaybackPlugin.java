package com.zipdeck.app;

import android.Manifest;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "ListenPlayback",
    permissions = {
        @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications")
    }
)
public class ListenPlaybackPlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "startAfterPermission");
            return;
        }
        begin(call);
    }

    @PermissionCallback
    private void startAfterPermission(PluginCall call) {
        begin(call);
    }

    @PluginMethod
    public void update(PluginCall call) {
        ListenPlaybackService.update(
            call.getString("title", "Zipdeck"),
            call.getString("artist", ""),
            Boolean.TRUE.equals(call.getBoolean("paused", false))
        );
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        ListenPlaybackService.stop(getContext());
        call.resolve();
    }

    void notifyAction(String action) {
        JSObject data = new JSObject();
        data.put("action", action);
        notifyListeners("action", data);
    }

    private void begin(PluginCall call) {
        ListenPlaybackService.start(
            getContext(),
            this,
            call.getString("title", "Zipdeck"),
            call.getString("artist", "")
        );
        call.resolve();
    }
}
