"use client";

import { useEffect } from "react";

const blockedDomains = [
  "adservice.google.com",
  "doubleclick.net",
  "pix04.revsci.net",
];

function getUrlFromRequest(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.href;
  }

  if (input instanceof Request) {
    return input.url;
  }

  return "";
}

function shouldBlock(url: string): boolean {
  return blockedDomains.some((domain) =>
    url.includes(domain)
  );
}

export default function ClientAdBlocker() {
  useEffect(() => {
    function removeBlockedElements() {
      document
        .querySelectorAll<HTMLScriptElement>(
          "script[src]"
        )
        .forEach((script) => {
          if (shouldBlock(script.src)) {
            script.remove();

            console.log(
              "🚫 Script bloqueado:",
              script.src
            );
          }
        });

      document
        .querySelectorAll<HTMLIFrameElement>(
          "iframe[src]"
        )
        .forEach((iframe) => {
          if (shouldBlock(iframe.src)) {
            iframe.remove();

            console.log(
              "🚫 Iframe bloqueado:",
              iframe.src
            );
          }
        });
    }

    /*
     * Intercepta fetchs feitos pela NOSSA página.
     */
    const originalFetch =
      window.fetch.bind(window);

    window.fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit
    ) => {
      const url =
        getUrlFromRequest(input);

      if (shouldBlock(url)) {
        console.log(
          "🚫 Fetch bloqueado:",
          url
        );

        return new Response("", {
          status: 204,
        });
      }

      return originalFetch(
        input,
        init
      );
    };

    /*
     * Observa novos elementos adicionados
     * ao BauerDutraFlix.
     */
    const observer =
      new MutationObserver(
        (mutations) => {
          for (const mutation of mutations) {
            mutation.addedNodes.forEach(
              (node) => {
                if (
                  !(node instanceof HTMLElement)
                ) {
                  return;
                }

                if (
                  node instanceof
                    HTMLScriptElement &&
                  shouldBlock(node.src)
                ) {
                  node.remove();

                  console.log(
                    "🚫 Novo script bloqueado:",
                    node.src
                  );

                  return;
                }

                if (
                  node instanceof
                    HTMLIFrameElement &&
                  shouldBlock(node.src)
                ) {
                  node.remove();

                  console.log(
                    "🚫 Novo iframe bloqueado:",
                    node.src
                  );
                }

                node
                  .querySelectorAll<
                    HTMLScriptElement |
                    HTMLIFrameElement
                  >(
                    "script[src], iframe[src]"
                  )
                  .forEach((element) => {
                    const src =
                      element instanceof
                      HTMLScriptElement
                        ? element.src
                        : element.src;

                    if (
                      src &&
                      shouldBlock(src)
                    ) {
                      element.remove();

                      console.log(
                        "🚫 Elemento bloqueado:",
                        src
                      );
                    }
                  });
              }
            );
          }
        }
      );

    removeBlockedElements();

    observer.observe(
      document.documentElement,
      {
        childList: true,
        subtree: true,
      }
    );

    return () => {
      observer.disconnect();

      window.fetch =
        originalFetch;
    };
  }, []);

  return null;
}