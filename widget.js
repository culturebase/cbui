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
   
   changeLanguage : function(language, context) {
      var labels = [];
      this.language = language;
      var self = this;
      
      /* collect labels */
      for (var name in jQuery.CbWidget) {
         jQuery(self.translateToClass(name, 'Ui'), context).each(function() {
            jQuery.merge(labels, jQuery(this).CbWidget().getLabels());
         });
         labels = jQuery.unique(labels);
      }
         
      /* fetch bricks */
      jQuery.getJSON("/module/lib/framework/getMlBricks.php", {
            "project" : this.project, 
            "base_project" : this.base_project, 
            "language" : this.language, 
            "labels[]" : labels
         }, function(bricks) {
         /* loop over widgets again and apply bricks */
         self.bricks = bricks;
         for (var name in jQuery.CbWidget) {
            jQuery(self.translateToClass(name, 'Ui'), context).each(function() {
               jQuery(this).CbWidget().changeLanguage(bricks);
            });
         }
      });
   },
   
   /**
    * Instantiate widgets and validators in the given context and translate them.
    * @param context A DOM element to restrict the operation to (e.g. a window) 
    */
   apply : function(context) {
      var self = this;
      
      /* create widgets */
      for (var name in jQuery.CbWidget) {
         jQuery(self.translateToClass(name, 'Ui'), context).each(function() {
            new (jQuery.CbWidget[name])(jQuery(this));
         });
      }
      
      for (var name in jQuery.CbValidate) {
         jQuery(self.translateToClass(name, 'Validate'), context).each(function() {
            new (jQuery.CbValidate[name])(jQuery(this).CbWidget());
         });
      }
      
      this.changeLanguage(this.language);
      
   }
};

jQuery.CbWidget = function() {}; // maybe do something useful here; e.g. find elements belonging to certain widget types

/**
 * jquery plugin to enable $(element).CbWidget() functionality. Saves information
 * about widgets via $.data(...).
 * @param widget if set attach the widget to the element otherwise find the 
 *    widget belonging to the element. If set to null remove widget information
 *    from the element.
 *    When querying for the widget CbWidget will recursively search the elements
 *    parent nodes.
 */
jQuery.fn.CbWidget = function(widget) {
   if (this.length == 0) return undefined;
   if (widget !== undefined) {
      if (widget !== null) {
         this.data("cb_widget", widget);
      } else {
         this.removeData("cb_widget");
      }
   }
   
   if (!this.data("cb_widget")) {
      var parent = this.parent();
      if (parent && parent != this) {
         return parent.CbWidget();
      } else {
         return undefined;
      }
   } else {
      var widget = this.data("cb_widget");
      return widget;
   }
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
      this.element().CbWidget(this);
      /* element() and parent_element may differ */
      this.parent_element.CbWidget(this);
      
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
    * Refresh the element associated with this widget. This is necessary if it
    * has been inserted or moved in the DOM. You will want to rebind all events
    * here. 
    */
   refreshElement : function() {
      this.parent_element = $(this.parent_element);
      this.element().CbWidget(this);
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



