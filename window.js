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
 * TODO: actually a window is a widget, too.
 * TODO: hide/show, standard buttons, title bar, logo
 * TODO: refactor to get more convenient smaller classes
 */
var CbWindow = base2.Base.extend({
   
   /**
    * create a window.
    * @param template a URL to load the structure from
    * @param options options you might want to refert to later. The base window uses:
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
   constructor : function(template, options) {
      this.base();
      this.template = template;
      this.include = [];
      this.options = options;
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
      this.frame.css({
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
      $('[class*="__CbValidate"]', this.frame).each(function() {
         var widget_valid = $(this).CbWidget().validate();
         if (!widget_valid) {
            self.showError(this);
            valid = false;
         }
      });
      return valid;
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
      self.frame = $(document.createElement('div')).addClass("__CbUiFrame");
      self.frame.css('width', self.options.width+'px');
      
      if (self.options.layerFrame) {
         self.center();
         $(window).resize(function() {self.center();});
         self.frame.addClass('__CbUiLayerFrame');
         self.frame.css('height', self.options.height+'px');

         if ($.browser.msie && $.browser.version < 7) {
            self.frame.css('position', 'absolute');
         }
      }

      self.frame.load(this.template, function() {
         self.frame.hide();
         self.frame.appendTo('body');
         self.frame = $(self.frame);
         
         if (self.options.showShadow && (!$.browser.msie || $.browser.version >= 7)) {
            addShadow(self.frame);
         }
         self.beforeApplyWidgets();
         $.CbWidgetRegistry.apply(self.frame);
         self.afterApplyWidgets();
         self.frame.fadeTo(delay, 1);
         
         self.frame.keypress(function(key) {
            if (key.keyCode == 27) {
               self.close(true);
            }
         });
      });
   },
   
   /**
    * Open the window.
    * @param delay if set to > 0 the window will fade in slowly in <delay> milliseconds.
    */
   open : function(delay) {
      if (!delay) delay = 0;
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
      $('[class*="__CbUi"]', this.frame).each(function() {
         var widget = $(this).CbWidget();
         if (widget) {
            widget.destructor();
         }
      });

      if (!delay) delay = 0;
      var self = this;
      this.frame.fadeOut(delay, function() {
         if (self.options.modal) {
            self.layer.fadeOut(delay, function() {
               $(this).remove();
            });
         }
         $(this).remove();
      });
   }
});