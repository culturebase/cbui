/**
 * A text button. I'm sure we'll eventually need some kind of special behaviour
 * here. Maybe the click handler should be centralized.
 */
jQuery.CbWidget.textButton = jQuery.CbWidget.text.extend({});

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

/**
 * close button for windows. When clicked this button searches for the next
 * parent element which defines the "close" method. It then calls this method.
 */
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

/**
 * Language selector with flag. Assumes a background image that's indexed by
 * background-position. The outerWidth of the given element is assumed to be
 * the unit of indexing.
 */
jQuery.CbWidget.langSelectFlag = jQuery.CbWidget.imgButton.extend({
   constructor : function(element) {
      this.base(element);
      this.element().click(function() {
         language_window_callback.window = new jQuery.CbWidget.language_window();
         language_window_callback.window.open();
      });
   },

   changeLanguage : function(bricks) {
      var lang = jQuery.CbWidgetRegistry.language.split('_')[0];

      /* 123 is 97 + 26 where 97 is the offset of 'a' in the ascii alphabet and
       * 26 is the number of useful characters in the locale. So in fact we're
       * counting the flags from right/bottom here.
       */
      var pos_x = (123 - lang.charCodeAt(0)) * this.element().outerWidth();
      var pos_y = (123 - lang.charCodeAt(1)) * this.element().outerHeight();
      this.element().css('background-position', pos_x + 'px ' + pos_y + 'px');
   },

   handleReady : function(params) {
      this.base(params);
      this.changeLanguage(); // call changeLanguage again to get the outerWidth right
   }
});


/**
 * A choose list widget. presents a list of options with alternating colors.
 * Each entry represents an id and a description text. Entries can be added
 * with the static method addOption.
 * The colors can be defined with the CSS classes __CbUiListOddColor and
 * __CbUiListEvenColor. If one of the entries is clicked the "select" event is
 * triggered, with {id : <id of chosen entry>} as parameter.
 */
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
      if (element.children().length % 2) {
         node.addClass("__CbUiListEvenColor");
      } else {
         node.addClass("__CbUiListOddColor");
      }
      element.append(node);
   },
   
   init : function() {
      jQuery.CbEvent(this, 'select');
      this.base();
   }
});

