import AVFoundation
import Capacitor
import MediaPlayer
import UIKit

/// Copy this file into the Xcode App target (same target as Info.plist) and add it
/// to Build Phases → Compile Sources. MainViewController.swift must call
/// `registerPluginInstance(ListenPlaybackPlugin())`.
///
/// Info.plist also needs UIBackgroundModes → audio. In Xcode that is
/// Signing & Capabilities → Background Modes → Audio, AirPlay, and Picture in Picture.
/// Without that mode, iOS suspends the app during the pause between cards.
@objc(ListenPlaybackPlugin)
public class ListenPlaybackPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ListenPlaybackPlugin"
    public let jsName = "ListenPlayback"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
    ]

    private let session = AVAudioSession.sharedInstance()
    private var player: AVAudioPlayer?
    private var playTarget: Any?
    private var pauseTarget: Any?
    private var nextTarget: Any?
    private var previousTarget: Any?
    private var interruptionObserver: NSObjectProtocol?
    private var sleepTimer: DispatchSourceTimer?
    private var sleeping = false

    @objc func start(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            do {
                try self.activate()
                self.installCommands()
                self.observeInterruptions()
                self.armSleep(call)
                if self.sleeping {
                    call.resolve()
                    return
                }
                self.refresh(call, paused: false)
                call.resolve()
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func update(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let paused = call.getBool("paused") ?? false
            self.armSleep(call)
            if self.sleeping {
                call.resolve()
                return
            }
            if self.player?.isPlaying != true {
                try? self.session.setActive(true)
                self.player?.play()
            }
            self.refresh(call, paused: paused)
            call.resolve()
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.teardown()
            call.resolve()
        }
    }

    private func activate() throws {
        if session.category != .playback || session.mode != .spokenAudio {
            try session.setCategory(.playback, mode: .spokenAudio)
        }
        try session.setActive(true)
        if player == nil {
            let bed = try tonePlayer()
            bed.numberOfLoops = -1
            bed.volume = 0.15
            player = bed
        }
        if player?.isPlaying != true {
            player?.play()
        }
    }

    private func refresh(_ call: CAPPluginCall, paused: Bool) {
        let title = call.getString("title") ?? "ZipCONVO"
        let artist = call.getString("artist") ?? "ZipCONVO"
        var info: [String: Any] = [
            MPMediaItemPropertyTitle: title,
            MPMediaItemPropertyArtist: artist,
            MPMediaItemPropertyAlbumTitle: "ZipCONVO",
            MPNowPlayingInfoPropertyPlaybackRate: paused ? 0 : 1,
        ]
        if let art = mark() {
            info[MPMediaItemPropertyArtwork] = art
        }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    private var cachedArt: MPMediaItemArtwork?

    private func mark() -> MPMediaItemArtwork? {
        if let cachedArt {
            return cachedArt
        }
        guard let image = iconImage() else {
            return nil
        }
        let side: CGFloat = 600
        let art = MPMediaItemArtwork(boundsSize: CGSize(width: side, height: side)) { size in
            let canvas = CGSize(width: max(size.width, 1), height: max(size.height, 1))
            let format = UIGraphicsImageRendererFormat()
            format.opaque = true
            format.scale = 1
            let renderer = UIGraphicsImageRenderer(size: canvas, format: format)
            return renderer.image { _ in
                UIColor(red: 124.0/255.0, green: 151.0/255.0, blue: 246.0/255.0, alpha: 1).setFill()
                UIBezierPath(rect: CGRect(origin: .zero, size: canvas)).fill()
                image.draw(in: CGRect(origin: .zero, size: canvas))
            }
        }
        cachedArt = art
        return art
    }

    private func iconImage() -> UIImage? {
        if let data = Data(base64Encoded: ListenMark.png, options: .ignoreUnknownCharacters),
           let image = UIImage(data: data),
           image.size.width > 0 {
            return image
        }
        if let icons = Bundle.main.infoDictionary?["CFBundleIcons"] as? [String: Any],
           let primary = icons["CFBundlePrimaryIcon"] as? [String: Any],
           let files = primary["CFBundleIconFiles"] as? [String] {
            for name in files.reversed() {
                if let image = UIImage(named: name) {
                    return image
                }
            }
        }
        return nil
    }

    private func installCommands() {
        let center = MPRemoteCommandCenter.shared()
        center.playCommand.isEnabled = true
        center.pauseCommand.isEnabled = true
        center.nextTrackCommand.isEnabled = true
        center.previousTrackCommand.isEnabled = true
        if playTarget == nil {
            playTarget = center.playCommand.addTarget { [weak self] _ in
                self?.notifyListeners("action", data: ["action": "resume"])
                return .success
            }
        }
        if pauseTarget == nil {
            pauseTarget = center.pauseCommand.addTarget { [weak self] _ in
                self?.notifyListeners("action", data: ["action": "pause"])
                return .success
            }
        }
        if nextTarget == nil {
            nextTarget = center.nextTrackCommand.addTarget { [weak self] _ in
                self?.notifyListeners("action", data: ["action": "next"])
                return .success
            }
        }
        if previousTarget == nil {
            previousTarget = center.previousTrackCommand.addTarget { [weak self] _ in
                self?.notifyListeners("action", data: ["action": "previous"])
                return .success
            }
        }
    }

    private func observeInterruptions() {
        if interruptionObserver != nil {
            return
        }
        interruptionObserver = NotificationCenter.default.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: session,
            queue: .main
        ) { [weak self] note in
            guard let self else { return }
            let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt ?? 0
            let type = AVAudioSession.InterruptionType(rawValue: raw)
            if type == .ended {
                try? self.session.setActive(true)
                self.player?.play()
            }
        }
    }

    private func armSleep(_ call: CAPPluginCall) {
        guard call.getDouble("sleepAt") != nil else {
            return
        }
        let epochMs = call.getDouble("sleepAt") ?? 0
        sleepTimer?.cancel()
        sleepTimer = nil
        guard epochMs > 0 else {
            sleeping = false
            return
        }
        let delay = epochMs / 1000 - Date().timeIntervalSince1970
        if delay <= 0.05 {
            onSleep()
            return
        }
        sleeping = false
        let timer = DispatchSource.makeTimerSource(queue: .main)
        timer.schedule(deadline: .now() + delay, leeway: .milliseconds(250))
        timer.setEventHandler { [weak self] in
            self?.onSleep()
        }
        sleepTimer = timer
        timer.resume()
    }

    private func onSleep() {
        if sleeping {
            return
        }
        sleeping = true
        sleepTimer?.cancel()
        sleepTimer = nil
        NotificationCenter.default.post(name: Notification.Name("zipconvo.listen.sleep"), object: nil)
        notifyListeners("action", data: ["action": "sleep"])
        teardown()
    }

    private func teardown() {
        sleepTimer?.cancel()
        sleepTimer = nil
        let center = MPRemoteCommandCenter.shared()
        if let playTarget {
            center.playCommand.removeTarget(playTarget)
        }
        if let pauseTarget {
            center.pauseCommand.removeTarget(pauseTarget)
        }
        if let nextTarget {
            center.nextTrackCommand.removeTarget(nextTarget)
        }
        if let previousTarget {
            center.previousTrackCommand.removeTarget(previousTarget)
        }
        playTarget = nil
        pauseTarget = nil
        nextTarget = nil
        previousTarget = nil
        if let interruptionObserver {
            NotificationCenter.default.removeObserver(interruptionObserver)
        }
        interruptionObserver = nil
        player?.stop()
        player = nil
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
        try? session.setActive(false, options: [.notifyOthersOnDeactivation])
    }

    private func tonePlayer() throws -> AVAudioPlayer {
        let sampleRate = 8000
        let frames = sampleRate
        let dataSize = frames * 2
        var bytes = [UInt8](repeating: 0, count: 44 + dataSize)
        func writeText(_ offset: Int, _ text: String) {
            for (index, byte) in text.utf8.enumerated() {
                bytes[offset + index] = byte
            }
        }
        func write16(_ offset: Int, _ value: UInt16) {
            bytes[offset] = UInt8(value & 0xff)
            bytes[offset + 1] = UInt8((value >> 8) & 0xff)
        }
        func write32(_ offset: Int, _ value: UInt32) {
            bytes[offset] = UInt8(value & 0xff)
            bytes[offset + 1] = UInt8((value >> 8) & 0xff)
            bytes[offset + 2] = UInt8((value >> 16) & 0xff)
            bytes[offset + 3] = UInt8((value >> 24) & 0xff)
        }
        writeText(0, "RIFF")
        write32(4, UInt32(36 + dataSize))
        writeText(8, "WAVE")
        writeText(12, "fmt ")
        write32(16, 16)
        write16(20, 1)
        write16(22, 1)
        write32(24, UInt32(sampleRate))
        write32(28, UInt32(sampleRate * 2))
        write16(32, 2)
        write16(34, 16)
        writeText(36, "data")
        write32(40, UInt32(dataSize))
        let frequency = 200.0
        for frame in 0..<frames {
            let value = sin((2 * Double.pi * frequency * Double(frame)) / Double(sampleRate)) * 12
            let sample = UInt16(bitPattern: Int16(Int(value)))
            let offset = 44 + frame * 2
            bytes[offset] = UInt8(sample & 0xff)
            bytes[offset + 1] = UInt8((sample >> 8) & 0xff)
        }
        let bed = try AVAudioPlayer(data: Data(bytes))
        bed.prepareToPlay()
        return bed
    }
}

private enum ListenMark {
    static let png = "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"
}
