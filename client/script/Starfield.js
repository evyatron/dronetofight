var Starfield = (function Starfield() {
	function Starfield(options) {
  	this.id = options.id || ('starfield_' + Date.now());
		
		this.el;
    this.context;
    this.numberOfItems = 0;
    this.isMoving = !!options.isMoving;
    this.items = [];
    this.width = 0;
    this.height = 0;
    this.speedFactor = 1;
    this.color = options.color || 'rgba(255, 255, 255, 1)';
    this.SIZE_MIN = (options.size || [0.5, 1])[0];
    this.SIZE_MAX = (options.size || [0.5, 1])[1];
    this.SPEED_MIN = (options.speed || [20, 1])[0];
    this.SPEED_MAX = (options.speed || [20, 100])[1];
	      
		this.init(options);
	}

	Starfield.prototype = {
		init: function init(options) {
		  this.el = document.createElement('canvas');
			this.context = this.el.getContext('2d');
	
			this.setNumberOfItems(options.numberOfItems);
			this.setSpeedFactor(options.speedFactor);
		},
		
		setNumberOfItems: function setNumberOfItems(newNumber) {
			this.numberOfItems = newNumber;
			this.fillCanvas(true);
		},
		
		setSize: function setSize() {
		  var elContainer = this.el.parentNode;
		  if (elContainer) {
	  		this.el.width = this.width = this.el.parentNode.offsetWidth;
	  		this.el.height = this.height = this.el.parentNode.offsetHeight;
		  }
			
			this.context.fillStyle = this.color;
			this.fillCanvas(true);
		},
		
		setSpeedFactor: function setSpeedFactor(newSpeedFactor) {
		  this.speedFactor = newSpeedFactor;
		  this.isMoving = (this.speedFactor !== 0);
		},
		
		getSpeedFactor: function getSpeedFactor() {
		  return this.speedFactor;
		},
		
		newItem: function newItem(isFromCenter) {
			this.items.push({
				'size': window.utils.random(this.SIZE_MIN, this.SIZE_MAX),
				'x': isFromCenter? Math.random() * this.width : this.width,
				'y': Math.random() * this.height,
				'speed': window.utils.random(this.SPEED_MIN, this.SPEED_MAX)
			});
		},
		
	  fillCanvas: function fillCanvas(isFromCenter) {
	    if (!this.width && !this.height) {
	      return;
	    }
	
	    // Remove items if there are too many (number of stars changed)
	    while (this.items.length > this.numberOfItems) {
	      this.items.splice(Math.floor(Math.random() * this.items.length), 1);
	    }
	    
	    // Fill stars until it's full
	    while (this.items.length < this.numberOfItems) {
	      this.newItem(isFromCenter);
	    }
	  },
	  
	  setLayer: function setLayer(layer) {
	  	this.layer = layer;
	  },
	          
		update: function update(dt) {
		  if (!this.isMoving) {
		    return;
		  }
		  
			for (var i = 0, item; (item = this.items[i++]);) {
				item.x -= item.speed * this.speedFactor * dt;
	
				if (item.x < 0) {
					this.items.splice(i-1, 1);
				}
			}
			
			this.fillCanvas(false);
		},
		
		draw: function draw() {
			var context = this.context;

			context.clearRect(0, 0, this.width, this.height);
			
			var arc = Math.PI * 360;
			for (var i = 0, item; (item = this.items[i++]);) {
				context.beginPath();
				context.arc(item.x, item.y, item.size, 0, arc, false);
				context.fill();
				context.closePath();
			}
		}
	};
	
	return Starfield;
}());