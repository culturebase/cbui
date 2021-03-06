/* This file is part of cbui.
 * Copyright © 2010-2012 stiftung kulturserver.de ggmbh <github@culturebase.org>
 *
 * cbui is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * cbui is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with cbui.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * An input widget. Input widgets can be validated, they have a value and they
 * can be marked as containing an input error.
 */
jQuery.CbWidget.input = jQuery.CbWidget.widget.extend({

   /**
    * Create the input widget.
    */
   constructor : function(element) {
      this.base(element);
      var title = this.element().attr('title');
      if (title) this.texts.title = title;
      /**
       * validators for this widget.
       */
      this.validators = [];
   },

   changeLanguage : function(bricks) {
      if (this.texts.title) {
         this.element().attr('title', bricks[this.texts.title]);
      }
      this.base(bricks);
   },

   /**
    * Query or set the current value of the field.
    * @param val the new value (optional)
    * @return the value of the field
    */
   value : function(val) {
      if (typeof(val) == 'undefined') {
         return this.element().val();
      } else {
         return this.element().val(val);
      }
   },

   /**
    * Run all validators on this widget.
    * @return true if validation was successful, false otherwise
    */
   validate : function() {
      var self = this;
      var ret = true;
      this.valid();
      jQuery.each(this.validators, function(i, validator) {
         if (!validator.valid(self)) {
            self.error();
            ret = false;
            return false;
         } else {
            return true;
         }
      });
      return ret;
   },

   /**
    * Certain widgets have defined "finished" states which may be important.
    * For example the search box will return a value but an invalid ID if it's
    * queries before editing is finished.
    */
   editingFinished : function() {return true;},

   /**
    * callback to announce that this field has an input error. Assigns the
    * class '__CbUiInputError' to the element.
    */
   handleError : function() {
      this.element().addClass("__CbUiInputError");
      return this;
   },

   /**
    * clear the error state and remove the CSS class '__CbUiInputError'.
    */
   handleValid : function() {
      this.element().removeClass("__CbUiInputError");
      return this;
   },

   /**
    * Remove the widget and all its validators.
    */
   handleDestroy : function() {
      jQuery.each(this.validators, function(i, validator) {
         validator.destroy();
      });
      this.base();
   }

}, {
   init : function() {
      /* triggered when the input has been found invalid */
      jQuery.CbEvent(this, 'error');

      /* triggered when the input has been found valid */
      jQuery.CbEvent(this, 'valid');

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
jQuery.CbWidget.inputText = jQuery.CbWidget.input.extend({
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
      this.base(bricks);
   },

   reset : function() {
      this.value(this.bricks[this.texts.text]);
      this.element().removeClass('__CbUiFieldEdited');
      this.element().addClass('__CbUiFieldUnedited');
   },

   /**
    * (re-)bind the events associated with this widget. Focus and blur events
    * from the widget's elements are passed on to trigger the respective events
    * on the widget itself.
    */
   bindEvents : function() {
      var self = this;
      this.element().focus(function() {
         self.focus();
      }).blur(function() {
         self.blur();
      }).click(function() {
         this.select();
      });
      return this;
   },

   /**
    * reread the element from the DOM and rebind the events.
    */
   refreshElement : function() {
      this.base();
      this.bindEvents();
      return this;
   },

   /**
    * Create the text input widget. Assigns the class __CbUiFieldUnedited to
    * its element.
    */
   constructor : function(element) {
      this.base(element);

      /**
       * bricks to be used for translation and for comparing with standard value.
       */
      this.bricks = {};

      var label = this.value();
      this.texts.text = label;
      this.bricks[label] = label;
      this.element().addClass('__CbUiFieldUnedited');
      this.bindEvents();
   },

   /**
    * blur handler. Sets the class '__CbUiFieldUnedited' on the element if it's
    * empty or contains the standard value.
    */
   handleBlur : function() {
      if (this.value() == '' || this.value() == this.bricks[this.texts.text]) {
         this.reset();
      }
      return this;
   },

   /**
    * focus handler. Sets the class '__CbUiFieldEdited' on the element.
    */
   handleFocus : function() {
      this.element().removeClass('__CbUiFieldUnedited');
      this.element().addClass('__CbUiFieldEdited');
      return this;
   }
}, {
   init : function() {
      jQuery.CbEvent(this, 'focus');
      jQuery.CbEvent(this, 'blur');
      return this.base();
   }
});

/**
 * A password entry widget. This is basically a text entry widget which changes
 * its type to "password" as soon as you type anything into it. It can optionally
 * use strength checking on the password field and open a hint element to explain
 * that.
 * You need pstrength.js if you want to use the password widget's strength check.
 */
jQuery.CbWidget.password = jQuery.CbWidget.inputText.extend({

   /**
    * reread the element and the backup elements from the DOM and
    * reattach the strength handler.
    */
   refreshElement : function() {
      this.base();
      this.pivot.refreshElement();
      this.cycler.refreshElement();
      if (this.strength_check) this.cycler.elements.pstrength();
      this.pivot.parent.children().first().unbind('blur');
   },

   /**
    * add a strength check. The background color will appear in various shades
    * of green and red depending on the strength of the password.
    * @param hint_element an optional hint widget to be shown while editing the
    * password.
    */
   addStrengthCheck : function(hint_element) {
      this.strength_check = true;
      this.hint_element = hint_element;
      this.default_color = this.element().css('background-color');
      this.cycler.elements.pstrength();
      this.cycler.getShown().css('background-color', this.current_color);
      if (this.hint_element !== undefined) this.hint_element.slideDown();
   },

   removeStrengthCheck : function() {
      if (this.hint_element !== undefined) this.hint_element.slideUp();
      this.cycler.elements.pstrength('destroy');
      this.element().css('background-color', this.default_color);
      delete this.hint_element;
      this.strength_check = false;
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
      /* We can't use clone() here as IE and Opera don't like setting the
       * type attribute on existing nodes.
       */
      var new_child = jQuery('<input type="text"/>');
      var self = this;
      jQuery.each(['style', 'class', 'value', 'size', 'maxlength', 'name'], function(i, attrib) {
         var val = self.pivot.child.attr(attrib);
         /* extra ugly clutch to make FF 4 happy: you can't set maxlength = -1 */
         if (typeof(val) != 'undefined' && (attrib != 'maxlength' || val != -1)) {
            new_child.attr(attrib, val);
         }
      });
      this.pivot.parent.prepend(new_child);
      this.cycler = new CbElementCycler(this.pivot.parent.children());
      this.base(this.pivot.parent);
      this.pivot.parent.children().first().unbind('blur'); // no need to handle blur event of text field
      return this;
   },

   /**
    * focus handler.
    * Change the type attribute of the password field. This is complicated because of
    * cross browser issues.
    */
   handleFocus : function() {
      if (this.cycler.getShown().attr('type') != 'password') {
         this.cycler.show();
         /* you should be able to type a password now */

         /* pass the focus and rebind the keypress as we have swapped the
          * node */
         this.cycler.getShown().focus();
         /* The field should have focus so that you can type a password now. */
      }

      if (this.value() == '' || this.value() == this.bricks[this.texts.text]) {
         this.value('');
      }

      return this.base();
   },

   /**
    * blur handler.
    * change the type back to 'text' if the content hasn't been edited.
    */
   handleBlur : function() {

      if (this.value() == '' || this.value() == this.bricks[this.texts.text]) {
         this.cycler.show();
      }
      return this.base();
   },

   /**
    * get or set the current value for the password
    * @return the value of the currently active field
    */
   value : function(val) {
      if (typeof(val) != 'undefined') {
         this.cycler.elements.val(val);
         return val;
      } else {
         return this.cycler.getShown().val();
      }
   },

   /**
    * destroy the widget and remove the backup elements.
    * @return this
    */
   handleDestroy : function() {
      this.cycler.destroy();
      this.pivot.destroy();
      return this.base();
   },

   /**
    * return all elements in the cycler.
    */
   element : function() {
      return this.cycler.elements;
   }
});

/**
 * A widget for the "select" input. It translates all its options on
 * changeLanguage.
 */
jQuery.CbWidget.select = jQuery.CbWidget.input.extend({

   /**
    * create the widget and collect the texts to be translated
    * @param element the element the widget should attach itself to.
    */
   constructor : function(element) {
      this.base(element);
      var self = this;
      this.element().children().each(function() {
         var label = jQuery(this).text();
         self.texts['value' + jQuery(this).val()] = label;
      });
   },

   /**
    * translate all options.
    * @param bricks the translations
    */
   changeLanguage : function(bricks) {
      var self = this;
      this.element().children().each(function() {
         var label = self.texts['value' + jQuery(this).val()];
         jQuery(this).html(bricks[label]);
      });
      this.base(bricks);
   },

   addOption : function(value, text, css_class, selected) {
      var el = jQuery(document.createElement('option')).val(value).text(text);
      if (css_class) el.addClass(css_class);
      if (selected) el.attr('selected', 'true');
      this.element().append(el);
   }
});

/**
 * A widget for the "checkbox" input. The pivoting is needed to make the element
 * stylable (checkboxes themselves can't be styled in firefox).
 */
jQuery.CbWidget.checkbox = jQuery.CbWidget.input.extend({
   constructor : function(element) {
      this.pivot = new CbElementPivot(element);
      this.checkbox = this.pivot.child;
      this.base(this.pivot.parent);
   },

   handleDestroy : function() {
      this.base();
      this.pivot.destroy();
   },

   refreshElement : function() {
      this.base();
      this.checkbox = jQuery(this.checkbox);
      this.pivot.refreshElement();
   },

   /**
    * Query or set the current value of the checkbox.
    * An unchecked checkbox always returns false when queried.
    * A checked checkbox without attribute "value" set returns true when queried.
    * A checked checkbox with value set returns the value when queried.
    * When setting the value, only the "checked" state is set according to the
    * truthiness of the parameter.
    * @param val the new value (optional)
    * @return the value of the checkbox
    */
   value : function(val) {
      if (typeof(val) == 'undefined') {
         if (!this.checkbox.attr('checked')) {
            return false;
         } else if (!this.checkbox.val()) {
            return true;
         } else {
            return this.checkbox.val();
         }
      } else {
         this.checkbox.attr('checked', val);
         return this.value();
      }
   }
});

/**
 * a searchbox widget. It invokes autocomplete() on its element's second child
 * and has the ID recorded in its element's first child. You can configure it
 * using the "options" member. All options are passed on to autocomplete.
 * Autocomplete is reinitialized when changing the language. As the text input
 * is managed by autocomplete, this is not a real text input widget.
 * You'll need autocomplete2/mod.autocomplete.js if you want to use this widget.
 */
jQuery.CbWidget.searchBox = jQuery.CbWidget.inputText.extend({

   constructor : function(element) {
      this.options = {};
      if (jQuery.CbWidgetRegistry.language) {
         this.options.language = jQuery.CbWidgetRegistry.language;
      }

      this.pivot = new CbElementPivot(element, 'div');
      this.name_field = this.pivot.child;
      var id_field = jQuery(document.createElement('input')).attr('type', 'hidden');

      this.base(this.pivot.parent);
      var id = 'searchbox' + this.base2ID;
      this.options.putIdInto = '#'+ id;
      this.pivot.parent.prepend(id_field.attr('id', id));
   },

   changeLanguage : function(bricks) {
      this.base(bricks);
      this.options.language = jQuery.CbWidgetRegistry.language;
      this.name_field.unbind();
   },

   handleReady : function(options) {
      jQuery.extend(this.options, options);
      this.name_field.autoComplete(this.options);
      return this.base(options);
   },

   refreshElement : function() {
      this.name_field.unbind();
      this.base();
      this.name_field = jQuery(this.name_field);
      this.name_field.autoComplete(this.options);
      this.pivot.refreshElement();
   },

   editingFinished : function() {
      return this.name_field.hasClass('__AC_freetext') || this.name_field.hasClass('__AC_validated');
   },

   value : function(val) {
      if (typeof(val) == 'undefined') {
         return this.name_field.val();
      } else {
         return this.name_field.val(val);
      }
   },

   /**
    * get or set the ID associated with the current value of the field
    */
   valueId : function(val) {
      if (typeof(val) == 'undefined') {
         return jQuery(this.options.putIdInto).val();
      } else {
         return jQuery(this.options.putIdInto).val(val);
      }
   },

   handleDestroy : function() {
      this.base();
      this.pivot.destroy();
   },

   handleHide : function() {
      this.pivot.parent.find('.__AC_close').click();
      this.base();
   },

   element : function() {
      return this.pivot.child;
   }
});

/**
 * Same as inputText, but with a textarea as base element. The distinction may
 * be important for styling.
 */
jQuery.CbWidget.inputTextArea = jQuery.CbWidget.inputText.extend({});
