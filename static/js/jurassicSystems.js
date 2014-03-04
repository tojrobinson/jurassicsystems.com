(function($, sm) {
   var jpTerminal = (function() {
      var env = {
             active: null,
             accessAttempts: 0,
             maxIndex: 1,
             musicOn: false,
             commands: {},
             sounds: {}
          },
          api = {};

      api.buildCommandLine = function(line) {
         var commandName = line.trim().split(/ /)[0],
             command = env.commands[commandName];

         $('#' + env.active).find('.command-history').append($('<div class="entered-command"/>').text('> ' + line));

         if (command) {
            command(env, line);
         } else if (commandName) {
            $('#' + env.active).find('.command-history').append($('<div/>').text(commandName + ': command not found'));
         }
      }

      api.addCommand = function(name, command) {
         if (name && !env.commands.hasOwnProperty(name) && (command.constructor = Function)) {
            env.commands[name] = command;
         }
      }

      api.activeTerminal = function(active) {
         env.active = active || env.active;
         return env.active;
      }

      api.nextIndex = function() {
         return ++env.maxIndex;
      }

      api.init = function() {
         // HTML5 audio element detection
         if (Modernizr.audio.mp3 || Modernizr.audio.wav || Modernizr.audio.ogg) {
            var beepHTML5 = $('<audio preload="auto"/>'),
                lockDownHTML5 = $('<audio preload="auto"/>'),
                dennisMusicHTML5 = $('<audio preload="auto"/>');

            beepHTML5.append('<source src="/snd/beep.ogg">');
            beepHTML5.append('<source src="/snd/beep.mp3">');
            beepHTML5.append('<source src="/snd/beep.wav">');

            lockDownHTML5.append('<source src="/snd/lockDown.ogg">');
            lockDownHTML5.append('<source src="/snd/lockDown.mp3">');
            lockDownHTML5.append('<source src="/snd/lockDown.wav">');

            dennisMusicHTML5.append('<source src="/snd/dennisMusic.ogg">');
            dennisMusicHTML5.append('<source src="/snd/dennisMusic.mp3">');
            dennisMusicHTML5.append('<source src="/snd/dennisMusic.wav">');

            env.sounds.beep = {
               play: function() {
                  beepHTML5[0].load();
                  beepHTML5[0].play();
               }
            };

            env.sounds.lockDown = {
               play: function() {
                  lockDownHTML5[0].load();
                  lockDownHTML5[0].play();
               }
            };

            env.sounds.dennisMusic = {
               play: function() {
                  dennisMusicHTML5[0].load();
                  dennisMusicHTML5[0].play();
               },
               stop: function() {
                  dennisMusicHTML5[0].pause();
               }
            };

            dennisMusicHTML5.bind('ended', function() {
               env.sounds.dennisMusic.play();
            });
         }  else {
            sm.setup({ 
               url: '/swf/soundManager/',
               onready: function() {
                  env.sounds.beep = sm.createSound({
                     id: 'beep',
                     autoLoad: true,
                     url: '/snd/beep.mp3'
                  });

                  env.sounds.lockDown = sm.createSound({
                     id: 'lockDown',
                     autoLoad: true,
                     url: '/snd/lockDown.mp3'
                  });

                  env.sounds.dennisMusic = sm.createSound({
                     id: 'dennisMusic',
                     autoLoad: true,
                     url: '/snd/dennisMusic.mp3',
                     onfinish: function() {
                        sm.play('dennisMusic');
                     }
                  });
               }
            });
         }
      }

      return api;
   }());

   jpTerminal.init();
   jpTerminal.activeTerminal('main-terminal');

   jpTerminal.addCommand('music', function(env, inputLine) {
      var arg = inputLine.split(/ +/)[1] || '',
          output = $('<span/>').text('music: must specify state [on|off]');

      if (arg) {
         if (arg.toLowerCase() === 'on') {
            if (!env.musicOn) {
               env.sounds.dennisMusic.play();
            }
            env.musicOn = true;
         } else if (arg.toLowerCase() === 'off') {
            env.sounds.dennisMusic.stop();
            env.musicOn = false;
         } else {
            $('#main-input').append(output);
         }
      } else {
         $('#main-input').append(output);
      }
   });

   jpTerminal.addCommand('access', function(env, inputLine) {
      var output = $('<span/>').text('access: PERMISSION DENIED'),
          arg = inputLine.split(/ +/)[1] || '',
          magicWord = inputLine.trim().substring(inputLine.lastIndexOf(' '));

      if (arg === '') {
         $('#main-input').append($('<span/>').text('access: must specify target system'));

         return;
      } else if (inputLine.split(' ').length > 2 && magicWord.trim() === 'please') {
         $('#main-input').append($('<img id="asciiNewman" src="/img/asciiNewman.jpg" />'));
         $('#asciiNewman').load(function() {
            $('#' + env.active + ' .inner-wrap').scrollTop($('#' + env.active + ' .inner-wrap')[0].scrollHeight);
         });

         return;
      }

      $('#main-input').append(output);
      env.sounds.beep.play();

      if (++env.accessAttempts >= 3) {
         var andMessage = $('<span/>').text('...and....'),
             errorSpam;

         $('.irix-window').unbind('keydown');
         $('#main-prompt').addClass('hide');

         setTimeout(function() {
            $('#main-input').append(andMessage);
         }, 200);

         setTimeout(function() {
            env.sounds.lockDown.play();
         }, 1000);

         setTimeout(function() {
            $('#environment').animate({'left': '+=3000'}, 
               2000, 
               function() {
                  setTimeout(function() {
                     $('#irix-desktop').hide();
                     if (errorSpam) {
                        clearInterval(errorSpam);
                     }

                     $('#the-king-window').ready(function() {
                        $('#mac-hd-window').css('background-image', 'url(/img/macHDBlur.jpg)');
                        $('#the-king-window').show();
                        if ($(window).width() < 1200) {
                           setTimeout(function() {
                              $('#home-key').css('z-index', '64000');
                           }, 10000);
                        }
                     });
                  }, 2000);
               });
         }, 4000);

         setTimeout(function() {
            errorSpam = setInterval(function() {
               var errorMessage = $('<div>YOU DIDN\'T SAY THE MAGIC WORD!</div>');
               $('#main-input').append(errorMessage);
               $('#main-inner').scrollTop($('#main-inner')[0].scrollHeight);
            }, 50);
         }, 1000);
      }
   });

   jpTerminal.addCommand('system', function(env, inputLine) {
      var arg = inputLine.split(/ +/)[1] || '',
          output = '<span>system: must specify target system</span>';

      if (arg.length > 0) {
         arg = arg.replace(/s$/, '');
         arg = arg[0].toUpperCase() + arg.slice(1);
         arg = $('<div/>').text(arg).html();
         
         output = '<div>' + arg + ' containment enclosure....</div>' +
                  '<table id="system-output"><tbody>' +
                  '<tr><td>Security</td><td>[OK]</td></tr>' +
                  '<tr><td>Fence</td><td>[OK]</tr>' +
                  '<tr><td>Feeding Pavilion</td><td>[OK]</td></tr>' +
                  '</tbody></table>';

         $('#main-prompt').addClass('hide');
         $('#main-input').append($(output));
         output = '<div>System Halt!</div>';
         env.sounds.beep.play();

         setTimeout(function() {
            env.sounds.beep.play();
            $('#main-input').append($(output));
            $('#' + env.active + ' .inner-wrap').scrollTop($('#' + env.active + ' .inner-wrap')[0].scrollHeight);
            $('#main-prompt').removeClass('hide');
         }, 900);
      } else {
         $('#main-input').append($(output));
      }
   });

   jpTerminal.addCommand('ls', function(env, inputLine) {
      $('#main-input').append($('<div>zebraGirl.jpg</div>'));
   });

   jpTerminal.addCommand('display', function(env, inputLine) {
      var args = inputLine.trim().split(' ');

      if (args.length < 2) {
         $('#main-input').append($('<span>display: no file specified</span>'));
         return;
      }

      if (inputLine.match(/zebraGirl\.jpg/)) {
         setTimeout(function() {
            $('#zebra-girl').css('z-index', ++env.maxIndex);
            $('#zebra-girl').show();
            $('#main-buffer').blur();
            blurAllWindows();
         }, 300);
      }
   });

   jpTerminal.addCommand('help', function(env, inputLine) {
      Object.keys(env.commands).sort().forEach(function(command) {
         $('#' + env.active).find('.command-history').append($('<div>' + command + '</div>'));
      });
   });

   // helpers
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

   var blurAllWindows = function() {
      $('.irix-window').each(function() {
         $('#' + $(this).attr('id').split('-')[0] + '-cursor').removeClass('active-cursor');
      });
   }

   $(document).ready(function() {
      // init
      $('.irix-window').draggable();
      $('.mac-window').draggable();

      // attempt to cache objects
      $(['introBackground.png',
         'theKingBlur.jpg',
         'theKingFocus.jpg',
         'macHDBlur.jpg',
         'asciiNewman.jpg',
         'zebraGirlWindow.jpg']).each(function() {
            new Image().src = '/img/' + this;
         });

      $.ajax({
         url : '/swf/theKing.swf'
      });

      // remove boot screen
      setTimeout(function() {
         $('#irix-boot').remove();
         $('#main-buffer').focus();

         if (!location.pathname.match(/system/)) {
            $('#intro').show();
            $('#intro').click(function() {
               $(this).fadeOut(1000);
               $('#intro-scene').attr('src', '');
            });
         }
      }, 4500);

      // listeners
      $('.buffer').blur(function() {
         $('#' + $(this).attr('id').split('-')[0] + '-cursor').removeClass('active-cursor');
      });

      $('.irix-window').mousedown(function() {
         blurAllWindows();
         var activeId = jpTerminal.activeTerminal($(this).attr('id')),
             activeTerminal = $('#' + activeId),
             maxIndex = jpTerminal.nextIndex(),
             buffer = activeTerminal.find('.buffer');

         if (buffer.length) {
            buffer.focus();
         } else {
            $('.buffer').blur();
         }

         $(this).css('z-index', maxIndex);
         activeTerminal.find('.cursor').addClass('active-cursor');
      });

      $(window).keydown(function(e) {
         if ([37, 38, 39, 40].indexOf(e.keyCode || e.which) > -1) {
            e.preventDefault();
         }
      });

      $('.irix-window').keydown(function(e) {
         var key = e.keyCode || e.which,
             activeId = jpTerminal.activeTerminal(),
             activeTerminal = $('#' + activeId),
             innerWrap = activeTerminal.find('.inner-wrap');

         // if enter
         if (key === 13) {
            var line = activeTerminal.find('.buffer').val();
            activeTerminal.find('.buffer').val('');

            if (activeId === 'chess-terminal') {
               $('#curr-chess-input').html('');
               activeTerminal.find('.command-history').append($('<div class="entered-command"/>').text(line || ' '));
            } else {
               $('#curr-main-input').html('');
               jpTerminal.buildCommandLine(line);
            }
         }

         innerWrap.scrollTop(innerWrap[0].scrollHeight);
      });

      $('#main-terminal .buffer').bind('input propertychange', function(e) {
         var input = $(this).val();
         $('#curr-main-input').text(input);
      });

      $('#chess-terminal .buffer').bind('input propertychange', function(e) {
         var input = $(this).val();
         $('#curr-chess-input').text(input);
      });

      $('#apple-desktop').click(function(e){
         if ($(this).attr('id') !== 'the-king-window' && $(this).attr('id') !== 'king-animation') {
            flicker('the-king-blur', 50, 450);
         }
      });
   });
}(jQuery, soundManager));
