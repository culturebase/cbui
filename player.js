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
            .click(function() {self.play();})
      );
   },
   
   play : function() {
      var self = this;
      var embed = $(document.createElement('embed'))
         .attr('id', '__CbUiPlayerEmbed')
         .attr('flashvars', 'config=' + self.options.player_root + 'config/xml/td' + self.options.id + '/' + self.options.config)
         .attr('allowfullscreen', self.options.allow_fullscreen).attr('allowscriptaccess', self.options.allow_script_access)
         .attr('src', self.options.player_root + self.options.embed_source).attr('width', self.options.width).attr('height', self.options.height);
      this.element().empty().append(embed);
      return this;
   },

   callMenu: function(type) {
      document.getElementById('__CbUiPlayerEmbed').callMenu(type);
   }
});

jQuery.CbWidget.playerVersions = jQuery.CbWidget.select.extend({
   constructor : function(element) {
      this.versions = {};
      return this.base(element);
   },
   
   handleReady : function(options) {
      for(var i in options.versions) {
         var version = options.versions[i];
         this.versions[version.id] = version;
         this.element().append($(document.createElement('option')).val(version.id).text(version.name));
      }
      this.player = options.widgets.player;
      var self = this;
      this.element().change(function() {
         self.player.load(self.value(), self.versions[self.value()].image);
      });
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
               self.player.play();
               self.player.callMenu(self.controls[$(this).text()]);
            })
         );
      });
   }
});