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
 * A text widget. This simply shows the text for some ML label retrieved via
 * jQuery(element).text().
 */
jQuery.CbWidget.text = jQuery.CbWidget.widget.extend({

   changeLanguage : function(bricks) {
      if (this.texts.text) {
         this.element().html(bricks[this.texts.text]);
      }
   },

   constructor : function(element) {
      this.base(element);
      var label = this.element().text();
      if (label != '') {
         this.texts = {text : label};
      }
   },

   value : function(text) {
      this.element().html(text);
   }
});

/**
 * A widget showing alternate texts which can be switched using show(). By
 * default no text is shown. This is particularly useful for error messages.
 *
 * It expects a DOM element with children, each of which has an ML label as
 * text.
 */
jQuery.CbWidget.multiText = jQuery.CbWidget.widget.extend({

   constructor : function(element) {
      this.base(element);
      this.cycler = new CbElementCycler(element.children());
      this.cycler.hide();
      var self = this;
      this.cycler.elements.each(function(index) {
         var label = jQuery(this).text();
         self.texts[index] = label;
      });
   },

   handleHide : function(params) {
      this.base();
      this.cycler.hide();
   },

   handleShow : function(params) {
      this.base();
      if (typeof(params.label) == 'number') {
         this.cycler.show(params.label);
      } else {
         for (var pos in this.texts) {
            if (this.texts[pos] == params.label) {
               this.cycler.show(pos);
               break;
            }
         }
      }
   },

   /**
    * Get the currently shown text.
    * @return Currently shown text.
    */
   getShown : function() {
      return this.cycler.getShown();
   },

   numTexts : function() {
      return this.cycler.elements.length;
   },

   /**
    * show the text belonging to the given label, provided it is available.
    * Hide any other text. short for trigger('show', ...)
    */
   showText : function(label) {
      return this.trigger('show', {'label' : label});
   },

   hideText : function() {
      return this.hide();
   },

   changeLanguage : function(bricks) {
      var self = this;
      this.cycler.elements.each(function(index) {
         jQuery(this).html(bricks[self.texts[index]]);
      });
      return this;
   },

   handleDestroy : function() {
      this.base();
      this.cycler.destroy();
   }
});
