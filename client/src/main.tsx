import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

function removeReplitBadge() {
  const selectors = [
    '[data-replit-feedback]',
    'iframe[src*="replit"]',
    'div[class*="replit-badge"]',
    'div[class*="replit-ui-theme-root"]',
    'div[class*="replit-lite-badge"]',
    '#replit-badge',
    '.replit-badge',
    'a[href*="replit.com/refer"]',
    'div[id*="replit"]',
    'body > iframe',
  ];
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => el.remove());
  });
  document.querySelectorAll('body > div:not(#root)').forEach(el => {
    if (!el.id && !el.className) el.remove();
  });
}

const observer = new MutationObserver(removeReplitBadge);
observer.observe(document.body, { childList: true, subtree: true });
setInterval(removeReplitBadge, 1000);
setTimeout(() => removeReplitBadge(), 0);

createRoot(document.getElementById("root")!).render(<App />);
