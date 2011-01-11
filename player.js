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

   configure : function(options) {
      this.options = jQuery.extend({}, this.defaultOptions, options);
      var self = this;
      this.element().append(
            jQuery(document.createElement('img'))
            .attr('src', self.options.image)
            .attr('width', self.options.width).attr('height', self.options.height)
            .click(function() {self.play();})
      );
      return this;
   },
   
   play : function() {
      var self = this;
      var embed = $(document.createElement('embed'))
         .attr('flashvars', 'config=' + self.options.player_root + 'config/xml/' + self.options.config + '/' + self.options.id)
         .attr('allowfullscreen', self.options.allow_fullscreen).attr('allowscriptaccess', self.options.allow_script_access)
         .attr('src', self.options.player_root + self.options.embed_source).attr('width', self.options.width).attr('height', self.options.height);
      this.element().empty().append(embed);
      return this;
   }
});