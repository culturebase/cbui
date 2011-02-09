jQuery.CbWidget.player = jQuery.CbWidget.widget.extend((function () {
   // "private members"
   var sendEvent = function(event) {
         var self = this;
         var t;
         if (!self.embed) self.play();
         try {            
            document.getElementById(self.embed.attr('id')).sendEvent(event);
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
            document.getElementById(self.embed.attr('id')).callMenu(type);
            clearTimeout(t);
            return;
         } catch(e) {
            // resume
         }
         t = setTimeout(function () {
            callMenu.call(self, type);
         }, 100);
      };
   
   // "public members"
   return {
      defaultOptions : {
         image : '',
         play_icon : '',
         play_icon_width : 42,
         play_icon_height : 42,
         player_root : '/player40/',
         config : '_default',
         allow_fullscreen : true,
         allow_script_access : 'always',
         embed_source : 'flash/player.swf',         
         width : 550, // width and height are necessary to make it play nice with IE
         height : 350,
         id : 0,
         buy_url: ''
      },

      constructor : function(element) {
         return this.base(element);
         var self = this;
         this.element().click(function() {self.play();});
      },

      handleReady : function(options) {
         this.options = jQuery.extend({}, this.defaultOptions, options);
         this.load(options.id, options.image, options.play_icon);
         return this;
      },

      load : function(id, image, play_icon, active) {
         this.options.id = id;
         this.options.image = image;
         this.options.play_icon = play_icon;
         this.options.active = active;
         var self = this;
         this.element().css({position:'relative'}).empty().append(
               jQuery(document.createElement('img'))
               .attr('src', image)
               .attr('width', self.options.width).attr('height', self.options.height)
               .click(function() {
                  if (active) self.play();
               })
         );
         if(this.options.play_icon) {
            this.element().append(
               jQuery(document.createElement('img'))
               .attr('src', play_icon)
               .css({
                  position:'absolute',
                  width: self.options.play_icon_width,
                  height: self.options.play_icon_height,
                  top: ((self.options.height/2)-(self.options.play_icon_height/2)),
                  left: ((self.options.width/2)-(self.options.play_icon_width/2))
               }).click(function() {
                  if (active) self.play();
               })
            );
         }
      },

      play : function(id) {
         var self = this;
         if(id)
            this.options.id = id;
         this.embed = $(document.createElement('embed'))
            .attr('id', self.options.id)
            .attr('flashvars', 'config=' + self.options.player_root + 'config/xml/td' + self.options.id + '/' + self.options.config)
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
         );
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
         var url = this.options.player_root+'td'+this.options.id+'/'+this.options.config+'_popup';
         window.open(url, 'cbplayer',
            'width=800,height=600,dependent=no,hotkeys=no,location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,toolbar=no'
         );
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
      var self = this;
      this.player = options.widgets.player;
      var slideshow = $('<div class="slideshow">\
                           <div class="left-button"></div>\
                           <div class="right-button"></div>\
                           <div class="slider-wrap">\
                              <div class="slider"></div>\
                           </div>\
                        </div>');
      $.each(options.slides, function(src){
         var img = $(document.createElement('img')).attr('src', src);
         slideshow.find('.slider').append(img);
      });
      self.element().append(slideshow).hide();
   }
});
