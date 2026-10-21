/** Light haptic tick where the platform supports it (Android Chrome). iOS Safari ignores it. */
export function haptic(ms = 10) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(ms);
    } catch {
      // Some browsers throw when called without a user gesture.
    }
  }
}
