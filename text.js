/**
 * A text widget. This simply shows the text for some ML label retrieved via
 * $(element).text().
 */
jQuery.CbWidget.text = jQuery.CbWidget.widget.extend({
   
   changeLanguage : function(bricks) {
      this.element().html(bricks[this.texts.text]);
   },
   
   constructor : function(element) {
      this.base(element);
      var label = this.element().text();
      this.texts = {text : label};
   }
});

/**
 * A widget showing alternate texts which can be switched using show(). By
 * default no text is shown. This is particularly useful for error messages.
 * 
 * It expects a DOM element with children, each of which has an ML label as
 * text.
 */
jQuery.CbWidget.multi_text = jQuery.CbWidget.widget.extend({
   
   constructor : function(element) {
      this.base(element);
      this.cycler = new CbElementCycler(element.children());
      this.cycler.hide();
      var self = this;
      this.cycler.elements.each(function(index) {
         var label = $(this).text();
         self.texts[index] = label;
      });
   },
   
   /**
    * show the text belonging to the given label, provided it is available.
    * Hide any other text.
    */
   show : function(label) {
      for (pos in this.texts) {
         if (this.texts[pos] == label) {
            this.cycler.show(pos);
         }
      }
   },
   
   hide : function() {
      this.cycler.hide();
   },
   
   changeLanguage : function(bricks) {
      var self = this;
      this.cycler.elements.each(function(index) {
         $(this).html(bricks[self.texts[index]]);
      });
   },
   
   destructor : function() {
      this.base();
      this.cycler.destructor();
   }
});