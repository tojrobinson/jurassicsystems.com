(function($) {
  'use strict';

  const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  const jpTerminal = (function() {
    const env = {
      accessAttempts: 0,
      active: null,
      commands: {},
      maxIndex: 2,
      musicOn: false,
      sounds: {},
      desktopShift: 3200,
      resizeDebounce: null,
      environmentScale: 1,
      prefersReducedMotion: motionQuery ? motionQuery.matches : false,
    };
    const api = {};

    api.buildCommandLine = function(line) {
      const commandName = line.trim().split(/ /)[0];
      const command =
        env.commands[commandName] &&
        env.commands[commandName].command;

      env.active.find('.command-history')
        .append($('<div class="entered-command" role="listitem">')
        .text('> ' + line));

      if (command) {
        command(env, line);
      } else if (commandName) {
        env.active.find('.command-history')
          .append($('<div role="listitem">').text(`${commandName}: command not found`));
      }
    }

    api.addCommand = function(details) {
      if (
        details.name &&
        !Object.prototype.hasOwnProperty.call(env.commands, details.name) &&
        (details.command.constructor === Function)
      ) {
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

    api.setDesktopShift = function(shift) {
      env.desktopShift = shift;
    };

    api.getDesktopShift = function() {
      return env.desktopShift;
    };

    api.setResizeDebounce = function(timeoutId) {
      env.resizeDebounce = timeoutId;
    };

    api.clearResizeDebounce = function() {
      if (env.resizeDebounce) {
        clearTimeout(env.resizeDebounce);
        env.resizeDebounce = null;
      }
    };

    api.setEnvironmentScale = function(scale) {
      env.environmentScale = scale;
    };

    api.getEnvironmentScale = function() {
      return env.environmentScale;
    };

    api.setPrefersReducedMotion = function(value) {
      env.prefersReducedMotion = Boolean(value);
    };

    api.prefersReducedMotion = function() {
      return env.prefersReducedMotion;
    };

    api.init = function() {
      const canPlayAudio = typeof Audio !== 'undefined';
      if (!canPlayAudio) {
        return;
      }

      const createSound = function(sources, options) {
        const settings = Object.assign({
          loop: false,
          preload: 'auto',
        }, options);
        const audio = document.createElement('audio');

        if (!audio.canPlayType) {
          return null;
        }

        audio.preload = settings.preload;

        let supportedSource = null;
        for (const source of sources) {
          if (audio.canPlayType(source.type || '')) {
            supportedSource = source;
            break;
          }
        }

        if (!supportedSource) {
          return null;
        }

        audio.src = supportedSource.src;
        try {
          audio.load();
        } catch (err) {
          // Ignore load errors triggered by aggressive autoplay policies.
        }

        audio.loop = Boolean(settings.loop);

        const play = function() {
          try {
            audio.pause();
            audio.currentTime = 0;
          } catch (err) {
            // Ignore exceptions when resetting audio.
          }

          const playPromise = audio.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function() {
              // Ignore autoplay rejections; user interaction will trigger playback later.
            });
          }
        };

        const stop = function() {
          audio.pause();
          if (!settings.loop) {
            try {
              audio.currentTime = 0;
            } catch (err) {
              // Ignore reset issues for browsers that disallow setting currentTime.
            }
          }
        };

        return {
          play: play,
          stop: stop,
        };
      };

      const buildAudioSources = function(baseName, includeLegacy = false) {
        const modernSources = [
          { src: `snd/${baseName}.mp3`, type: 'audio/mpeg' },
          { src: `snd/${baseName}.ogg`, type: 'audio/ogg' },
        ];

        if (includeLegacy) {
          modernSources.push({ src: `snd/${baseName}.wav`, type: 'audio/wav' });
        }

        return modernSources;
      };

      const silentSound = {
        play: function() {},
        stop: function() {},
      };

      const withFallback = function(sound) {
        return sound || silentSound;
      };

      env.sounds.beep = withFallback(createSound(buildAudioSources('beep')));

      env.sounds.lockDown = withFallback(createSound(buildAudioSources('lockDown')));

      env.sounds.dennisMusic = withFallback(createSound(buildAudioSources('dennisMusic'), { loop: true }));
    };

    return api;
  }());

  jpTerminal.init();
  jpTerminal.setActive('#main-terminal');

  if (motionQuery) {
    const handleMotionPreference = function(event) {
      jpTerminal.setPrefersReducedMotion(event.matches);
    };

    if (typeof motionQuery.addEventListener === 'function') {
      motionQuery.addEventListener('change', handleMotionPreference);
    } else if (typeof motionQuery.addListener === 'function') {
      motionQuery.addListener(handleMotionPreference);
    }
  }

  const applyEnvironmentScale = function() {
    const environmentElement = document.getElementById('environment');
    if (!environmentElement) {
      return { width: window.innerWidth, height: window.innerHeight };
    }

    const wrapper = document.querySelector('.environment-wrapper');
    const mainDesktopElement = document.getElementById('irix-desktop');
    const appleDesktopElement = document.getElementById('apple-desktop');

    const baseWidth = Math.max(
      window.innerWidth,
      mainDesktopElement ? mainDesktopElement.offsetWidth : 0,
      appleDesktopElement ? appleDesktopElement.offsetWidth : 0,
    );

    const baseHeight = Math.max(
      window.innerHeight,
      mainDesktopElement ? mainDesktopElement.offsetHeight : 0,
      appleDesktopElement ? appleDesktopElement.offsetHeight : 0,
    );

    const availableWidth = wrapper ? wrapper.clientWidth : window.innerWidth;
    const availableHeight = window.innerHeight;

    const widthScale = baseWidth > 0 ? availableWidth / baseWidth : 1;
    const heightScale = baseHeight > 0 ? availableHeight / baseHeight : 1;
    const scale = Math.min(1, Math.max(0.55, widthScale, heightScale));

    environmentElement.style.setProperty('--environment-scale', scale);
    jpTerminal.setEnvironmentScale(scale);

    if (wrapper) {
      wrapper.style.minHeight = `${Math.ceil(baseHeight * scale)}px`;
    }

    return { width: baseWidth, height: baseHeight };
  };

  const updateDesktopShift = function() {
    jpTerminal.clearResizeDebounce();

    const environment = $('#environment');
    if (!environment.length) {
      return;
    }

    const metrics = applyEnvironmentScale();
    const computedWidth = metrics.width;
    const shift = Math.max(computedWidth, 1800);
    jpTerminal.setDesktopShift(shift);
    $('#apple-desktop').css('left', -shift);

    const currentLeft = parseFloat(environment.css('left')) || 0;
    if (currentLeft > 0) {
      environment.css('left', shift);
    } else if (currentLeft < 0) {
      environment.css('left', 0);
    }
  };

  const scheduleDesktopShiftUpdate = function() {
    jpTerminal.clearResizeDebounce();
    const timeoutId = window.setTimeout(updateDesktopShift, 150);
    jpTerminal.setResizeDebounce(timeoutId);
  };

  const animateEnvironment = function(properties, duration, callback) {
    const environment = $('#environment');
    if (!environment.length) {
      if (typeof callback === 'function') {
        callback.call(null);
      }
      return;
    }

    if (jpTerminal.prefersReducedMotion()) {
      environment.stop(true, true).css(properties);
      if (typeof callback === 'function') {
        callback.call(environment);
      }
      return;
    }

    environment.stop(true, true).animate(properties, duration, 'swing', callback);
  };

  jpTerminal.addCommand({
    name: 'music',
    summary: 'turn background music on or off',
    manPage: 'SYNOPSIS\n' +
             '\tmusic [on|off]\n\n' +
             'DESCRIPTION\n' + 
             '\tManage the state of the \'Dennis Steals the Embryo\' ' +
             'music. Use the \'on\' state for\n\tincreased epicness.\n\n' +
             'AUTHOR\n' +
             '\tWritten by <a href="https://tully.io">Tully Robinson</a>.\n',
    command: function(env, inputLine) {
      const arg = inputLine.trim().split(/ +/)[1] || '';
      const output = $('<div role="listitem">').text('music: must specify state [on|off]');

      if (!arg || !/^(?:on|off)$/i.test(arg)) {
        $('#main-input').append(output);
        return;
      }

      const normalized = arg.toLowerCase();

      if (normalized === 'on') {
        if (!env.musicOn) {
          env.sounds.dennisMusic.play();
        }
        env.musicOn = true;
      } else {
        env.sounds.dennisMusic.stop();
        env.musicOn = false;
      }

      $('#main-input').append(
        $('<div role="listitem">').text(
          normalized === 'on' ? 'music: background track enabled' : 'music: background track disabled',
        ),
      );
    },
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
      const target = inputLine.split(/ +/)[1] || '';
      const magicWord = inputLine.substring(inputLine.trim().lastIndexOf(' ')) || '';

      if (!target) {
        $('#main-input').append(
          $('<div role="listitem">').text('access: must specify target system'),
        );

        return;
      }

      if (
        inputLine.split(' ').length > 2 &&
        magicWord.trim().toLowerCase() === 'please'
      ) {
        const asciiImage = $('<img>', {
          id: 'asciiNewman',
          src: 'img/asciiNewman.jpg',
          alt: 'ASCII art of Dennis Nedry',
        });

        const asciiContainer = $('<div role="listitem" class="ascii-output">').append(asciiImage);
        $('#main-input').append(asciiContainer);

        asciiImage.on('load', function() {
          const wrap = $('.inner-wrap', env.active);
          if (wrap.length) {
            wrap.scrollTop(wrap[0].scrollHeight);
          }
        });

        return;
      }

      $('#main-input').append(
        $('<div role="listitem">').text('access: PERMISSION DENIED.'),
      );
      env.sounds.beep.play();

      if (++env.accessAttempts >= 3) {
        const andMessage = $('<div role="listitem">').text('...and...');
        let errorSpam;

        $('.irix-window').off('keydown');
        $('#main-prompt').addClass('hide');

        window.setTimeout(function() {
          $('#main-input').append(andMessage);
        }, 200);

        window.setTimeout(function() {
          env.sounds.lockDown.play();
        }, 1000);

        window.setTimeout(function() {
          updateDesktopShift();
          const shiftDistance = jpTerminal.getDesktopShift();

          animateEnvironment(
            { left: `+=${shiftDistance}` },
            2000,
            function() {
              window.setTimeout(function() {
                const theKingVideo = document.getElementById('the-king-video');

                if (errorSpam) {
                  clearInterval(errorSpam);
                }

                if (theKingVideo) {
                  const playPromise = theKingVideo.play();
                  if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(function() {});
                  }
                }

                $('#irix-desktop').attr('hidden', true);
                $('#mac-hd-window').css('background-image', 'url(img/macHDBlur.jpg)');
                $('#the-king-window').removeAttr('hidden').addClass('is-visible');
                scheduleDesktopShiftUpdate();
              }, 2000);
            },
          );
        }, 4000);

        window.setTimeout(function() {
          errorSpam = window.setInterval(function() {
            const errorMessage = $('<div role="listitem">YOU DIDN\'T SAY THE MAGIC WORD!</div>');
            $('#main-input').append(errorMessage);
            const mainInner = document.getElementById('main-inner');
            if (mainInner) {
              mainInner.scrollTop = mainInner.scrollHeight;
            }
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
             '\tCheck the input system and return each sector\'s ' +
             'current status.\n\n' +
             'AUTHOR\n' +
             '\tWritten by Dennis Nedry.\n',
    command: function(env, inputLine) {
      const arg = inputLine.split(/ +/)[1] || '';
      let output = $('<div role="listitem">system: must specify target system</div>');

      if (arg.length > 0) {
        let system = arg.replace(/s$/, '');
        system = system.charAt(0).toUpperCase() + system.slice(1);
        const sanitized = $('<div/>').text(system).html();
        const statusEntry = $('<div role="listitem">');
        statusEntry.append(`<div>${sanitized} containment enclosure....</div>`);
        statusEntry.append(
          '<table id="system-output"><tbody>' +
          '<tr><td>Security</td><td>[OK]</td></tr>' +
          '<tr><td>Fence</td><td>[OK]</td></tr>' +
          '<tr><td>Feeding Pavilion</td><td>[OK]</td></tr>' +
          '</tbody></table>',
        );

        $('#main-prompt').addClass('hide');
        $('#main-input').append(statusEntry);
        output = $('<div role="listitem">System Halt!</div>');
        env.sounds.beep.play();

        setTimeout(function() {
          const wrap = $('.inner-wrap', env.active);
          env.sounds.beep.play();
          $('#main-input').append(output);
          wrap.scrollTop(wrap[0].scrollHeight);
          $('#main-prompt').removeClass('hide');
        }, 900);
      } else {
        $('#main-input').append(output);
      }
    }
  });

  jpTerminal.addCommand({
    name: 'ls',
    summary: 'list files in the current directory',
    manPage: 'SYNOPSIS\n' +
             '\tls [FILE] ...\n\n' +
             'DESCRIPTION\n' +
             '\tList information about the FILEs ' +
             '(the current directory by default).\n\n' +
             'AUTHOR\n' +
             '\tWritten by Richard Stallman and David MacKenzie.\n',
    command: function(env, inputLine) {
      $('#main-input').append($('<div role="listitem">zebraGirl.jpg</div>'));
    }
  });

  jpTerminal.addCommand({
    name: 'display',
    summary: 'display image files (hint: use ls to find a \'file\')',
    manPage: 'SYNOPSIS\n' +
             '\tdisplay file ...\n\n' +
             'DESCRIPTION\n' +
             '\tDisplay is a machine architecture independent image ' +
             'processing and display\n\tprogram. It can ' +
             '<strong>display</strong> an image on any workstation screen ' +
             'running an X server.\n\n' +
             'AUTHOR\n' +
             '\tJohn Cristy, ImageMagick Studio.\n',
      command: function(env, inputLine) {
        const args = inputLine.trim().split(' ');

        if (args.length < 2) {
          $('#main-input')
            .append($('<div role="listitem">display: no file specified</div>'));
          return;
        }

        if (inputLine.match(/zebraGirl\.jpg/)) {
          setTimeout(function() {
            const zebraWindow = $('#zebra-girl');
            zebraWindow.css('z-index', jpTerminal.nextIndex());
            zebraWindow.removeAttr('hidden').addClass('is-visible');
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
             '\tA system level command log used for accountability ' +
             'purposes. keychecks must be\n\tactivated or deactivated ' +
             'via the main board.\n',
    command: function(env, inputLine) {
      const output =
        '13,42,121,32,88,77,19,13,44,52,77,90,13,99,13,100,13,109,55,103,144,' +
        '13,99,87,60,13,44,12,09,13,43,63,13,46,57,89,103,122,13,44,52,88,931,' +
        '13,21,13,57,98,100,102,103,13,112,13,146,13,13,13,77,67,88,23,13,13\n' +
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
      const entry = $('<div role="listitem" class="keychecks-output"></div>');
      entry.append($('<pre>').text(output));
      $('#main-input').append(entry);
    }
  });

  jpTerminal.addCommand({
    name: 'man',
    summary: 'display reference manual for a given command',
    manPage: 'SYNOPSIS\n' +
             '\tman title ...\n\n' +
             'DESCRIPTION\n' +
             '\tman locates and prints the titled entries from the on-line ' +
             'reference manuals.\n',
    command: function(env, inputLine) {
      const arg = inputLine.trim().split(/ +/)[1] || '';
      let output = 'What manual page do you want?';

      if (Object.prototype.hasOwnProperty.call(env.commands, arg)) {
        output = env.commands[arg].manPage;
      } else if (arg) {
        output = 'No manual entry for ' + $('<div/>').text(arg).html();
      }

      $('#main-input').append($('<div role="listitem">').html(output));
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
    command: function(env) {
      Object.keys(env.commands).sort().forEach(function(commandName) {
        const command = env.commands[commandName];
        env.active.find('.command-history')
          .append($('<div role="listitem">')
          .text(command.name + ' - ' + command.summary)
          );
      });
    }
  });

  // helpers
  const flicker = function(altId, interval, duration) {
    let visible = true;
    const alt = $('#' + altId);

    if (!alt.length) {
      return;
    }

    alt.show();

    if (jpTerminal.prefersReducedMotion()) {
      window.setTimeout(function() {
        alt.css('opacity', '0');
        alt.hide();
      }, Math.min(duration, 200));
      return;
    }

    const flickering = setInterval(function() {
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
  };

  const blurAllWindows = function() {
    $('.cursor', '.irix-window').removeClass('active-cursor');
    $('.buffer').blur();
  };

  $(document).ready(function() {
    updateDesktopShift();
    $(window).on('resize orientationchange', scheduleDesktopShiftUpdate);

    window.setTimeout(function() {
      $('#main-buffer').trigger('focus');
    }, 300);

    // attempt to cache objects
    [
      'theKingBlur.jpg',
      'theKingFocus.jpg',
      'macHDBlur.jpg',
      'asciiNewman.jpg',
      'zebraGirlWindow.jpg',
    ].forEach(function(imageName) {
      const preloadImage = new Image();
      preloadImage.decoding = 'async';
      preloadImage.src = `img/${imageName}`;
    });


    $('body').on('click', blurAllWindows);

    (function() {
      let diffX = 0;
      let diffY = 0;

      $('.window-bar').on('mousedown', function(e) {
        const dragging = $(this).parent()
          .css('z-index', jpTerminal.nextIndex())
          .addClass('dragging');
        diffY = e.pageY - dragging.offset().top;
        diffX = e.pageX - dragging.offset().left;
      });

      $('body').on('mousemove', function(e) {
        $('.dragging').offset({
          top: e.pageY - diffY,
          left: e.pageX - diffX,
        });
      });
    }());

    $('body').on('mouseup', function() {
      $('.dragging').removeClass('dragging');
    });

    $('.irix-window').on('click', function(e) {
      e.stopPropagation();
      blurAllWindows();
      jpTerminal.setActive(this);
      $('.buffer', this).focus();
      $(this).css('z-index', jpTerminal.nextIndex());
      $(this).find('.cursor').addClass('active-cursor');
    });

    $(window).on('keydown', function(e) {
      const key = e.key || '';
      const legacy = e.keyCode || e.which;
      if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(key) ||
          (!key && [37, 38, 39, 40].indexOf(legacy) > -1)) {
        e.preventDefault();
      }
    });

    $('.irix-window').on('keydown', function(e) {
      const key = e.key || '';
      const activeTerminal = jpTerminal.getActive();

      if (!activeTerminal) {
        return false;
      }

      const isEnter = key === 'Enter' || (!key && (e.keyCode || e.which) === 13);

      if (isEnter) {
        const line = activeTerminal.find('.buffer').val();
        activeTerminal.find('.buffer').val('');

        if (activeTerminal.attr('id') === 'chess-terminal') {
          $('#curr-chess-input').text('');
          activeTerminal.find('.command-history')
            .append($('<div class="entered-command" role="listitem">')
            .text(line || ' '));
        } else {
          $('#curr-main-input').text('');
          jpTerminal.buildCommandLine(line);
        }
      }

      const wrap = activeTerminal.find('.inner-wrap');
      wrap.scrollTop(wrap[0].scrollHeight);
    });

    $('#main-terminal .buffer').on('input', function() {
      $('#curr-main-input').text($(this).val());
    });

    $('#chess-terminal .buffer').on('input', function() {
      $('#curr-chess-input').text($(this).val());
    });

    $('#apple-desktop').on('click', function(e){
      if ($(e.target).closest('.mac-window').attr('id') !== 'the-king-window') {
        flicker('the-king-blur', 50, 450);
      }
    });
  });
}(jQuery));
