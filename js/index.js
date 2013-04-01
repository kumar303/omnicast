var events = {
  _target: null,
  trigger: function _eventsTrigger(name, opt) {
    if (!this._target) this.makeTarget();
    var init = opt ? {detail: opt} : null;
    var event = new CustomEvent(name, init);
    this._target.dispatchEvent(event);
  },
  on: function _eventsOn(name, handler) {
    if (!this._target) this.makeTarget();
    this._target.addEventListener(name, handler);
  },
  makeTarget: function _eventsMakeTarget() {
    // Make an orphaned element to stop any unecessary bubbling work.
    this._target = document.createElement('div');
    this._target.attributes.id = 'omni_events_dispatch';
  }
};


function Data() {
  var self = this;
  this.viewName = 'data';
  // These are the characters you can easily type on Firefox OS
  // without using the shift/alt key. The characters must be valid Firebase keys.
  this.chars = 'abcdefghijklmnopqrstuvwxyz'.split('');
  this.conn = new Firebase('https://omnicast.firebaseio.com/').child('v1');
  this.channels = this.conn.child('channels');

  this.itemToAdd = ko.observable("");
  this.enabled = ko.observable(false);
  this.items = ko.observableArray();
  this.channel = null;
  this.refStack = [];
  this.maxLength = 10;  // only store this number of items

  events.on('disconnect', function _onDisconnect() {
    console.log('data.disconnect');
    self.enabled(false);
  });

  events.on('findNewChannel', self.findNewChannel.bind(self));

  events.on('joinChannel', function _onJoinChannel(evt) {
    self.joinChannel(evt.detail.channelName);
  });
}

Data.prototype.wakeUp = function _wakeUp() {
  var self = this;
  ko.computed(function _whenEnabled() {
    if (self.enabled()) {
      events.trigger('viewEnabled', {viewName: self.viewName});
    }
  });
}

Data.prototype.addItem = function _addItem() {
  var obj = {link: this.itemToAdd()};
  this.channel.push(obj, function _firebaseSet(error) {
    if (error) {
      console.log('error:', error);
    }
  });
  this.itemToAdd('');
};

Data.prototype.findNewChannel = function _findNewChannel() {
  // TODO: make some timeout here and up the string length.
  var self = this;
  var name = '';
  for (var i=0; i < 5; i++) {
    name += this.chars[Math.floor(Math.random() * this.chars.length)];
  }
  console.log('data.findNewChannel', name);
  this.channels.child(name).once('value', function _onValue(snapshot) {
    if (!snapshot.val()) {
      // We found an open channel; join it.
      events.trigger('joinChannel', {channelName: name});
    } else {
      setTimeout(self.findNewChannel.bind(self), 100);
    }
  });
};

Data.prototype.joinChannel = function _joinChannel(name) {
  var self = this;
  console.log('data.joinChannel', name);
  if (this.channel) {
    delete this.refStack;
    this.refStack = [];
    this.items.removeAll();
    this.channel.off('child_added');
  }
  this.channel = this.channels.child(name);
  this.channel.on('child_added', function(snapshot) {
    console.log('data.child_added', snapshot.val());
    self.items.unshift(snapshot.val());
    self.refStack.unshift(snapshot.ref());
    self.cleanUpStack();
  });
  self.enabled(true);
};

Data.prototype.cleanUpStack = function _cleanUpStack() {
  if (this.refStack.length > this.maxLength) {
    console.log('data.cleanUpStack');
    this.refStack.pop().remove();
    this.items.pop();
  }
}


function Connect() {
  var self = this;
  this.viewName = 'connect';
  this.connected = ko.observable(false);
  this.showJoinControls = ko.observable(false);
  this.channelToJoin = ko.observable('')
  this.channelName = ko.observable('')

  events.on('joinChannel', function _onJoinChannel(evt) {
    var name = evt.detail.channelName;
    console.log('connect.joinChannel', name);
    self.showJoinControls(false);
    self.connected(true);
    self.channelName(name);
    window.localStorage.setItem('channel', name);
  });
}

Connect.prototype.wakeUp = function _wakeUp() {
  var self = this;
  ko.computed(function _whenEnabled() {
    if (!self.connected()) {
      // Not connected to a channel but the view is ready.
      events.trigger('viewEnabled', {viewName: self.viewName});
    }
  });

  //window.localStorage.setItem('channel', '');
  var channel = window.localStorage.getItem('channel');
  if (channel) {
    events.trigger('joinChannel', {channelName: channel});
  }
}

Connect.prototype.disconnect = function _disconnect() {
  this.channelName('');
  this.connected(false);
  events.trigger('disconnect');
}

Connect.prototype.newChannel = function _newChannel(ctx, event) {
  events.trigger('findNewChannel');
}

Connect.prototype.enterJoinControls = function _enterJoinControls() {
  this.showJoinControls(true);
};

Connect.prototype.joinSelectedChannel = function _joinSelectedChannel() {
  var name = this.channelToJoin();
  this.channelToJoin('');
  events.trigger('joinChannel', {channelName: name});
};


function Loader() {
  var self = this;
  this._loaded = false;

  events.on('viewEnabled', function _onEnabled(evt) {
    console.log('view enabled:', evt.detail.viewName);
    if (!self._loaded) {
      console.log('removing loader');
      document.querySelector('#app').className = '';
      document.querySelector('#loader').className = 'hidden';
      self._loaded = true;
    }
  });
}

Loader.prototype.wakeUp = function _wakeUp() {}


document.addEventListener('DOMContentLoaded', function _onLoad() {
  var viewModel = {
    data: new Data(),
    connect: new Connect(),
    loader: new Loader()
  };
  for (var attr in viewModel) {
    // This is a hook for views to trigger events after everyone else
    // is listening.
    viewModel[attr].wakeUp();
  }
  ko.applyBindings(viewModel);
});
