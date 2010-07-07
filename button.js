/**
 * A text button. I'm sure we'll eventually need some kind of special behaviour
 * here. Maybe the click handler should be centralized.
 */
jQuery.CbWidget.text_button = jQuery.CbWidget.text.extend({
   // nothing special for now
});

/**
 * A button intended for language selection. It always shows an isocode for the
 * current language. 
 */
jQuery.CbWidget.lang_select = jQuery.CbWidget.text_button.extend({

   constructor : function(element) {
      this.base(element);
      this.element().html(jQuery.CbWidgetRegistry.language.split('_')[0]);
      this.element().click(function() {
         language_window_callback.window = new jQuery.CbWidget.language_window(); 
         language_window_callback.window.open();
      });
   },
   
   changeLanguage : function(bricks) {
      this.element().html(jQuery.CbWidgetRegistry.language.split('_')[0]);
   }
});

jQuery.CbWidget.img_button = jQuery.CbWidget.widget.extend({});

jQuery.CbWidget.close_button = jQuery.CbWidget.img_button.extend({
   
   constructor : function(element) {
      this.base(element);
      var self = this;
      this.element().click(function() {
         var element = self.element();
         while(element.CbWidget().close == undefined) {
            var parent = $(element.parent());
            if (!parent || parent == element) {
               return;
            } else {
               element = parent;
            }
         }
         element.CbWidget().close();
      });
   }

});