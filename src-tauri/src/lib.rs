use serde::Serialize;
use std::path::Path;
use std::process::Command;

#[derive(Serialize)]
struct GitCommit {
    hash: String,
    date: String,
    title: String,
}

#[tauri::command]
fn collect_git(path: String, week: String, next_week: String) -> Result<Vec<GitCommit>, String> {
    let repo = Path::new(&path);
    if !repo.is_dir() {
        return Err("That repository folder does not exist.".into());
    }
    if !is_iso_day(&week) || !is_iso_day(&next_week) || next_week <= week {
        return Err("Choose a valid work week before reading Git metadata.".into());
    }
    let output = Command::new("git")
        .args([
            "-C",
            &path,
            "log",
            &format!("--since={week}T00:00:00"),
            &format!("--before={next_week}T00:00:00"),
            "--max-count=200",
            "--date=short",
            "--pretty=format:%H%x1f%ad%x1f%s%x1e",
        ])
        .output()
        .map_err(|_| "Git is not installed or could not be started.".to_string())?;
    if !output.status.success() {
        return Err("This folder is not a readable Git repository.".into());
    }
    let text = String::from_utf8(output.stdout)
        .map_err(|_| "Git returned unreadable metadata.".to_string())?;
    let commits = text
        .split('\u{1e}')
        .filter_map(|record| {
            let mut parts = record.trim().split('\u{1f}');
            Some(GitCommit {
                hash: parts.next()?.to_string(),
                date: parts.next()?.to_string(),
                title: parts.next()?.to_string(),
            })
        })
        .collect();
    Ok(commits)
}

fn is_iso_day(value: &str) -> bool {
    value.len() == 10
        && value.as_bytes().get(4) == Some(&b'-')
        && value.as_bytes().get(7) == Some(&b'-')
        && value.bytes().enumerate().all(|(index, byte)| index == 4 || index == 7 || byte.is_ascii_digit())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![collect_git])
        .run(tauri::generate_context!())
        .expect("error while running Worklog Bridge");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::net::TcpListener;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn claim_git_metadata() {
        let suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let path = std::env::temp_dir().join(format!("worklog-bridge-git-{suffix}"));
        fs::create_dir(&path).unwrap();
        let git = |args: &[&str]| {
            Command::new("git")
                .args(["-C", path.to_str().unwrap()])
                .args(args)
                .output()
                .unwrap()
        };
        assert!(git(&["init", "--quiet"]).status.success());
        assert!(git(&["config", "user.email", "test@example.invalid"])
            .status
            .success());
        assert!(git(&["config", "user.name", "Test Worker"])
            .status
            .success());
        fs::write(path.join("work.txt"), "reviewed work\n").unwrap();
        assert!(git(&["add", "work.txt"]).status.success());
        let mut commit = Command::new("git");
        commit.args(["-C", path.to_str().unwrap(), "commit", "--quiet", "-m", "Add reviewed work"])
            .env("GIT_AUTHOR_DATE", "2026-08-26T12:00:00Z")
            .env("GIT_COMMITTER_DATE", "2026-08-26T12:00:00Z");
        assert!(commit.output().unwrap().status.success());
        fs::write(path.join("work.txt"), "outside the selected week\n").unwrap();
        assert!(git(&["add", "work.txt"]).status.success());
        let mut outside_week = Command::new("git");
        outside_week.args(["-C", path.to_str().unwrap(), "commit", "--quiet", "-m", "Outside selected week"])
            .env("GIT_AUTHOR_DATE", "2026-09-02T12:00:00Z")
            .env("GIT_COMMITTER_DATE", "2026-09-02T12:00:00Z");
        assert!(outside_week.output().unwrap().status.success());
        let commits = collect_git(path.to_string_lossy().into_owned(), "2026-08-24".into(), "2026-08-31".into()).unwrap();
        assert_eq!(commits.len(), 1);
        assert_eq!(commits[0].title, "Add reviewed work");
        assert_eq!(commits[0].hash.len(), 40);
        assert_eq!(commits[0].date.len(), 10);
        fs::remove_dir_all(path).unwrap();
    }

    #[test]
    fn claim_no_repository_upload() {
        let suffix = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
        let path = std::env::temp_dir().join(format!("worklog-bridge-local-only-{suffix}"));
        fs::create_dir(&path).unwrap();
        let git = |args: &[&str]| Command::new("git").args(["-C", path.to_str().unwrap()]).args(args).output().unwrap();
        assert!(git(&["init", "--quiet"]).status.success());
        assert!(git(&["config", "user.email", "test@example.invalid"]).status.success());
        assert!(git(&["config", "user.name", "Test Worker"]).status.success());
        fs::write(path.join("private-source.txt"), "never upload this content\n").unwrap();
        assert!(git(&["add", "private-source.txt"]).status.success());
        let mut commit = Command::new("git");
        commit.args(["-C", path.to_str().unwrap(), "commit", "--quiet", "-m", "Local commit only"])
            .env("GIT_AUTHOR_DATE", "2026-08-26T12:00:00Z")
            .env("GIT_COMMITTER_DATE", "2026-08-26T12:00:00Z");
        assert!(commit.output().unwrap().status.success());
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        listener.set_nonblocking(true).unwrap();
        let port = listener.local_addr().unwrap().port();
        assert!(git(&["remote", "add", "origin", &format!("git://127.0.0.1:{port}/private.git")]).status.success());
        let commits = collect_git(path.to_string_lossy().into_owned(), "2026-08-24".into(), "2026-08-31".into()).unwrap();
        assert_eq!(commits[0].title, "Local commit only");
        assert!(listener.accept().is_err(), "reading Git metadata must not contact the configured remote");
        fs::remove_dir_all(path).unwrap();
    }
}
