document.addEventListener('DOMContentLoaded', function _onLoad() {

  function Data() {
    this.conn = new Firebase('https://omnicast.firebaseio.com/');
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
      console.log('child_added ', snapshot.val());
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
  ko.applyBindings(data, document.getElementById('links'));


  function Connect(data) {
    this.data = data;
    this.connected = ko.observable(false);
    this.channelName = ko.observable('')

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

  Connect.prototype.newChannel = function _newChannel() {
    this.joinChannel('some-channel');
  }

  Connect.prototype.joinChannel = function _joinChannel(name) {
    this.connected(true);
    this.channelName(name);
    window.localStorage.setItem('channel', name);
    this.data.joinChannel('some-channel');
  };

  var connect = new Connect(data);
  ko.applyBindings(connect, document.getElementById('connect'));

});
