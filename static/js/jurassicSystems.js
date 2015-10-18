(function($, sm) {
   var jpTerminal = (function() {
      var env = {
             active: null,
             accessAttempts: 0,
             maxIndex: 1,
             musicOn: false,
             commands: {},
             sounds: {}
          };
      var api = {};

      api.buildCommandLine = function(line) {
         var commandName = line.trim().split(/ /)[0];
         var command = env.commands[commandName] && env.commands[commandName].command;

         env.active.find('.command-history')
                   .append($('<div class="entered-command">')
                   .text('> ' + line));

         if (command) {
            command(env, line);
         } else if (commandName) {
            env.active.find('.command-history')
                      .append($('<div>').text(commandName + ': command not found'));
         }
      }

      api.addCommand = function(details) {
         if (details.name && !env.commands.hasOwnProperty(details.name) && (details.command.constructor === Function)) {
            env.commands[details.name] = details;
         }
      }

      api.setActive = function(active) {
         env.active = $(active) || env.active;
      }

      api.getActive = function() {
         return env.active;
      }

      api.nextIndex = function() {
         return ++env.maxIndex;
      }

      api.init = function() {
         // HTML5 audio element detection
         if (Modernizr.audio.mp3 || Modernizr.audio.wav || Modernizr.audio.ogg) {
            var beepHTML5 = $('<audio preload="auto"/>');
            var lockDownHTML5 = $('<audio preload="auto"/>');
            var dennisMusicHTML5 = $('<audio preload="auto"/>');

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
   jpTerminal.setActive('#main-terminal');

   jpTerminal.addCommand({
      name: 'music',
      summary: 'turn background music on or off',
      manPage: 'SYNOPSIS\n' + 
               '\tmusic [on|off]\n\n' + 
               'DESCRIPTION\n' + 
               '\tManage the state of the \'Dennis Steals the Embryo\' music. Use the \'on\' state for\n\tincreased epicness.\n\n' +
               'AUTHOR\n' +
               '\tWritten by <a href="https://tully.io">Tully Robinson</a>.\n',
      command: function(env, inputLine) {
         var arg = inputLine.trim().split(/ +/)[1] || '';
         var output = $('<span/>').text('music: must specify state [on|off]');

         if (!arg || !arg.match(/^(?:on|off)$/i)) {
            $('#main-input').append(output);
         } else {
            if (arg.toLowerCase() === 'on') {
               if (!env.musicOn) {
                  env.sounds.dennisMusic.play();
               }
               env.musicOn = true;
            } else if (arg.toLowerCase() === 'off') {
               env.sounds.dennisMusic.stop();
               env.musicOn = false;
            }
         }
      }
   });

   jpTerminal.addCommand({
   name: 'access', 
      summary: 'access a target environment on the Jurassic Systems grid',
      manPage: 'SYNOPSIS\n' +
               '\taccess [SYSTEM_NAME] [MAGIC_WORD]\n\n' +
               'DESCRIPTION\n' + 
               '\tGain read and write access to a specified environment.\n\n' +
               'AUTHOR\n' +
               '\tWritten by Dennis Nedry.\n',
      command: function(env, inputLine) {
          var output = $('<span>').text('access: PERMISSION DENIED');
          var arg = inputLine.split(/ +/)[1] || '';
          var magicWord = inputLine.substring(inputLine.trim()
                                   .lastIndexOf(' ')) || '';

         if (arg === '') {
            $('#main-input').append($('<span/>')
                            .text('access: must specify target system'));

            return;
         } else if (inputLine.split(' ').length > 2 && magicWord.trim() === 'please') {
            $('#main-input').append($('<img id="asciiNewman" src="/img/asciiNewman.jpg" />'));
            $('#asciiNewman').load(function() {
               var wrap = $('.inner-wrap', env.active);
               wrap.scrollTop(wrap[0].scrollHeight);
            });

            return;
         }

         $('#main-input').append(output);
         env.sounds.beep.play();

         if (++env.accessAttempts >= 3) {
            var andMessage = $('<span>').text('...and....');
            var errorSpam;

            $('.irix-window').unbind('keydown');
            $('#main-prompt').addClass('hide');

            setTimeout(function() {
               $('#main-input').append(andMessage);
            }, 200);

            setTimeout(function() {
               env.sounds.lockDown.play();
            }, 1000);

            setTimeout(function() {
               $('#environment').animate({
                  'left': '+=3000'
               },
               2000,
               function() {
                  setTimeout(function() {
                     $('#irix-desktop').hide();
                     if (errorSpam) {
                        clearInterval(errorSpam);
                     }

                     $('#mac-hd-window').css('background-image', 'url(/img/macHDBlur.jpg)');
                     $('#the-king-window').show();
                     setTimeout(function() {
                        $('#home-key').css('z-index', '64000');
                     }, 10000);
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
      }
   });

   jpTerminal.addCommand({
      name: 'system',
      summary: 'check a system\'s current status',
      manPage: 'SYNOPSIS\n' +
               '\tsystem [SYSTEM_NAME]\n\n' +
               'DESCRIPTION\n' +
               '\tCheck the input system and return each sector\'s current status.\n\n' +
               'AUTHOR\n' +
               '\tWritten by Dennis Nedry.\n',
      command: function(env, inputLine) {
         var arg = inputLine.split(/ +/)[1] || '';
         var output = '<span>system: must specify target system</span>';

         if (arg.length > 0) {
            arg = arg.replace(/s$/, '');
            arg = arg[0].toUpperCase() + arg.slice(1);
            arg = $('<div/>').text(arg).html();
            
            output = '<div>' + arg + ' containment enclosure....</div>' +
                     '<table id="system-output"><tbody>' +
                     '<tr><td>Security</td><td>[OK]</td></tr>' +
                     '<tr><td>Fence</td><td>[OK]</td></tr>' +
                     '<tr><td>Feeding Pavilion</td><td>[OK]</td></tr>' +
                     '</tbody></table>';

            $('#main-prompt').addClass('hide');
            $('#main-input').append($(output));
            output = '<div>System Halt!</div>';
            env.sounds.beep.play();

            setTimeout(function() {
               var wrap = $('.inner-wrap', env.active);
               env.sounds.beep.play();
               $('#main-input').append($(output));
               wrap.scrollTop(wrap[0].scrollHeight);
               $('#main-prompt').removeClass('hide');
            }, 900);
         } else {
            $('#main-input').append($(output));
         }
      }
   });

   jpTerminal.addCommand({
      name: 'ls',
      summary: 'list files in the current directory',
      manPage: 'SYNOPSIS\n' + 
               '\tls [FILE] ...\n\n' +
               'DESCRIPTION\n' + 
               '\tList information about the FILEs (the current directory by default).\n\n' +
               'AUTHOR\n' +
               '\tWritten by Richard Stallman and David MacKenzie.\n',
      command: function(env, inputLine) {
         $('#main-input').append($('<div>zebraGirl.jpg</div>'));
      }
   });

   jpTerminal.addCommand({
      name: 'display',
      summary: 'display image files (hint: use ls to find a \'file\')',
      manPage: 'SYNOPSIS\n' +
               '\tdisplay file ...\n\n' +
               'DESCRIPTION\n' +
               '\tDisplay is a machine architecture independent image processing and display\n\tprogram. It can <strong>display</strong> an image on any workstation screen running an X server.\n\n' +
               'AUTHOR\n' +
               '\tJohn Cristy, ImageMagick Studio.\n',
      command: function(env, inputLine) {
         var args = inputLine.trim().split(' ');

         if (args.length < 2) {
            $('#main-input').append($('<span>display: no file specified</span>'));
            return;
         }

         if (inputLine.match(/zebraGirl\.jpg/)) {
            setTimeout(function() {
               $('#zebra-girl').css('z-index', ++env.maxIndex);
               $('#zebra-girl').show();
               blurAllWindows();
            }, 300);
         }
      }
   });

   jpTerminal.addCommand({
      name: 'keychecks',
      summary: 'display system level command history',
      manPage: 'SYNOPSIS\n' +
               '\tkeychecks\n\n' +
               'DESCRIPTION\n' +
               '\tA system level command log used for accountability purposes. keychecks must be\n\tactivated or deactivated via the main board.\n',
      command: function(env, inputLine) {
         var output = '13,42,121,32,88,77,19,13,44,52,77,90,13,99,13,100,13,109,55,103,144,13,99,87,60,13,44,12,09,13,43,63,13,46,57,89,103,122,13,44,52,88,931,13,21,13,57,98,100,102,103,13,112,13,146,13,13,13,77,67,88,23,13,13\n' +
            'system\n' +
            'nedry\n' +
            'go to command level\n' +
            'nedry\n' +
            '040/#xy/67&\n' +
            'mr goodbytes\n' +
            'security\n' +
            'keycheck off\n' +
            'safety off\n' +
            'sl off\n' +
            'security\n' +
            'whte_rbt.obj\n';

         $('#main-input').append(output);
      }
   });

   jpTerminal.addCommand({
      name: 'man',
      summary: 'display reference manual for a given command',
      manPage: 'SYNOPSIS\n' +
               '\tman title ...\n\n' +
               'DESCRIPTION\n' +
               '\tman locates and prints the titled entries from the on-line reference manuals.\n',
      command: function(env, inputLine) {
         var arg = inputLine.trim().split(/ +/)[1] || '';
         var output = 'What manual page do you want?';

         if (env.commands.hasOwnProperty(arg)) {
            output = env.commands[arg].manPage;
         } else if (arg) {
            output = 'No manual entry for ' + $('<div/>').text(arg).html();
         }

         $('#main-input').append(output);
      }
   });

   jpTerminal.addCommand({
      name: 'help', 
      summary: 'list available commands',
      manPage: 'SYNOPSIS\n' +
               '\thelp\n\n' +
               'DESCRIPTION\n' +
               '\tDisplay a command summary for Jurassic Systems.\n\n' +
               'AUTHOR\n' +
               '\tWritten by <a href="https://tully.io">Tully Robinson</a>.\n',
      command: function(env, inputLine) {
         for (var command in env.commands) {
            env.active.find('.command-history')
                      .append($('<div>').text(env.commands[command].name + ' - ' + env.commands[command].summary));
         }
      }
   });

   // helpers
   var flicker = function(altId, interval, duration) {
      var visible = true;
      var alt = $('#' + altId).show();
      var flickering = setInterval(function() {
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
         alt.hide()
      }, duration);
   }

   var blurAllWindows = function() {
      $('.cursor', '.irix-window').removeClass('active-cursor');
      $('.buffer').blur();
   }

   $(document).ready(function() {
      // attempt to cache objects
      $(['theKingBlur.jpg',
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
            $('#main-buffer').blur();
            $('#intro').show();
            $('#intro').click(function() {
               $(this).fadeOut(1000);
               $('#intro-scene').attr('src', '');
            });
         }
      }, 4500);

      $('body').click(blurAllWindows);

      (function() {
         var diffX = 0;
         var diffY = 0;

         $('.window-bar').mousedown(function(e) {
            var dragging = $(this).parent()
                                  .css('z-index', jpTerminal.nextIndex())
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
      
      $('.irix-window').click(function(e) {
         e.stopPropagation();
         blurAllWindows();

         jpTerminal.setActive(this);

         $('.buffer', this).focus();
         $(this).css('z-index', jpTerminal.nextIndex());
         $(this).find('.cursor').addClass('active-cursor');
      });

      $(window).keydown(function(e) {
         if ([37, 38, 39, 40].indexOf(e.keyCode || e.which) > -1) {
            e.preventDefault();
         }
      });

      $('.irix-window').keydown(function(e) {
         var key = e.keyCode || e.which;
         var activeTerminal = jpTerminal.getActive();

         if (!activeTerminal) {
            return false;
         }

         // if enter
         if (key === 13) {
            var line = activeTerminal.find('.buffer').val();
            activeTerminal.find('.buffer').val('');

            if (activeTerminal.attr('id') === 'chess-terminal') {
               $('#curr-chess-input').html('');
               activeTerminal.find('.command-history')
                             .append($('<div class="entered-command">')
                             .text(line || ' '));
            } else {
               $('#curr-main-input').html('');
               jpTerminal.buildCommandLine(line);
            }
         }

         var wrap = activeTerminal.find('.inner-wrap');
         wrap.scrollTop(wrap[0].scrollHeight);
      });

      $('#main-terminal .buffer').bind('input propertychange', function() {
         var input = $(this).val();
         $('#curr-main-input').text(input);
      });

      $('#chess-terminal .buffer').bind('input propertychange', function() {
         var input = $(this).val();
         $('#curr-chess-input').text(input);
      });

      $('#apple-desktop').click(function(e){
         if ($(e.target).closest('.mac-window').attr('id') !== 'the-king-window') {
            flicker('the-king-blur', 50, 450);
         }
      });
   });
}(jQuery, soundManager));
