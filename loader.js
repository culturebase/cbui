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

jQuery.CbWidget.loader = jQuery.CbWidget.widget.extend({
   constructor: function (options) {
      this.base(jQuery(document.createElement('div'))
         .addClass('__CbUiLayer').addClass('__CbUiLoader'));

      this.options = jQuery.extend({
         opacity:         0.25,
         fadeingDuration: 250
      }, options || {});
   },

   handleShow: function () {
      this.element().appendTo('body').stop()
         .fadeTo(this.options.fadingDuration, this.options.opacity);

      return this;
   },

   handleHide: function () {
      this.element().stop().fadeOut(this.options.fadingDuration, function () {
         jQuery(this).detach();
      });

      return this;
   }
});