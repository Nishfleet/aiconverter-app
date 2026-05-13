(async function setupSupportTurnstile() {
  const container = document.querySelector("[data-turnstile-support]");
  if (!container) return;

  const config = await fetch("/api/config").then((response) => response.json()).catch(() => ({}));
  if (!config.turnstileSiteKey) {
    container.remove();
    return;
  }

  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  script.async = true;
  script.defer = true;
  script.onload = () => {
    window.turnstile?.render(container, {
      sitekey: config.turnstileSiteKey,
      theme: "auto",
      size: "flexible"
    });
  };
  document.head.appendChild(script);
})();
