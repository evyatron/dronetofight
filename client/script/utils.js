var utils = (function(){
  function utils() {
    
  }
  
  utils.prototype = {
    // Random method with min and max limits
    random: function random(min, max) {
      if (Array.isArray(min) && max === undefined) {
        return min[window.utils.random(0, min.length - 1)];
      } else if (min === undefined && max === undefined) {
        return window.utils.random(0, 1) === 0;
      }

      return Math.round(Math.random() * (max - min)) + min;
    }
  };
  
  return new utils();
}());