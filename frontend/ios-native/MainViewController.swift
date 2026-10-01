import Capacitor
import UIKit

/// Copy this file into the Xcode App target (same target as Info.plist).
/// Then set Main.storyboard's view controller Custom Class to
/// `MainViewController` (module App, or Inherit Module From Target).
/// Capacitor 8 does not load a Swift plugin from the App target until
/// `registerPluginInstance` runs here. Android does the same in MainActivity.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(AppleBillingPlugin())
    }
}
