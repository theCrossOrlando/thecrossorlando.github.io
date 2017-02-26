(function($) {
  $(window).on('load', function() {
    $('#content .row').masonry({
      itemSelector: '.column'
    });
  });
})(jQuery);
