(function($) {
   $.ajax({
      url : '/swf/theKing.swf'
   });

   $(['theKingBlur.jpg',
      'macHDBlur.jpg',
      'macHDFocus.jpg']).each(function() {
         $('<img />')[0].src = '/img/' + this;
      });

   (function() {
      var diffX = 0;
      var diffY = 0;

      $('.window-bar').mousedown(function(e) {
         var dragging = $(this).parent()
                               .addClass('dragging');
         diffY = e.pageY - dragging.offset().top;
         diffX = e.pageX - dragging.offset().left;
      });

      $('body').mousemove(function(e) {
         $('.dragging').offset({
            top: e.pageY - diffY,
            left: e.pageX - diffX 
         });
      });
   }());

   $('body').mouseup(function(e) {
      $('.dragging').removeClass('dragging');
   });

   $('#the-king-window').ready(function() {
      setTimeout(function() {
         $('#mac-hd-window').css('background-image', 'url(/img/macHDBlur.jpg)');
         $('#the-king-window').show();

         if ($(window).width() < 1200) {
            setTimeout(function() {
               $('#home-key').css('z-index', '64000');
            }, 10000);
         }

      }, 2500);
   });

   var flicker = function(altId, interval, duration) {
      var visible = true,
          alt = $('#' + altId),
          flickering = setInterval(function() {
             if (visible) {
                alt.css('opacity', '1');
             } else {
                alt.css('opacity', '0');
             }

             visible = !visible;
          }, interval);

      setTimeout(function() {
         clearInterval(flickering);
         alt.css('opacity', '0');
      }, duration);
   }

   $('#apple-desktop').click(function(e){
      var isKing = $(e.target).closest('#the-king-window').length;

      if (!isKing) {
         flicker('the-king-blur', 50, 450);
      }
   });
}(jQuery));
