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
      this.less();
      return this.base();
   }
}, {
   init : function() {
      jQuery.CbEvent(this, 'more');
      jQuery.CbEvent(this, 'less');
      return this.base();
   }
});

jQuery.CbWidget.moreLessText = jQuery.CbWidget.moreLess.extend({
   constructor : function(element) {
      this.maxLength(jQuery.CbWidget.moreLessText.default_max_length);
      this.hidden_content = '';
      return this.base(element);
   },

   handleMore : function() {
      var content = jQuery('.__CbUiMoreLessContent', this.element());
      if (this.hidden_content != '') {
         content.text(content.text().substr(0, -3) + this.hidden_content);
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
         this.hidden_content = content.text().substr(this.maxLength());
         content.text(content.text().substr(0, this.maxLength()) + '...');
         jQuery('.__CbUiMoreButton', this.element()).show();
      }
      return this.base();
   }
}, {
   default_max_length : 20
});

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