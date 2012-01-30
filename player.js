

/**
 * A base player is a widget nested in a player and fully controlled by it. It
 * creates the embedded element that handles the actual video playback (i.e. a
 * <video>-Tag or a flash-<embed>).
 */
jQuery.CbWidget.base_player = jQuery.CbWidget.widget.extend({

   /**
    * Generates a unique ID for id-attributes to avoid conflicts between
    * multiple players (playing the same video) on the same page. This is not
    * uncommon when layers are used on a website.
    *
    * @param <number> base (optional) "seed" used for ID generation
    * @return ID
    */
   generateUniqueId : (function () {
      var ids = {};

      return function (base) {
         base = base || 0;
         ids[base] = (ids[base] || 0) + 1;
         return 'cb_player_'+base+'_'+ids[base];
      };
   })(),

   constructor : function(element) {
      this.embedCallable = false;
      this.unbind_embed_ready = [];
      this.uniqueId = this.generateUniqueId();
      return this.base(element);
   },

   handleEmbedReady : function(params) {
      this.embedCallable = true;
      return this;
   },

   handleEmbed : function(params) {
      this.embedCallable = false;
      return this;
   },

   /**
    * We can do this in the special case of embedded players as
    * a, we don't need to route any events between the element and other widgets.
    * b, there are no other elements in the player div.
    */
   replaceElement : function(el) {
      this.element().parent().empty().append(el);
      this.parentElement = el;
      this.refreshElement();
      return this;
   },

   callPlayer : function(func, param) {
      var self = this;
      if (self.element().is('img')) this.trigger('embed');

      if (self.embedCallable) {
         self.element().get(0)[func](param);
      } else {
         self.embedReady(function(params) {
            // IE throws here: "Object doesn't support property or method <params.func>"
            self.element().get(0)[params.func](params.param);
            self.unbind_embed_ready.push(this.callback); // will be unbound next time
         }, {'func' : func, 'param' : param});
      }
   },

   doEmbedReady : function() {
      var self = this;
      jQuery.each(self.unbind_embed_ready, function(i, callback) {
         self.unbind('embedReady', callback);
      });
      self.unbind_embed_ready = [];
      self.embedReady();
   }
}, {
   init : function() {
      jQuery.CbEvent(this, 'control');    ///< General purpose event for above control actions.
      jQuery.CbEvent(this, 'embed');      ///< Trigger this to create the embedded player.
      jQuery.CbEvent(this, 'embedReady'); ///< Triggered when the embedded player has been created.
      jQuery.CbEvent(this, 'embedEvent'); ///< Trigger an event on the embedded player.
      return this.base();
   }
});

jQuery.CbWidget.jw_player = jQuery.CbWidget.base_player.extend({

   handleEmbed : function(params) {
      this.base(params);
      var self = this;

      window["player" + this.uniqueId] = function () {
         self.doEmbedReady();
         delete window["player" + this.uniqueId];
      };

      return this.replaceElement(jQuery(document.createElement('embed'))
            .attr('id', self.uniqueId)
            .attr('flashvars', 'config=' + self.options.player_root +
               'config/xml/' + self.options.id_type + self.options.id + '/' +
               self.options.config + '&playerready=player' + self.uniqueId) // CbWidget does a recursive search
            .attr('allowfullscreen', self.options.allow_fullscreen)
            .attr('allowscriptaccess', self.options.allow_script_access)
            .attr('src', self.options.player_root + self.options.embed_source)
            .attr('width', self.options.width)
            .attr('height', self.options.height)
            .attr('wmode', self.options.wmode));
   },

   handleEmbedEvent : function(params) {
      this.callPlayer('sendEvent', params.event);
      return this.base(params);
   },

   handleControl : function(params) {
      this.callPlayer('callMenu', params.type);
      return this.base(params);
   },

   handleReady : function(options) {
      this.options = jQuery.extend(jQuery.CbWidget.jw_player.defaultOptions, this.options, options);
      return this.base(options);
   }
}, {
   defaultOptions : {
      embed_source : 'flash/player.swf',
      wmode: 'window' // http://kb2.adobe.com/cps/127/tn_12701.html#main_Using_Window_Mode__wmode__values_
   }
});

jQuery.CbWidget.html5_player = jQuery.CbWidget.base_player.extend({
   handleEmbed : function(params) {
      this.base(params);

      var self = this;
      jQuery.getJSON(self.options.player_root + 'config/json/' +
         self.options.id_type + self.options.id + '/' + self.options.config,
         {}, function(data) {
            self.replaceElement(jQuery(document.createElement('video'))
                  .attr('id', self.uniqueId)
                  .attr('src', data.file)
                  .attr('width', self.options.width)
                  .attr('height', self.options.height)
                  .attr('controls', '')
                  .text('ouch!'));
            self.doEmbedReady();
         }
      );
      return this;
   },

   handleReady : function(options) {
      this.options = jQuery.extend(this.options, options);
      return this.base(options);
   },

   handleEmbedEvent : function(params) {
      if (params.event == 'PLAY') this.callPlayer('play');
      return this.base(params);
   }
});

jQuery.CbWidget.dummy_player = jQuery.CbWidget.base_player.extend({});

jQuery.CbWidget.player = jQuery.CbWidget.widget.extend({

   players : {
      'flash/flv' : jQuery.CbWidget.jw_player,
      'flash/h264' : jQuery.CbWidget.jw_player,
      'html5/webm' : jQuery.CbWidget.html5_player,
      'html5/h264' : jQuery.CbWidget.html5_player,
      'none' : jQuery.CbWidget.dummy_player
   },

   getIcon : function(options) {

      if (options.id) {
         return (options.active && options.player != 'none') ? options.play_icon : options.na_icon;
      } else {
         return options.no_icon;
      }
   },

   handleReady : function(options) {
      this.options = jQuery.extend(jQuery.CbWidget.player.defaultOptions, this.options, options);
      this.load(this.options.id, this.options.image, this.getIcon(this.options),
         this.options.active);
      this.player = new this.players[this.options.player](this.element().children());
      this.player.trigger('ready', this.options);
      return this.base(options);
   },

   load : function(id, image, play_icon, active, id_type, player) {
      this.options.id = id;
      this.options.image = image;
      this.options.play_icon = play_icon;
      this.options.active = active;
      this.options.id_type = id_type || this.options.id_type;
      if (this.options.id) {
         this.options.player = player || this.options.player;
      } else { // prevent old configs from launching default flash player on non-films
         this.options.player = 'none';
      }
      this.reset();
   },

   reset : function() {
      if (this.player) {
         this.player.destroy();
         delete this.player;
      }
      var self = this;
      var active = self.options.id && self.options.active && self.options.player != 'none';

      this.element().css({
         position : 'relative'
      }).empty().append(
         jQuery(document.createElement('img'))
         .attr('src', self.options.image)
         .attr('width', self.options.width).attr('height', self.options.height)
         .addClass(active ? '__CbUiPlayerActivePreview' : '__CbUiPlayerDummyPreview')
         .click(function() {if (self.options.active) self.play();})
      );

      if (self.options.play_icon) {
         var icon = self.options.play_icon;

         // if not we assume DOM element was directly specificified
         if (typeof(icon) == 'string') {
            // element is an url to be loaded
            icon = jQuery(document.createElement('img')).attr('src', icon);
         }

         if (self.options.play_icon_width || self.options.play_icon_height) {
            // do the positioning
            var css = {
               position : 'absolute',
               top : ((self.options.height/2)-(self.options.play_icon_height/2)),
               left : ((self.options.width/2)-(self.options.play_icon_width/2))
            };
            if (self.options.play_icon_width) css.width = self.options.play_icon_width + 'px';
            if (self.options.play_icon_height) css.height = self.options.play_icon_height + 'px';
            icon.css(css);
         }
         if (active) {
            icon.addClass('__CbUiImgButton').click(function() {self.play();});
         }
         this.element().append(icon.addClass('__CbUiPlayerPlayButton'));
      }
   },

   handlePlay : function(options) {
      if (this.player) this.player.destroy();
      this.trigger('ready', options);
      this.player.trigger('embedEvent', {event : 'PLAY'});
      return this;
   },

   // CbEvent handler for playerControls Widget

   handleBuyControl : function() {
      window.open(this.options.buy_url, 'cbshop',
         'width=650,height=550,dependent=no,hotkeys=no,location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,toolbar=no'
      ).focus();
   },

   handleContactControl : function() {
      this.player.trigger('control', {type : 'CONTACT'});
   },

   handleEmbedControl : function() {
      this.player.trigger('control', {type : 'EMBED'});
   },

   handleInfoControl : function() {
      this.player.trigger('control', {type : 'INFO'});
   },

   handleMailControl : function() {
      this.player.trigger('control', {type : 'MAIL'});
   },

   handleMenuControl : function() {
      this.player.trigger('control', {type : 'MENU'});
   },

   handlePopupControl : function() {
      this.reset();
      var url = this.options.player_root + this.options.id_type + this.options.id + '/' + this.options.popup_config;
      window.open(url, 'cbplayer', this.options.popup_windowfeatures).focus();
      return false;
   },

   handleZoomControl : function() {
      // TODO
   }
}, {
   init : function() {
      jQuery.CbEvent(this, 'contactControl'); ///< Show contact information.
      jQuery.CbEvent(this, 'embedControl');   ///< Generate an embed code for other websites.
      jQuery.CbEvent(this, 'infoControl');
      jQuery.CbEvent(this, 'mailControl');
      jQuery.CbEvent(this, 'menuControl');
      jQuery.CbEvent(this, 'popupControl');
      jQuery.CbEvent(this, 'zoomControl');
      jQuery.CbEvent(this, 'play');
      return this.base();
   },

   detect : function() {
      var supported = [];

      /* 9.0.114 added h264 suppport, I heard. */
      if (FlashDetect.versionAtLeast(9, 0, 114)) supported.push('flash/h264');

      /* Wikipedia says they added it in version 7. */
      if (FlashDetect.versionAtLeast(7)) supported.push('flash/flv');

      var v = document.createElement('video');
      if (!!v.canPlayType) {
         var mp4 = v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
         if (mp4 && mp4 != 'no') supported.push('html5/h264');

         var webm = v.canPlayType('video/webm; codecs="vp8, vorbis"');
         if (webm && webm != 'no') {
            if (navigator.userAgent.toLowerCase().indexOf("android") > -1) {
               /* Android has bad flash support, so we prefer webm here. */
               supported.unshift('html5/webm');
            } else {
               supported.push('html5/webm');
            }
         }
      }

      return supported;
   },

   defaultOptions : {
      image : '',
      play_icon : '',
      player_root : '/player40/',
      config : '_default',
      allow_fullscreen : true,
      allow_script_access : 'always',
      width : 550, // width and height are necessary to make it play nice with IE
      height : 350,
      id : 0,
      buy_url: '',
      active : true,
      id_type : 'td',
      player : 'flash/flv'
   }
});

jQuery.CbWidget.playerVersions = jQuery.CbWidget.select.extend({
   constructor : function(element) {
      this.versions = {};
      return this.base(element);
   },

   handleReady : function(options) {
      var self = this;
      if(options.versions != '' && (options.versions.length > 1 || options.versions_always)) {
         var sorted_versions = {};

         jQuery.each(options.versions, function(i, version) {
            self.versions[version.id] = version;
            var source = version.generated_from ? version.generated_from : version.id;
            if (!sorted_versions[source]) sorted_versions[source] = [];
            sorted_versions[source].push(version);
         });

         jQuery.each(sorted_versions, function(i, source_versions) {
            source_versions.sort(function(a, b) {
               if (a.generated_from == 0) return -1;
               if (b.generated_from == 0) return 1;
               if (a.f_format == b.f_format) return 0;
               return a.f_format < b.f_format ? -1 : 1;
            });
            jQuery.each(source_versions, function(i, version) {
               self.addOption(version.id, version.name,
                     version.generated_from == 0 ? '__CbUiPlayerVersionsParent' : '__CbUiPlayerVersionsChild',
                     version.id == options.id);
            });
         });

         self.player = options.widgets.player;
         self.element().change(function() {
            var version = self.versions[self.value()];
            if(options.versions_autoplay && version.active) {
               self.player.trigger('play', {id : self.value(), id_type : 'td', player : version.player});
            } else {
               self.player.load(self.value(), version.image, self.player.getIcon(jQuery.extend(options, version)), version.active, 'td', version.player);
            }
         });
      } else {
         self.element().hide();
      }
   }
});

jQuery.CbWidget.playerControls = jQuery.CbWidget.widget.extend({
   constructor : function(element) {
      return this.base(element);
   },

   handleReady : function(options) {
      var self = this;
      this.player = options.widgets.player;
      if (options.controls) {
         jQuery.each(options.controls, function(type, text){
            var a = jQuery(document.createElement('a')).attr('href', 'javascript://').text(text).addClass(type);
            if(type == 'buy' && options.buy_url == '')
               a.addClass('inactive');
            else
               a.click(function() {
                  self.player.trigger(type+'Control');
               });
            self.element().append(a);
         });
      }
      return this;
   }
});

jQuery.CbWidget.playerSlides = jQuery.CbWidget.widget.extend({
   handleReady : function(options) {
      var self = this,
         widgetOptions = options,
         slideshow = jQuery(document.createElement('div')).addClass('slideshow')
            .append(jQuery(document.createElement('div')).addClass('left-button'))
            .append(jQuery(document.createElement('div')).addClass('right-button'))
            .append(jQuery(document.createElement('div')).addClass('slider-wrap')
               .append(jQuery(document.createElement('div')).addClass('slider'))),
         slider = slideshow.find('.slider'),
         icon = null,
         iconSrc = null;

      this.player = options.widgets.player;

      if (options.slides && options.slides.length > 1) {
         jQuery.each(options.slides, function(i, image) {
            var img = jQuery(document.createElement('img'));

            // first image of slide is video trigger
            if (i == 0) {
               // select the best available icon source
               iconSrc = jQuery.map([options.slides_video_trigger_icon, options.play_icon], function (val) {
                  return val || null;
               })[0] || null;

               if (iconSrc !== null) {
                  icon = jQuery(document.createElement('img'))
                     .attr('src', iconSrc)
                     .addClass('video-trigger-icon')
                     .click(function() {
                        self.player.play();
                     })
                     .appendTo(slider);

                  img.load(function () {
                     icon.css({
                        display:   'block',
                        position:  'absolute',
                        top:       Math.round(img.height() / 2 - icon.height() / 2)+'px',
                        left:      Math.round(img.width() / 2 - icon.width() / 2)+'px',
                        'z-index': 2
                     });
                  }).addClass('video-trigger').click(function() {
                     self.player.play();
                  });
               }
            } else {
               img.click(function() {
                  self.player.load(self.player.options.id,
                     'http://data.heimat.de/transform.php'
                        +'?width='+self.player.options.width
                        +'&height='+self.player.options.height
                        +'&do=cropOut'
                        +'&file='+encodeURIComponent(image.original),
                     false);
               });
            }

            img.attr('src', image.thumbnail).appendTo(slider);
         });

         self.element().append(slideshow);

         (function (options) {
            options = jQuery.extend({
               acceleration:    0.5, // how fast the slider gains speed (more means faster)
               friction:        0.5, // how fast the slider looses speed (more means faster)
               pixelsPerSecond: 500
            }, options || {});

            jQuery(this).each(function () {
               // movement
               var animationInterval = null,
                  currentVelocity = 0,
                  element = jQuery(this),
                  sliderWrap = element.find('.slider-wrap'),
                  slider = sliderWrap.find('.slider'),
                  images = slider.find('img').not('.video-trigger-icon'),
                  leftButton = element.find('.left-button'),
                  rightButton = element.find('.right-button');

               options.maximumVelocity = options.pixelsPerSecond / 60;

               // prepare
               images.css({
                  'display': 'block',
                  'float':   'left',
                  'cursor':  'pointer'
               }).width(widgetOptions.slides_width).height(widgetOptions.slides_height)
                  .not(':last').css('margin-right', widgetOptions.slides_separator+'px');

               slider.width(widgetOptions.slides_width * widgetOptions.slides.length
                  + widgetOptions.slides_separator * (widgetOptions.slides.length - 1));

               if (slider.width() <= sliderWrap.width()) {
                  leftButton.hide();
                  rightButton.hide();
               }

               var move = function (direction) {
                  if (animationInterval !== null) {
                     clearInterval(animationInterval);
                  }

                  animationInterval = setInterval(function () {
                     if (direction < 0) { // left
                        currentVelocity -= options.acceleration;
                        if (currentVelocity < -options.maximumVelocity) {
                           currentVelocity = -options.maximumVelocity;
                        }
                     } else if (direction > 0) { // right
                        currentVelocity += options.acceleration;
                        if (currentVelocity > options.maximumVelocity) {
                           currentVelocity = options.maximumVelocity;
                        }
                     } else if (currentVelocity < 0) { // stop
                        currentVelocity += options.friction;
                        if (currentVelocity > 0) {
                           currentVelocity = 0;
                        }
                     } else if (currentVelocity > 0) { // stop
                        currentVelocity -= options.friction;
                        if (currentVelocity < 0) {
                           currentVelocity = 0;
                        }
                     } else {
                        clearInterval(animationInterval);
                     }

                     // everything calculcated? okay, lets get ready to rumble.
                     sliderWrap.scrollLeft(Math.round(sliderWrap.scrollLeft() + currentVelocity));
                  }, 16); // ~ 60 FPS
               };

               // bindings
               leftButton.mousedown(function () {
                  move(-1);
                  return false;
               });

               rightButton.mousedown(function () {
                  move(1);
                  return false;
               });

               jQuery().add(leftButton).add(rightButton).bind('mouseup mouseleave', function () {
                  move(0);
                  return false;
               });

               if (!(jQuery.browser.msie && jQuery.browser.version < 9)) {
                  jQuery().add(leftButton).add(rightButton).mouseenter(function() {
                     jQuery(this).stop().animate({opacity: 0.8}, 200);
                  }).mouseleave(function() {
                     jQuery(this).stop().animate({opacity: 0.4}, 500);
                  }).css('opacity', 0.4);
               } else {
                  jQuery().add(leftButton).add(rightButton).css('opacity', 0.8);
               }
            });
         }).call(slideshow);
      } else {
         self.element().hide();
      }
   }
});
