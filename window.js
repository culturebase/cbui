/**
 * Base class for all kinds of "window-like" things. Windows are supposed to be
 * contained in a DOM element (the "frame") and may have various widgets whose 
 * life cycles are managed by the window. When calling show() window's structure
 * is loaded from a 'template' using AJAX. After that it's widgets and 
 * validators are instantiated. Before and after that hooks are called to allow
 * for customization in derived classes. You can also add custom Javascript code
 * to be used in derived classes by adding URLs to the "include" array. The 
 * scripts at those URLs will be added to the 'head' section of the document.
 * 
 * In order for this to work you need to include:
 * - jquery.js
 * - base2.js
 * - cbShadow.js (if the shadow feature is to be used)
 * - cb_ui/validate.js (if there are any validated input fields)
 * - cb_ui/widget.js (if there are any widgets in the window)
 * - some styles for __CbUi* - otherwise it'll look strange
 * 
 * TODO: logo
 * TODO: refactor to get more convenient smaller classes
 */
jQuery.CbWidget.window = jQuery.CbWidget.widget.extend({
   
   defaultOptions : {
      'logo'          : false,
      'showShadow'    : true,
      'modal'         : true,
      'layerColor'    : '#000000',
      'layerFrame'    : true,
      'showButtons'   : true,
      'layerOpacity'  : 0.25,
      'overlayClose'  : false,
      'width'         : 450,
      'height'        : 450
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
         element = $(document.createElement('div')).addClass("__CbUiFrame");
         this.insertElement = true;
      }
      
      this.base(element);
      this.template = loadOptions.template;
      this.postParams = loadOptions.postParams;
      this.include = [];
   },

   /**
    * hook which is executed before instantiating the widgets
    */
   beforeApplyWidgets : function() {},
   
   /**
    * hook which is executed after instantiating the widgets
    */
   afterApplyWidgets : function() {},
   
   /**
    * center the window on the screen. This is the default behaviour for newly opened windows.
    */
   center : function() {
      var self = this;
      var width = $.support.boxModel ? window.innerWidth : window.document.documentElement.clientWidth;
      var height = $.support.boxModel ? window.innerHeight : window.document.documentElement.clientHeight;
      
      this.moveTo(Math.max(Math.floor(width / 2 - self.options.width / 2) - 10, 0), 
            Math.max(Math.floor(height / 2 - self.options.height / 2) - 30, 0));
   },
   
   /**
    * move the window to the specified position
    * @param left X coordinate in pixels
    * @param top Y coordinate in pixels
    */
   moveTo : function(left, top) {
      this.element().css({
         'left': left + 'px',
         'top': top + 'px'
      });
   },
   
   /**
    * hook which is executed when the validation fails
    * @param element the element for which the validation has failed
    */
   showError : function(element) {},
   
   /**
    * Validate all validatable widgets in the window (those with a class __CbValidate*). 
    */
   validateInput : function() {
      var valid = true;
      var self = this;
      $('[class*="__CbValidate"]', this.element()).each(function() {
         var widget_valid = $(this).CbWidget().validate();
         if (!widget_valid) {
            self.showError(this);
            valid = false;
         }
      });
      return valid;
   },
   
   postLoadFrame : function(delay) {
      if (this.insertElement) {
         this.element().appendTo('body');
      }
      
      this.refreshElement();
      
      if (this.options.showButtons) {
         var self = this;
         var close_button = $(document.createElement('img'))
            .attr('src', '/module/lib/framework/pics/delete.gif')
            .addClass('__CbUiCloseButton');
         $('.__CbUiTitle', this.element()).prepend(close_button);
         $('.__CbUiTitle', this.element()).append(
               $(document.createElement('span')).addClass('__CbUiLangSelect'));
      }
      
      if (this.options.showShadow && (!jQuery.browser.msie || jQuery.browser.version >= 7)) {
         addShadow(this.element());
      }
      this.beforeApplyWidgets();
      jQuery.CbWidgetRegistry.apply(this.element());
      this.afterApplyWidgets();
      this.element().fadeIn(delay);
      
      this.element().keypress(function(key) {
         if (key.keyCode == 27) self.close(500);
      });
   },
   
   /**
    * called by open(); loads the structure and instantiates the widgets. 
    * Don't call it from outside. Use open() and close().
    */
   loadFrame : function(delay) {
      for (var index in this.include) {
         $('head').append("<script type='text/javascript' src='" + this.include[index] + "'></script>");
      }
      
      var self = this;
      this.element().css('width', self.options.width+'px');
      
      if (this.options.layerFrame) {
         this.center();
         $(window).resize(function() {self.center();});
         this.element().addClass('__CbUiLayerFrame');
         this.element().css('height', self.options.height+'px');

         if (jQuery.browser.msie && jQuery.browser.version < 7) {
            this.element().css('position', 'absolute');
         }
      }
      
      this.element().hide();
      if (this.template) {
         if (this.postParams) {
            this.element().load(this.template, this.postParams, function() {self.postLoadFrame(delay);});
         } else {
            this.element().load(this.template, function() {self.postLoadFrame(delay);});
         }
      } else {
         this.postLoadFrame(delay);
      }
   },
   
   /**
    * Open the window.
    * @param delay if set to > 0 the window will fade in slowly in <delay> milliseconds.
    */
   open : function(delay) {
      var self = this;
      if (self.options.modal) {
         var layer = $(document.createElement('div')).addClass('__CbUiLayer');
         layer.appendTo('body').fadeTo(delay, self.options.layerOpacity, function() {
            self.layer = $(layer);
            self.layer.css({'background-color': self.options.layerColor});
            if (self.options.overlayClose) {
               self.layer.click(function() {
                  self.close(true);
               });
            }
            self.loadFrame(delay);
         });
      } else {
         this.loadFrame(delay);
      }
   },
   
   /**
    * Close the window and destroy all its widgets.
    * @param delay if set to > 0 the window will fade out slowly in <delay> milliseconds.
    */
   close : function(delay) {
      var self = this;
      $('[class*="__CbUi"]', this.element()).each(function() {
         var widget = $(this).CbWidget();
         if (widget && widget != self) {
            widget.destructor();
         }
      });

      if (!delay) delay = 0;
      this.element().fadeOut(delay, function() {
         if (self.options.modal) {
            self.layer.fadeOut(delay, function() {
               $(this).remove();
            });
         }
         $(this).remove();
      });
   }
});


function language_window_callback(locale) {
   jQuery.CbWidgetRegistry.changeLanguage(locale);
   language_window_callback.window.close();
}


jQuery.CbWidget.language_window = jQuery.CbWidget.window.extend({
   constructor : function(options) {
      options = jQuery.extend({"showButtons" : false, 'useFlags' : false}, options);
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