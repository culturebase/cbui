/**
 * Base class for all kinds of "window-like" things. Windows are supposed to be
 * contained in a DOM element (the "frame") and may have various widgets whose 
 * life cycles are managed by the window. When calling open() window's structure
 * is loaded from a 'template' using AJAX. After that it's widgets and 
 * validators are instantiated. Before and after that hooks are called to allow
 * for customization in derived classes.
 * 
 * In order for this to work you need to include:
 * - jquery.js
 * - base2.js
 * - cbShadow.js (if the shadow feature is to be used)
 * - cb_ui/validate.js (if there are any validated input fields)
 * - cb_ui/widget.js (if there are any widgets in the window)
 * - some styles for __CbUi* - otherwise it'll look strange
 * 
 * TODO: refactor to get more convenient smaller classes
 */
jQuery.CbWidget.window = jQuery.CbWidget.widget.extend({
   
   defaultOptions : {
      'showShadow'    : true,
      'modal'         : true,
      'layerColor'    : '#000000',
      'layerFrame'    : true,
      'layerOpacity'  : 0.25,
      'overlayClose'  : false,
      'width'         : 450,
      'height'        : 450,
      'delay'         : 0
   },
   
   /**
    * create a window.
    * @param loadOptions options for loading the content:
    *    - element the frame for the window. Can be omitted, then a new one is
    *      created and appended to <body>.
    *    - template a URL to load the structure from
    *    - postParams POST parameters to be passed when loading the template
    * @param options options you might want to refer to later. The base window uses:
    *    - 'width' and 'height': to determine its initial dimensions.
    *    - 'layerFrame': if set, have the window floating on top of existing content,
    *       otherwise just append it to <body>.
    *    - 'modal': if set, put a semi-transparent layer over the whole document
    *       before adding the window - prevents any interaction with other elements
    *    - 'layerColor' and 'layerOpacity': properties of the modal layer
    *    - 'overlayClose': if set, close the window when clicking on the modal layer
    *    - 'showShadow': create a shadow for the window if possible
    * obviously some combinations don't make sense. Results for those are undefined.
    */
   constructor : function(loadOptions, options) {
      this.options = jQuery.extend({}, this.defaultOptions, options);
          
      var element = loadOptions.element;
      if (element == undefined) {
         element = jQuery(document.createElement('div')).addClass("__CbUiFrame");
         jQuery(document.createElement('div')).appendTo(element);
         this.insertElement = true;
      }
      
      this.base(element);
      this.template = loadOptions.template;
      this.postParams = loadOptions.postParams;
   },
   
   /**
    * Open the window.
    * @param params if contains "delay" which is set to > 0 the window will fade in slowly in <delay> milliseconds.
    */
   open : function(params) {
      var options = jQuery.extend({}, this.options, params);
      var self = this;
      if (options.modal) {
         var layer = jQuery(document.createElement('div')).addClass('__CbUiLayer');
         layer.appendTo('body').fadeTo(options.delay, options.layerOpacity, function() {
            self.layer = $(layer);
            self.layer.css({'background-color': self.options.layerColor});
            if (options.overlayClose) {
               self.layer.click(function() {
                  self.close(true);
               });
            }
            self.loadFrame(options);
         });
      } else {
         this.loadFrame(options);
      }
   },

   /**
    * Close the window and destroy all its widgets.
    * @param params if contains "delay" which is set to > 0 the window will fade out slowly in <delay> milliseconds.
    */
   close : function(params) {
      var options = jQuery.extend({}, params || {}, this.options);
      var self = this;
      
      if (options.modal) {
         self.layer.fadeOut(options.delay);
      }
      this.element().fadeOut(options.delay, function() {
         self.destroy();
      });
   },
   
   handleDestroy : function() {
      var self = this;
      jQuery(window).unbind('resize.window' + this.id);
      
      jQuery('[class*="__CbUi"]', this.element()).each(function() {
         var widget = jQuery(this).CbWidget();
         if (widget && widget != self) {
            widget.destroy();
         }
      });
      
      if (this.options.modal) this.layer.remove();
      
      if (this.insertElement) this.element().remove();

      this.base();
   },
   
   /**
    * Validate all validatable widgets in the window (those with a class __CbValidate*). 
    */
   validateInput : function() {
      var valid = true;
      var self = this;
      jQuery('[class*="__CbValidate"]', this.element()).each(function() {
         var widget_valid = jQuery(this).CbWidget().validate();
         if (!widget_valid) {
            self.trigger('error', {element : this});
            valid = false;
         }
      });
      if (valid) self.valid();
      return valid;
   },
   
   postLoadFrame : function(options) {
      if (this.insertElement) {
         this.element().appendTo('body');
      }
      
      this.refreshElement();
      
      if (options.showShadow && (!jQuery.browser.msie || jQuery.browser.version >= 7)) {
         addShadow(this.element());
      }
      this.load();
      jQuery.CbWidgetRegistry.apply(this.element());
      this.element().fadeIn(options.delay);
      this.ready();
      
      this.element().keypress(function(key) {
         if (key.keyCode == 27) self.close(options.delay);
      });
   },
   
   /**
    * called by open(); loads the structure and instantiates the widgets. 
    * Don't call it from outside. Use open() and close().
    */
   loadFrame : function(options) {
      
      var self = this;
      this.element().css('width', options.width + 'px');
      
      if (options.layerFrame) {
         this.element().addClass('__CbUiLayerFrame');
         this.element().css('height', options.height + 'px');

         if (jQuery.browser.msie && jQuery.browser.version < 7) {
            this.element().css('position', 'absolute');
         }
      }
      
      this.element().hide(); // don't fire the event here
      if (this.template) {
         var inner = jQuery(this.element().children()[0]);
         if (this.postParams) {
            inner.load(this.template, this.postParams, function() {self.postLoadFrame(options);});
         } else {
            inner.load(this.template, function() {self.postLoadFrame(options);});
         }
      } else {
         this.postLoadFrame(options);
      }
   },
   
   centerX : function() {
      var width = jQuery.support.boxModel ? window.innerWidth : window.document.documentElement.clientWidth;
      this.moveToX(Math.max(Math.floor(width / 2 - this.width() / 2) - 10, 0));
      return this;
   },
   
   centerY : function() {
      var height = jQuery.support.boxModel ? window.innerHeight : window.document.documentElement.clientHeight;
      this.moveToY(Math.max(Math.floor(height / 2 - this.height() / 2) - 30, 0));
      return this;
   },
   
   center  : function() {
      this.centerX();
      this.centerY();
      return this;
   },
   
   autoposition : function(method, params) {
      var self = this;
      this.ready(function() {self[method](params);});
      jQuery(window).bind('resize.window' + this.id, function() {self[method](params);});
      return this;
   },
   
   autocenterX : function() {
      return this.autoposition('centerX');
   },
   
   autocenterY : function() {
      return this.autoposition('centerY');
   },
   
   autocenter : function() {
      return this.autoposition('center');
   },
   
   /**
    * if no explicit height given:
    * resize the window to fit its content in vertical direction.
    */
   resizeY : function(y) {
      if (y !== undefined) return this.base(y);
      var height = jQuery(this.element().children()[0]).height();
      this.element().height(height);
      return this;
   },
   
   /**
    * if no explicit width given:
    * resize the window to fit its content in horizontal direction.
    */
   resizeX : function(x) {
      if (x !== undefined) return this.base(x);
      var width = jQuery(this.element().children()[0]).width();
      this.element().width(width);
      return this;
   },

   autoresizeY : function() {
      return this.autoposition('resizeY');
   },
   
   autoresizeX : function() {
      return this.autoposition('resizeX');
   },
   
   autoresize : function() {
      return this.autoposition('resize');
   }
}, {
   init : function() {
      /**
       * load is called after the template has been loaded, but before
       * the widgets are initialized.
       */
      jQuery.CbEvent(this, 'load');
      
      /**
       * error is called when a widget cannot be validated.
       */
      jQuery.CbEvent(this, 'error');
      
      /**
       * called when all widgets have passed validation.
       */
      jQuery.CbEvent(this, 'valid');
      this.base();
   }
});


function language_window_callback(locale) {
   jQuery.CbWidgetRegistry.changeLanguage(locale);
   language_window_callback.window.close();
}


jQuery.CbWidget.language_window = jQuery.CbWidget.window.extend({
   constructor : function(options) {
      options = jQuery.extend({'useFlags' : false}, options);
      this.base({template : '/module/lib/framework/getLanguageWindow.php',
         postParams : {
            'use_callback' : true,
            'no_close_icon' : true,
            'use_flags' : options.useFlags,
            'project' : jQuery.CbWidgetRegistry.project
         }
      }, options);
   }
});
