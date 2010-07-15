

jQuery.CbBehaviour.behaviour = base2.Base.extend({
   constructor : function(widget) {
      widget.behaviours.push(this);
   },

   destructor : function(widget) {
      for(var index in widget.behaviours) {
         if (widget.behaviours[index] == this) {
            widget.behaviours.splice(index, 1);
         }
      }
   }   
});

jQuery.CbBehaviour.resize = jQuery.CbBehaviour.behaviour.extend({
   constructor : function(widget) {
      this.base(widget);
      widget.resize = function(x, y) {
         widget.element().width(x);
         widget.element().height(y);
      };
   },
   
   destructor : function(widget) {
      this.base(widget);
      widget.resize = undefined;
   }
});

jQuery.CbBehaviour.move = jQuery.CbBehaviour.behaviour.extend({
   constructor : function(widget) {
      this.base(widget);
      widget.move = function(x, y) {
         widget.element().css({
            'left': left + 'px',
            'top': top + 'px'
         });
      };
   },

   destructor : function(widget) {
      this.base(widget);
      widget.move = undefined;
   }
});

jQuery.CbBehaviour.center = jQuery.CbBehaviour.move.extend({
   
});