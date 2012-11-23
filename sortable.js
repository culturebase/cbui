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
 * A frame with items sortable by the jquery_ui "sortable" effect. The
 * drag handle is defined by the CSS class "__CbUiDragIcon" and the
 * sortable items are child elements of this frame with the CSS class
 * "__CbUiSortableItem".
 * You get an event 'dragStart' when the drag handle is clicked and
 * an event 'dragStop' when it's released. jquery_ui sets a helper
 * class on the item, but only when it's actually moved.
 * The default handlers for dragStart and dragStop also set and remove
 * a helper CSS class "__CbUiSortableItemDragging".
 *
 * You can add and remove items with the respective methods. Clicks
 * on elements with the CSS class '__CbUiAddIcon' insert an item at
 * the end of the list. Clicks on '__CbUiRemoveIcon' inside an item
 * remove that item.
 */
jQuery.CbWidget.sortableFrame = jQuery.CbWidget.frame.extend({
   constructor : function(options) {
      this.base(options.element);
      this.options = options;
      var self = this;

      this.element().find('.__CbUiSortableItem').each(function() {
         var item = jQuery(this);
         self.bindIcons(item);
         self.bindDrag(item);
      });

      this.element().find('.__CbUiAddIcon').click(function() {
         self.addItem();
         return false;
      });
   },

   handleReady : function() {
      this.base();
      this.element().sortable({
         handle : '.__CbUiDragIcon'
      });
   },

   /**
    * manually add an item to the end of the list.
    * @param index the position where the element should be inserted
    * @return the item being inserted
    */
   addItem : function(index) {
      var item = null;
      if (index === 0) { // this also works if the list is empty
         item = this.options.template.clone().prependTo(this.element());
      } else if (!index) { // default: append to the end of the list
         item = this.options.template.clone().appendTo(this.element());
      } else {
         item = this.options.template.clone().insertBefore(jQuery(this.element().find('.__CbUiSortableItem')[index]));
      }
      this.bindIcons(item);
      this.bindDrag(item);
      return item;
   },

   /**
    * Get item with the given index.
    * @param index Position of requested item.
    * @return Item at given position.
    */
   getItem : function(index) {
      return jQuery(this.element().find('.__CbUiSortableItem')[index]);
   },

   /**
    * manually remove the item at index.
    * @param index index of the item to be removed.
    */
   removeItem : function(index) {
      if (index !== undefined) {
         jQuery(this.element().find('.__CbUiSortableItem')[index]).remove();
      } else {
         jQuery(this.element().find('.__CbUiSortableItem').last()).remove();
      }
   },

   handleDragStart : function (params) {
      params.target.addClass('__CbUiSortableItemDragging');
   },

   handleDragStop : function () {
      this.element().find('.__CbUiSortableItemDragging').removeClass('__CbUiSortableItemDragging');
   },

   bindIcons : function(item) {
      var self = this;
      item.find('.__CbUiRemoveIcon').click(function() {
         if (!self.options.remove_warning || confirm(self.options.remove_warning)) {
            item.remove();
         }
         return false;
      });
   },

   bindDrag : function (item) {
      var self = this;
      item.find('.__CbUiDragIcon').mousedown(function () {
         self.trigger('dragStart', {target: item});
         jQuery(document).one('mouseup', function () { // mouseup can be triggered on a different element
            self.trigger('dragStop');
         });
      });
   },

   /**
    * remove all items.
    */
   clear : function() {
      this.element().find('.__CbUiSortableItem').remove();
   },

   /**
    * pad or truncate the list to 'num' items. Items are added to the end
    * and removed from the end of the list.
    * @param num the desired number of items.
    */
   setNumItems : function(num) {
      var present = this.element().find('.__CbUiSortableItem').length;
      while (present < num) {
         this.addItem();
         ++present;
      }
      while (num < present) {
         this.removeItem();
         --present;
      }
   },

   getNumItems : function() {
      return this.element().find('.__CbUiSortableItem').length;
   }
}, {
   init : function() {
      jQuery.CbEvent(this, 'dragStart');
      jQuery.CbEvent(this, 'dragStop');
      this.base();
   }
});