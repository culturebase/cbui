/**
 * A text button. I'm sure we'll eventually need some kind of special behaviour
 * here. Maybe the click handler should be centralized.
 */
jQuery.CbWidget.textButton = jQuery.CbWidget.text.extend({
   
});

/**
 * A button intended for language selection. It always shows an isocode for the
 * current language. 
 */
jQuery.CbWidget.langSelect = jQuery.CbWidget.textButton.extend({

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

jQuery.CbWidget.imgButton = jQuery.CbWidget.widget.extend({});

jQuery.CbWidget.closeButton = jQuery.CbWidget.imgButton.extend({
   
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

jQuery.CbWidget.chooseList = jQuery.CbWidget.widget.extend({
   
   constructor : function(element) {
      this.base(element);
      var self = this;
      this.element().children().each(function() {
         $(this).click(function() {
            self.trigger('select', {id : $($(this).children()[0]).text()});
         });
      });
   }
}, {
   /**
    * has to be done before applying widgets as additional
    * widgets might be defined in the description.
    */
   addOption : function(element, id, description) {
      var node = $(document.createElement('div'));
      node.append($(document.createElement('span')).text(id).hide());
      node.append(description);
      if (element.children().length % 2) node.addClass("__CbUiListOddColor");
      element.append(node);
   },
   
   init : function() {
      jQuery.CbEvent(this, 'select');
      this.base();
   }
});

