var Chat = (function() {
  var TEMPLATE_MESSAGE = '<span class="timestamp">[{{time}}]</span> ' +
                         '<span class="message">{{playerName}}: {{message}}</span>';
  
  function Chat(options) {
    this.elList;
    this.types = {};
    this.elWindows = {};
    
    this.current;
    
    this.init(options);
  }

  Chat.prototype = {
    init: function init(options) {
      !options && (options = {});
      
      this.elList = options.el;
      this.types = options.types;
    },
    
    addWindow: function addWindow(data) {
      var id = data.id,
          name = data.name;

      console.log('[Chat] Add window: ', id, name);
      
      var el = this.elWindows[id];
      
      if (el) {
        el.querySelector('.name').innerHTML = name;
      } else {
        el = document.createElement('div');
        el.dataset.id = id;
        el.className = 'window ' + id;
        el.innerHTML = '<div class="name">' + name + '</div>' +
                       '<div class="messages"></div>';

        var elName = el.querySelector('.name');
        elName.addEventListener('click', this.onWindowNameClick.bind(this));
        
        this.elWindows[id] = el;
        
        this.elList.appendChild(el);
      }
      
      if (!this.current) {
        this.selectWindow(id);
      }
    },
    
    selectWindow: function selectWindow(id) {
      if (this.current === id) {
        return;
      }
      
      var el = this.elWindows[id];
      if (el) {
        if (this.current) {
          var elCurrent = this.elWindows[this.current];
          if (elCurrent) {
            elCurrent.classList.remove('active');
          }
        }
        
        this.current = id;
        el.classList.add('active');
      }
    },
    
    onWindowNameClick: function onWindowNameClick(e) {
      var elName = e.target,
          elWindow = elName.parentNode,
          id = elWindow.dataset.id;
      
      if (id) {
        this.selectWindow(id);
      }
    },
    
    addMessage: function addMessage(data) {
      var windowId = data.windowId,
          player = data.player,
          message = data.message,
          type = data.type || '',
          
          el = document.createElement('div'),
          elWindow = this.elWindows[windowId];
          
      if (!elWindow) {
        return;
      }
      
      if (type) {
        el.className = type;
      }
      
      elWindow = elWindow.querySelector('.messages');
      
      el.innerHTML = TEMPLATE_MESSAGE.format({
        'time': this.getTimestamp(),
        'playerName': player.name,
        'message': message
      });
      
      elWindow.appendChild(el);
    },
    
    getTimestamp: function getTimestamp(date) {
      if (!date) {
        date = new Date();
      }
      
      var h = date.getHours(),
          m = date.getMinutes(),
          s = date.getSeconds();
          
      (h < 10) && (h = '0' + h);
      (m < 10) && (m = '0' + m);
      (s < 10) && (s = '0' + s);
      
      return h + ':' + m + ':' + s;
    }
  };

  return Chat;
}());