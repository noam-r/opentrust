(function () {
  'use strict';

  var sidebar  = document.getElementById('sidebar');
  var overlay  = document.getElementById('overlay');
  var menuBtn  = document.getElementById('menuBtn');

  // ── Mobile sidebar ──────────────────────────────────

  function openSidebar() {
    sidebar.classList.add('is-open');
    overlay.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
    menuBtn.setAttribute('aria-expanded', 'true');
  }

  function closeSidebar() {
    sidebar.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    document.body.style.overflow = '';
    menuBtn.setAttribute('aria-expanded', 'false');
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      sidebar.classList.contains('is-open') ? closeSidebar() : openSidebar();
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSidebar();
  });

  // ── Nav group collapsing ─────────────────────────────

  document.querySelectorAll('.nav-group-toggle').forEach(function (btn) {
    var group = btn.closest('.nav-group');
    var items = group && group.querySelector('.nav-group-items');
    if (!items) return;

    var isActive = group.classList.contains('active');

    // Collapsed by default; open if the group contains the active page
    if (!isActive) {
      items.style.display = 'none';
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      items.style.display = expanded ? 'none' : 'block';
    });
  });

  // ── Scroll active nav link into view ─────────────────

  var activeLink = document.querySelector('.nav-link.active');
  if (activeLink) {
    activeLink.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }

  // ── Search ────────────────────────────────────────────

  var searchInput   = document.getElementById('searchInput');
  var searchResults = document.getElementById('searchResults');
  var sidebarNav    = document.querySelector('.sidebar-nav');
  var searchReady   = false;
  var debounceTimer;

  if (searchInput && searchResults && typeof base_url !== 'undefined') {
    var searchWorker = new Worker(base_url + '/search/worker.js');

    searchWorker.postMessage({ init: true });

    searchWorker.onmessage = function (e) {
      if (e.data.allowSearch) {
        searchReady = true;
      }
      if (e.data.results !== undefined) {
        renderResults(e.data.results);
      }
    };

    searchInput.addEventListener('input', function () {
      var query = searchInput.value.trim();
      clearTimeout(debounceTimer);
      if (!query) {
        searchResults.hidden = true;
        sidebarNav.style.display = '';
        return;
      }
      debounceTimer = setTimeout(function () {
        if (searchReady) {
          searchWorker.postMessage({ query: query });
        }
      }, 200);
    });

    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        searchInput.value = '';
        searchResults.hidden = true;
        sidebarNav.style.display = '';
        searchInput.blur();
      }
    });

    function renderResults(results) {
      if (!results.length) {
        searchResults.innerHTML = '<div class="search-no-results">No results found.</div>';
        searchResults.hidden = false;
        sidebarNav.style.display = 'none';
        return;
      }
      var html = '';
      results.forEach(function (r) {
        var title = escapeHtml(r.title || 'Untitled');
        var loc   = r.location || '';
        html += '<a class="search-result-item" href="' + base_url + '/' + escapeAttr(loc) + '">';
        html += '<span class="search-result-title">' + title + '</span>';
        html += '</a>';
      });
      searchResults.innerHTML = html;
      searchResults.hidden = false;
      sidebarNav.style.display = 'none';
    }

    function escapeHtml(s) {
      var d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    }

    function escapeAttr(s) {
      return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }

  // ── Mermaid diagrams ──────────────────────────────────
  // MkDocs renders ```mermaid blocks as:
  //   <pre><code class="language-mermaid">…</code></pre>
  // or wrapped in a .highlight div by Pygments.
  // We extract the raw source, replace the block with a <div class="mermaid">,
  // then dynamically load Mermaid.js to render it.

  var mermaidLoaded = false;

  function initMermaid() {
    var mermaidBlocks = document.querySelectorAll('code.language-mermaid');
    if (mermaidBlocks.length === 0) return;

    mermaidBlocks.forEach(function (code) {
      var source = code.textContent;
      var div = document.createElement('div');
      div.className = 'mermaid';
      div.textContent = source;

      var wrapper = code.closest('.highlight') || code.closest('pre') || code;
      wrapper.parentNode.replaceChild(div, wrapper);
    });

    if (mermaidLoaded && window.mermaid) {
      window.mermaid.run({ querySelector: '.mermaid' });
    } else if (!mermaidLoaded) {
      mermaidLoaded = true;
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
      script.onload = function () {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
          fontSize: 15,
        });
        window.mermaid.run({ querySelector: '.mermaid' });
      };
      document.head.appendChild(script);
    }
  }

  // Run on initial load (works for unencrypted pages)
  initMermaid();

  // Re-run after encryptcontent plugin decrypts the page
  window.addEventListener('encryptcontent_event', function () {
    initMermaid();
  });

})();
