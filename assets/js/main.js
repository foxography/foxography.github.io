// util.js
(function($) {
  /**
   * Generate an indented list of links from a nav. Meant for use with panel().
   * @return {jQuery} jQuery object.
   */
  $.fn.navList = function() {
    var $this = $(this);
      $a = $this.find('a'),
      b = [];

    $a.each(function() {
      var $this = $(this),
        indent = Math.max(0, $this.parents('li').length - 1),
        href = $this.attr('href'),
        target = $this.attr('target');

      b.push(
        '<a ' +
          'class="link depth-' + indent + '"' +
          ( (typeof target !== 'undefined' && target != '') ? ' target="' + target + '"' : '') +
          ( (typeof href !== 'undefined' && href != '') ? ' href="' + href + '"' : '') +
        '>' +
          '<span class="indent-' + indent + '"></span>' +
          $this.text() +
        '</a>'
      );
    });
    return b.join('');
  };

  /**
   * Panel-ify an element.
   * @param {object} userConfig User config.
   * @return {jQuery} jQuery object.
   */
  $.fn.panel = function(userConfig) {
    // No elements?
      if (this.length == 0)
        return $this;

    // Multiple elements?
      if (this.length > 1) {

        for (var i=0; i < this.length; i++)
          $(this[i]).panel(userConfig);

        return $this;
      }

    // Vars.
      var $this = $(this),
        $body = $('body'),
        $window = $(window),
        id = $this.attr('id'),
        config;

    // Config.
      config = $.extend({

        // Delay.
          delay: 0,

        // Hide panel on link click.
          hideOnClick: false,

        // Hide panel on escape keypress.
          hideOnEscape: false,

        // Hide panel on swipe.
          hideOnSwipe: false,

        // Reset scroll position on hide.
          resetScroll: false,

        // Reset forms on hide.
          resetForms: false,

        // Side of viewport the panel will appear.
          side: null,

        // Target element for "class".
          target: $this,

        // Class to toggle.
          visibleClass: 'visible'

      }, userConfig);

      // Expand "target" if it's not a jQuery object already.
        if (typeof config.target != 'jQuery')
          config.target = $(config.target);

    // Panel.

      // Methods.
        $this._hide = function(event) {

          // Already hidden? Bail.
            if (!config.target.hasClass(config.visibleClass))
              return;

          // If an event was provided, cancel it.
            if (event) {

              event.preventDefault();
              event.stopPropagation();

            }

          // Hide.
            config.target.removeClass(config.visibleClass);

          // Post-hide stuff.
            window.setTimeout(function() {

              // Reset scroll position.
                if (config.resetScroll)
                  $this.scrollTop(0);

              // Reset forms.
                if (config.resetForms)
                  $this.find('form').each(function() {
                    this.reset();
                  });

            }, config.delay);

        };

      // Vendor fixes.
        $this
          .css('-ms-overflow-style', '-ms-autohiding-scrollbar')
          .css('-webkit-overflow-scrolling', 'touch');

      // Hide on click.
        if (config.hideOnClick) {

          $this.find('a')
            .css('-webkit-tap-highlight-color', 'rgba(0,0,0,0)');

          $this
            .on('click', 'a', function(event) {

              var $a = $(this),
                href = $a.attr('href'),
                target = $a.attr('target');

              if (!href || href == '#' || href == '' || href == '#' + id)
                return;

              // Cancel original event.
                event.preventDefault();
                event.stopPropagation();

              // Hide panel.
                $this._hide();

              // Redirect to href.
                window.setTimeout(function() {

                  if (target == '_blank')
                    window.open(href);
                  else
                    window.location.href = href;

                }, config.delay + 10);

            });
        }

      // Event: Touch stuff.
        $this.on('touchstart', function(event) {

          $this.touchPosX = event.originalEvent.touches[0].pageX;
          $this.touchPosY = event.originalEvent.touches[0].pageY;

        })

        $this.on('touchmove', function(event) {

          if ($this.touchPosX === null
          ||  $this.touchPosY === null)
            return;

          var diffX = $this.touchPosX - event.originalEvent.touches[0].pageX,
            diffY = $this.touchPosY - event.originalEvent.touches[0].pageY,
            th = $this.outerHeight(),
            ts = ($this.get(0).scrollHeight - $this.scrollTop());

          // Hide on swipe?
            if (config.hideOnSwipe) {
              var result = false,
                boundary = 20,
                delta = 50;

              switch (config.side) {
                case 'left':
                  result = (diffY < boundary && diffY > (-1 * boundary)) && (diffX > delta);
                  break;

                case 'right':
                  result = (diffY < boundary && diffY > (-1 * boundary)) && (diffX < (-1 * delta));
                  break;

                case 'top':
                  result = (diffX < boundary && diffX > (-1 * boundary)) && (diffY > delta);
                  break;

                case 'bottom':
                  result = (diffX < boundary && diffX > (-1 * boundary)) && (diffY < (-1 * delta));
                  break;

                default:
                  break;
              }

              if (result) {
                $this.touchPosX = null;
                $this.touchPosY = null;
                $this._hide();

                return false;
              }
            }

          // Prevent vertical scrolling past the top or bottom.
            if (($this.scrollTop() < 0 && diffY < 0)
            || (ts > (th - 2) && ts < (th + 2) && diffY > 0)) {

              event.preventDefault();
              event.stopPropagation();

            }
        });

      // Event: Prevent certain events inside the panel from bubbling.
        $this.on('click touchend touchstart touchmove', function(event) {
          event.stopPropagation();
        });

      // Event: Hide panel if a child anchor tag pointing to its ID is clicked.
        $this.on('click', 'a[href="#' + id + '"]', function(event) {

          event.preventDefault();
          event.stopPropagation();

          config.target.removeClass(config.visibleClass);
        });

    // Body.

      // Event: Hide panel on body click/tap.
        $body.on('click touchend', function(event) {
          $this._hide(event);
        });

      // Event: Toggle.
        $body.on('click', 'a[href="#' + id + '"]', function(event) {

          event.preventDefault();
          event.stopPropagation();

          config.target.toggleClass(config.visibleClass);
        });

    // Window.

      // Event: Hide on ESC.
        if (config.hideOnEscape)
          $window.on('keydown', function(event) {

            if (event.keyCode == 27)
              $this._hide(event);

          });
    return $this;
  };

  /**
   * Apply "placeholder" attribute polyfill to one or more forms.
   * @return {jQuery} jQuery object.
   */
  $.fn.placeholder = function() {
    // Browser natively supports placeholders? Bail.
      if (typeof (document.createElement('input')).placeholder != 'undefined')
        return $(this);

    // No elements?
      if (this.length == 0)
        return $this;

    // Multiple elements?
      if (this.length > 1) {
        for (var i=0; i < this.length; i++)
          $(this[i]).placeholder();

        return $this;
      }

    // Vars.
      var $this = $(this);

    // Text, TextArea.
      $this.find('input[type=text],textarea')
        .each(function() {
          var i = $(this);

          if (i.val() == '' || i.val() == i.attr('placeholder'))
            i
              .addClass('polyfill-placeholder')
              .val(i.attr('placeholder'));
        })
        .on('blur', function() {
          var i = $(this);

          if (i.attr('name').match(/-polyfill-field$/))
            return;

          if (i.val() == '')
            i
              .addClass('polyfill-placeholder')
              .val(i.attr('placeholder'));
        })
        .on('focus', function() {
          var i = $(this);

          if (i.attr('name').match(/-polyfill-field$/))
            return;

          if (i.val() == i.attr('placeholder'))
            i
              .removeClass('polyfill-placeholder')
              .val('');
        });

    // Password.
      $this.find('input[type=password]')
        .each(function() {
          var i = $(this);
          var x = $(
                $('<div>')
                  .append(i.clone())
                  .remove()
                  .html()
                  .replace(/type="password"/i, 'type="text"')
                  .replace(/type=password/i, 'type=text')
          );

          if (i.attr('id') != '')
            x.attr('id', i.attr('id') + '-polyfill-field');

          if (i.attr('name') != '')
            x.attr('name', i.attr('name') + '-polyfill-field');

          x.addClass('polyfill-placeholder')
            .val(x.attr('placeholder')).insertAfter(i);

          if (i.val() == '')
            i.hide();
          else
            x.hide();

          i
            .on('blur', function(event) {
              event.preventDefault();

              var x = i.parent().find('input[name=' + i.attr('name') + '-polyfill-field]');

              if (i.val() == '') {

                i.hide();
                x.show();
              }
            });
          x
            .on('focus', function(event) {
              event.preventDefault();

              var i = x.parent().find('input[name=' + x.attr('name').replace('-polyfill-field', '') + ']');

              x.hide();

              i
                .show()
                .focus();
            })
            .on('keypress', function(event) {
              event.preventDefault();
              x.val('');
            });
        });

    // Events.
      $this
        .on('submit', function() {
          $this.find('input[type=text],input[type=password],textarea')
            .each(function(event) {
              var i = $(this);

              if (i.attr('name').match(/-polyfill-field$/))
                i.attr('name', '');

              if (i.val() == i.attr('placeholder')) {
                i.removeClass('polyfill-placeholder');
                i.val('');
              }
            });
        })
        .on('reset', function(event) {
          event.preventDefault();

          $this.find('select')
            .val($('option:first').val());

          $this.find('input,textarea')
            .each(function() {

              var i = $(this),
                x;

              i.removeClass('polyfill-placeholder');

              switch (this.type) {

                case 'submit':
                case 'reset':
                  break;

                case 'password':
                  i.val(i.attr('defaultValue'));

                  x = i.parent().find('input[name=' + i.attr('name') + '-polyfill-field]');

                  if (i.val() == '') {
                    i.hide();
                    x.show();
                  }
                  else {
                    i.show();
                    x.hide();
                  }

                  break;

                case 'checkbox':
                case 'radio':
                  i.attr('checked', i.attr('defaultValue'));
                  break;

                case 'text':
                case 'textarea':
                  i.val(i.attr('defaultValue'));

                  if (i.val() == '') {
                    i.addClass('polyfill-placeholder');
                    i.val(i.attr('placeholder'));
                  }

                  break;

                default:
                  i.val(i.attr('defaultValue'));
                  break;
              }
            });
        });
    return $this;
  };

  /**
   * Moves elements to/from the first positions of their respective parents.
   * @param {jQuery} $elements Elements (or selector) to move.
   * @param {bool} condition If true, moves elements to the top. Otherwise, moves elements back to their original locations.
   */
  $.prioritize = function($elements, condition) {

    var key = '__prioritize';

    // Expand $elements if it's not already a jQuery object.
      if (typeof $elements != 'jQuery')
        $elements = $($elements);

    // Step through elements.
      $elements.each(function() {

        var $e = $(this), $p,
          $parent = $e.parent();

        // No parent? Bail.
          if ($parent.length == 0)
            return;

        // Not moved? Move it.
          if (!$e.data(key)) {
            // Condition is false? Bail.
              if (!condition)
                return;

            // Get placeholder (which will serve as our point of reference for when this element needs to move back).
              $p = $e.prev();

              // Couldn't find anything? Means this element's already at the top, so bail.
                if ($p.length == 0)
                  return;

            // Move element to top of parent.
              $e.prependTo($parent);

            // Mark element as moved.
              $e.data(key, $p);
          }

        // Moved already?
          else {
            // Condition is true? Bail.
              if (condition)
                return;

            $p = $e.data(key);

            // Move element back to its original location (using our placeholder).
              $e.insertAfter($p);

            // Unmark element as moved.
              $e.removeData(key);
          }
      });
  };
})(jQuery);

// main.js
(function($) {
  skel.breakpoints({
    xlarge: '(max-width: 1680px)',
    large: '(max-width: 1280px)',
    medium: '(max-width: 980px)',
    small: '(max-width: 736px)',
    xsmall: '(max-width: 480px)'
  });

  $(function() {
    var $window = $(window);
    var $body = $('body');
    var $wrapper = $('#wrapper');

    // Hack: Enable IE workarounds.
    if (skel.vars.IEVersion < 12)
      $body.addClass('ie');

    // Touch?
    if (skel.vars.mobile)
      $body.addClass('touch');

    // Transitions supported?
    if (skel.canUse('transition')) {
      // Add (and later, on load, remove) "loading" class.
      $body.addClass('loading');

      $window.on('load', function() {
        window.setTimeout(function() {
          $body.removeClass('loading');
        }, 100);
      });

      // Prevent transitions/animations on resize.
      var resizeTimeout;

      $window.on('resize', function() {
        window.clearTimeout(resizeTimeout);

        $body.addClass('resizing');

        resizeTimeout = window.setTimeout(function() {
          $body.removeClass('resizing');
        }, 100);
      });
    }

    // Scroll back to top.
    $window.scrollTop(0);

    // Fix: Placeholder polyfill.
    $('form').placeholder();

    // Panels.
    var $panels = $('.panel');

    $panels.each(function() {
      var $this = $(this);
      var $toggles = $('[href="#' + $this.attr('id') + '"]');
      var $closer = $('<div class="closer" />').appendTo($this);

      // Closer.
      $closer
        .on('click', function(event) {
          $this.trigger('---hide');
        });

      // Events.
      $this
        .on('click', function(event) {
          event.stopPropagation();
        })
        .on('---toggle', function() {
          if ($this.hasClass('active'))
            $this.triggerHandler('---hide');
          else
            $this.triggerHandler('---show');
        })
        .on('---show', function() {
          // Hide other content.
          if ($body.hasClass('content-active'))
            $panels.trigger('---hide');

          // Activate content, toggles.
          $this.addClass('active');
          $toggles.addClass('active');

          // Activate body.
          $body.addClass('content-active');
        })
        .on('---hide', function() {
          // Deactivate content, toggles.
          $this.removeClass('active');
          $toggles.removeClass('active');

          // Deactivate body.
          $body.removeClass('content-active');
        });

      // Toggles.
      $toggles
        .removeAttr('href')
        .css('cursor', 'pointer')
        .on('click', function(event) {
          event.preventDefault();
          event.stopPropagation();

          $this.trigger('---toggle');
        });
    });

      // Global events.
      $body
        .on('click', function(event) {
          if ($body.hasClass('content-active')) {
            event.preventDefault();
            event.stopPropagation();

            $panels.trigger('---hide');
          }
        });

      $window
        .on('keyup', function(event) {
          if (event.keyCode == 27 && $body.hasClass('content-active')) {
            event.preventDefault();
            event.stopPropagation();
            $panels.trigger('---hide');
          }
        });

    // Footer.
    var $footer = $('#footer');

    // Copyright.
    // This basically just moves the copyright line to the end of the *last* sibling of its current parent
    // when the "medium" breakpoint activates, and moves it back when it deactivates.
    $footer.find('.copyright').each(function() {
      var $this = $(this),
        $parent = $this.parent(),
        $lastParent = $parent.parent().children().last();

      skel
        .on('+medium', function() {
          $this.appendTo($lastParent);
        })
        .on('-medium', function() {
          $this.appendTo($parent);
        });
      });

    // Main.
    var $main = $('#main');

    // Thumbs.
    $main.children('.thumb').each(function() {
      var $this = $(this);
      var $image = $this.find('.image');
      var $image_img = $image.children('img');
      var x;

      // No image? Bail.
      if ($image.length == 0) { return; };

      // Image.
      // This sets the background of the "image" <span> to the image pointed to by its child
      // <img> (which is then hidden). Gives us way more flexibility.
      // Set background.
      $image.css('background-image', 'url(' + $image_img.attr('src') + ')');

      // Set background position.
      if (x = $image_img.data('position'))
        $image.css('background-position', x);

      // Hide original img.
      $image_img.hide();

      // Hack: IE<11 doesn't support pointer-events, which means clicks to our image never
      // land as they're blocked by the thumbnail's caption overlay gradient. This just forces
      // the click through to the image.
      if (skel.vars.IEVersion < 11)
        $this
          .css('cursor', 'pointer')
          .on('click', function() {
            $image.trigger('click');
          });
    });

    // Poptrox.
    $main.poptrox({
      baseZIndex: 20000,
      caption: function($a) {
        var s = '';

        $a.nextAll().each(function() {
          s += this.outerHTML;
        });

        return s;
      },
      fadeSpeed: 300,
      onPopupClose: function() { $body.removeClass('modal-active'); },
      onPopupOpen: function() { $body.addClass('modal-active'); },
      overlayOpacity: 0,
      popupCloserText: '',
      popupHeight: 150,
      popupLoaderText: '',
      popupSpeed: 300,
      popupWidth: 150,
      selector: '.thumb > a.image',
      usePopupCaption: true,
      usePopupCloser: true,
      usePopupDefaultStyling: false,
      usePopupForceClose: true,
      usePopupLoader: true,
      usePopupNav: true,
      windowMargin: 50
    });

    // Hack: Set margins to 0 when 'xsmall' activates.
    skel
      .on('-xsmall', function() {
        $main[0]._poptrox.windowMargin = 50;
      })
      .on('+xsmall', function() {
        $main[0]._poptrox.windowMargin = 0;
      });
  });
})(jQuery);
