package com.zipdeck.app;

import com.getcapacitor.PluginHandle;

import java.lang.reflect.Field;
import java.lang.reflect.Method;

/**
 * Stops the speech engine the page is using. The WebView timer can be frozen
 * while the screen is locked, so the sleep deadline has to silence speech from
 * this process.
 */
final class ListenSpeechCut {

    private ListenSpeechCut() {}

    static void cut(ListenPlaybackPlugin owner) {
        if (owner == null || owner.getBridge() == null) {
            return;
        }
        try {
            PluginHandle handle = owner.getBridge().getPlugin("TextToSpeech");
            if (handle == null || handle.getInstance() == null) {
                return;
            }
            Object plugin = handle.getInstance();
            Field field = plugin.getClass().getDeclaredField("implementation");
            field.setAccessible(true);
            Object implementation = field.get(plugin);
            if (implementation == null) {
                return;
            }
            Method stop = implementation.getClass().getMethod("stop");
            stop.invoke(implementation);
        } catch (Exception ignored) {
            // Speech may already be stopped.
        }
    }
}
