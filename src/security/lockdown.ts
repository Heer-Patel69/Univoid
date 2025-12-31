/**
 * Production Security Lockdown
 * Prevents any external editor/badge injection in production builds
 */

const FORBIDDEN_KEYWORDS = [
  'lovable',
  'edit with lovable',
  'lovable-tagger',
  'lovable-badge',
];

const FORBIDDEN_DOMAINS = [
  'lovable.dev/editor',
  'lovable.app/embed',
];

export function initSecurityLockdown(): void {
  // Only run in production
  if (import.meta.env.MODE !== 'production') {
    return;
  }

  // Clear any forced editor flags from storage
  clearEditorStorage();

  // Block editor query params
  blockEditorQueryParams();

  // Set up DOM mutation observer to block injected elements
  setupMutationObserver();

  // Block external script injection
  blockScriptInjection();
}

function clearEditorStorage(): void {
  try {
    const keysToRemove = ['lovable', 'editor', 'lovable-editor', 'lovable_mode'];
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  } catch {
    // Storage access may be blocked
  }
}

function blockEditorQueryParams(): void {
  try {
    const url = new URL(window.location.href);
    const editorParams = ['editor', 'lovable', 'edit', 'lovable_mode'];
    let hasEditorParam = false;

    editorParams.forEach(param => {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        hasEditorParam = true;
      }
    });

    if (hasEditorParam) {
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  } catch {
    // URL manipulation may fail
  }
}

function setupMutationObserver(): void {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          // Check for forbidden content
          const shouldRemove = 
            FORBIDDEN_KEYWORDS.some(keyword => 
              node.textContent?.toLowerCase().includes(keyword) ||
              node.className?.toLowerCase().includes(keyword) ||
              node.id?.toLowerCase().includes(keyword)
            ) ||
            (node instanceof HTMLScriptElement && 
              FORBIDDEN_DOMAINS.some(domain => node.src?.includes(domain))) ||
            (node instanceof HTMLIFrameElement && 
              FORBIDDEN_DOMAINS.some(domain => node.src?.includes(domain)));

          if (shouldRemove) {
            node.remove();
          }
        }
      });
    });
  });

  // Start observing once DOM is ready
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }
}

function blockScriptInjection(): void {
  // Override appendChild to block forbidden scripts
  const originalAppendChild = Element.prototype.appendChild;
  
  Element.prototype.appendChild = function<T extends Node>(node: T): T {
    if (node instanceof HTMLScriptElement) {
      const src = node.src?.toLowerCase() || '';
      if (FORBIDDEN_DOMAINS.some(domain => src.includes(domain))) {
        console.warn('[Security] Blocked external editor script injection');
        return node; // Return without appending
      }
    }
    return originalAppendChild.call(this, node) as T;
  };
}
