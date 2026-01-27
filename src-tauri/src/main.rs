#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use tauri::{Manager, AppHandle};
use tauri_plugin_shell::{ShellExt, process::CommandChild};

struct SidecarState(Mutex<Option<CommandChild>>);

fn start_backend(app: &AppHandle) -> Result<CommandChild, String> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data dir: {}", e))?;

    let db_path = app_data_dir.join("itcert.db");
    let database_url = format!("file:{}", db_path.to_string_lossy());

    println!("Starting backend with DATABASE_URL: {}", database_url);

    let sidecar = app.shell()
        .sidecar("desktop-backend")
        .map_err(|e| format!("Failed to create sidecar command: {}", e))?
        .env("DATABASE_URL", &database_url)
        .env("PORT", "3002")
        .env("JWT_SECRET", "desktop-app-secret-key-change-in-production");

    let (mut rx, child) = sidecar.spawn()
        .map_err(|e| format!("Failed to spawn sidecar: {}", e))?;

    tauri::async_runtime::spawn(async move {
        use tauri_plugin_shell::process::CommandEvent;
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    println!("[backend stdout] {}", String::from_utf8_lossy(&line));
                }
                CommandEvent::Stderr(line) => {
                    eprintln!("[backend stderr] {}", String::from_utf8_lossy(&line));
                }
                CommandEvent::Error(err) => {
                    eprintln!("[backend error] {}", err);
                }
                CommandEvent::Terminated(payload) => {
                    println!("[backend terminated] code: {:?}, signal: {:?}", payload.code, payload.signal);
                    break;
                }
                _ => {}
            }
        }
    });

    Ok(child)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .manage(SidecarState(Mutex::new(None)))
        .setup(|app| {
            let handle = app.handle().clone();

            match start_backend(&handle) {
                Ok(child) => {
                    let state = handle.state::<SidecarState>();
                    *state.0.lock().unwrap() = Some(child);
                    println!("Backend sidecar started successfully");
                }
                Err(e) => {
                    eprintln!("Failed to start backend: {}", e);
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let app = window.app_handle();
                let state = app.state::<SidecarState>();
                let child = state.0.lock().unwrap().take();
                if let Some(child) = child {
                    println!("Killing backend sidecar...");
                    let _ = child.kill();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
