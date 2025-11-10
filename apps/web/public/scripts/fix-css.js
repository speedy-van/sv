(function () {
  'use strict';

  function ensureEmotionStyles() {
    try {
      var emotionStyles = document.querySelectorAll('style[data-emotion]');
      var head = document.head || document.getElementsByTagName('head')[0];

      emotionStyles.forEach(function (style) {
        if (style.parentNode !== head) {
          head.appendChild(style);
        }
        if (!style.getAttribute('type')) {
          style.setAttribute('type', 'text/css');
        }
      });
    } catch (error) {
      console.warn('Error ensuring Emotion styles', error);
    }
  }

  function fixCssAsScripts() {
    try {
      var scripts = document.querySelectorAll('script[src*=".css"]');
      scripts.forEach(function (script) {
        var src = script.getAttribute('src');
        if (src && (src.endsWith('.css') || src.indexOf('/css/') !== -1)) {
          script.type = 'text/css';
          var existingLink = document.querySelector('link[href="' + src + '"]');
          if (!existingLink) {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = src;
            link.type = 'text/css';
            link.crossOrigin = 'anonymous';
            (document.head || document.getElementsByTagName('head')[0]).appendChild(link);
          }
          script.removeAttribute('src');
          script.remove();
        }
      });
    } catch (error) {
      console.warn('Error normalising CSS scripts', error);
    }
  }

  function schedule(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  schedule(ensureEmotionStyles);
  schedule(fixCssAsScripts);

  if (typeof window !== 'undefined' && window.MutationObserver) {
    var observer = new MutationObserver(function (mutations) {
      var shouldEnsure = false;
      var shouldFix = false;

      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (
            node.tagName === 'STYLE' &&
            node.getAttribute('data-emotion')
          ) {
            shouldEnsure = true;
          }
          if (
            node.tagName === 'SCRIPT' &&
            node.getAttribute('src') &&
            (node.getAttribute('src').endsWith('.css') ||
              node.getAttribute('src').indexOf('/css/') !== -1)
          ) {
            shouldFix = true;
          }
        });
      });

      if (shouldEnsure) {
        ensureEmotionStyles();
      }
      if (shouldFix) {
        fixCssAsScripts();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }
})();

