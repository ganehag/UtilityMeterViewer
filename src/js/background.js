function Background() {
  
}

Background.prototype.launch = function(launchData) {
  this.newWindow();
};


Background.prototype.newWindow = function() {
  var appWindowId = 'appWindow';
  var options = {
    id: appWindowId,
    frame: 'chrome',
    innerBounds: { 
      width: 325, 
      height: 480, 
      minWidth: 325,
      minHeight: 480
    }
  };

  chrome.app.window.create('index.html', options, function(win) {
    console.log('Window opened:', win);
    var self = this;
    win.onClosed.addListener(function(e) {
      self.onWindowClosed.bind(self, win);
    });
  }.bind(this));
};


var background = new Background();
chrome.app.runtime.onLaunched.addListener(background.launch.bind(background));

/* Exports */
window['background'] = background;
Background.prototype['newWindow'] = Background.prototype.newWindow;
