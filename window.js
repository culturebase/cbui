/**
 * a frame where widgets can be grouped. It introduces a new event "change" which
 * is triggered whenever a child widget is either shown or hidden and on "ready".
 * Frames support fading in and out slowly via additional parameters for show()
 * and hide(). They can also slide up and down in the same way.
 */
jQuery.CbWidget.frame = jQuery.CbWidget.widget.extend({
   /**
    * show the frame, using an optional delay (in milliseconds)
    * @param options optional parameters containing "delay"
    * @return this
    */
   handleShow : function(options) {
      var self = this,
         base = this.base;

      options = options || {delay : 0};
      
      this.element().fadeIn(options.delay, function() {
         // jQuery tends to stop at an unprecise value (like 0.98423421 instead
         // of 1.0), which can cause problems with certain contents of this
         // element.
         self.element().css('opacity', 1.0);
         
         base.call(self, options);
      });

      return this;
   },
   
   /**
    * hide the frame, using an optional delay (in milliseconds)
    * @param options optional parameters containing "delay"
    * @return this
    */
   handleHide : function(options) {
      var self = this,
         base = this.base; // base may change due to other functions being executed in between

      options = options || {delay : 0};

      this.element().fadeOut(options.delay, function() {
         // jQuery tends to stop at an unprecise value (like 0.98423421 instead
         // of 1.0), which can cause problems with certain contents of this
         // element.
         self.element().css('opacity', 0.0);
         
         base.call(self, options);
      });
      
      return this;
   },
   
   /**
    * slide up the element, using the delay. Will trigger "hide"
    * @param delay the time to be taken for sliding the widget up
    * @return this
    */
   slideUp : function(delay) {
      var self = this;
      this.element().slideUp(delay, function() {self.hide();});
      return this;
   },
   
   /**
    * slide down the element, using the delay. Will trigger "show"
    * @param delay the time to be taken for sliding the widget down
    * @return this
    */
   slideDown : function(delay) {
      var self = this;
      this.element().slideDown(delay, function() {self.show();});
      return this;
   },
   
   constructor : function(element) {
      this.base(element);
      var self = this;
      this.throwChange = function() {self.change();};
      
      /* Binding the change event when ready.
       * This is not done by handleReady as you may wish to override the
       * configuration for various widgets on a per-window base. Binding the
       * change event, however is so universal that we make it mandatory for
       * all frames. Of course you can unbind it from window.handleLoad if you
       * know what you're doing.
       */
      this.ready(function() {self.bindChange();});
   },
   
   changeLanguage : function(bricks) {
      this.base(bricks);
      
      // changing the language is a change as the sizes of texts may have changed
      this.change();
   },

   /**
    * bind the "change" event of the frame to all "show" and "hide"
    * events of its inner widgets so that we have a chance to autoposition
    * the frame (or do other interesting things) when its widgets change. 
    * 
    * This doesn't work for adding or removing widgets as we have no way
    * of finding out about that. You'll have to call this method manually when
    * doing that in order to bind the new widgets' events.
    */
   bindChange : function() {
      var self = this;
      jQuery('[class*="__CbUi"]', this.element()).each(function() {
         var widget = jQuery(this).CbWidget();
         if (widget) {
            widget.unbind('show', self.throwChange);
            widget.unbind('hide', self.throwChange);
            widget.show(self.throwChange);
            widget.hide(self.throwChange);
         }
      });
      return this.change(); // being ready is also a change, but it happens only once
   }
}, {
   init : function() {
      /*
       * "change" is triggered when the widget or some subwidget has changed its appearance
       * In this case the layout may have to be recalculated. 
       */
      jQuery.CbEvent(this, 'change');
      return this.base();
   }
   
});

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
jQuery.CbWidget.window = jQuery.CbWidget.frame.extend({
   
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
    * @param loadOptions Options for loading the template:
    *    - element the frame for the window. Can be omitted, then a new one is
    *      created and appended to <body>.
    *    - template a URL to load the structure from
    *    - postParams POST parameters to be passed when loading the template
    * @param options Options you might want to refer to later. The base window uses:
    *    - 'width' and 'height': to determine its initial dimensions.
    *    - 'layerFrame': if set, have the window floating on top of existing content,
    *       otherwise just append it to <body>.
    *    - 'modal': if set, put a semi-transparent layer over the whole document
    *       before adding the window - prevents any interaction with other elements
    *    - 'layerColor' and 'layerOpacity': properties of the modal layer
    *    - 'overlayClose': if set, close the window when clicking on the modal layer or pressing escape
    *    - 'showShadow': create a shadow for the window if possible
    * Obviously some combinations don't make sense. Results for those are undefined.
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
      return this;
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
            try {
               self.layer = $(layer).css({
                  'background-color': self.options.layerColor,

                  // jQuery tends to stop at an unprecise value (like 0.98423421
                  // instead of 1.0), which can cause problems with certain
                  // contents of this element.
                  'opacity': options.layerOpacity
               });

               if (options.overlayClose) {
                  self.layer.click(function() {
                     self.close(true);
                  });
               }

               self.loadFrame(options);
            } catch (err) {
               /* ignore to avoid fading loop created by jquery not being able
                * to finish its work after calling the callback.
                */
            }
         });
      } else {
         this.loadFrame(options);
      }
      return this;
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
      
      this.hide(function() {
         self.destroy();
      });
      
      return this.trigger('hide', options);
   },
   
   /**
    * immediately destroy everything without any fading
    */
   handleDestroy : function() {
      var self = this;
      jQuery(window).unbind('resize.window' + this.base2ID);
      
      jQuery('[class*="__CbUi"]', this.element()).each(function() {
         var widget = jQuery(this).CbWidget();
         if (widget && widget != self) {
            widget.destroy();
         }
      });
      
      if (this.options.modal) this.layer.remove();
      
      if (this.insertElement) this.element().remove();

      return this.base();
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
   
   /**
    * Passes the ready event and the configuration options on to all
    * child widgets. It's recommended to use this for final configuration
    * as it happens after the widgets have been instantiated and translated,
    * but before the window is shown.
    * @param options The options to be used for configuration. Those are
    * the ones passed to the constructor and open().
    */
   handleReady : function(options) {
      var self = this;
      jQuery('[class*="__CbUi"]', this.element()).each(function() {
         var widget = jQuery(this).CbWidget();
         if (widget && widget != self) widget.trigger('ready', options);
      });
      return this.base();
   },

   /**
    * called after loading the frame. This method is considered private.
    * @param options the options for loading the window. Will be passed on to
    * show and close and will be used to determine if the shadow is to be shown.
    */
   postLoadFrame : function(options) {
      if (this.insertElement) {
         this.element().appendTo('body');
      }
      
      if (options.layerFrame) {
         // Style changes are more reliable when applied after an element has
         // been appended to the DOM.
         this.element().height(options.height);
         this.element().width(options.width);

         if (jQuery.browser.msie && jQuery.browser.version < 7) {
            this.element().css('position', 'absolute');
         }
      }
      
      this.refreshElement();
      
      if (options.showShadow && (!jQuery.browser.msie || jQuery.browser.version >= 7)) {
         addShadow(this.element());
      }
      this.load();
      jQuery.CbWidgetRegistry.apply(this.element());
      this.trigger('show', options);
      this.trigger('ready', options);
      var self = this;
      
      if (options.overlayClose) {
         this.element().keypress(function(key) {
            if (key.keyCode == 27) self.close(options);
         });
      }
      return this;
   },
   
   /**
    * called by open(); loads the structure and instantiates the widgets. 
    * Don't call it from outside. Use open() and close().
    */
   loadFrame : function(options) {
      
      var self = this;
      
      if (options.layerFrame) {
         this.element().addClass('__CbUiLayerFrame');
      }
      
      this.element().hide(); // don't fire the event here
      if (this.template) {
         var inner = this.element().children().eq(0);
         if (this.postParams) {
            inner.load(this.template, this.postParams, function() {self.postLoadFrame(options);});
         } else {
            inner.load(this.template, function() {self.postLoadFrame(options);});
         }
      } else {
         this.postLoadFrame(options);
      }
      return this;
   },
   
   /**
    * center the widget in horizontal direction.
    * @return this
    */
   centerX : function() {
      var width = jQuery.support.boxModel ? window.innerWidth : window.document.documentElement.clientWidth;
      this.moveToX(Math.max(Math.floor(width / 2 - this.width() / 2) - 10, 0));
      return this;
   },
   
   /**
    * center the widget in vertical direction.
    * @return this
    */
   centerY : function() {
      var height = jQuery.support.boxModel ? window.innerHeight : window.document.documentElement.clientHeight;
      this.moveToY(Math.max(Math.floor(height / 2 - this.height() / 2) - 30, 0));
      return this;
   },
   
   /**
    * center the widget in both directions.
    * @return this
    */
   center  : function() {
      this.centerX();
      this.centerY();
      return this;
   },
   
   /**
    * automatically position the window with the given method when
    * a, "change" is triggered
    * b, the browser window is resized
    * @param method the method to be called to position the window
    * @param params the parameters to be passed to the positioning method
    * @return this 
    */
   autoposition : function(method, params) {
      var self = this;
      this.change(function() {self[method](params);});
      jQuery(window).bind('resize.window' + this.base2ID, function() {self[method](params);});
      return this;
   },
   
   /**
    * automatically center in horizontal direction on change
    * @return this
    */
   autocenterX : function() {
      return this.autoposition('centerX');
   },
   
   /**
    * automatically center in vertical direction on change
    * @return this
    */
   autocenterY : function() {
      return this.autoposition('centerY');
   },
   
   /**
    * automatically center in both directions on change
    * @return this
    */
   autocenter : function() {
      return this.autoposition('center');
   },
   
   /**
    * if no explicit height given:
    * resize the window to fit its content in vertical direction.
    */
   resizeY : function(y) {
      if (y !== undefined) return this.base(y);
      var height = (this.element().children()[0]).clientHeight;
      this.element().height(height);
      return this;
   },
   
   /**
    * if no explicit width given:
    * resize the window to fit its content in horizontal direction.
    */
   resizeX : function(x) {
      if (x !== undefined) return this.base(x);
      var width = this.element().children()[0].clientWidth;
      this.element().width(width);
      return this;
   },

   /**
    * automatically resize to fit in vertical direction on change
    * @return this
    */
   autoresizeY : function() {
      return this.autoposition('resizeY');
   },
   
   /**
    * automatically resize to fit in horizontal direction on change
    * @return this
    */
   autoresizeX : function() {
      return this.autoposition('resizeX');
   },
   
   /**
    * automatically resize to fit in both directions on change
    * @return this
    */
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


/**
 * callback needed for the language window to work. Just calls 
 * jQuery.CbWidgetRegistry.changeLanguage and closes the window
 * @param locale the language being chosen
 */
function language_window_callback(locale) {
   jQuery.CbWidgetRegistry.changeLanguage(locale);
   language_window_callback.window.close();
}

/**
 * language choice window. This is loaded from /module/lib/framework/getLanguageWindow.php
 * @deprecated will be replaced with a native equivalent 
 */
jQuery.CbWidget.language_window = jQuery.CbWidget.window.extend({
   constructor : function(options) {
      options = jQuery.extend({'useFlags' : false}, options);
      this.base({template : '/module/lib/framework/getLanguageWindow.php',
         postParams : {
            'use_callback' : true,
            'no_close_icon' : true,
            'dynamic_height' : true,
            'use_flags' : options.useFlags,
            'project' : jQuery.CbWidgetRegistry.project
         }
      }, options);
      this.autocenter();
      this.autoresize();
   }
});
