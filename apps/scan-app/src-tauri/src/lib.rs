// This app has no Tauri commands of its own - the entire scan-reconciliation
// flow (QR decode, local diff, signing, QR render) runs in the webview via
// browser APIs (getUserMedia, Web Crypto, localStorage). See
// docs/superpowers/specs/2026-09-09-scan-reconciliation-design.md.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_barcode_scanner::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
