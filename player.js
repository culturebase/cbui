jQuery.CbWidget.player = jQuery.CbWidget.widget.extend((function () {
   // "private members"
   var sendEvent = function(event) {
         var self = this;
         var t;
         if (!self.embed) self.play();
         try {
            self.embed.get(0).sendEvent(event);
            clearTimeout(t);
            return;
         } catch(e) {
            // continue
         }
         t = setTimeout(function () {
            sendEvent.call(self, event);
         }, 100);
      },

      callMenu = function(type) {
         var self = this;
         var t;
         if (!self.embed) self.play();
         try {
            self.embed.get(0).callMenu(type);
            clearTimeout(t);
            return;
         } catch(e) {
            // resume
         }
         t = setTimeout(function () {
            callMenu.call(self, type);
         }, 100);
      },

      /**
       * Generates a unique ID for id-attributes to avoid conflicts between
       * multiple players (playing the same video) on the same page. This is not
       * uncommon when layers are used on a website.
       *
       * @param <number> base (optional) "seed" used for ID generation
       * @return ID
       */
      generateUniqueId = (function () {
         var ids = {};

         return function (base) {
            base = base || 0;
            ids[base] = (ids[base] || 0) + 1;
            return 'cb-player-'+base+'-'+ids[base];
         };
      }());

   // "public members"
   return {
      defaultOptions : {
         image : '',
         play_icon : '',
         play_icon_width : 100,
         play_icon_height : 100,
         player_root : '/player40/',
         config : '_default',
         allow_fullscreen : true,
         allow_script_access : 'always',
         embed_source : 'flash/player.swf',
         width : 550, // width and height are necessary to make it play nice with IE
         height : 350,
         id : 0,
         buy_url: '',
         active : true,
         id_type : 'td'
      },

      constructor : function(element) {
         return this.base(element);
         var self = this;
         this.element().click(function() {self.play();});
      },

      handleReady : function(options) {
         this.options = jQuery.extend({}, this.defaultOptions, options);
         this.load(this.options.id, this.options.image,
               (this.options.active ? this.options.play_icon : this.options.na_icon),
               this.options.active);
         return this;
      },

      load : function(id, image, play_icon, active) {
         this.options.id = id;
         this.options.image = image;
         this.options.play_icon = play_icon;
         this.options.active = active;
         this.reset();
      },

      reset : function() {
         var self = this;
         this.element().css({position:'relative'}).empty().append(
               jQuery(document.createElement('img'))
               .attr('src', self.options.image)
               .attr('width', self.options.width).attr('height', self.options.height)
               .click(function() {
                  if (self.options.active) self.play();
               })
         );
         if(this.options.play_icon) {
            this.element().append(
               jQuery(document.createElement('img'))
               .attr('src', self.options.play_icon)
               .css({
                  position:'absolute',
                  width: self.options.play_icon_width,
                  height: self.options.play_icon_height,
                  top: ((self.options.height/2)-(self.options.play_icon_height/2)),
                  left: ((self.options.width/2)-(self.options.play_icon_width/2))
               }).click(function() {
                  if (self.options.active) self.play();
               })
            );
         }
      },

      play : function(id) {
         var self = this;
         if(id) this.options.id = id;

         // TODO: Check wether to use Flash or the <video> tag.

         this.embed = $(document.createElement('embed'))
            .attr('id', generateUniqueId(self.options.id))
            .attr('flashvars', 'config=' + self.options.player_root + 'config/xml/' + self.options.id_type + self.options.id + '/' + self.options.config)
            .attr('allowfullscreen', self.options.allow_fullscreen).attr('allowscriptaccess', self.options.allow_script_access)
            .attr('src', self.options.player_root + self.options.embed_source).attr('width', self.options.width).attr('height', self.options.height);
         this.element().empty().append(this.embed);
         sendEvent.call(this, 'PLAY'); // It is important to use .call(this, ...), since sendEvent() does not belong to the scope of this instance.
         return this;
      },

      // CbEvent handler for playerControls Widget

      handleBuyControl: function() {
         window.open(this.options.buy_url, 'cbshop',
            'width=500,height=600,dependent=no,hotkeys=no,location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,toolbar=no'
         ).focus();
      },

      handleContactControl: function() {
         callMenu.call(this, 'CONTACT');
      },

      handleEmbedControl: function() {
         callMenu.call(this, 'EMBED');
      },

      handleInfoControl: function() {
         callMenu.call(this, 'INFO');
      },

      handleMailControl: function() {
         callMenu.call(this, 'MAIL');
      },

      handleMenuControl: function() {
         callMenu.call(this, 'MENU');
      },

      handlePopupControl: function() {
         this.reset();
         var url = this.options.player_root+'td'+this.options.id+'/'+this.options.popup_config;
         window.open(url, 'cbplayer', this.options.popup_windowfeatures).focus();
         return false;
      },

      handleZoomControl: function() {
         // TODO
      }
   };
}()), {
   init : function() {
      jQuery.CbEvent(this, 'contactControl');
      jQuery.CbEvent(this, 'embedControl');
      jQuery.CbEvent(this, 'infoControl');
      jQuery.CbEvent(this, 'mailControl');
      jQuery.CbEvent(this, 'menuControl');
      jQuery.CbEvent(this, 'popupControl');
      jQuery.CbEvent(this, 'zoomControl');
      this.base();
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
         for(var i in options.versions) {
            var version = options.versions[i];
            self.versions[version.id] = version;
            var el = $(document.createElement('option')).val(version.id).text(version.name);
            if (version.id == options.id) el.attr('selected', 'true');
            self.element().append(el);
         }
         self.player = options.widgets.player;
         self.element().change(function() {
            var version = self.versions[self.value()];
            if(options.versions_autoplay == 1 && version.active) {
               self.player.play(self.value());
            } else {
               self.player.load(self.value(), version.image, (version.active ? options.play_icon : options.na_icon) , version.active);
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
      $.each(options.controls, function(type,text){
         var a = $(document.createElement('a')).attr('href', 'javascript://').text(text).addClass(type);
         if(type == 'buy' && self.player.options.buy_url == '')
            a.addClass('inactive');
         else
            a.click(function() {
               self.player.trigger(type+'Control');
            });
         self.element().append(a);
      });
   }
});

jQuery.CbWidget.playerSlides = jQuery.CbWidget.widget.extend({
   constructor : function(element) {
      return this.base(element);
   },

   handleReady : function(options) {
      var self = this,
         slideshow = $('<div class="slideshow">'
                         +'<div class="left-button"></div>'
                         +'<div class="right-button"></div>'
                         +'<div class="slider-wrap">'
                            +'<div class="slider"></div>'
                         +'</div>'
                      +'</div>'),
         slider = slideshow.find('.slider');

      this.player = options.widgets.player;
      
      if (options.slides && options.slides.length >= 1) {
         $.each(options.slides, function(i, image) {
            var img = $(document.createElement('img'))
               .attr('src', image.thumbnail)
               .attr('data-orig-src', image.original);

            // first image of slide is video trigger
            if (i == 0) {
               var
                  // select the best available icon source
                  iconSrc = $.map([options.slides_video_trigger_icon, options.play_icon], function (i, val) {
                     return !!val;
                  })[0] || null,
                  icon = null;

               if (iconSrc !== null) {
                  icon = $(document.createElement('img'))
                     .attr('src', iconSrc)
                     .addClass('video-trigger-icon')
                     .click(function() {
                        self.player.play();
                     })
                     .appendTo(slider);

                  img.load(function(){
                     icon.css({
                           display:   'block',
                           position:  'absolute',
                           top:       ((img.attr('height') / 2) - (icon.height() / 2))+'px',
                           left:      ((img.attr('width') / 2) - (icon.width() / 2))+'px',
                           'z-index': 2
                     });
                  });
               }

               img.addClass('video-trigger').click(function() {
                  self.player.play();
               });
            } else {
               img.click(function() {
                  self.player.load(self.player.options.id,
                     'http://data.heimat.de/transform.php'
                        +'?width='+self.player.options.width
                        +'&height='+self.player.options.height
                        +'&do=cropOut'
                        +'&file='+encodeURIComponent(img.attr('data-orig-src')),
                     false);
               });
            }

            img.appendTo(slider);
         });

         // wait for all images to be loaded
         (function (callbacks) {
            var callbackCount = callbacks.length,
               internalCallback = function () {
                  callbackCount--;

                  if (callbackCount === 0) {
                     (function (options) {
                        options = $.extend({
                           acceleration:    0.5, // how fast the slider gains speed (more means faster)
                           friction:        0.5, // how fast the slider looses speed (more means faster)
                           pixelsPerSecond: 500
                        }, options || {});

                        $(this).each(function () {
                           // movement
                           var animationInterval = null,
                              currentVelocity = 0,
                              sliderWrap = $(this).find('.slider-wrap'),
                              sliderWidth = 0,
                              slider = sliderWrap.find('.slider'),
                              leftButton = sliderWrap.find('.left-button'),
                              rightButton = sliderWrap.find('.right-button'),
                              buttons = $().add(leftButton).add(rightButton);

                           options.maximumVelocity = options.pixelsPerSecond / 60;

                           // prepare
                           slider.find('img').last().css('margin-right', '0px');

                           slider.children().each(function () {
                              if (!$(this).hasClass('video-trigger-icon')) {
                                 sliderWidth += $(this).outerWidth(true);
                              }
                           });

                           slider.width(sliderWidth);

                           if (sliderWidth <= sliderWrap.width()) {
                              buttons.hide();
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
                                 sliderWrap[0].scrollLeft += Math.round(currentVelocity);
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

                           buttons.bind('mouseup mouseleave', function () {
                              move(0);
                              return false;
                           }).mouseenter(function() {
                              $(this).stop().animate({opacity: 0.8}, 200);
                           }).mouseleave(function() {
                              $(this).stop().animate({opacity: 0}, 500);
                           }).animate({opacity: 0.8}, 2000, function() {
                              $(this).animate({opacity: 0}, 2000);
                           });
                        });
                     }).call(slideshow);
                  }
               };

            $.each(callbacks, function (i, callback) {
               callback(internalCallback);
            });
         }(slider.find('img').map(function (i, img) { // create callback functions for all images
            return function (callback) {
               img.load(callback);
            };
         }).get()));

         console.log(slider.find('img').map(function (i, img) { // create callback functions for all images
            return function (callback) {
               img.load(callback);
            };
         }).get());
         
         self.element().append(slideshow);
      } else {
         self.element().hide();
      }
   }
});
