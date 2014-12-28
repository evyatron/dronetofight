var utils = (function(){
  function utils() {
    
  }
  
  utils.prototype = {
    preventEvent: function preventEvent(el, eventName) {
      el.addEventListener(eventName, this._onPreventEvent);
    },
    _onPreventEvent: function _onPreventEvent(e) {
      e.preventDefault();
    },
    
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

// A simple template formatting method
// Replaces {{propertyName}} with properties from the 'args' object
String.prototype.format = function String_format(args) {
  !args && (args = {});

  return this.replace(/(\{\{([^\}]+)\}\})/g, function onMatch() {
    var key = arguments[2],
        shouldFormat = key.indexOf('(f)') === 0,
        properties = key.replace('(f)', '').split('.'),
        value = args;

    // support nesting - "I AM {{ship.info.name}}"
    for (var i = 0, property; (property = properties[i++]);) {
      value = value[property];
    }

    if (value === undefined || value === null) {
      value = arguments[0];
    }

    if (shouldFormat) {
      value = window.utils.numberWithCommas(value);
    }

    return value;
  });
};

// Clamp a number between min/max range
Math.clamp = function Math_Clamp(number, min, max) {
  return Math.min(Math.max(number, min), max);
};