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
      var title = this.element().attr('title');
      if (title) this.texts.title = title;
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
      if (this.texts.title) {
         this.element().attr('title', bricks[this.texts.title]);
      }
      // changing the language is a change as the sizes of texts may have changed
      return this.change();
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
      this.options = jQuery.extend({}, jQuery.CbWidget.window.defaultOptions, options);

      var element = loadOptions.element;
      var elCls = "__CbUiFrame ";
      if (loadOptions.cls !== undefined) elCls += loadOptions.cls;
      if (element === undefined) {
         element = jQuery(document.createElement('div')).addClass(elCls);
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
   open : function(params, callback) {
      var options = jQuery.extend({}, this.options, params);
      var self = this;
      if (options.modal) {
         var layer = jQuery(document.createElement('div')).addClass('__CbUiLayer');
         layer.appendTo('body').fadeTo(options.delay, options.layerOpacity, function() {
            try {
               self.layer = jQuery(layer).css({
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

               self.loadFrame(options, callback);
            } catch (err) {
               /* ignore to avoid fading loop created by jquery not being able
                * to finish its work after calling the callback.
                */
            }
         });
      } else {
         this.loadFrame(options, callback);
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
    * @param callback Function to be called when done.
    */
   postLoadFrame : function(options, callback) {
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
      var self = this;
      var hidden = this.element().find('.__CbUiHiddenTemplates').remove();
      jQuery.CbWidgetRegistry.apply(this.element(), function() {
         if (hidden) self.element().append(hidden); // don't apply widgets to hidden templates
         self.trigger('show', options);
         self.trigger('ready', options);

         if (options.overlayClose) {
            self.element().keypress(function(key) {
               if (key.keyCode == 27) self.close(options);
            });
         }
         if (callback !== undefined) callback();
      });
      return this;
   },

   /**
    * called by open(); loads the structure and instantiates the widgets.
    * Don't call it from outside. Use open() and close().
    */
   loadFrame : function(options, callback) {

      var self = this;

      if (options.layerFrame) this.element().addClass('__CbUiLayerFrame');

      this.element().hide(); // don't fire the event here
      if (this.template) {
         var inner = $(this.element().children().eq(0));
         if (this.postParams) {
            inner.load(this.template, this.postParams, function() {
               $(document).ready(function() {
                  self.postLoadFrame(options, callback);
               });
            });
         } else {
            inner.load(this.template, function() {
               $(document).ready(function() {
                  self.postLoadFrame(options, callback);
               });
            });
         }
      } else {
         this.postLoadFrame(options, callback);
      }
      return this;
   },

   /**
    * center the widget in horizontal direction.
    * @return this
    */
   centerX : function() {
      this.moveToX(Math.max(Math.floor(jQuery(window).width() / 2 - this.width() / 2) - 10, 0));
      return this;
   },

   /**
    * center the widget in vertical direction.
    * @return this
    */
   centerY : function() {
      this.moveToY(Math.max(Math.floor(jQuery(window).height() / 2 - this.height() / 2) - 30, 0));
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
   },

   /**
    * Handle a click on an element <button> as follows:
    * 1. if we're already handling a previous click call
    *    <alreadyHandlingCallback>.
    * 2. Try to validate <subject>, either with validate() or validateInput().
    *    This can be a window or a single widget.
    * 3. If valid add <submitClass> to <button> and call <callback>,
    *    else call <invalidCallback>
    * All callbacks are called in the same scope and with the same arguments as
    * the button.click(), but adding, as a last argument a function that, if
    * called:
    * a, removes <submitClass> from the button
    * b, resets the "handling" state so that 1. won't call
    *    <alreadyHandlingCallback> anymore.
    *
    * This is the recommended way to submit data. If you do it with a primitive
    * click handler the user may click twice, submitting the data twice which
    * may lead to unexpected results.
    */
   onceOnClickIfValid : function(button, subject, callback, invalidCallback,
            alreadyHandlingCallback, submitClass) {
      var handling = false;
      button.click(function() {
         var args = [].concat.apply([], arguments);
         args.push(function() {
            handling = false;
            button.removeClass(submitClass);
         });
         if (!handling) {
            if ((typeof subject.validateInput === 'function' && subject.validateInput()) ||
                  (typeof subject.validate === 'function' && subject.validate())) {
               handling = true;
               button.addClass(submitClass);
               callback.apply(this, args);
            } else if (invalidCallback !== undefined) {
               invalidCallback.apply(this, args);
            }
         } else if (alreadyHandlingCallback !== undefined) {
            alreadyHandlingCallback.apply(this, args);
         }
      });
   },

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
});

/**
 * Language choice window. Will call jQuery.CbWidgetRegistry.changeLanguage
 * when an option is clicked.
 */
jQuery.CbWidget.language_window = jQuery.CbWidget.window.extend({
   constructor : function(loadOptions, options) {
      this.base(jQuery.extend({
         template : '/module/jscript/lib/cb_ui/templates/language_window.html'
      }, loadOptions), jQuery.extend({
         modal    : false // not modal by default as it's expected to be placed on top of another modal window
      }, options));
      return this.autocenter();
   },

   open : function (params) {
      jQuery.CbWidgetRegistry.retrofitProjects();
      var self = this;
      var base = this.base;
      jQuery.getJSON('/module/lib/framework/getMlLanguages.php', {
         projects : jQuery.CbWidgetRegistry.projects
      }, function(data) {
         self.languages = data;
         base.call(self, params);
      });
      return this;
   },

   handleLoad : function(params) {
      var list = this.element().find('.__CbUiLangChooseList');
      jQuery.each(this.languages, function(i, language) {
         jQuery.CbWidget.langChooseList.addOption(list, language.locale, language.name);
      });
      return this.base(params);
   }
});


jQuery.CbWidget.text_window = jQuery.CbWidget.window.extend({
   constructor : function(loadOptions, options, texts) {
      this.base(jQuery.extend({'cls' : '__CbUiLanguageWindow'}, loadOptions), options); // creates an empty "texts" member
      if (texts) this.texts = jQuery.extend(this.texts, texts);
      return this;
   },

   isTranslatable : function(pattern) {
      return pattern.substr(0, 3) == 'ml_';
   },

   getLabels : function() {
      var labels = [];
      var self = this;
      jQuery.each(this.texts, function(label, value) {
         if (self.isTranslatable(label)) {
            if (typeof(value) == 'object') {
               jQuery.merge(labels, value);
            } else {
               labels.push(value);
            }
         }
      });
      return labels;
   },

   changeLanguage : function(bricks) {
      this.base(bricks);
      var self = this;
      var indices = {};
      if (self.texts) {
         var doReplace = function(method, el) {
            jQuery.each(self.texts, function(pattern, replacement) {
               if (replacement != null && typeof(replacement) == 'object') {
                  if (!indices[pattern]) indices[pattern] = 0;
                  var regex = new RegExp('{'+pattern.toUpperCase()+'}');
                  do {
                     var val = replacement[indices[pattern]];
                     var oldtext = el[method]();
                     var newtext = oldtext.replace(regex,
                        self.isTranslatable(pattern) ? bricks[val] : val);
                     el[method](newtext);
                  } while (oldtext != newtext && replacement.length > ++indices[pattern]);
               } else {
                  el[method](el[method]().replace(
                        new RegExp('{'+pattern.toUpperCase()+'}', 'g'),
                        self.isTranslatable(pattern) ? bricks[replacement] : replacement));
               }
            });
         }

         self.element().find('.__CbUiReplaceText, .__CbUiReplaceHtml, .__CbUiReplaceVal').each(function() {
            var el = jQuery(this);
            if (el.hasClass('__CbUiReplaceText')) {
               doReplace('text', el);
            } else if (el.hasClass('__CbUiReplaceHtml')) {
               doReplace('html', el);
            } else if (el.hasClass('__CbUiReplaceVal')) {
               doReplace('val', el);
            }
         });
      }
      return this;
   }

});