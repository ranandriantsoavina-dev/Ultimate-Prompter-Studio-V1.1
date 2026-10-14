//! Ultimate Prompter — local file-backed server.
//!
//! data/
//!   users.json                 list of user profiles
//!   db/<userId>.json           one workspace database per user (no image bytes, only /files/... paths)
//!   db/<userId>.bak.json       rolling safety backup of the previous db (refreshed at most every 5 min)
//!   photos/<userId>/<file>     every imported photo, as a real file
//!
//! Photos are served at  /files/<userId>/<file>   (read-only static route)
//! JSON API lives under  /api/...
//! If ../dist/index.html exists (production build of the web app) it is served at /.

use axum::{
    body::Bytes,
    extract::{DefaultBodyLimit, Path, State},
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::{delete, get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
    collections::HashSet,
    path::{Path as FsPath, PathBuf},
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc,
    },
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tokio::{fs, sync::Mutex};
use tower_http::services::{ServeDir, ServeFile};

/// Photos that are no longer referenced by the saved database are only deleted once they are
/// older than this, so Undo/Redo and half-finished edits never point at a deleted file.
const GC_GRACE: Duration = Duration::from_secs(10 * 60);
const BACKUP_EVERY: Duration = Duration::from_secs(5 * 60);

struct AppState {
    data_dir: PathBuf,
    users_lock: Mutex<()>,
    counter: AtomicU64,
}

type Shared = Arc<AppState>;
type ApiError = (StatusCode, String);
type ApiResult<T> = Result<T, ApiError>;

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct User {
    id: String,
    name: String,
    is_main: bool,
    created_at: u64,
}

// ---------- small helpers ----------

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn bad(msg: impl Into<String>) -> ApiError {
    (StatusCode::BAD_REQUEST, msg.into())
}

fn not_found(msg: impl Into<String>) -> ApiError {
    (StatusCode::NOT_FOUND, msg.into())
}

fn internal(msg: impl Into<String>) -> ApiError {
    (StatusCode::INTERNAL_SERVER_ERROR, msg.into())
}

fn ioerr(e: std::io::Error) -> ApiError {
    internal(format!("File system error: {e}"))
}

/// User ids become folder / file names, so only allow a safe character set.
fn valid_id(s: &str) -> bool {
    !s.is_empty()
        && s.len() <= 64
        && s.chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
}

/// Photo file names: no separators, no leading dot, no "..".
fn valid_file(s: &str) -> bool {
    !s.is_empty()
        && s.len() <= 128
        && !s.starts_with('.')
        && !s.contains("..")
        && s.chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-' || c == '.')
}

fn db_path(st: &AppState, id: &str) -> PathBuf {
    st.data_dir.join("db").join(format!("{id}.json"))
}

fn bak_path(st: &AppState, id: &str) -> PathBuf {
    st.data_dir.join("db").join(format!("{id}.bak.json"))
}

fn photo_dir(st: &AppState, id: &str) -> PathBuf {
    st.data_dir.join("photos").join(id)
}

/// Write to a unique temp file, then rename over the target (atomic on the same volume).
async fn write_atomic(st: &AppState, path: &FsPath, bytes: &[u8]) -> std::io::Result<()> {
    let n = st.counter.fetch_add(1, Ordering::Relaxed);
    let tmp = path.with_extension(format!("tmp{n}"));
    fs::write(&tmp, bytes).await?;
    if let Err(e) = fs::rename(&tmp, path).await {
        let _ = fs::remove_file(&tmp).await;
        return Err(e);
    }
    Ok(())
}

async fn read_users(st: &AppState) -> ApiResult<Vec<User>> {
    let p = st.data_dir.join("users.json");
    match fs::read(&p).await {
        Ok(bytes) => serde_json::from_slice(&bytes)
            .map_err(|e| internal(format!("users.json is corrupt: {e}"))),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(vec![User {
            id: "main".into(),
            name: "Main User".into(),
            is_main: true,
            created_at: now_ms(),
        }]),
        Err(e) => Err(ioerr(e)),
    }
}

async fn write_users(st: &AppState, users: &[User]) -> ApiResult<()> {
    let bytes = serde_json::to_vec_pretty(users).map_err(|e| internal(e.to_string()))?;
    write_atomic(st, &st.data_dir.join("users.json"), &bytes)
        .await
        .map_err(ioerr)
}

async fn ensure_user(st: &AppState, id: &str) -> ApiResult<()> {
    if !valid_id(id) {
        return Err(bad("Invalid user id"));
    }
    let users = read_users(st).await?;
    if users.iter().any(|u| u.id == id) {
        Ok(())
    } else {
        Err(not_found(format!("No such user: {id}")))
    }
}

// ---------- users ----------

async fn list_users(State(st): State<Shared>) -> ApiResult<Json<Vec<User>>> {
    let _g = st.users_lock.lock().await;
    Ok(Json(read_users(&st).await?))
}

#[derive(Deserialize)]
struct NewUser {
    name: String,
    /// Optional: lets the one-time browser→disk migration keep the original ids.
    id: Option<String>,
}

async fn create_user(
    State(st): State<Shared>,
    Json(body): Json<NewUser>,
) -> ApiResult<Json<User>> {
    let name = body.name.trim().to_string();
    if name.is_empty() || name.chars().count() > 60 {
        return Err(bad("User name must be 1-60 characters"));
    }
    let _g = st.users_lock.lock().await;
    let mut users = read_users(&st).await?;

    let id = match body.id {
        Some(id) => {
            if !valid_id(&id) {
                return Err(bad("Invalid user id"));
            }
            id
        }
        None => format!("user_{}_{}", now_ms(), st.counter.fetch_add(1, Ordering::Relaxed)),
    };

    if let Some(existing) = users.iter().find(|u| u.id == id) {
        return Ok(Json(existing.clone()));
    }

    let user = User {
        id: id.clone(),
        name,
        is_main: false,
        created_at: now_ms(),
    };
    fs::create_dir_all(photo_dir(&st, &id)).await.map_err(ioerr)?;
    users.push(user.clone());
    write_users(&st, &users).await?;
    Ok(Json(user))
}

async fn delete_user(
    State(st): State<Shared>,
    Path(id): Path<String>,
) -> ApiResult<Json<Value>> {
    if !valid_id(&id) {
        return Err(bad("Invalid user id"));
    }
    if id == "main" {
        return Err(bad("The main user cannot be deleted"));
    }
    let _g = st.users_lock.lock().await;
    let mut users = read_users(&st).await?;
    let before = users.len();
    users.retain(|u| u.id != id);
    if users.len() == before {
        return Err(not_found("No such user"));
    }
    write_users(&st, &users).await?;

    for p in [db_path(&st, &id), bak_path(&st, &id)] {
        match fs::remove_file(&p).await {
            Ok(_) => {}
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
            Err(e) => return Err(ioerr(e)),
        }
    }
    match fs::remove_dir_all(photo_dir(&st, &id)).await {
        Ok(_) => {}
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
        Err(e) => return Err(ioerr(e)),
    }
    Ok(Json(json!({ "ok": true })))
}

// ---------- per-user database ----------

async fn get_db(State(st): State<Shared>, Path(id): Path<String>) -> ApiResult<Response> {
    ensure_user(&st, &id).await?;
    match fs::read(db_path(&st, &id)).await {
        Ok(bytes) => Ok(([(header::CONTENT_TYPE, "application/json")], bytes).into_response()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            Err(not_found("No saved database yet"))
        }
        Err(e) => Err(ioerr(e)),
    }
}

async fn put_db(
    State(st): State<Shared>,
    Path(id): Path<String>,
    body: Bytes,
) -> ApiResult<Json<Value>> {
    ensure_user(&st, &id).await?;

    let value: Value = serde_json::from_slice(&body)
        .map_err(|e| bad(format!("Body is not valid JSON: {e}")))?;
    if !value.get("cats").map(|c| c.is_array()).unwrap_or(false) {
        return Err(bad("Database JSON must contain a `cats` array"));
    }

    // Rolling safety backup of whatever is on disk right now.
    let target = db_path(&st, &id);
    if fs::metadata(&target).await.is_ok() {
        let bak = bak_path(&st, &id);
        let stale = match fs::metadata(&bak).await.and_then(|m| m.modified()) {
            Ok(t) => t.elapsed().map(|d| d > BACKUP_EVERY).unwrap_or(true),
            Err(_) => true,
        };
        if stale {
            let _ = fs::copy(&target, &bak).await;
        }
    }

    write_atomic(&st, &target, &body).await.map_err(ioerr)?;
    let removed = gc_photos(&st, &id, &value).await;
    Ok(Json(json!({ "ok": true, "removedPhotos": removed })))
}

fn collect_urls(v: &Value, prefix: &str, out: &mut HashSet<String>) {
    match v {
        Value::String(s) => {
            if let Some(rest) = s.strip_prefix(prefix) {
                out.insert(rest.to_string());
            }
        }
        Value::Array(a) => {
            for x in a {
                collect_urls(x, prefix, out);
            }
        }
        Value::Object(m) => {
            for x in m.values() {
                collect_urls(x, prefix, out);
            }
        }
        _ => {}
    }
}

/// Delete photo files that the saved database no longer references (and that are older than GC_GRACE).
async fn gc_photos(st: &AppState, uid: &str, db: &Value) -> usize {
    let prefix = format!("/files/{uid}/");
    let mut used = HashSet::new();
    collect_urls(db, &prefix, &mut used);

    let mut rd = match fs::read_dir(photo_dir(st, uid)).await {
        Ok(r) => r,
        Err(_) => return 0,
    };
    let mut removed = 0;
    while let Ok(Some(entry)) = rd.next_entry().await {
        let name = entry.file_name().to_string_lossy().to_string();
        if used.contains(&name) {
            continue;
        }
        let old_enough = match entry.metadata().await.and_then(|m| m.modified()) {
            Ok(t) => t.elapsed().map(|d| d > GC_GRACE).unwrap_or(false),
            Err(_) => false,
        };
        if old_enough && fs::remove_file(entry.path()).await.is_ok() {
            removed += 1;
        }
    }
    removed
}

// ---------- photos ----------

/// POST /api/users/:id/photos   body = raw image bytes, Content-Type = image/*
/// -> { url: "/files/<id>/<file>", file: "<file>" }
async fn upload_photo(
    State(st): State<Shared>,
    Path(id): Path<String>,
    headers: HeaderMap,
    body: Bytes,
) -> ApiResult<Json<Value>> {
    ensure_user(&st, &id).await?;
    if body.is_empty() {
        return Err(bad("Empty upload"));
    }
    let ctype = headers
        .get(header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .split(';')
        .next()
        .unwrap_or("")
        .trim()
        .to_ascii_lowercase();
    let ext = match ctype.as_str() {
        "image/jpeg" | "image/jpg" => "jpg",
        "image/png" => "png",
        "image/webp" => "webp",
        "image/gif" => "gif",
        "image/avif" => "avif",
        _ => {
            return Err((
                StatusCode::UNSUPPORTED_MEDIA_TYPE,
                format!("Unsupported image type '{ctype}' (use JPEG, PNG, WebP, GIF or AVIF)"),
            ))
        }
    };

    let dir = photo_dir(&st, &id);
    fs::create_dir_all(&dir).await.map_err(ioerr)?;
    let name = format!(
        "{}_{}.{}",
        now_ms(),
        st.counter.fetch_add(1, Ordering::Relaxed),
        ext
    );
    fs::write(dir.join(&name), &body).await.map_err(ioerr)?;
    Ok(Json(json!({ "url": format!("/files/{id}/{name}"), "file": name })))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct TransferReq {
    from_user: String,
    to_user: String,
    url: String,
}

/// POST /api/transfer-photo  { fromUser, toUser, url } -> { url }   (copies the file into the target user's folder)
async fn transfer_photo(
    State(st): State<Shared>,
    Json(req): Json<TransferReq>,
) -> ApiResult<Json<Value>> {
    ensure_user(&st, &req.from_user).await?;
    ensure_user(&st, &req.to_user).await?;

    let prefix = format!("/files/{}/", req.from_user);
    let file = req
        .url
        .strip_prefix(&prefix)
        .ok_or_else(|| bad("URL does not belong to the source user"))?;
    if !valid_file(file) {
        return Err(bad("Invalid file name"));
    }
    if req.from_user == req.to_user {
        return Ok(Json(json!({ "url": req.url })));
    }

    let src = photo_dir(&st, &req.from_user).join(file);
    let ext = FsPath::new(file)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("jpg");
    let dest_dir = photo_dir(&st, &req.to_user);
    fs::create_dir_all(&dest_dir).await.map_err(ioerr)?;
    let name = format!(
        "{}_{}.{}",
        now_ms(),
        st.counter.fetch_add(1, Ordering::Relaxed),
        ext
    );

    match fs::copy(&src, dest_dir.join(&name)).await {
        Ok(_) => {}
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            return Err(not_found("Source photo not found on disk"))
        }
        Err(e) => return Err(ioerr(e)),
    }
    Ok(Json(json!({ "url": format!("/files/{}/{}", req.to_user, name) })))
}

// ---------- main ----------

#[tokio::main]
async fn main() {
    let data_dir =
        PathBuf::from(std::env::var("PROMPTER_DATA").unwrap_or_else(|_| "data".to_string()));
    let static_dir = PathBuf::from(
        std::env::var("PROMPTER_STATIC").unwrap_or_else(|_| "../dist".to_string()),
    );
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3000);

    fs::create_dir_all(data_dir.join("db"))
        .await
        .expect("cannot create data/db");
    fs::create_dir_all(data_dir.join("photos"))
        .await
        .expect("cannot create data/photos");

    let state: Shared = Arc::new(AppState {
        data_dir: data_dir.clone(),
        users_lock: Mutex::new(()),
        counter: AtomicU64::new(0),
    });

    // Make sure users.json (with the main user) exists on disk.
    {
        let users = read_users(&state).await.expect("cannot read users.json");
        write_users(&state, &users)
            .await
            .expect("cannot write users.json");
        for u in &users {
            let _ = fs::create_dir_all(photo_dir(&state, &u.id)).await;
        }
    }

    let api = Router::new()
        .route("/users", get(list_users).post(create_user))
        .route("/users/:id", delete(delete_user))
        .route("/users/:id/db", get(get_db).put(put_db))
        .route("/users/:id/photos", post(upload_photo))
        .route("/transfer-photo", post(transfer_photo))
        .with_state(state.clone());

    let mut app = Router::new()
        .nest("/api", api)
        .nest_service("/files", ServeDir::new(data_dir.join("photos")))
        .layer(DefaultBodyLimit::max(100 * 1024 * 1024));

    if static_dir.join("index.html").exists() {
        app = app.fallback_service(
            ServeDir::new(&static_dir).fallback(ServeFile::new(static_dir.join("index.html"))),
        );
        println!("Serving web app from {}", static_dir.display());
    } else {
        println!(
            "(No built web app at {} — run the Vite dev server and proxy /api and /files here.)",
            static_dir.display()
        );
    }

    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], port));
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("cannot bind port (is another instance already running?)");
    println!("Ultimate Prompter server: http://{addr}");
    println!("Data folder: {}", data_dir.display());
    axum::serve(listener, app).await.expect("server error");
}
