#[cfg(feature = "desktop")]
fn main() {
    worklog_approval_bridge_lib::run();
}

// Registered Git/privacy claims intentionally compile without Tauri's native
// webview runtime. Desktop packaging explicitly enables the `desktop` feature.
#[cfg(not(feature = "desktop"))]
fn main() {}
