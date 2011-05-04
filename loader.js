jQuery.CbWidget.loader = jQuery.CbWidget.widget.extend({
   constructor: function (options) {
      this.base(jQuery(document.createElement('div'))
         .addClass('__CbUiLayer').addClass('__CbUiLoader'));

      this.options = jQuery.extend({
         opacity:         0.25,
         fadeingDuration: 250
      }, options || {});
   },

   handleShow: function () {
      this.element().appendTo('body').stop()
         .fadeTo(this.options.fadingDuration, this.options.opacity);

      return this;
   },

   handleHide: function () {
      this.element().stop().fadeOut(this.options.fadingDuration, function () {
         jQuery(this).detach();
      });

      return this;
   }
});