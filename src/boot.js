import "./styles.css";

function deferredStylesheetsReady() {
  const links = [...document.querySelectorAll('link[rel="stylesheet"][media="print"]')];
  return Promise.all(
    links.map(
      (link) =>
        new Promise((resolve) => {
          const apply = () => {
            link.media = "all";
            resolve();
          };
          if (link.sheet) apply();
          else {
            link.addEventListener("load", apply, { once: true });
            link.addEventListener("error", apply, { once: true });
          }
        })
    )
  );
}

function startApp() {
  deferredStylesheetsReady().then(() => import("./main.jsx"));
}

function afterLoad() {
  if ("requestIdleCallback" in window) requestIdleCallback(startApp, { timeout: 2000 });
  else setTimeout(startApp, 200);
}

if (document.readyState === "complete") afterLoad();
else addEventListener("load", afterLoad, { once: true });
