import Capacitor
import UIKit

/// Copy this file into the Xcode App target (same target as Info.plist).
/// Capacitor 8.5 SceneDelegate must set rootViewController to MainViewController()
/// — Main.storyboard Custom Class is ignored once the scene lifecycle is on.
/// Capacitor 8 does not load a Swift plugin from the App target until
/// `registerPluginInstance` runs here. Android does the same in MainActivity.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(AppleBillingPlugin())
    }
}
