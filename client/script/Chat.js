var Chat = (function() {
  var TEMPLATE_MESSAGE = '<span class="header">' +
                            '<span class="timestamp">[{{time}}]</span> ' +
                            '<span class="player">{{player.name}}</span>' +
                          '</span>' +
                          '<span class="message">{{message}}</span>';
  
  function Chat(options) {
    this.elList = null;
    this.elInput = null;
    this.types = {};
    this.elWindows = {};
    
    this.current = '';
    this.isFocused = false;
    
    this.init(options);
  }

  Chat.prototype = {
    init: function init(options) {
      !options && (options = {});
      
      this.elList = options.el;
      this.elInput = this.elList.querySelector('input');
      this.types = options.types;
      
      this.onMessage = options.onMessage || function(){};
      
      window.addEventListener('GameInputKeyUp', this.onKeyUp.bind(this));
      this.elInput.addEventListener('focus', this.onFocus.bind(this));
      this.elInput.addEventListener('blur', this.onBlur.bind(this));
    },
    
    handleInput: function handleInput() {
      var message = this.elInput.value;
      
      if (message) {
        this.onMessage(message, this.current);
        this.elInput.value = '';
      }
      
      this.unfocus();
    },

    onKeyUp: function onKeyUp(e) {
      var input = e.detail.input,
          key = e.detail.key;

      if (this.isFocused) {
        if (input.is(key, Config.KEY_BINDINGS.CHAT_SEND_MESSAGE)) {
          this.handleInput();
        }
      } else {
        if (input.is(key, Config.KEY_BINDINGS.CHAT_ENTER)) {
          this.focus();
        }
      }
    },
    
    focus: function focus() {
      if (this.isFocused) {
        return;
      }
      
      this.elInput.focus();
      this.elList.classList.add('focused');
      this.isFocused = true;
    },
    
    unfocus: function unfocus() {
      if (!this.isFocused) {
        return;
      }
      
      this.elInput.blur();
      this.elList.classList.remove('focused');
      this.isFocused = false;
    },
    
    onFocus: function onFocus(e) {
      this.focus();
    },
    
    onBlur: function onBlur(e) {
      this.unfocus();
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
      console.info('[Chat] Add message', data);
      
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
      
      var elMessages = elWindow.querySelector('.messages');
      if (!elMessages) {
        return;
      }

      el.innerHTML = TEMPLATE_MESSAGE.format({
        'time': this.getTimestamp(),
        'player': player,
        'message': message
      });
      
      var scrollPosition = elMessages.scrollTop + elMessages.offsetHeight,
          shouldAutoScroll = scrollPosition >= elMessages.scrollHeight;

      elMessages.appendChild(el);
      
      if (shouldAutoScroll) {
        elMessages.scrollTop = Infinity;
      }
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