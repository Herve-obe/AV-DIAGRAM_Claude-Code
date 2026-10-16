// Assistant IA (lot 6) : seule partie de l'application qui parle au réseau.
// - La clé API est rangée dans le trousseau du système (Trousseau macOS, Gestionnaire
//   d'identification Windows, Secret Service sous Linux) ; elle n'est jamais renvoyée à l'interface.
// - Liste stricte d'adresses : l'adresse d'un fournisseur en ligne est fixée ici ; une adresse saisie
//   par l'utilisateur doit être locale (127.0.0.1, localhost) ou, pour « compatible OpenAI », en HTTPS.
// - Liste stricte de chemins : seuls les points d'accès de discussion et de liste des modèles.
use serde::Serialize;
use std::time::Duration;
use url::Url;

const SERVICE: &str = "io.github.herveobe.avdiagram";
/// Fournisseurs dont la clé peut être enregistrée (les serveurs locaux n'en ont pas)
const KEY_PROVIDERS: [&str; 5] = ["anthropic", "openai", "gemini", "mistral", "compatible"];
const ALLOWED_PATHS: [&str; 3] = ["/messages", "/models", "/chat/completions"];

enum Auth {
    /// En-têtes x-api-key et anthropic-version
    Anthropic,
    /// En-tête Authorization: Bearer (OpenAI et compatibles), si une clé est enregistrée
    Bearer,
    /// Serveur local sans clé
    None,
}

struct Endpoint {
    base: String,
    auth: Auth,
    key_required: bool,
    local: bool,
}

fn is_loopback(u: &Url) -> bool {
    matches!(u.host_str(), Some("localhost") | Some("127.0.0.1") | Some("[::1]") | Some("::1"))
}

fn user_url(base_url: Option<String>, https_allowed: bool) -> Result<Url, String> {
    let raw = base_url.ok_or("adresse du serveur manquante")?;
    let u = Url::parse(raw.trim()).map_err(|_| "adresse du serveur invalide".to_string())?;
    let ok = match u.scheme() {
        "http" => is_loopback(&u),
        "https" => https_allowed || is_loopback(&u),
        _ => false,
    };
    if !ok || u.query().is_some() || !u.username().is_empty() {
        return Err("adresse refusée : serveur local (localhost) ou HTTPS pour « compatible OpenAI »".into());
    }
    Ok(u)
}

fn endpoint(provider: &str, base_url: Option<String>) -> Result<Endpoint, String> {
    let fixed = |base: &str, auth: Auth| Endpoint { base: base.into(), auth, key_required: true, local: false };
    Ok(match provider {
        "anthropic" => fixed("https://api.anthropic.com/v1", Auth::Anthropic),
        "openai" => fixed("https://api.openai.com/v1", Auth::Bearer),
        "gemini" => fixed("https://generativelanguage.googleapis.com/v1beta/openai", Auth::Bearer),
        "mistral" => fixed("https://api.mistral.ai/v1", Auth::Bearer),
        "compatible" => {
            let u = user_url(base_url, true)?;
            Endpoint { local: is_loopback(&u), base: u.to_string(), auth: Auth::Bearer, key_required: false }
        }
        "ollama" | "lmstudio" | "llamacpp" | "local" => {
            let u = user_url(base_url, false)?;
            Endpoint { base: u.to_string(), auth: Auth::None, key_required: false, local: true }
        }
        _ => return Err(format!("fournisseur inconnu : {provider}")),
    })
}

fn entry(provider: &str) -> Result<keyring::Entry, String> {
    keyring::Entry::new(SERVICE, provider).map_err(|e| format!("trousseau indisponible : {e}"))
}

fn read_key(provider: &str) -> Result<Option<String>, String> {
    match entry(provider)?.get_password() {
        Ok(k) => Ok(Some(k)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(format!("lecture du trousseau impossible : {e}")),
    }
}

#[tauri::command]
pub fn ai_key_set(provider: String, key: String) -> Result<(), String> {
    if !KEY_PROVIDERS.contains(&provider.as_str()) {
        return Err(format!("fournisseur inconnu : {provider}"));
    }
    let key = key.trim();
    if key.is_empty() || key.len() > 512 || key.chars().any(|c| c.is_whitespace() || c.is_control()) {
        return Err("clé vide ou mal formée".into());
    }
    entry(&provider)?.set_password(key).map_err(|e| format!("écriture dans le trousseau impossible : {e}"))
}

#[tauri::command]
pub fn ai_key_delete(provider: String) -> Result<(), String> {
    match entry(&provider)?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(format!("suppression impossible : {e}")),
    }
}

#[tauri::command]
pub fn ai_key_present(provider: String) -> Result<bool, String> {
    Ok(read_key(&provider)?.is_some())
}

#[derive(Serialize)]
pub struct AiResponse {
    status: u16,
    body: String,
}

#[tauri::command]
pub async fn ai_request(
    provider: String,
    base_url: Option<String>,
    method: String,
    path: String,
    body: Option<String>,
) -> Result<AiResponse, String> {
    let ep = endpoint(&provider, base_url)?;
    if !ALLOWED_PATHS.contains(&path.as_str()) {
        return Err(format!("chemin refusé : {path}"));
    }
    let key = match ep.auth {
        Auth::None => None,
        _ => read_key(&provider)?,
    };
    if ep.key_required && key.is_none() {
        return Err("aucune clé API enregistrée pour ce fournisseur".into());
    }
    // Un modèle local sur processeur peut mettre plusieurs minutes à répondre
    let timeout = Duration::from_secs(if ep.local { 600 } else { 120 });
    let client = reqwest::Client::builder()
        .timeout(timeout)
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|e| e.to_string())?;
    let url = format!("{}{}", ep.base.trim_end_matches('/'), path);
    let mut req = match method.as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url).header("content-type", "application/json").body(body.unwrap_or_default()),
        _ => return Err(format!("méthode refusée : {method}")),
    };
    req = match (&ep.auth, key) {
        (Auth::Anthropic, Some(k)) => req.header("x-api-key", k).header("anthropic-version", "2023-06-01"),
        (Auth::Bearer, Some(k)) => req.bearer_auth(k),
        _ => req,
    };
    let res = req.send().await.map_err(|e| {
        if e.is_timeout() {
            "délai dépassé".to_string()
        } else if e.is_connect() {
            "connexion impossible".to_string()
        } else {
            e.to_string()
        }
    })?;
    let status = res.status().as_u16();
    let body = res.text().await.map_err(|e| e.to_string())?;
    Ok(AiResponse { status, body })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adresses_autorisees() {
        assert!(endpoint("anthropic", Some("https://evil.example".into())).unwrap().base.starts_with("https://api.anthropic.com"));
        assert!(endpoint("ollama", Some("http://localhost:11434/v1".into())).is_ok());
        assert!(endpoint("ollama", Some("http://192.168.1.10:11434/v1".into())).is_err());
        assert!(endpoint("ollama", Some("https://example.com/v1".into())).is_err());
        assert!(endpoint("compatible", Some("https://example.com/v1".into())).is_ok());
        assert!(endpoint("compatible", Some("http://example.com/v1".into())).is_err());
        assert!(endpoint("inconnu", None).is_err());
    }
}
