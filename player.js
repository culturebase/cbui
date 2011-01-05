jQuery.CbWidget.player = jQuery.CbWidget.widget.extend({
   defaultOptions : {
      config : '_default',
      allow_fullscreen : true,
      allow_script_access : 'always',
      embed_source : '/player40/flash/player.swf',
      width : 550, // width and height are necessary to make it play nice with IE
      height : 350,
      id : 0
   },
   
   constructor : function(element, options) {
      this.base(element);
      this.options = jQuery.extend({}, this.defaultOptions, options);
   },
   
   handleShow : function() {
      var self = this;
      var embed = $(document.createElement('embed'))
         .attr('flashvars', "config=%2Fplayer40%2Fapi.php%3Fconfig%3D" + self.options.config + "%26id%3D" + self.options.id + "%26type%3Dconfig%26api_type%3Dxml")
         .attr('allowfullscreen', self.options.allow_fullscreen).attr('allowscriptaccess', self.options.allow_script_access)
         .attr('src', self.options.embed_source).attr('width', self.options.width).attr('height', self.options.height);
      this.element().append(embed);
      return this.base();
   },
   
   handleHide : function() {
      this.element().children().remove();
      return this.base();
   }
});