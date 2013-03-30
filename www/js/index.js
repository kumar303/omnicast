var app = {
  initialize: function _initialize() {
    this.conn = new Firebase('https://omnicast.firebaseio.com/');
    this.channels = this.conn.child('channels');
    this.bindEvents();
  },
  bindEvents: function _bindEvents() {
    document.addEventListener('DOMContentLoaded', this.onDeviceReady.bind(this), false);
    var btn = document.getElementById('new-channel');
    btn.addEventListener('click', this.newChannel.bind(this), false);
  },
  onDeviceReady: function _onDeviceReady() {
    var channel = window.localStorage.getItem('channel');
    if (channel) {
      this.joinChannel(channel);
    }
  },
  joinChannel: function _joinChannel(name) {
    console.log('joining channel', name);
    this.channel = this.channels.child(name);
    window.localStorage.setItem('channel', name);
    this.channel.on('value', function(snapshot) {
      console.log('child_added ', snapshot.val());
    });
    this.channel.on('child_added', function(snapshot) {
      console.log('child_added ', snapshot.val().link);
    });
    /*
    this.channel.push({link: "http://baidu.com"}, function _firebaseSet(error) {
      if (error) {
        console.log('error:', error);
      }
    });
    */
  },
  newChannel: function _newChannel() {
    this.joinChannel('some-channel');
  }
};
