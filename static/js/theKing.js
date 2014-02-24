(function($) {
   $.ajax({
      url : '/swf/theKing.swf'
   });

   $(['theKingBlur.jpg',
      'macHDBlur.jpg',
      'macHDFocus.jpg']).each(function() {
         $('<img />')[0].src = '/img/' + this;
      });

   $('#the-king-window').draggable();

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
      if (e.target.id !== 'the-king-window' && e.target.id !== 'king-animation') {
         flicker('the-king-blur', 50, 450);
      }
   });
}(jQuery));
