#[cfg(feature = "desktop")]
fn main() {
    tauri_build::build()
}

// The two registered Git/privacy claims exercise only the local collector.
// Skipping desktop code generation keeps their exact `cargo test` commands
// independent of the desktop WebKit/GTK toolchain. The packaged app always
// enables this feature through scripts/build-desktop.mjs.
#[cfg(not(feature = "desktop"))]
fn main() {}
