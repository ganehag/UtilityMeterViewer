var MBusProtocol = function(app, serialPort) {
    this.app = app;
    this.serialPort = serialPort;
    this.default = {
        bitrate: 2400,
        dataBits: "eight",
        parityBit: "even",
        stopBits: "one"
    };
};
MBusProtocol.prototype.performReadout = function(callback) {
    var self = this;
    if($('#settings-mbus-opto').is(':checked')) {
        self.optoWake(function() {
            self.stage1.call(self, callback);
        });
    } else {
        self.stage1.call(self, callback);
    }
};
MBusProtocol.prototype.stage1 = function(callback) {
    var self = this;
    self.final_callback = callback;
    self.serialPort.state = 'recv';

    var mbus = new MBus();
    var frame = mbus.pingFrame(self.app.options.mbus.address);

    chrome.serial.update(self.serialPort.connectionId, {
        bitrate: self.app.options.mbus.baudrate, 
        dataBits: self.default.dataBits,
        parityBit: self.default.parityBit,
        stopBits: self.default.stopBits
    }, function(result) {
        chrome.serial.send(self.serialPort.connectionId, str2ab(frame), function(result) {
            self.stage2.call(self, result);
        });
    });
};
MBusProtocol.prototype.stage2 = function(result) {
    var self = this;
    self.serialPort.recvWatchdog(function(data) {
        var mbus = new MBus();
        try {
            var frame = mbus.load(data);
            // FIXME: verify if ACK frame

            self.stage3.call(self);

        } catch(err) {
            Materialize.toast(err, 2000);
            return self.final_callback.call(self);
        }
    });
};
MBusProtocol.prototype.stage3 = function(result) {
    var self = this;
    self.serialPort.state = 'recv';

    var mbus = new MBus();
    var frame = mbus.requestFrame(self.app.options.mbus.address);


    function convertToHex(str) {
        var hex = '';
        for(var i=0;i<str.length;i++) {
            hex += ''+str.charCodeAt(i).toString(16);
        }
        return hex;
    }

    chrome.serial.send(self.serialPort.connectionId, str2ab(frame.toString()), function(result) {
        self.serialPort.recvWatchdog(function(data) {
            var mbus = new MBus();
            try {
                var frame = mbus.load(data);

                self.final_callback(frame);

            } catch(err) {
                Materialize.toast(err, 2000);
                return self.final_callback.call(self);
            }
        });
    });
};
MBusProtocol.prototype.optoWake = function(callback) {
    var self = this;

    if(self.connectionId === null) {
        callback.apply(self);
    } else {
        var wake_bitrate = self.app.options.mbus.baudrate; // FIXME: Should we always use 2400 baud here? self.options.bitrate;

        chrome.serial.update(self.serialPort.connectionId, {
            bitrate: wake_bitrate, 
            dataBits: "eight",
            parityBit: "no",
            stopBits: "one"
        }, function(result) {
            var numChars = 0;
            var i1 = setInterval(function() {
                chrome.serial.send(self.serialPort.connectionId, str2ab("\x55\x55\x55\x55\x55\x55\x55\x55\x55\x55"), function() {
                    numChars += 10;
                });
            }, (100/wake_bitrate)*1000);

            setTimeout(function() {
                clearInterval(i1);

                setTimeout(function() {
                    chrome.serial.update(self.serialPort.connectionId, self.serialPort.options, callback);    
                }, 200);
            }, 2200);
        });
    }
};