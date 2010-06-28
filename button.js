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
   },
   
   changeLanguage : function(bricks) {
      this.element().html(jQuery.CbWidgetRegistry.language.split('_')[0]);
   }
});