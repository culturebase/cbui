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
 *
 */

/**
 * The widget registry collects information about all available widget classes
 * and manages translation, instantiation and destruction of widgets.
 *
 */
jQuery.CbWidgetRegistry = {
   /**
    * get a widget or validator name from a class name
    */
   translateToClass : function(name, prefix) {
      return '.__Cb' + prefix + name.substring(0, 1).toUpperCase() + name.substring(1);
   },

   /* some properties you can change to modify the behaviour of the widget registry */

   /**
    * The projects to be queried for ML bricks.
    */
   projects : ['cb-framework'],

   /** old API for querying bricks; deprecated */
   project : '',
   baseProject : '',

   /**
    * language to be used
    */
   language : 'en_EN',

   brickSource : "/module/lib/framework/getMlBricks.php",

   /**
    * The actual translated bricks. Be careful when modifying this.
    */
   bricks : {},

   /**
    * Create a proper projects array from this.project and this.baseProject if
    * they're given.
    */
   retrofitProjects : function() {
      var projects = [];
      if (this.project) projects.push(this.project);
      if (this.baseProject) projects.push(this.baseProject);
      if (projects.length > 0) {
         this.projects = projects
         this.project = '';
         this.baseProject = '';
      }
   },

   /**
    * change the language of all widgets in the given context
    * @param language the new language (locale)
    * @param context the context to be manipulated - for example a window
    * @param callback Function to be called when done
    */
   changeLanguage : function(language, context, callback) {
      var labels = [];
      this.language = language;
      if (!this.language) {
         if (callback !== undefined) callback();
         return; // translation disabled
      }
      var self = this;

      /* collect labels */
      jQuery.each(jQuery.CbWidget, function(name) {
         var clazz = self.translateToClass(name, 'Ui');
         jQuery(clazz, context).each(function() {
            jQuery.merge(labels, jQuery(this).CbWidget().getLabels());
         });
         if (context && context.is(clazz)) {
            jQuery.merge(labels, jQuery(context).CbWidget().getLabels());
         }
         labels = jQuery.unique(labels);
      });

      if (labels.length === 0) {
         if (callback !== undefined) callback();
         return; // no translation needed
      }

      /* for backward compatibility */
      this.retrofitProjects();

      /* fetch bricks */
      jQuery.ajax({
         type : 'GET',
         url : this.brickSource,
         dataType : 'json',
         data : {
            "projects" : this.projects,
            "language" : this.language,
            "labels[]" : labels
         },
         success : function(bricks) {
            /* loop over widgets again and apply bricks */
            self.bricks = bricks;
            jQuery.each(jQuery.CbWidget, function(name, w) {
                var clazz = self.translateToClass(name, 'Ui');
                jQuery(clazz, context).each(function() {
                   jQuery(this).CbWidget().changeLanguage(bricks);
                });
                if (context && context.is(clazz)) {
                   jQuery(context).CbWidget().changeLanguage(bricks);
                }
            });
            if (callback !== undefined) callback();
         }
     });
   },

   /**
    * Instantiate widgets and validators in the given context and translate them.
    * @param context A DOM element to restrict the operation to (e.g. a window)
    * @param callback Function to be called when done
    */
   apply : function(context, callback) {
      var self = this;

      /* create widgets */
      jQuery.each(jQuery.CbWidget, function(name, widget) {
         jQuery(self.translateToClass(name, 'Ui'), context).each(function() {
            var el = jQuery(this);
            if (el.CbWidget(undefined, false) === undefined) { // but don't overwrite existing ones
               new widget(el);
            }
         });
      });

      jQuery.each(jQuery.CbValidate, function(name, validator) {
         jQuery(self.translateToClass(name, 'Validate'), context).each(function() {
            new validator(jQuery(this).CbWidget());
         });
      });

      this.changeLanguage(this.language, context, callback);
   }
};

/**
 * Event Handling
 * --------------
 *
 * Events are declared by implementing an "init" method in the class interface
 * of your widget and stating "jQuery.CbEvent(this, <name>)" there. There are
 * two ways of triggering the event:
 *
 * 1. Call widget.<name>() without parameters. This is the shortcut for events
 * you don't want to specify any special parameters for.
 *
 * 2. Call widget.trigger(<name>, <parameters>) where <parameters> are a JS
 * object. The parameters will be passed on to the event handlers then.
 *
 * Event handlers can be attached to events in three ways.
 *
 * 1. Override handle<Name>(). This method is the first to be called every time
 * the event is triggered. You can use base2's inheritance mechanism here and
 * call base() to invoke the handle<Name>() method of super classes.
 *
 * 2. Call widget.<name>(<handler>, <params>). <handler> should be a function to be
 * executed when the event is triggered. Like this you can attach multiple handlers
 * to the same event in jquery-style. They will be invoked after handle<Name>().
 * Any parameters will be passed on to all event handlers when they are invoked.
 * You can extend and override them with trigger().
 *
 * 3. Call widget.bind(<name>, <handler>, <params>). This is the same as
 * widget.<name>(<handler>, <params>).
 *
 * You can unbind handlers from an event by calling widget.unbind(<event>, <handler>).
 * If you omit the second parameter all handlers will be unbound from the specified
 * event.
 *
 * (Class interfaces aren't inherited in base2 so we have to create an external
 * CbEvent function to add events to classes.)
 *
 */
jQuery.CbEvent = function(target, name) {
   jQuery.CbEvent.getHandleName = function(name) {
      return "handle" + name.substring(0,1).toUpperCase() + name.substring(1);
   };

   var event = {};
   event[name] = function(callback, staticParams) {
      if (callback) {
         if (typeof(this.handlers[name]) == 'undefined') this.handlers[name] = [];
         this.handlers[name].push({
            'callback' : callback,
            'params': staticParams || {}
         });
      } else {
         this.trigger(name);
      }
   };

   var handleName = jQuery.CbEvent.getHandleName(name);
   if (typeof(target.prototype[handleName]) == 'undefined') {
      event[handleName] = function() {return this;};
   }

   target.implement(event);
   return target[name];
};

jQuery.CbWidget = function() {}; // maybe do something useful here; e.g. find elements belonging to certain widget types
jQuery.CbValidate = function() {};

/**
 * jquery plugin to enable $(element).CbWidget() functionality. Saves information
 * about widgets via $.data(...).
 * @param widget if set attach the widget to the element otherwise find the
 *    widget belonging to the element. If set to null remove widget information
 *    from the element.
 *    When querying for the widget CbWidget will recursively search the elements
 *    parent nodes.
 * @param recursive If the widget should be looked for recursively up the DOM
 *    tree. If undefined, true is assumed.
 */
jQuery.fn.CbWidget = function(widget, recursive) {
   if (recursive === undefined) recursive = true;
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
      if (recursive && parent && parent != this) {
         return parent.CbWidget();
      } else {
         return undefined;
      }
   } else {
      return this.data("cb_widget");
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
      base2.assignID(this);
      this.parentElement = element;
      this.element().CbWidget(this);
      /* element() and parentElement may differ */
      this.parentElement.CbWidget(this);

      /**
       * association of positions -> labels
       */
      this.texts = {};

      /**
       * event handlers
       */
      this.handlers = {};
   },

   /**
    * show the widget
    */
   handleShow : function() {
      this.element().show();
      return this;
   },

   /**
    * hide the widget
    */
   handleHide : function() {
      this.element().hide();
      return this;
   },

   /**
    * get the element the widget belongs to. Some widgets might override this
    * method and/or change their element. Don't assume the element to be the
    * same every time you use it.
    */
   element : function() {
      return this.parentElement;
   },

   /**
    * Refresh the element associated with this widget. This is necessary if it
    * has been inserted or moved in the DOM. You will want to rebind all events
    * here.
    */
   refreshElement : function() {
      this.parentElement = jQuery(this.parentElement);
      this.element().CbWidget(this);
   },

   /**
    * get labels for all ML bricks needed by this widget.
    * @return an array of labels for all ML bricks needed.
    */
   getLabels : function() {
      var labels = [];
      jQuery.each(this.texts, function(i, text) {
         labels.push(text);
      });
      return labels;
   },

   /**
    * hook for changing or initializing the language.
    * @param bricks map of labels to ML bricks for the new language.
    */
   changeLanguage : function(bricks) {},

   /**
    * bind a handler to an event
    * @param name name of the event
    * @param callback the handler to be called when the event is triggered
    * @param staticParams default parameters for the handler (optional)
    * @return this
    */
   bind : function(name, callback, staticParams) {
      this[name](callback, staticParams);
      return this;
   },

   /**
    * unbind a handler from an event
    * @param name the name of the event
    * @param callback the handler to be removed (if omitted all handlers are removed)
    * @return this
    */
   unbind : function(name, callback) {
      if (callback && typeof(this.handlers[name]) != 'undefined') {
         var self = this;
         jQuery.each(self.handlers[name], function (i, handler) {
            if (handler.callback == callback) {
               self.handlers[name] = self.handlers[name].splice(i, 1);
               return false;
            } else {
               return true;
            }
         });
      } else {
         this.handlers[name] = [];
      }
      return this;
   },

   /**
    * trigger an event
    * @param name the event to be triggered
    * @param extraParams additional parameters to be passed to the event
    * @return this
    */
   trigger : function(name, extraParams) {
      this[jQuery.CbEvent.getHandleName(name)](extraParams || {});

      if (typeof(this.handlers[name]) != 'undefined') {
         jQuery.each(this.handlers[name], function(i, handler) {
            var params = jQuery.extend({}, handler.params, extraParams || {});
            handler.callback(params);
            return true;
         });
      }
      return this;
   },

   /**
    * get the width of this widget
    * @return the width
    */
   width : function() {
      return this.element().width();
   },

   /**
    * get the height of this widget
    * @return the height
    */
   height : function() {
      return this.element().height();
   },

   /**
    * resize the widget in horizontal direction
    * @param x the new width in pixels
    * @return this
    */
   resizeX : function(x) {
      this.element().width(x);
      return this;
   },

   /**
    * resize the widget in vertical direction
    * @param y the new height in pixels
    * @return this
    */
   resizeY : function(y) {
      this.element().height(y);
      return this;
   },

   /**
    * resize the widget in both directions
    * @param x the new width
    * @param y the new height
    * @return this
    */
   resize : function(x, y) {
      this.resizeX(x);
      this.resizeY(y);
      return this;
   },

   /**
    * move the widget in horizontal direction
    * @param x the new position in pixels
    * @return this
    */
   moveToX : function(x) {
      this.element().css('left', x + 'px');
      return this;
   },

   /**
    * move the widget in vertical direction
    * @param y the new position in pixels
    * @return this
    */
   moveToY : function(y) {
      this.element().css('top', y + 'px');
      return this;
   },

   /**
    * move the widget in both directions
    * @param x the new X position
    * @param y the new Y position
    * @return this
    */
   moveTo : function(x, y) {
      this.moveToX(x);
      this.moveToY(y);
      return this;
   },

   /**
    * destroy the widget. Leave the element alone, though.
    * As the widget doesn't create the element on construction it won't remove
    * it on destruction. Widgets are expected to remove any extra elements they
    * might have created and revert the original element to its original state,
    * though.
    */
   handleDestroy : function() {
      this.element().CbWidget(null);
   }
}, {


   init : function() {
      /*
       * "ready" is triggered by the containing frame when everything has been
       * translated and set up. The widget is not necessarily shown at that
       * point, but it is in the DOM.
       */
      jQuery.CbEvent(this, 'ready');

      jQuery.CbEvent(this, 'show');
      jQuery.CbEvent(this, 'hide');
      jQuery.CbEvent(this, 'destroy');
      this.base();
   }
});



