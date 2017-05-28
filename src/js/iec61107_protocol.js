var IEC61107Protocol = function(app, serialPort) {
    this.app = app;
    this.serialPort = serialPort;
    this.default = {
        bitrate: 300,
        dataBits: "seven",
        parityBit: "even",
        stopBits: "one"
    };
    this.STX = '\x02';
    this.ETX = '\x03';
};
IEC61107Protocol.prototype.reply_speed = function(c) {
  var speed = 300;

  switch(c) {
    case 'A':
    case '1':
      speed = 600;
      break;
    case '2':
    case 'B':
      speed = 1200;
      break;
    case '3':
    case 'C':
      speed = 2400;
      break;
    case '4':
    case 'D':
      speed = 4800;
      break;
    case '5':
    case 'E':
      speed = 9600;
      break;
    case '6':
    case 'F':
      speed = 19200;
      break;
  }
  return speed;
};
IEC61107Protocol.prototype.optoWake = function(callback) {
    var self = this;

    if(self.serialPort.connectionId === null) {
        callback.apply(this);
    } else {
        var bitrate,
            i,
            wake_str = "",
            wakeup_len,
            wakeup_mode = self.app.options.iec61107.wakeup;

        // FROM LUG 2WR5 Documentation
        if(wakeup_mode == 0) {
            bitrate = 300;
            wakeup_len = 40;
        }
        else if(wakeup_mode == 1) {
            abitrate = 2400;
            wakeup_len = 229;
        }
        else if(wakeup_mode == 2) {
            bitrate = 2400;
            wakeup_len = 130;
        } /* 62056 wake */
        else if(wakeup_mode == 3) {
            bitrate = 300;
            wakeup_len = 66;
        } /* 62056 fast wake */
        else if(wakeup_mode == 4) {
            bitrate = 300;
            wakeup_len = 15;
        }

        for(i=0; i < wakeup_len; i++) {
            wake_str += "\x00";
        }

        chrome.serial.update(self.serialPort.connectionId, {
            bitrate: bitrate, 
            dataBits: self.default.dataBits,
            parityBit: self.default.parityBit,
            stopBits: self.default.stopBits
        }, function(result) {
            chrome.serial.send(self.serialPort.connectionId, str2ab(wake_str), function(result) {
                if(callback) {
                    callback.call(self);
                }
            });
        });

    }
};
IEC61107Protocol.prototype.performReadout = function(callback) {
    var self = this;
    if($('#settings-iec61107-wakeup').val() != -1) {
        self.optoWake(function() {
            self.stage1.call(self, callback);
        });
    } else {
        self.stage1.call(self, callback);
    }
};
IEC61107Protocol.prototype.stage1 = function(callback) {
    var self = this;
    self.final_callback = callback;
    self.serialPort.state = 'recv';
    self.serialPort.timer = 3000;
    self.serialPort.eot_char = '\n'; // Terminate read on newline

    chrome.serial.update(self.serialPort.connectionId, {
        bitrate: self.default.bitrate, 
        dataBits: self.default.dataBits,
        parityBit: self.default.parityBit,
        stopBits: self.default.stopBits
    }, function(result) {
        var req = "/?!\r\n";

        // FIXME: hack for 2WR5, nothing in IEC61107 about this
        if(self.app.options.iec61107.optional) {
            req = "/#!\r\n"; 
        }

        chrome.serial.send(self.serialPort.connectionId, str2ab(req), function(result) {
            self.stage2.call(self, result);
        });
    });
};

IEC61107Protocol.prototype.stage2 = function(result) {
    var self = this;
    self.serialPort.recvWatchdog(function(data) {
        if(data.length >= 5) {
            var manufacturer = data.slice(1, 4);
            var details_link = '<i class="material-icons left white-text">info</i> ';

            if(FlagList !== undefined && FlagList.hasOwnProperty(manufacturer)) {
                $('#manufacturer').html(details_link + FlagList[manufacturer].company).prop('title', FlagList[manufacturer].company);
            } else {
                $('#manufacturer').html(details_link + manufacturer).prop('title', manufacturer);
            }

            var new_speed = self.reply_speed(data[4]);

            chrome.serial.update(self.serialPort.connectionId, {
                bitrate: new_speed, 
                dataBits: self.default.dataBits,
                parityBit: self.default.parityBit,
                stopBits: self.default.stopBits
            }, function(result) {
                self.serialPort.state = 'recv';
                self.serialPort.eot_char = null;
                self.stage3.call(self, result);
            });
        } else {
            Materialize.toast("Timeout occured", 2000);
            return self.final_callback.call();
        }
    });
};
IEC61107Protocol.prototype.stage3 = function(result) {
    var self = this;
    self.serialPort.recvWatchdog(function(data) {
        var content = "" + data;
        if(content[0] == self.STX) {
            content = content.slice(1, content.indexOf(self.ETX));
        }
        var re = /([^\(]*)\(([^\)]*)\)/g,
            match;

        var table = [];
        while (match = re.exec(content)) {
            if(match.length >= 3) {
                table.push({func: match[1], value: match[2]});
            }
        }

        self.final_callback(table);
    });
};