// OAuth configuration
export function getLoginUrl(): string {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  if (!oauthPortalUrl || !appId) {
    console.warn("[OAuth] VITE_OAUTH_PORTAL_URL or VITE_APP_ID not configured");
    return "/";
  }
  
  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("app_id", appId);
  url.searchParams.set("redirect_url", window.location.href);
  return url.toString();
}
