// Sermon audio player. Plyr is concatenated ahead of this file (global `Plyr`).
(function () {
  var el = document.querySelector('audio');
  if (!el || typeof Plyr === 'undefined') return;

  var player = new Plyr(el, {
    iconUrl: '/assets/plyr.svg',
    controls: ['play', 'rewind', 'progress', 'current-time', 'duration', 'fast-forward', 'mute', 'volume', 'settings', 'download'],
    settings: ['speed'],
    speed: { selected: 1, options: [1, 1.25, 1.5, 1.75, 2] },
    seekTime: 15,
  });

  // Clicking a transcript timestamp seeks the player.
  document.addEventListener('click', function (e) {
    var link = e.target.closest('.seek');
    if (!link) return;
    e.preventDefault();
    player.currentTime = parseFloat(link.dataset.t) || 0;
    player.play();
  });
})();
