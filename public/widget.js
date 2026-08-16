(function () {
  if (document.getElementById("ai-widget-root")) return;

  // 1. Locate script and parse workspace ID
  const script = document.currentScript || document.querySelector("script[data-workspace-id]");
  if (!script) {
    console.error("[Helpdesk Widget] Script tag missing data-workspace-id attribute.");
    return;
  }

  const workspaceId = script.getAttribute("data-workspace-id") || script.getAttribute("data-helpdesk-workspace-id");
  const baseUrl = script.getAttribute("data-backend-url") || new URL(script.src).origin;

  // 2. Inject responsive widget wrapper container
  const container = document.createElement("div");
  container.id = "ai-widget-root";
  Object.assign(container.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: "2147483647", // Maximum 32-bit integer z-index
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    overflow: "hidden",
    boxShadow: "none",
    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    background: "transparent",
  });

  // 3. Mount Isolated Iframe App
  const iframe = document.createElement("iframe");
  
  let iframeUrl = `${baseUrl}/widget/embed?workspaceId=${workspaceId}`;
  
  iframe.src = iframeUrl;
  Object.assign(iframe.style, {
    width: "100%",
    height: "100%",
    border: "none",
    borderRadius: "50%",
    background: "transparent",
  });

  // Add Loader Spinner
  const loader = document.createElement("div");
  Object.assign(loader.style, {
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    borderRadius: "50%",
    transition: "opacity 0.5s ease",
    zIndex: "5"
  });

  const style = document.createElement("style");
  style.textContent = `
    .spinner {
      position: relative;
      width: 9px;
      height: 9px;
    }

    .spinner div {
      position: absolute;
      width: 50%;
      height: 150%;
      background: #005CB5;
      transform: rotate(calc(var(--rotation) * 1deg)) translate(0, calc(var(--translation) * 1%));
      animation: spinner-fzua35 1s calc(var(--delay) * 1s) infinite ease;
    }

    .spinner div:nth-child(1) { --delay: 0.1; --rotation: 36; --translation: 150; }
    .spinner div:nth-child(2) { --delay: 0.2; --rotation: 72; --translation: 150; }
    .spinner div:nth-child(3) { --delay: 0.3; --rotation: 108; --translation: 150; }
    .spinner div:nth-child(4) { --delay: 0.4; --rotation: 144; --translation: 150; }
    .spinner div:nth-child(5) { --delay: 0.5; --rotation: 180; --translation: 150; }
    .spinner div:nth-child(6) { --delay: 0.6; --rotation: 216; --translation: 150; }
    .spinner div:nth-child(7) { --delay: 0.7; --rotation: 252; --translation: 150; }
    .spinner div:nth-child(8) { --delay: 0.8; --rotation: 288; --translation: 150; }
    .spinner div:nth-child(9) { --delay: 0.9; --rotation: 324; --translation: 150; }
    .spinner div:nth-child(10) { --delay: 1; --rotation: 360; --translation: 150; }

    @keyframes spinner-fzua35 {
      0%, 10%, 20%, 30%, 50%, 60%, 70%, 80%, 90%, 100% {
        transform: rotate(calc(var(--rotation) * 1deg)) translate(0, calc(var(--translation) * 1%));
      }
      50% {
        transform: rotate(calc(var(--rotation) * 1deg)) translate(0, calc(var(--translation) * 1.5%));
      }
    }
  `;
  document.head.appendChild(style);
  loader.innerHTML = `
    <div class="spinner">
      <div></div><div></div><div></div><div></div><div></div>
      <div></div><div></div><div></div><div></div><div></div>
    </div>
  `;

  iframe.onload = () => {
    loader.style.opacity = "0";
    setTimeout(() => loader.remove(), 500);
  };

  container.appendChild(loader);
  container.appendChild(iframe);
  document.body.appendChild(container);

  // 4. Listen for postMessage events from iframe
  window.addEventListener("message", (event) => {
    if (event.origin !== baseUrl) return;

    const { type, payload } = event.data || {};
    if (type === "WIDGET_RESIZE") {
      if (payload?.isExpanded) {
        container.style.width = "380px";
        container.style.height = "580px";
        container.style.borderRadius = "24px";
        iframe.style.borderRadius = "24px";
        container.style.boxShadow = "0 24px 60px -12px rgba(0,0,0,0.25)";
      } else if (payload?.showPopup) {
        container.style.width = "340px";
        container.style.height = "160px";
        container.style.borderRadius = "24px";
        iframe.style.borderRadius = "24px";
        container.style.boxShadow = "none";
      } else {
        container.style.width = "80px";
        container.style.height = "80px";
        container.style.borderRadius = "50%";
        iframe.style.borderRadius = "24px"; 
        container.style.boxShadow = "none";
      }

      if (payload?.position === "left") {
        container.style.right = "auto";
        container.style.left = "20px";
      } else if (payload?.position === "right") {
        container.style.left = "auto";
        container.style.right = "20px";
      }
    }
  });
})();
