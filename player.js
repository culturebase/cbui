jQuery.CbWidget.player = jQuery.CbWidget.widget.extend((function () {
   // "private members"
   var sendEvent = function(event) {
         var self = this;
         if (!self.embed) self.play();
         try {
            document.getElementById(self.embed.attr('id')).sendEvent(event);
            return;
         } catch(e) {
            // continue
         }
         setTimeout(function () {
            sendEvent.call(self, event);
         }, 100);
      },

      callMenu = function(type) {
         var self = this;
         if (!self.embed) self.play();
         try {
            document.getElementById(self.embed.attr('id')).callMenu(self, type);
            return;
         } catch(e) {
            // resume
         }
         setTimeout(function () {
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
         id : 0
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

      load : function(id, image, play_icon) {
         this.options.id = id;
         this.options.image = image;
         this.options.play_icon = play_icon;
         var self = this;
         this.element().css({position:'relative'}).empty().append(
               jQuery(document.createElement('img'))
               .attr('src', image)
               .attr('width', self.options.width).attr('height', self.options.height)
               .click(function() {
                  self.play();
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
                  self.play();
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
      }
   };
}()));

jQuery.CbWidget.playerVersions = jQuery.CbWidget.select.extend({
   constructor : function(element) {
      this.versions = {};
      return this.base(element);
   },
   
   handleReady : function(options) {
      if(options.versions != '') {
         for(var i in options.versions) {
            var version = options.versions[i];
            this.versions[version.id] = version;
            this.element().append($(document.createElement('option')).val(version.id).text(version.name));
         }
         this.player = options.widgets.player;
         var self = this;
         this.element().change(function() {
            if(options.versions_autoplay == 1) {               
               self.player.play(self.value());
            }
            else
               self.player.load(self.value(), self.versions[self.value()].image);
         });
      } else {
         this.element().hide();
      }
   }
});

jQuery.CbWidget.playerControls = jQuery.CbWidget.widget.extend({
   constructor : function(element) {
      this.controls = {};
      return this.base(element);
   },

   handleReady : function(options) {
      var self = this;
      this.player = options.widgets.player;
      $.each(options.controls, function(type,text){
         self.controls[text] = type;
         self.element().append($(document.createElement('a')).attr('href', '#').text(text).click(function() {
               self.player.callMenu(self.controls[$(this).text()]);
            })
         );
      });
   }
});