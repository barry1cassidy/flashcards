package com.zipdeck.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;

import androidx.core.content.ContextCompat;

import com.zipdeck.app.R;

public class ListenPlaybackService extends Service {

    private static final String CHANNEL_ID = "zipdeck_listen";
    private static final int NOTIFICATION_ID = 4108;
    private static final long ACTIONS = PlaybackState.ACTION_PLAY
        | PlaybackState.ACTION_PAUSE
        | PlaybackState.ACTION_PLAY_PAUSE
        | PlaybackState.ACTION_SKIP_TO_NEXT
        | PlaybackState.ACTION_SKIP_TO_PREVIOUS;

    private static volatile ListenPlaybackService instance;
    private static ListenPlaybackPlugin plugin;

    private MediaSession mediaSession;
    private AudioManager audioManager;
    private AudioFocusRequest focusRequest;
    private AudioManager.OnAudioFocusChangeListener focusListener;
    private PowerManager.WakeLock wakeLock;
    private AudioTrack bed;
    private Thread bedWriter;
    private volatile boolean writing;
    private String title = "Zipdeck";
    private String artist = "";
    private boolean paused;
    private Bitmap art;
    private Handler sleepHandler;
    private boolean sleepFired;

    static boolean isRunning() {
        return instance != null;
    }

    static void start(Context context, ListenPlaybackPlugin owner, String nextTitle, String nextArtist, long sleepAt) {
        plugin = owner;
        Intent intent = new Intent(context, ListenPlaybackService.class);
        intent.putExtra("title", nextTitle);
        intent.putExtra("artist", nextArtist);
        intent.putExtra("sleepAt", sleepAt);
        ContextCompat.startForegroundService(context, intent);
    }

    static void armSleep(long sleepAt) {
        ListenPlaybackService service = instance;
        if (service != null) {
            service.scheduleSleep(sleepAt);
        }
    }

    static void update(String nextTitle, String nextArtist, boolean nextPaused) {
        ListenPlaybackService service = instance;
        if (service == null) {
            return;
        }
        service.apply(nextTitle, nextArtist, nextPaused);
    }

    static void stop(Context context) {
        ListenPlaybackService service = instance;
        if (service != null) {
            service.stopPlayback();
            service.stopSelf();
            return;
        }
        context.stopService(new Intent(context, ListenPlaybackService.class));
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        audioManager = (AudioManager) getSystemService(AUDIO_SERVICE);
        createChannel();
        mediaSession = new MediaSession(this, "ZipdeckListen");
        mediaSession.setCallback(new MediaSession.Callback() {
            @Override
            public void onPlay() {
                sendAction("resume");
            }

            @Override
            public void onPause() {
                sendAction("pause");
            }

            @Override
            public void onSkipToNext() {
                sendAction("next");
            }

            @Override
            public void onSkipToPrevious() {
                sendAction("previous");
            }
        });
        mediaSession.setActive(true);
        focusListener = this::onAudioFocus;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        long sleepAt = 0;
        if (intent != null) {
            title = text(intent.getStringExtra("title"), title);
            artist = text(intent.getStringExtra("artist"), artist);
            sleepAt = intent.getLongExtra("sleepAt", 0);
        }
        paused = false;
        scheduleSleep(sleepAt);
        try {
            enterForeground();
        } catch (Exception error) {
            stopPlayback();
            stopSelf();
            return START_NOT_STICKY;
        }
        requestFocus();
        acquireWakeLock();
        startBed();
        publishState();
        return START_NOT_STICKY;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        sendAction("stop");
        stopPlayback();
        stopSelf();
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        stopPlayback();
        if (instance == this) {
            instance = null;
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void apply(String nextTitle, String nextArtist, boolean nextPaused) {
        title = text(nextTitle, title);
        artist = text(nextArtist, artist);
        paused = nextPaused;
        publishState();
        try {
            enterForeground();
        } catch (Exception ignored) {
            // The notification can fail if the service is already stopping.
        }
    }

    private void enterForeground() {
        Notification notification = buildNotification();
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private Notification buildNotification() {
        Intent open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent content = PendingIntent.getActivity(
            this,
            0,
            open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        Notification.Builder builder = Build.VERSION.SDK_INT >= 26
            ? new Notification.Builder(this, CHANNEL_ID)
            : new Notification.Builder(this);
        Bitmap icon = art();
        if (mediaSession == null) {
            return builder
                .setSmallIcon(R.drawable.ic_stat_listen)
                .setContentTitle(title)
                .setOngoing(true)
                .build();
        }
        builder
            .setSmallIcon(R.drawable.ic_stat_listen)
            .setContentTitle(title)
            .setContentText(artist)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setContentIntent(content)
            .setCategory(Notification.CATEGORY_TRANSPORT);
        if (icon != null) {
            builder.setLargeIcon(icon);
        }
        if (mediaSession != null) {
            builder.setStyle(new Notification.MediaStyle().setMediaSession(mediaSession.getSessionToken()));
        }
        return builder.build();
    }

    private void publishState() {
        if (mediaSession == null) {
            return;
        }
        int state = paused ? PlaybackState.STATE_PAUSED : PlaybackState.STATE_PLAYING;
        PlaybackState playback = new PlaybackState.Builder()
            .setActions(ACTIONS)
            .setState(state, PlaybackState.PLAYBACK_POSITION_UNKNOWN, paused ? 0f : 1f)
            .build();
        mediaSession.setPlaybackState(playback);
        android.media.MediaMetadata.Builder metadata = new android.media.MediaMetadata.Builder()
            .putString(android.media.MediaMetadata.METADATA_KEY_TITLE, title)
            .putString(android.media.MediaMetadata.METADATA_KEY_ARTIST, artist)
            .putString(android.media.MediaMetadata.METADATA_KEY_ALBUM, "Zipdeck");
        Bitmap icon = art();
        if (icon != null) {
            metadata.putBitmap(android.media.MediaMetadata.METADATA_KEY_ALBUM_ART, icon);
            metadata.putBitmap(android.media.MediaMetadata.METADATA_KEY_ART, icon);
            metadata.putBitmap(android.media.MediaMetadata.METADATA_KEY_DISPLAY_ICON, icon);
        }
        mediaSession.setMetadata(metadata.build());
    }

    private Bitmap art() {
        if (art != null) {
            return art;
        }
        Drawable drawable = ContextCompat.getDrawable(this, R.mipmap.ic_launcher);
        if (drawable == null) {
            return null;
        }
        int size = drawable.getIntrinsicWidth();
        if (size <= 0) {
            size = 128;
        }
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        drawable.setBounds(0, 0, size, size);
        drawable.draw(canvas);
        art = bitmap;
        return art;
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < 26) {
            return;
        }
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Audio Flashcards",
            NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("Playback controls while Audio Flashcards is playing.");
        channel.setSound(null, null);
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(channel);
        }
    }

    private void requestFocus() {
        if (audioManager == null) {
            return;
        }
        AudioAttributes attributes = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build();
        if (Build.VERSION.SDK_INT >= 26) {
            focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(attributes)
                .setOnAudioFocusChangeListener(focusListener)
                .build();
            audioManager.requestAudioFocus(focusRequest);
        } else {
            audioManager.requestAudioFocus(focusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
        }
    }

    private void abandonFocus() {
        if (audioManager == null) {
            return;
        }
        if (Build.VERSION.SDK_INT >= 26 && focusRequest != null) {
            audioManager.abandonAudioFocusRequest(focusRequest);
            focusRequest = null;
        } else if (focusListener != null) {
            audioManager.abandonAudioFocus(focusListener);
        }
    }

    private void onAudioFocus(int change) {
        if (change == AudioManager.AUDIOFOCUS_LOSS || change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
            sendAction("pause");
        }
    }

    private void acquireWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            return;
        }
        PowerManager power = (PowerManager) getSystemService(POWER_SERVICE);
        if (power == null) {
            return;
        }
        wakeLock = power.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "zipdeck:listen");
        wakeLock.setReferenceCounted(false);
        wakeLock.acquire();
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        wakeLock = null;
    }

    private void startBed() {
        if (bed != null) {
            return;
        }
        int sampleRate = 16000;
        int min = AudioTrack.getMinBufferSize(
            sampleRate,
            AudioFormat.CHANNEL_OUT_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        );
        if (min <= 0) {
            min = 1600;
        }
        AudioAttributes attributes = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build();
        AudioFormat format = new AudioFormat.Builder()
            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
            .setSampleRate(sampleRate)
            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
            .build();
        if (Build.VERSION.SDK_INT >= 26) {
            bed = new AudioTrack.Builder()
                .setAudioAttributes(attributes)
                .setAudioFormat(format)
                .setBufferSizeInBytes(min)
                .setTransferMode(AudioTrack.MODE_STREAM)
                .build();
        } else {
            bed = new AudioTrack(
                AudioManager.STREAM_MUSIC,
                sampleRate,
                AudioFormat.CHANNEL_OUT_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                min,
                AudioTrack.MODE_STREAM
            );
        }
        bed.setVolume(0.2f);
        bed.play();
        writing = true;
        int bufferBytes = min;
        bedWriter = new Thread(() -> {
            int period = sampleRate / 220;
            int samples = Math.max(period, bufferBytes / 2);
            byte[] tone = new byte[samples * 2];
            int phase = 0;
            while (writing && bed != null) {
                for (int i = 0; i < samples; i++) {
                    short sample = (short) (Math.sin((2 * Math.PI * phase) / period) * 8);
                    tone[i * 2] = (byte) (sample & 0xff);
                    tone[i * 2 + 1] = (byte) ((sample >> 8) & 0xff);
                    phase++;
                    if (phase >= period) {
                        phase = 0;
                    }
                }
                AudioTrack current = bed;
                if (current == null) {
                    return;
                }
                int offset = 0;
                while (offset < tone.length && writing) {
                    try {
                        int wrote = current.write(tone, offset, tone.length - offset);
                        if (wrote < 0) {
                            return;
                        }
                        if ((wrote & 1) == 1) {
                            wrote -= 1;
                        }
                        if (wrote == 0) {
                            Thread.sleep(5);
                            continue;
                        }
                        offset += wrote;
                    } catch (Exception ignored) {
                        return;
                    }
                }
            }
        }, "zipdeck-listen");
        bedWriter.start();
    }

    private void stopBed() {
        writing = false;
        Thread writer = bedWriter;
        bedWriter = null;
        AudioTrack current = bed;
        bed = null;
        if (current != null) {
            try {
                current.pause();
                current.flush();
                current.release();
            } catch (Exception ignored) {
                // The track is already gone.
            }
        }
        if (writer != null) {
            writer.interrupt();
        }
    }

    private void scheduleSleep(long sleepAt) {
        cancelSleep();
        sleepFired = false;
        if (sleepAt <= 0) {
            return;
        }
        if (sleepHandler == null) {
            sleepHandler = new Handler(Looper.getMainLooper());
        }
        long delay = sleepAt - System.currentTimeMillis();
        if (delay <= 0) {
            sleepHandler.post(this::onSleep);
            return;
        }
        sleepHandler.postDelayed(this::onSleep, delay);
    }

    private void cancelSleep() {
        if (sleepHandler != null) {
            sleepHandler.removeCallbacksAndMessages(null);
        }
    }

    private void onSleep() {
        if (sleepFired) {
            return;
        }
        sleepFired = true;
        cancelSleep();
        ListenSpeechCut.cut(plugin);
        sendAction("sleep");
        stopPlayback();
        stopSelf();
    }

    private void stopPlayback() {
        cancelSleep();
        stopBed();
        releaseWakeLock();
        abandonFocus();
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
            mediaSession = null;
        }
        try {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } catch (Exception ignored) {
            // startForeground never completed.
        }
    }

    private void sendAction(String action) {
        ListenPlaybackPlugin owner = plugin;
        if (owner != null) {
            owner.notifyAction(action);
        }
    }

    private static String text(String value, String fallback) {
        if (value == null || value.trim().isEmpty()) {
            return fallback == null ? "Zipdeck" : fallback;
        }
        String trimmed = value.trim();
        return trimmed.length() > 80 ? trimmed.substring(0, 80) : trimmed;
    }
}
