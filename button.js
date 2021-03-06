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
 * A text button. I'm sure we'll eventually need some kind of special behaviour
 * here. Maybe the click handler should be centralized.
 */
jQuery.CbWidget.textButton = jQuery.CbWidget.text.extend({});

/**
 * A button intended for language selection. It always shows an isocode for the
 * current language.
 */
jQuery.CbWidget.langSelect = jQuery.CbWidget.textButton.extend({

   constructor : function(element) {
      this.base(element);
      this.element().html(jQuery.CbWidgetRegistry.language.split('_')[0]);
      this.element().click(function() {
         new jQuery.CbWidget.language_window().open();
      });
   },

   changeLanguage : function(bricks) {
      this.element().html(jQuery.CbWidgetRegistry.language.split('_')[0]);
      this.base(bricks);
   }
});

jQuery.CbWidget.imgButton = jQuery.CbWidget.widget.extend({
   constructor : function(element) {
      this.base(element);
      var title = this.element().attr('title');
      if (title) this.texts.title = title;
   },

   changeLangauge : function(bricks) {
      this.base(bricks);
      if (this.texts.title) {
         this.element().attr('title', bricks[this.texts.title]);
      }
   }
});

/**
 * close button for windows. When clicked this button searches for the next
 * parent element which defines the "close" method. It then calls this method.
 */
jQuery.CbWidget.closeButton = jQuery.CbWidget.imgButton.extend({

   constructor : function(element) {
      this.base(element);
      this.closer = new jQuery.CbUtil.window_closer(element);
      this.element().click(this.doClose());
      return this;
   },

   doClose : function() {
      // we need self here, as click will run in a different context
      var self = this;
      if (self.doCloseCallback === undefined) {
         self.doCloseCallback = function(event) {
            if (event !== undefined) event.preventDefault();
            self.closer.destroy()
         };
      }
      return self.doCloseCallback;
   },

   refreshElement : function() {
      this.closer.refreshElement();
      this.base();
   },

   handleDestroy : function() {
      this.element().unbind('click', this.doClose());
   }
});

jQuery.CbWidget.langFlag = jQuery.CbWidget.imgButton.extend({
   setLanguage : function(locale) {
      var countrycode = null;
      var parts = locale.split('_');
      if (parts.length === 1) {
         countrycode = parts[0];
      } else {
         countrycode = parts[1].substr(0, 2).toLowerCase();
      }
      /* 123 is 97 + 26 where 97 is the offset of 'a' in the ascii alphabet and
       * 26 is the number of useful characters in the locale. So in fact we're
       * counting the flags from right/bottom here.
       */
      var pos_x = (123 - countrycode.charCodeAt(0)) * this.element().innerWidth();
      var pos_y = (123 - countrycode.charCodeAt(1)) * this.element().innerHeight();
      this.element().css('background-position', pos_x + 'px ' + pos_y + 'px');
   }
});

/**
 * Language selector with flag. Assumes a background image that's indexed by
 * background-position. The outerWidth of the given element is assumed to be
 * the unit of indexing.
 */
jQuery.CbWidget.langSelectFlag = jQuery.CbWidget.langFlag.extend({
   constructor : function(element) {
      this.base(element);
      this.element().click(function() {
         new jQuery.CbWidget.language_window().open();
      });
   },

   changeLanguage : function(bricks) {
      this.base(bricks);
      this.setLanguage(jQuery.CbWidgetRegistry.language);
   },

   handleReady : function(params) {
      this.base(params);
      this.changeLanguage(); // call changeLanguage again to get the dimensions right
   }
});


/**
 * A choose list widget. presents a list of options with alternating colors.
 * Each entry represents an id and a description text. Entries can be added
 * with the static method addOption.
 * The colors can be defined with the CSS classes __CbUiListOddColor and
 * __CbUiListEvenColor. If one of the entries is clicked the "select" event is
 * triggered, with {id : <id of chosen entry>} as parameter.
 */
jQuery.CbWidget.chooseList = jQuery.CbWidget.widget.extend({

   constructor : function(element) {
      this.base(element);
      var self = this;
      this.element().children().each(function() {
         jQuery(this).click(function() {
            self.trigger('select', {id : jQuery(jQuery(this).children()[0]).text()});
         });
      });
   }
}, {
   /**
    * has to be done before applying widgets as additional
    * widgets might be defined in the description.
    */
   addOption : function(element, id, description) {
      var node = jQuery(document.createElement('div'));
      node.append(jQuery(document.createElement('span'))
         .addClass('__CbUiListItemValue')
         .text(id).hide());
      node.append(description);
      if (element.children().length % 2) {
         node.addClass("__CbUiListEvenColor");
      } else {
         node.addClass("__CbUiListOddColor");
      }
      element.append(node);
   },

   init : function() {
      jQuery.CbEvent(this, 'select');
      this.base();
   }
});


jQuery.CbWidget.langChooseList = jQuery.CbWidget.chooseList.extend({
   constructor : function(element) {
      this.closer = new CbWindowCloser(element);
      return this.base(element);
   },

   handleReady : function(params) {
      this.element().children().each(function() {
         jQuery(this).find('.__CbUiLangFlag').CbWidget()
               .setLanguage(jQuery(this).find('.__CbUiListItemValue').text());
      });
      return this.base(params);
   },

   handleSelect : function(params) {
      var self = this;
      jQuery.CbWidgetRegistry.changeLanguage(params.id, undefined, function() {
         self.closer.destroy();
      });
      return this.base(params);
   },

   refreshElement : function() {
      this.closer.refreshElement();
      return this.base();
   }

}, {
   addOption : function(element, locale, name) {
      var desc = jQuery(document.createElement('div'));
      desc.append(jQuery(document.createElement('span')).addClass('__CbUiText').text(name));
      desc.append(jQuery(document.createElement('span')).addClass('__CbUiLangFlag'));
      var button = jQuery(document.createElement('span')).addClass('__CbUiTextButton')
            .text(locale.split('_')[0]);
      if (locale == jQuery.CbWidgetRegistry.language) button.addClass('__CbUiSelected');
      desc.append(button);
      jQuery.CbWidget.chooseList.addOption.call(this, element, locale, desc);
   }
});
