function Starfield(options) {
  var self = this,
      elCanvas,
      context,
      numberOfItems = 0,
      isMoving = !!options.isMoving,
      items = [],
      width = 0,
      height = 0,
      speedFactor = options.speedFactor || 1,
      color = options.color || 'rgba(255, 255, 255, 1)',
      SIZE_MIN = (options.size || [0.5, 1])[0],
      SIZE_MAX = (options.size || [0.5, 1])[1],
      SPEED_MIN = (options.speed || [20, 1])[0],
      SPEED_MAX = (options.speed || [20, 100])[1];
      
      
  this.id = options.id || ('starfield_' + Date.now());
		
	this.init = function init() {
	  this.el = elCanvas = document.createElement('canvas')
		context = elCanvas.getContext('2d');

		self.setNumberOfItems(options.numberOfItems);
	};
	
	this.setNumberOfItems = function(newNumber) {
		numberOfItems = newNumber;
		fillCanvas(true);
	};
	
	this.setSize = function setSize() {
	  var elContainer = elCanvas.parentNode;
	  if (elContainer) {
  		elCanvas.width = width = elCanvas.parentNode.offsetWidth;
  		elCanvas.height = height = elCanvas.parentNode.offsetHeight;
	  }
		
		context.fillStyle = color;
		fillCanvas(true);
	};
	
	this.setSpeedFactor = function setSpeedFactor(newSpeedFactor) {
	  speedFactor = newSpeedFactor;
	  isMoving = (speedFactor !== 0);
	};
	
	this.getSpeedFactor = function getSpeedFactor() {
	  return speedFactor;
	};
	
	function newItem(isFromCenter) {
		items.push({
			'size': window.utils.random(SIZE_MIN, SIZE_MAX),
			'x': isFromCenter? Math.random() * width : width,
			'y': Math.random() * height,
			'speed': window.utils.random(SPEED_MIN, SPEED_MAX)
		});
	}
	
  function fillCanvas(isFromCenter) {
    if (!width && !height) {
      return;
    }

    // Remove items if there are too many (number of stars changed)
    while (items.length > numberOfItems) {
      items.splice(Math.floor(Math.random() * items.length), 1);
    }
    
    // Fill starrs until it's full
    while (items.length < numberOfItems) {
      newItem(isFromCenter);
    }
  }
          
	this.update = function update(dt) {
	  if (!isMoving) {
	    return;
	  }
	  
		for (var i = 0, item; (item = items[i++]);) {
			item.x -= item.speed * speedFactor * dt;
			//item.y += vectorY * item.speed * speedFactor * dt;

			if (item.x < 0 || item.x > width || item.y < 0 || item.y > height) {
				items.splice(i-1, 1);
			}
		}
		
		fillCanvas(false);
	};
	
	this.draw = function draw() {
		context.clearRect(0, 0, width, height);
		
		var arc = Math.PI * 360;
		for (var i = 0, item; (item = items[i++]);) {
			context.beginPath();
			context.arc(item.x, item.y, item.size, 0, arc, false);
			context.fill();
			context.closePath();
		}
	};
          
	this.init();
}