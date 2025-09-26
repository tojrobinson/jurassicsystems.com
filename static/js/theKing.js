(function($) {
  const preloadImages = [
    'theKingBlur.jpg',
    'macHDBlur.jpg',
    'macHDFocus.jpg',
  ];

  $(function() {
    preloadImages.forEach(function(imageName) {
      const img = new Image();
      img.src = 'img/' + imageName;
    });

    let diffX = 0;
    let diffY = 0;

    $('.window-bar').on('mousedown', function(event) {
      const dragging = $(this).parent()
        .addClass('dragging');

      diffY = event.pageY - dragging.offset().top;
      diffX = event.pageX - dragging.offset().left;
    });

    $(document).on('mousemove', function(event) {
      $('.dragging').offset({
        top: event.pageY - diffY,
        left: event.pageX - diffX,
      });
    });

    $(document).on('mouseup', function() {
      $('.dragging').removeClass('dragging');
    });

    setTimeout(function() {
      const theKingVideo = document.getElementById('the-king-video');

      if (theKingVideo) {
        const playPromise = theKingVideo.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function() {
            // Some browsers require a user gesture before playback; ignore errors.
          });
        }
      }

      $('#mac-hd-window').css('background-image', 'url(img/macHDBlur.jpg)');
      $('#the-king-window').show();

      if ($(window).width() < 1200) {
        setTimeout(function() {
          $('#home-key').css('z-index', '64000');
        }, 10000);
      }
    }, 2500);

    const flicker = function(altId, interval, duration) {
      let visible = true;
      const alt = $('#' + altId);
      const flickering = setInterval(function() {
        alt.css('opacity', visible ? '1' : '0');
        visible = !visible;
      }, interval);

      setTimeout(function() {
        clearInterval(flickering);
        alt.css('opacity', '0');
      }, duration);
    };

    $('#apple-desktop').on('click', function(event) {
      const isKing = $(event.target).closest('#the-king-window').length;

      if (!isKing) {
        flicker('the-king-blur', 50, 450);
      }
    });
  });
}(jQuery));
