import AVFoundation
import Capacitor
import MediaPlayer

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

    @objc func start(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            do {
                try self.activate()
                self.installCommands()
                self.observeInterruptions()
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
            if paused {
                self.player?.pause()
            } else if self.player?.isPlaying != true {
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
        try session.setCategory(.playback, mode: .spokenAudio)
        try session.setActive(true)
        if player == nil {
            let bed = try tonePlayer()
            bed.numberOfLoops = -1
            bed.volume = 0.2
            player = bed
        }
        player?.play()
    }

    private func refresh(_ call: CAPPluginCall, paused: Bool) {
        let title = call.getString("title") ?? "Zipdeck"
        let artist = call.getString("artist") ?? "Zipdeck"
        var info: [String: Any] = [
            MPMediaItemPropertyTitle: title,
            MPMediaItemPropertyArtist: artist,
            MPMediaItemPropertyAlbumTitle: "Zipdeck",
            MPNowPlayingInfoPropertyPlaybackRate: paused ? 0 : 1,
        ]
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
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

    private func teardown() {
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
        let frequency = 220.0
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
