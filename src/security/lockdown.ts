/**
 *  Production Security Lockdown
 * Blocks Lovable editor, badge, iframe, scripts & reinjections
 * Use ONLY in production builds
 */


const FORBIDDEN_DOMAINS = [
  'lovable.dev',
  'lovable.app',
];

export function initSecurityLockdown(): void {
  // Run only in production
  if (import.meta.env?.MODE !== 'production') return;

  clearEditorStorage();
  blockEditorQueryParams();
  injectKillCSS();
  setupMutationObserver();
  blockScriptInjection();

  // Extra safety: periodic cleanup
  removeLovableHard();
  setInterval(removeLovableHard, 1000);
}

/* ---------------------------------- */
/* Storage Cleanup */
/* ---------------------------------- */
function clearEditorStorage(): void {
  try {
    const keys = [
      'lovable',
      'editor',
      'lovable-editor',
      'lovable_mode',
      'lovableEditor',
    ];

    keys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  } catch {
    // ignore
  }
}

/* ---------------------------------- */
/* URL Query Param Cleanup */
/* ---------------------------------- */
function blockEditorQueryParams(): void {
  try {
    const url = new URL(window.location.href);
    const params = ['editor', 'lovable', 'edit', 'lovable_mode'];

    let changed = false;
    params.forEach(p => {
      if (url.searchParams.has(p)) {
        url.searchParams.delete(p);
        changed = true;
      }
    });

    if (changed) {
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  } catch {
    // ignore
  }
}

/* ---------------------------------- */
/* HARD DOM REMOVAL */
/* ---------------------------------- */
function removeLovableHard(): void {
  const selectors = [
    '[class*="lovable"]',
    '[id*="lovable"]',
    '[data-lovable]',
    'iframe[src*="lovable"]',
    'a[href*="lovable"]',
    'script[src*="lovable"]',
  ];

  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Text based removal (Edit with Lovable)
  document.querySelectorAll('*').forEach(el => {
    if (
      el.textContent &&
      el.textContent.toLowerCase().includes('edit with lovable')
    ) {
      el.remove();
    }
  });
}

/* ---------------------------------- */
/* Mutation Observer (Re-Injection Block) */
/* ---------------------------------- */
function setupMutationObserver(): void {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return;

        const text = node.textContent?.toLowerCase() || '';
        const cls = node.className?.toLowerCase() || '';
        const id = node.id?.toLowerCase() || '';

        // Inline regex check to avoid top-level keyword list
        const isForbidden = /lovable|gptengineer|gpt-engineer|lovable-tagger|lovable-badge/i.test(text + cls + id);

        const shouldRemove =
          isForbidden ||
          (node instanceof HTMLScriptElement &&
            FORBIDDEN_DOMAINS.some(d => node.src?.includes(d))) ||
          (node instanceof HTMLIFrameElement &&
            FORBIDDEN_DOMAINS.some(d => node.src?.includes(d)));

        if (shouldRemove) {
          node.remove();
          return;
        }

        // Shadow DOM check
        const anyNode = node as any;
        if (anyNode.shadowRoot) {
          anyNode.shadowRoot.querySelectorAll('*').forEach((el: HTMLElement) => {
            if (
              el.textContent?.toLowerCase().includes('lovable') ||
              el.getAttributeNames().some(a => a.includes('lovable'))
            ) {
              el.remove();
            }
          });
        }

        // iframe delayed src injection
        if (node instanceof HTMLIFrameElement) {
          setTimeout(() => {
            if (
              FORBIDDEN_DOMAINS.some(d =>
                node.src?.toLowerCase().includes(d)
              )
            ) {
              node.remove();
            }
          }, 100);
        }
      });
    });
  });

  const start = () =>
    observer.observe(document.body, { childList: true, subtree: true });

  document.body ? start() : document.addEventListener('DOMContentLoaded', start);
}

/* ---------------------------------- */
/* Script Injection Block */
/* ---------------------------------- */
function blockScriptInjection(): void {
  const originalAppendChild = Element.prototype.appendChild;

  Element.prototype.appendChild = function <T extends Node>(node: T): T {
    if (node instanceof HTMLScriptElement) {
      const src = node.src?.toLowerCase() || '';
      if (FORBIDDEN_DOMAINS.some(d => src.includes(d))) {
        console.warn('[Security] Blocked external script');
        return node;
      }
    }
    return originalAppendChild.call(this, node) as T;
  };
}

/* ---------------------------------- */
/* CSS Kill Switch (Fastest) */
/* ---------------------------------- */
function injectKillCSS(): void {
  const style = document.createElement('style');
  style.innerHTML = `
    [class*="lovable"],
    [id*="lovable"],
    [data-lovable],
    iframe[src*="lovable"],
    a[href*="lovable"] {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(style);
}
