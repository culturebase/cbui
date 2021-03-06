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
 * Frame to show more or less content and associated "more" and "less" buttons
 * depending on length of content. This is a frame where you can place all kinds
 * of buttons, titles, annotations and other things. It should contain one
 * element with the class "CbUiMoreLessContent" which will react to the buttons.
 */
jQuery.CbWidget.moreLess = jQuery.CbWidget.frame.extend({
   handleMore : function() {
      jQuery('.__CbUiMoreButton', this.element()).hide();
      return this;
   },

   handleLess : function() {
      jQuery('.__CbUiLessButton', this.element()).hide();
      return this;
   },

   maxLength : function(max) {
      if (typeof(max) != 'undefined') this.max_length = max;
      return this.max_length;
   },

   handleReady : function() {
      var self = this;
      if (this.hidden_content.length == 0) {
         jQuery('.__CbUiMoreButton', this.element()).hide();
      }
      jQuery('.__CbUiMoreButton', this.element()).click(function() {
         self.more();
      });
      jQuery('.__CbUiLessButton', this.element()).click(function() {
         self.less();
      });
      this.base();
      return this.less();
   }
}, {
   init : function() {
      /**
       * Show full version of the content.
       */
      jQuery.CbEvent(this, 'more');
      /**
       * Show abbreviated version of the content.
       */
      jQuery.CbEvent(this, 'less');
      return this.base();
   }
});

/**
 * More/Less frame for text. Abbreviated text will be shown with a trailing
 * '...'. All text is expected to be placed directly in '.CbUiMoreLessContent'.
 * Maximum length refers to number of characters here.
 */
jQuery.CbWidget.moreLessText = jQuery.CbWidget.moreLess.extend({
   constructor : function(element) {
      this.maxLength(jQuery.CbWidget.moreLessText.default_max_length);
      this.hidden_content = '';
      return this.base(element);
   },

   handleMore : function() {
      var content = jQuery('.__CbUiMoreLessContent', this.element());
      if (this.hidden_content != '') {
         content.html(this.hidden_content);
         this.hidden_content = '';
      }
      if (content.text().length > this.maxLength()) {
         jQuery('.__CbUiLessButton', this.element()).show();
      }
      return this.base();
   },

   handleLess : function() {
      if (this.hidden_content.length) return this;
      var content = jQuery('.__CbUiMoreLessContent', this.element());
      if (content.text().length > this.maxLength()) {
         this.hidden_content = content.html();
         content.text(content.text().substr(0, this.maxLength()) + '...');
         jQuery('.__CbUiMoreButton', this.element()).show();
      }
      return this.base();
   }
}, {
   default_max_length : 250
});

/**
 * More/Less frame for nested elements. Maximum length refers to
 * CbUiMoreLessContent's number of children here.
 */
jQuery.CbWidget.moreLessElements = jQuery.CbWidget.moreLess.extend({
   constructor : function(element) {
      this.maxLength(jQuery.CbWidget.moreLessElements.default_max_length);
      this.hidden_content = [];
      return this.base(element);
   },

   handleMore : function() {
      var content = jQuery('.__CbUiMoreLessContent', this.element());
      content.append(this.hidden_content);
      this.hidden_content = [];
      if (content.children().length > this.maxLength()) {
         jQuery('.__CbUiLessButton', this.element()).show();
      }
      return this.base();
   },

   handleLess : function() {
      if (this.hidden_content.length) return this;
      var length = 0;
      var self = this;
      jQuery('.__CbUiMoreLessContent', this.element()).children().each(function(i, child) {
         if (++length > self.maxLength()) {
            self.hidden_content.push(jQuery(child).remove()[0]);
         }
      });
      if (length > this.maxLength()) {
         jQuery('.__CbUiMoreButton', self.element()).show();
      }
      return this.base();
   }

}, {
   default_max_length : 3
});