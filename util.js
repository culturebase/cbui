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

jQuery.CbUtil = {};
jQuery.CbUtil.element_cycler = base2.Base.extend({
   /**
    * Cycle through the elements: show the next one or the
    * given one.
    */
   show : function(index) {
      if (typeof(index) == 'undefined') index = this.shown_field + 1;
      if (index >= this.elements.length) index = 0;

      if (this.shown_field >= 0) {
         jQuery(this.elements[this.shown_field]).hide();
      }
      jQuery(this.elements[index]).show();

      this.shown_field = index;
   },

   hide : function() {
      if (this.shown_field < 0) return;
      jQuery(this.elements[this.shown_field]).hide();
      this.shown_field = -1;
   },

   getShown : function() {
      return jQuery(this.elements[this.shown_field]);
   },

   constructor : function(elements) {
      base2.lang.assert(elements.length > 0);
      this.base();
      this.shown_field = 0;
      this.elements = elements;
      this.original_state = [];
      var self = this;
      elements.each(function(index) {
         self.original_state[index] = jQuery(this).css('display');
      });
      this.elements.hide();
      jQuery(this.elements[0]).show();
   },

   destroy : function() {
      var self = this;
      this.elements.each(function(index) {
         jQuery(this).css('display', self.original_state[index]);
      });
   },

   refreshElement : function() {
      this.elements = jQuery(this.elements);
   }
});

jQuery.CbUtil.element_pivot = base2.Base.extend({

   constructor : function(element, pivot_tag) {
      this.base();
      this.parent = jQuery(document.createElement(pivot_tag || 'span'));
      this.parent.attr('id', element.attr('id'));
      element.removeAttr('id');
      this.parent.insertAfter(element);
      this.parent = jQuery(this.parent);
      this.parent.append(element.remove());
      this.child = this.parent.children();
   },

   destroy : function() {
      this.child.insertAfter(this.parent).attr('id', this.parent.attr('id'));
      this.parent.remove();
   },

   refreshElement : function() {
      this.child = jQuery(this.child);
      this.parent = jQuery(this.parent);
   }
});

jQuery.CbUtil.window_closer = base2.Base.extend({
   constructor : function(element) {
      this.base();
      this.element = element;
   },

   destroy : function() {
      var element = this.element;
      while(typeof(element.CbWidget) != 'function' || typeof(element.CbWidget().close) != 'function') {
         var parent = jQuery(element.parent());
         if (!parent || parent == element) {
            return;
         } else {
            element = parent;
         }
      }
      element.CbWidget().close();
   },

   refreshElement : function() {
      this.element = jQuery(this.element);
   }
});

jQuery.CbUtil.base64_codec = base2.Base.extend({
   b64 : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

   encode : function(input) {
      input =  window.unescape(window.encodeURIComponent(input));
      if (typeof window.btoa === 'function') {
         return window.btoa(input);
      } else {
         var output = "";
         var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
         var i = 0;

         while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
               enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
               enc4 = 64;
            }

            output += this.b64.charAt(enc1) + this.b64.charAt(enc2) +
                  this.b64.charAt(enc3) + this.b64.charAt(enc4);
         }
         return output;
      }
   },

   decode : function (input) {
      if (typeof window.atob === 'function') {
         output = window.atob(input);
      } else {
         var output = "";
         var chr1, chr2, chr3;
         var enc1, enc2, enc3, enc4;
         var i = 0;

         input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

         while (i < input.length) {
            enc1 = this.b64.indexOf(input.charAt(i++));
            enc2 = this.b64.indexOf(input.charAt(i++));
            enc3 = this.b64.indexOf(input.charAt(i++));
            enc4 = this.b64.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output += String.fromCharCode(chr1);

            if (enc3 != 64) output = output + String.fromCharCode(chr2);
            if (enc4 != 64) output = output + String.fromCharCode(chr3);
         }
      }
      return window.decodeURIComponent(window.escape(output));
   }
});

jQuery.CbUtil.xml_codec = base2.Base.extend({
   decode : function(element) {
      var self = this;
      switch (element.attr('type')) {
         case 'number':
            return +element.text();
         case 'string':
            return element.text();
         case 'null':
            return null;
         case 'boolean':
            return element.text() === '1' ? true : false;
         case 'object':
            var numeric = element.attr('numeric') === '1';
            var result = numeric ? [] : {};
            element.children().each(function(i, child) {
               child = jQuery(child);
               if (numeric) {
                  result.push(self.decode(child));
               } else {
                  result[child.attr('key')] = self.decode(child);
               }
            });
            return result;
      }
   }
});

/**
 * @deprecated Use the properly scoped variants
 */
var CbElementCycler = jQuery.CbUtil.element_cycler;
var CbWindowCloser = jQuery.CbUtil.window_closer;
var CbBase64Codec = jQuery.CbUtil.base64_codec;
var CbElementPivot = jQuery.CbUtil.element_pivot;