jQuery.CbWidget.loader = jQuery.CbWidget.widget.extend({
   constructor: function (options) {
      this.options = $.extend({
         opacity:         0.25,
         fadeingDuration: 250
      }, options || {});

      this.parentElement = $(document.createElement('div'))
         .addClass('__CbUiLayer').addClass('__CbUiLoader');
   },

   handleShow: function () {
      this.element().appendTo('body').stop()
         .fadeTo(this.options.fadingDuration, this.options.opacity);

      return this.base();
   },

   handleHide: function () {
      this.element().stop().fadeOut(this.options.fadingDuration, function () {
         $(this).detach();
      });

      return this.base();
   }
});