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
        let title = call.getString("title") ?? "Zipdeck"
        let artist = call.getString("artist") ?? "Zipdeck"
        var info: [String: Any] = [
            MPMediaItemPropertyTitle: title,
            MPMediaItemPropertyArtist: artist,
            MPMediaItemPropertyAlbumTitle: "Zipdeck",
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
        guard let data = Data(base64Encoded: ListenMark.png, options: .ignoreUnknownCharacters),
              let image = UIImage(data: data) else {
            return nil
        }
        let art = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
        cachedArt = art
        return art
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
