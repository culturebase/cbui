/**
 * A widget toolkit for culturebase. A widget is a simle GUI element with some
 * functionality and an internal state. Widgets are 
 * - extendable: If you need a widget similar to one we already have you can
 *    subclass the existing one. Always keep this in mind when you do, though.
 * - reusable: Widgets are to be collected in a central place and are thus
 *    available to all CB applications and web sites.
 * - translatable: Widgets integrate with cb-ml.
 * - managable: Widgets have a life cycle. You can create and destroy them and
 *    they will behave nicely when you do. Widgets can be composed into windows
 *    which will take away much of the management burden.
 * - validatable: Certain widgets can accomodate subclassses of 
 *    CbValidate.validator and provide validate() methods.
 *    
 * In order for this to work you need to include:
 * - jquery.js
 * - base2.js
 * - cb_ui/validate.js (if there are any widgets to be validated)
 * - some styles for '__CbUi*'
 * - autocomplete2/mod.autocomplete.js if you want to use the autocomplete widget
 * - pstrength.js if you want to use the password widget's strength check
 * 
 * TODO: split up in multiple files.
 */

/**
 * The widget registry collects information about all available widget classes
 * and manages translation, instantiation and destruction of widgets.
 * 
 * TODO: move destruction from window.js to here
 */
jQuery.CbWidgetRegistry = {
   /**
    * get a widget or validator name from a class name
    */
   translateToClass : function(name, prefix) {
      return '.__Cb' + prefix + ('_' + name).replace( /_[a-z]/g ,
            function(m){ return m.substring(1).toUpperCase(); });
   },
   
   /* some properties you can change to modify the behaviour of the widget registry */
   
   /**
    * the project to be queried for ML bricks
    */
   project : 'cb-framework',
   
   /**
    * secondary project to be queried for ML bricks if they aren't found in 'project'
    */
   base_project : 'cb-framework',
   
   /**
    * language to be used
    */
   language : 'en_EN',
   
   /**
    * The actual translated bricks. Be careful when modifying this.
    */
   bricks : {},
   
   /**
    * Instantiate widgets and validators in the given context and translate them.
    * @param context A DOM element to restrict the operation to (e.g. a window) 
    */
   apply : function(context) {
      var self = this;
      var labels = [];
      /* create widgets and collect bricks */
      for (var name in jQuery.CbWidget) {
         var elements = jQuery(self.translateToClass(name, 'Ui'), context);

         elements.each(function() {
            var widget = new (jQuery.CbWidget[name])(jQuery(this));
            jQuery.merge(labels, widget.getLabels());
         });
         labels = jQuery.unique(labels);
      }
      
      for (var name in jQuery.CbValidate) {
         var elements = jQuery(self.translateToClass(name, 'Validate'), context);
         elements.each(function() {
            new (jQuery.CbValidate[name])(jQuery(this).CbWidget());
         });
      }
      
      /* fetch bricks */
      jQuery.getJSON("/module/lib/framework/getMlBricks.php", {
            "project" : this.project, 
            "base_project" : this.base_project, 
            "language" : this.language, 
            "labels" : labels
         }, function(bricks) {
         /* loop over widgets again and apply bricks */
         self.bricks = bricks;
         for (var name in jQuery.CbWidget) {
            jQuery(self.translateToClass(name, 'Ui'), context).each(function() {
               jQuery(this).CbWidget().changeLanguage(bricks);
            });
         }
      });
   }
};

jQuery.CbWidget = function() {}; // maybe do something useful here; e.g. find elements belonging to certain widget types

/**
 * jquery plugin to enable $(element).CbWidget() functionality. Saves information
 * about widgets via $.data(...).
 * @param widget if set attach the widget to the element otherwise find the 
 *    widget belonging to the element. If set to null remove widget information
 *    from the element.
 */
jQuery.fn.CbWidget = function(widget) {
   if (widget !== undefined) {
      if (widget !== null) {
         this.data("cb_widget", widget);
      } else {
         this.removeData("cb_widget");
      }
   }
   return this.data("cb_widget");
};

/**
 * the base widget. All widgets are to be subclassed from this one.
 */
jQuery.CbWidget.widget = base2.Base.extend({
   
   /**
    * create a widget on the given element.
    * @param element the element the widget should attach to
    */
   constructor : function(element) {
      this.base();
      this.parent_element = element;
      var self = this;
      this.parent_element.unload(function() {self.destructor();});
      this.element().CbWidget(this);
      
      /**
       * association of positions -> labels
       */
      this.texts = {};
   },
   
   /**
    * get the element the widget belongs to. Some widgets might override this
    * method and/or change their element. Don't assume the element to be the 
    * same every time you use it.
    */
   element : function() {
      return this.parent_element;
   },
   
   /**
    * get labels for all ML bricks needed by this widget.
    * @return an array of labels for all ML bricks needed.
    */
   getLabels : function() {
      var labels = [];
      for (var pos in this.texts) {
         labels.push(this.texts[pos]);
      }
      return labels;
   },
   
   /**
    * hook for changing or initializing the language.
    * @param bricks map of labels to ML bricks for the new language. 
    */
   changeLanguage : function(bricks) {},
   
   /**
    * hide the widget.
    */
   hide : function() {
      this.element().hide();
   },
   
   /**
    * show the widget.
    */
   show : function() {
      this.element().show();
   },
   
   /**
    * destroy the widget. Leave the element alone, though.
    * As the widget doesn't create the element on construction it won't remove
    * it on destruction. Widgets are expected to remove any extra elements they
    * might have created and revert the original element to its original state,
    * though.
    */
   destructor : function() {
      this.element().CbWidget(null);
   }
});


/**
 * An input widget. Input widgets can be validated, they have centralized focus
 * handling, they have a value and they can be marked as containing an input 
 * error.
 * 
 * Input fields are expected to have apredefined standard value which is the ML
 * brick associated with the label registered at position "text" (i.e. 
 * this.bricks[this.texts.text]).
 * 
 * The input widget by itself can be used for text fields.
 * 
 * TODO: split up into generalized input widget and text input widget.
 */
jQuery.CbWidget.input = jQuery.CbWidget.widget.extend({
   
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
   
   /**
    * focus handler. Sets the class '__CbUiFieldEdited' on the element.
    */
   focus : function() {
      if (!this.editing) {
         this.editing = true;
         this.element().select();
         this.element().removeClass('__CbUiFieldUnedited');
         this.element().addClass('__CbUiFieldEdited');
      }
   },
   
   /**
    * blur handler. Sets the class '__CbUiFieldUnedited' on the element if it's
    * empty or contains the standard value.
    */
   blur : function() {
      if (this.value() == '' || this.value() == this.bricks[this.texts.text]) {
         this.editing = false;
         this.value(this.bricks[this.texts.text]);
         this.element().removeClass('__CbUiFieldEdited');
         this.element().addClass('__CbUiFieldUnedited');
      }
   },
   
   /**
    * Create the input widget. Assigns the class __CbUiFieldUnedited to its element  
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
      
      /**
       * validators for this widget.
       */
      this.validators = [];
      
      var label = this.value();
      this.texts = {text : label};
      this.bricks[label] = label;
      var self = this;
      this.element().addClass('__CbUiFieldUnedited');
      this.element().focus(function() {
         self.focus();
      }).blur(function() {
         self.blur();
      });
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
 * A password entry widget. This is basically a text entry widget which changes
 * its type to "password" as soon as you type anything into it. It can optionally
 * use strength checking on the password field and open a hint element to explain
 * that.
 * 
 * TODO: destructor; revert to original state.
 */
jQuery.CbWidget.password = jQuery.CbWidget.input.extend({
   
   /** 
    * Swap the field with the one from backup_passwd_node.
    * Changing types on an existing node is not properly supported in IE
    * so we have to do it this way.
    */
   swapElement : function() {
      var hidden_field = $('input:hidden', this.element());
      var id = this.shown_field.attr('id');
      this.shown_field.hide();
      this.shown_field.removeAttr('id');
      hidden.val(this.shown_field.val());
      hidden.attr('id', id);
      hidden.show();
      this.shown_field = hidden;
   },
   
   /**
    * overriden focus handler.
    * Change the type attribute of the password field. This is complicated because of
    * cross browser issues.
    */
   focus : function() {
      if ($.browser.msie || $.browser.opera) {
         this.swapElement();
         /* you should be able to type a password now */

         /* pass the focus and rebind the keypress as we have swapped the
          * node */
         this.shown_field.focus();
         /* The field should have focus so that you can type a password now. */
      } else {
         /* Firefox messes up the focus handling when replacing nodes.
          * Especially on tab it forgets the order of input fields and when
          * changing anything in a "blur" event handler it doesn't call the
          * focus event for the same click. So we have to change the 'type' 
          * attribute in this case.
          */

         /* jquery doesn't like changing the type on live nodes, so we do it
          * with native DOM methods ... */
         this.shown_field[0].type = 'password';
      }
      
      if (this.strength_check) {
         this.shown_field.css('background-color', this.current_color);
         if (this.hint_element !== undefined) this.hint_element.slideDown();
      }
      
      if (this.value() == jQuery.CbWidgetRegistry.bricks[this.texts.text]) {
         this.value('');
      }
      
      this.base();
   },

   /**
    * overriden blur handler.
    * change the type back to 'text' if the content hasn't been edited.
    */
   blur : function() {
      if (this.strength_check) {
         this.current_color = this.shown_field.css('background-color');
         this.shown_field.css('background-color', this.default_color);
         if (this.hint_element !== undefined) this.hint_element.slideUp();
      }
      
      if (this.value() == '' || this.value() == this.bricks[this.texts.text]) {
         if ($.browser.msie || $.browser.opera) {
            this.swapElement();
            /* you've left the password field */
         } else {
            this.shown_field[0].type = 'text';
         }
      }
      
      this.base();
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
      this.element().pstrength();
   },
   
   /**
    * create the password widget.
    * This actually replaces the given field with a span containing two input
    * fields: one with type 'password' and one with type 'text'. During the life
    * time of the widgets those are shown and hidden to conform to the standard
    * behaviour of text input widgets.
    */
   constructor : function(field) { 
      var parent_element = $(document.createElement('span'));
      parent_element.insertAfter(field);
      parent_element = $(parent_element);
      this.shown_field = field.clone().attr('type', 'text');
      parent_element.append(field.hide().removeAttr('id').remove());
      parent_element.append(this.shown_field);
      this.shown_field = $(this.shown_field);
      this.base(parent_element);
      var self = this;
      this.element().focus(function () {self.focus();});
      this.element().blur(function () {self.blur();});
   },
   
   /**
    * Get the elements associated with this widget-
    * @return both of the actual input fields, but not the span 
    */
   element : function() {
      return this.base().children();
   },
   
   /**
    * get the current value for the password
    * @return the value of the currently active field
    */
   value : function(val) {
      return this.shown_field.val(val);
   }
});

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
      var self = this;
      this.element().children().each(function(index) {
         var label = $(this).text();
         self.texts[index] = label;
         $(this).hide();
      });
   },
   
   /**
    * show the text belonging to the given label, provided it is available.
    * Hide any other text.
    */
   show : function(label) {
      this.element().children().hide();
      for (pos in this.texts) {
         if (this.texts[pos] == label) {
            $(this.element().children()[pos]).show();
         }
      }
   },
   
   hide : function() {
      this.element().children().hide();
   },
   
   changeLanguage : function(bricks) {
      var self = this;
      this.element().children().each(function(index) {
         $(this).html(bricks[self.texts[index]]);
      });
   }
});

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

/**
 * A widget for the "select" input. It translates all its options on 
 * changeLanguage.
 */
jQuery.CbWidget.select = jQuery.CbWidget.widget.extend({
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
 * Autocomplete is reinitialized when changing the language.
 */
jQuery.CbWidget.search_box = jQuery.CbWidget.widget.extend({
   
   constructor : function(element) {
      this.base(element);
      this.options = {};
      
      options.putIdInto = jQuery(this.element().children()[0]).attr('id');
      options.language = jQuery.CbWidgetRegistry.language;
   },
   
   changeLanguage : function(bricks) {
      this.base(bricks);
      options.language = jQuery.CbWidgetRegistry.language;
      var field = jQuery(this.element().children()[1]);
      field.unbind();
      field.autoComplete(this.params);
   }
});

