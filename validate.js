/**
 * validate input widgets according to classes defined on input fields (or assigned manually)
 */

/**
 * Validator base class. Handles life cycle
 */
jQuery.CbValidate.validator = base2.Base.extend({
   constructor : function(widget) {
      this.base();
      widget.validators.push(this);
   },

   valid : function(widget) {
      return true;
   },
   
   destroy : function() {}
});

/**
 * makes sure a field is neither empty nor contains the predefined string.
 */
jQuery.CbValidate.nonempty = jQuery.CbValidate.validator.extend({
   valid : function(widget) {
      return widget.value() != "" &&
            widget.value() != jQuery.CbWidgetRegistry.bricks[widget.texts.text];
   }
});

/**
 * makes sure a field contains an email address.
 */ 
jQuery.CbValidate.email = jQuery.CbValidate.nonempty.extend({
   valid : function(widget) {
      return this.base(widget) && 
            widget.value().match(/^[\w_\-\.]{1,}@[\w_\-\.]{2,}\.[\w]{2,4}$/);
   }
});

/**
 * makes sure a field has the same content as other fields in the same group
 */
jQuery.CbValidate.equals = jQuery.CbValidate.nonempty.extend({
   
   /**
    * constructor
    * @param widget the Widget to attach to
    * @param group the group this validator belongs to. If undefined 0 is assumed
    */
   constructor : function(widget, group) {
      var static_self = jQuery.CbValidate.equals; 
      if (group === undefined) group = 0;
      this.base(widget);
      this.widget = widget;
      
      if (static_self.groups[group] === undefined) {
         static_self.groups[group] = [];
      }
      
      this.group = static_self.groups[group];
      this.group.push(this);
   },
   
   valid : function(widget) {
      if (!this.base(widget)) return false;
      
      for (var index in this.group) {
         if (this.group[index].widget.value() != widget.value()) {
            return false;
         }
      }
      return true;
   },
   
   destroy : function() {
      for (index in this.group) {
         if (this.group[index] == this) {
            this.group.splice(index, 1);
         }
      }
      this.base();
   }
}, {
   groups : {}  
});

/**
 * make sure the field contains a number
 */
jQuery.CbValidate.number = jQuery.CbValidate.nonempty.extend({
   valid : function(widget) {
      return this.base(widget) && widget.value().match(/\d*/);
   }
});

jQuery.CbValidate.editingFinished = jQuery.CbValidate.validator.extend({
   valid : function(widget) {return widget.editingFinished();}
});

jQuery.CbValidate.inputLength = jQuery.CbValidate.validator.extend({
   constructor : function(widget, min, max) {
      this.base(widget);
      this.min = (typeof(min) == 'undefined') ? jQuery.CbValidate.inputLength.default_min : min;
      this.max = (typeof(max) == 'undefined') ? jQuery.CbValidate.inputLength.default_max : max;
   },

   valid : function(widget) {
      var length = widget.value().length;
      return this.base(widget) && length >= this.min && length <= this.max;
   }
}, {
   default_min : 5,
   default_max : 255
});