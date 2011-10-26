
var CbElementCycler = base2.Base.extend({
   /**
    * Cycle through the elements: show the next one or the
    * given one.
    */
   show : function(index) {
      if (typeof(index) == 'undefined') index = this.shown_field + 1;
      if (index >= this.elements.length) index = 0;
      
      if (this.shown_field >= 0) {
         jQuery(this.elements[this.shown_field]).hide();
      }
      jQuery(this.elements[index]).show();
      
      this.shown_field = index;
   },
   
   hide : function() {
      if (this.shown_field < 0) return;
      jQuery(this.elements[this.shown_field]).hide();
      this.shown_field = -1;
   },
   
   getShown : function() {
      return jQuery(this.elements[this.shown_field]);
   },
   
   constructor : function(elements) {
      base2.lang.assert(elements.length > 0);
      this.base();
      this.shown_field = 0;
      this.elements = elements;
      this.original_state = [];
      var self = this;
      elements.each(function(index) {
         self.original_state[index] = jQuery(this).css('display');
      });
      this.elements.hide();
      jQuery(this.elements[0]).show();
   },
   
   destroy : function() {
      var self = this;
      this.elements.each(function(index) {
         jQuery(this).css('display', self.original_state[index]);
      });
   },
   
   refreshElement : function() {
      this.elements = jQuery(this.elements);
   }
});

var CbElementPivot = base2.Base.extend({
   
   constructor : function(element) {
      this.base();
      this.parent = jQuery(document.createElement('span'));
      this.parent.attr('id', element.attr('id'));
      element.removeAttr('id');
      this.parent.insertAfter(element);
      this.parent = jQuery(this.parent);
      this.parent.append(element.remove());
      this.child = this.parent.children();
   },
   
   destroy : function() {
      this.child.insertAfter(this.parent).attr('id', this.parent.attr('id'));
      this.parent.remove();
   },
   
   refreshElement : function() {
      this.child = jQuery(this.child);
      this.parent = jQuery(this.parent);
   }
});

var CbWindowCloser = base2.Base.extend({
   constructor : function(element) {
      this.base();
      this.element = element;
   },

   destroy : function() {
      var element = this.element;
      while(typeof(element.CbWidget) != 'function' || typeof(element.CbWidget().close) != 'function') {
         var parent = jQuery(element.parent());
         if (!parent || parent == element) {
            return;
         } else {
            element = parent;
         }
      }
      element.CbWidget().close();
   },

   refreshElement : function() {
      this.element = jQuery(this.element);
   }
});