// Embedded in another page (the portfolio shows this piece in a live frame), the piece's own links replace the frame's
// page in history instead of adding to it, so the host page's Back button leaves the host page rather than stepping
// back through this frame. Opened on its own, nothing changes.
(function () {
  if (window.self === window.top) return;
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    var url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    e.preventDefault();
    window.location.replace(url.href);
  });
})();
