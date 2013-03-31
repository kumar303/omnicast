document.addEventListener('DOMContentLoaded', function _onLoad() {

  // These are the characters you can easily type on Firefox OS
  // without using the shift/alt key. The characters must be valid Firebase keys.
  var chars = 'abcdefghijklmnopqrstuvwxyz_@'.split('');

  function Data() {
    this.conn = new Firebase('https://omnicast.firebaseio.com/').child('v1');
    this.channels = this.conn.child('channels');

    this.itemToAdd = ko.observable("");
    this.enabled = ko.observable(false);
    this.items = ko.observableArray();
    this.channel = null;
    this.refStack = [];
    this.maxLength = 10;  // only store this number of items
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

  Data.prototype.joinChannel = function _joinChannel(name) {
    var self = this;
    console.log('joining channel', name);
    if (this.channel) {
      delete this.refStack;
      this.refStack = [];
      this.items.removeAll();
      this.channel.off('child_added');
    }
    this.channel = this.channels.child(name);
    this.channel.on('child_added', function(snapshot) {
      console.log('child_added', snapshot.val());
      self.items.unshift(snapshot.val());
      self.refStack.unshift(snapshot.ref());
      self.cleanUpStack();
    });
    self.enabled(true);
  };

  Data.prototype.cleanUpStack = function _cleanUpStack() {
    if (this.refStack.length > this.maxLength) {
      console.log('cleaning up ref stack');
      this.refStack.pop().remove();
      this.items.pop();
    }
  }

  var data = new Data();
  ko.applyBindings(data, document.getElementById('data'));


  function Connect(data) {
    this.data = data;
    this.connected = ko.observable(false);
    this.showJoinControls = ko.observable(false);
    this.channelToJoin = ko.observable('')
    this.channelName = ko.observable('')
    //window.localStorage.setItem('channel', '');

    var channel = window.localStorage.getItem('channel');
    if (channel) {
      this.joinChannel(channel);
    }
  }

  Connect.prototype.disconnect = function _disconnect() {
    this.channelName('');
    this.connected(false);
    this.data.enabled(false);
  }

  Connect.prototype.newChannel = function _newChannel(ctx, event) {
    // TODO: make some timeout here and up the string length.
    var self = this;
    var name = '';
    for (var i=0; i < 5; i++) {
      name += chars[Math.floor(Math.random() * chars.length)];
    }
    console.log('trying to connect to', name);
    this.data.channels.child(name).once('value', function _onValue(snapshot) {
      if (!snapshot.val()) {
        // We found an open channel; join it.
        self.joinChannel(name);
      } else {
        setTimeout(self.newChannel.bind(self), 100);
      }
    });
  }

  Connect.prototype.enterJoinControls = function _enterJoinControls() {
    this.showJoinControls(true);
  };

  Connect.prototype.joinSelectedChannel = function _joinSelectedChannel() {
    var name = this.channelToJoin();
    this.channelToJoin('');
    this.joinChannel(name);
  };

  Connect.prototype.joinChannel = function _joinChannel(name) {
    this.showJoinControls(false);
    this.connected(true);
    this.channelName(name);
    window.localStorage.setItem('channel', name);
    this.data.joinChannel(name);
  };

  var connect = new Connect(data);
  ko.applyBindings(connect, document.getElementById('connect'));

});
