/**
 * An input widget. Input widgets can be validated, they have a value and they
 * can be marked as containing an input error.
 * 
 * The input widget by itself can be used for text fields.
 */
jQuery.CbWidget.input = jQuery.CbWidget.widget.extend({

   /**
    * Create the input widget.  
    */
   constructor : function(element) {
      this.base(element);
      
      /**
       * validators for this widget.
       */
      this.validators = [];
   },
   
   /**
    * Query the current value of the field.
    */
   value : function(val) {
      return this.element().val(val);
   },
   
   /**
    * Run all validators on this widget.
    */
   validate : function() {
      this.clearError();
      for (i in this.validators) {
         if (!this.validators[i].valid(this)) {
            this.setError();
            return false;
         }
      }
      return true;
   },
   
   /**
    * callback to announce that this field has an input error. Assigns the
    * class '__CbUiInputError' to the element.
    */
   setError : function() {
      this.element().addClass("__CbUiInputError");
   },
   
   /**
    * clear the error state and remove the CSS class '__CbUiInputError'.
    */
   clearError : function() {
      this.element().removeClass("__CbUiInputError");
   },
   
   /**
    * Remove the widget and all its validators.
    */
   destructor : function() {
      for (index in this.validators) {
         this.validators[index].destructor();
      }
      this.base();
   }
   
});

/**
 * Text input widget.
 * Text input fields are expected to have a predefined standard value which is
 * the ML brick associated with the label registered at position "text" (i.e. 
 * this.bricks[this.texts.text]).
 * Focus handling is centralized for text input widgets.
 */
jQuery.CbWidget.input_text = jQuery.CbWidget.input.extend({
   /**
    * change the language. The description of the widget is usually shown in
    * the input field itself if it hasn't been edited yet. This is reflected
    * here. You can override this function or value() to change the behaviour.
    * 
    * For external labels, consider using separate text widgets, though.
    */
   changeLanguage : function(bricks) {
      var label = this.texts.text;
      if (this.value() == '' || this.value() == this.bricks[label]) {
         this.value(bricks[label]);
      }
      this.bricks[label] = bricks[label];
   },
   
   bindEvents : function(elements) {
      var self = this;
      this.element().focus(function() {
         self.focus();
      }).blur(function() {
         self.blur();
      });
   },
   
   refreshElement : function() {
      this.base();
      this.bindEvents();
   },
   
   /**
    * Create the text input widget. Assigns the class __CbUiFieldUnedited to
    * its element.  
    */
   constructor : function(element) {
      this.base(element);
      
      /**
       * tells if the field is being edited.
       */
      this.editing = false;
      
      /**
       * bricks to be used for translation and for comparing with standard value.
       */
      this.bricks = {};
      
      var label = this.value();
      this.texts = {text : label};
      this.bricks[label] = label;
      this.element().addClass('__CbUiFieldUnedited');
      this.bindEvents();
      this.event('focus');
      this.event('blur');
      
      var self = this;
      
      /**
       * focus handler. Sets the class '__CbUiFieldEdited' on the element.
       */
      this.focus(function() {
         if (!self.editing) {
            self.editing = true;
            self.element().select();
            self.element().removeClass('__CbUiFieldUnedited');
            self.element().addClass('__CbUiFieldEdited');
         }
      });
      
      /**
       * blur handler. Sets the class '__CbUiFieldUnedited' on the element if it's
       * empty or contains the standard value.
       */
      this.blur(function() {
         if (self.value() == '' || self.value() == self.bricks[self.texts.text]) {
            self.editing = false;
            self.value(self.bricks[self.texts.text]);
            self.element().removeClass('__CbUiFieldEdited');
            self.element().addClass('__CbUiFieldUnedited');
         }
      });
   }
});

/**
 * A password entry widget. This is basically a text entry widget which changes
 * its type to "password" as soon as you type anything into it. It can optionally
 * use strength checking on the password field and open a hint element to explain
 * that.
 * 
 * TODO: destructor; revert to original state.
 */
jQuery.CbWidget.password = jQuery.CbWidget.input_text.extend({
   
   refreshElement : function() {
      this.base();
      this.pivot.refreshElement();
      this.cycler.refreshElement();
      if (this.strength_check) this.cycler.elements.pstrength();
   },
   
   /**
    * add a strength check. The background color will appear in various shades
    * of green and red depending on the strength of the password.
    * @param hint_element an optional hint to be shown while editing the password.
    */
   addStrengthCheck : function(hint_element) {
      this.strength_check = true;
      this.hint_element = hint_element;
      this.default_color = this.element().css('background-color');
      this.cycler.elements.pstrength();
   },
   
   /**
    * create the password widget.
    * This actually replaces the given field with a span containing two input
    * fields: one with type 'password' and one with type 'text'. During the life
    * time of the widgets those are shown and hidden to conform to the standard
    * behaviour of text input widgets.
    */
   constructor : function(field) {
      this.pivot = new CbElementPivot(field);
      this.pivot.parent.prepend(
            this.pivot.child.clone().attr('type', 'text').removeAttr('id'));
      this.cycler = new CbElementCycler(this.pivot.parent.children());
      this.base(this.pivot.parent);
      var self = this;
      
      /**
       * focus handler.
       * Change the type attribute of the password field. This is complicated because of
       * cross browser issues.
       */
      this.focus(function() {
         if (self.cycler.getShown().attr('type') != 'password') {
            self.cycler.show();
            /* you should be able to type a password now */

            /* pass the focus and rebind the keypress as we have swapped the
             * node */
            self.cycler.getShown().focus();
            /* The field should have focus so that you can type a password now. */
         }
         
         if (self.value() == '' || self.value() == self.bricks[self.texts.text]) {
            self.value('');
         }
         
         if (self.strength_check) {
            self.cycler.getShown().css('background-color', self.current_color);
            if (self.hint_element !== undefined) self.hint_element.slideDown();
         }
      });
      
      /**
       * blur handler.
       * change the type back to 'text' if the content hasn't been edited.
       */
      this.blur(function() {
         if (self.strength_check) {
            self.current_color = self.cycler.getShown().css('background-color');
            self.cycler.getShown().css('background-color', self.default_color);
            if (self.hint_element !== undefined) self.hint_element.slideUp();
         }
         
         if (self.value() == '' || self.value() == self.bricks[self.texts.text]) {
            self.cycler.show();
         }
      });
   },
   
   /**
    * get the current value for the password
    * @return the value of the currently active field
    */
   value : function(val) {
      if (val !== undefined) {
         this.cycler.elements.val(val);
         return val;
      } else {
         return this.cycler.getShown().val();
      }
   },
   
   destructor : function() {
      this.cycler.destructor();
      this.pivot.destructor();
      this.base();
   },
   
   element : function() {
      return this.cycler.elements;
   }
});

/**
 * A widget for the "select" input. It translates all its options on 
 * changeLanguage.
 */
jQuery.CbWidget.select = jQuery.CbWidget.input.extend({
   constructor : function(element) {
      this.base(element);
      var self = this;
      this.element().children().each(function(index) {
         var label = jQuery(this).text();
         self.texts[jQuery(this).val()] = label;
      });
   },

   changeLanguage : function(bricks) {
      var self = this;
      this.element().children().each(function(index) {
         var label = self.texts[jQuery(this).val()];
         jQuery(this).html(bricks[label]);
      });
   }
});

/**
 * a searchbox widget. It invokes autocomplete() on its element's second child
 * and has the ID recorded in its element's first child. You can configure it 
 * using the "options" member. All options are passed on to autocomplete.
 * Autocomplete is reinitialized when changing the language. As the text input
 * is managed by autocomplete, this is not a real text input widget.
 */
jQuery.CbWidget.search_box = jQuery.CbWidget.input_text.extend({
   
   constructor : function(element) {
      this.options = {};
      this.options.language = jQuery.CbWidgetRegistry.language;
      
      this.pivot = new CbElementPivot(element);
      this.name_field = this.pivot.child;
      var id_field = $(document.createElement('input')).attr('type', 'hidden');
      this.options.putIdInto = 'searchbox' + this.id;
      this.pivot.parent.prepend(id_field.attr('id', this.options.putIdInto));
      
      this.base(this.pivot.parent);
   },
   
   changeLanguage : function(bricks) {
      this.base(bricks);
      this.options.language = jQuery.CbWidgetRegistry.language;
      this.name_field.unbind();
      this.name_field.autoComplete(this.options);
   },
   
   refreshElement : function() {
      this.name_field.unbind();
      this.base();
      this.name_field = jQuery(this.name_field);
      this.name_field.autoComplete(this.options);
   },
   
   value : function(val) {
      return this.name_field.val(val);
   },
   
   valueId : function() {
      return $(this.options.putIdInto).val();
   },
   
   destructor : function() {
      this.base();
      this.pivot.destructor();
   },
   
   element : function() {
      return this.pivot.child;
   }
});
