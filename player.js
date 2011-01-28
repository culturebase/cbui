jQuery.CbWidget.player = jQuery.CbWidget.widget.extend({
   defaultOptions : {
      image : '',
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
      this.load(options.id, options.image);
      return this;
   },
   
   load : function(id, image) {
      this.options.id = id;
      this.options.image = image;
      var self = this;
      this.element().empty().append(
            jQuery(document.createElement('img'))
            .attr('src', image)
            .attr('width', self.options.width).attr('height', self.options.height)
            .click(function() {
               self.play();
               self.sendEvent('PLAY');
            })
      );
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
      return this;
   },

   sendEvent: function(event) {
      var self = this;
      if (!self.embed) self.play();
      try {
         self.getFlashMovieObject(self.embed.attr('id')).sendEvent(event);
         return;
      } catch(e) {
         // resume
      }
      setTimeout(function () {
         self.sendEvent(event);
      }, 100);
   },

   callMenu: function(type) {
      var self = this;
      if (!self.embed) self.play();
      try {
         self.getFlashMovieObject(self.embed.attr('id')).callMenu(type);
         return;
      } catch(e) {
         // resume
      }
      setTimeout(function () {
         self.callMenu(type);
      }, 100);
   },

   getFlashMovieObject: function (_movieName)	{
      if (window.document[_movieName]) {
         return window.document[_movieName];
      } else if (navigator.appName.indexOf("Microsoft Internet") == -1 && document.embeds && document.embeds[_movieName])  {
         return document.embeds[_movieName];
      }
      return document.getElementById(_movieName);
   }
});

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
               self.player.sendEvent('PLAY');
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