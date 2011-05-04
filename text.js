/**
 * A text widget. This simply shows the text for some ML label retrieved via
 * jQuery(element).text().
 */
jQuery.CbWidget.text = jQuery.CbWidget.widget.extend({
   
   changeLanguage : function(bricks) {
      if (this.texts.text) {
         this.element().html(bricks[this.texts.text]);
      }
   },
   
   constructor : function(element) {
      this.base(element);
      var label = this.element().text();
      if (label != '') {
         this.texts = {text : label};
      }
   },

   value : function(text) {
      this.element().html(text);
   }
});

/**
 * A widget showing alternate texts which can be switched using show(). By
 * default no text is shown. This is particularly useful for error messages.
 * 
 * It expects a DOM element with children, each of which has an ML label as
 * text.
 */
jQuery.CbWidget.multiText = jQuery.CbWidget.widget.extend({
   
   constructor : function(element) {
      this.base(element);
      this.cycler = new CbElementCycler(element.children());
      this.cycler.hide();
      var self = this;
      this.cycler.elements.each(function(index) {
         var label = jQuery(this).text();
         self.texts[index] = label;
      });
   },
   
   handleHide : function(params) {
      this.base();
      this.cycler.hide();
   },
   
   handleShow : function(params) {
      this.base();
      if (typeof(params.label) == 'number') {
         this.cycler.show(params.label);
      } else {
         for (pos in this.texts) {
            if (this.texts[pos] == params.label) {
               this.cycler.show(pos);
               break;
            }
         }
      }
   },

   numTexts : function() {
      return this.cycler.elements.length;
   },
   
   /**
    * show the text belonging to the given label, provided it is available.
    * Hide any other text. short for trigger('show', ...)
    */
   showText : function(label) {
      this.trigger('show', {'label' : label});
   },
   
   hideText : function() {
      this.hide();
   },
   
   changeLanguage : function(bricks) {
      var self = this;
      this.cycler.elements.each(function(index) {
         jQuery(this).html(bricks[self.texts[index]]);
      });
   },
   
   handleDestroy : function() {
      this.base();
      this.cycler.destroy();
   }
});