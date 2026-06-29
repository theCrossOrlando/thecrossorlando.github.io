function initMasonry() {
  var grid = document.querySelector('#content .row:not(.no-masonry)');
  if (!grid || typeof Masonry === 'undefined') return;

  var msnry = new Masonry(grid, { itemSelector: '.col' });

  // Images carry width/height attributes, so the grid lays out correctly
  // immediately. Re-layout as any lazy/async images finish so we never hang
  // waiting on images that load after init (which previously left the posts
  // stuck in a raw multi-column layout).
  Array.prototype.forEach.call(document.images, function (img) {
    if (!img.complete) {
      img.addEventListener('load', function () { msnry.layout(); });
      img.addEventListener('error', function () { msnry.layout(); });
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMasonry);
} else {
  initMasonry();
}

// Click a transcript timestamp to seek the sermon audio player.
document.addEventListener('click', function (e) {
  var link = e.target.closest('.seek');
  if (!link) return;
  e.preventDefault();
  var audio = document.querySelector('audio');
  if (!audio) return;
  audio.currentTime = parseFloat(link.dataset.t) || 0;
  audio.play().catch(function () {});
});
