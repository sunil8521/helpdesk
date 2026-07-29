(function () {
  if (document.getElementById("ai-widget-root")) return;

  // 1. Locate script and parse workspace ID
  const script = document.currentScript || document.querySelector("script[data-workspace-id]");
  if (!script) {
    console.error("[Helpdesk Widget] Script tag missing data-workspace-id attribute.");
    return;
  }

  const workspaceId = script.getAttribute("data-workspace-id") || script.getAttribute("data-helpdesk-workspace-id");
  const userEmail = script.getAttribute("data-user-email");
  const userName = script.getAttribute("data-user-name");
  const baseUrl = new URL(script.src).origin;

  // 2. Inject responsive widget wrapper container
  const container = document.createElement("div");
  container.id = "ai-widget-root";
  Object.assign(container.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: "2147483647", // Maximum 32-bit integer z-index
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    overflow: "hidden",
    boxShadow: "none",
    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    background: "transparent",
  });

  // 3. Mount Isolated Iframe App
  const iframe = document.createElement("iframe");
  
  let iframeUrl = `${baseUrl}/widget/embed?workspaceId=${workspaceId}`;
  if (userEmail) iframeUrl += `&email=${encodeURIComponent(userEmail)}`;
  if (userName) iframeUrl += `&name=${encodeURIComponent(userName)}`;
  
  iframe.src = iframeUrl;
  Object.assign(iframe.style, {
    width: "100%",
    height: "100%",
    border: "none",
    borderRadius: "50%",
    background: "transparent",
  });

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
        container.style.overflow = "hidden";
        container.style.boxShadow = "0 24px 60px -12px rgba(0,0,0,0.25)";
      } else {
        container.style.width = "60px";
        container.style.height = "60px";
        container.style.borderRadius = "50%";
        iframe.style.borderRadius = "50%";
        container.style.overflow = "hidden";
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
