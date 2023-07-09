Promise.all(
  Array.from(document.images)
    .filter(img => !img.complete)
    .map(img =>
      new Promise(resolve => {
        img.onload = img.onerror = resolve;
      })
    )
).then(() => {
  var msnry = new Masonry('#content .row:not(.no-masonry)', {
    itemSelector: '.col',
  });
});
