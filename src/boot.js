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

requestAnimationFrame(() => {
  setTimeout(async () => {
    await deferredStylesheetsReady();
    await import("./main.jsx");
  }, 0);
});
