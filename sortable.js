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
   },
   
   handleReady : function() {
      this.base();
      var self = this;

      this.element().find('.__CbUiSortableItem').each(function() {
         var item = jQuery(this);
         self.bindIcons(item);
         self.bindDrag(item);
      });

      this.element().sortable({
         handle : '.__CbUiDragIcon'
      });
      
      this.element().find('.__CbUiAddIcon').click(function() {
         self.addItem();
         return false;
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
      item.find('.__CbUiRemoveIcon').click(function() {
         item.remove();
         return false;
      });
   },

   bindDrag : function (item) {
      var self = this;
      item.find('.__CbUiDragIcon').mousedown(function () {
         self.trigger('dragStart', {target: item});
         $(document).one('mouseup', function () { // mouseup can be triggered on a different element
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