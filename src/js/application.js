Handlebars.registerHelper("counter", function (index){
    return index + 1;
});

Handlebars.registerHelper("fixround", function (value){
    if(typeof value === 'string') {
        return value;
    } else if(Number(value) === value && value % 1 === 0) {
        return value;
    } else if(value === null || value === undefined) {
        return value;
    }

    return parseFloat((value).toFixed(8));
});

String.prototype.hexEncode = function(){
    var hex, i;

    var result = "";
    for (i=0; i<this.length; i++) {
        hex = this.charCodeAt(i).toString(16);
        result += ("000"+hex).slice(-4);
    }

    return result
}

var ab2str = function(buf) {
  var bufView = new Uint8Array(buf);
  var unis = [];
  for (var i=0; i<bufView.length; i++) {
    unis.push(bufView[i]);
  }
  return String.fromCharCode.apply(null, unis);
};

var str2ab = function(str) {
  var buf = new ArrayBuffer(str.length);
  var bufView = new Uint8Array(buf);
  for (var i=0; i<str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

var Application = function(options, callback) {
    var self = this;
    self.defaults = {
        mbus: {
            optoWake: true,
            baudrate: 2400,
            address: 254
        },
        kmp: {
            legacy: false
        },
        iec61107: {
            optional: false,
            wakeup: 0
        }
    };
    self.options = $.extend({}, self.defaults, options || {});

    chrome.storage.sync.get(["mbus", "kmp", "iec61107"], function(data) {
        self.options = $.extend({}, self.options, data);
        if(callback) {
            callback.call(self);
        }
    });

    chrome.storage.onChanged.addListener(function(changes, namespace) {
        for (key in changes) {
            var storageChange = changes[key];

            switch(key) {
                case 'mbus':
                    self.options.mbus = $.extend({}, self.options.mbus, storageChange.newValue);
                break;
                case 'kmp':
                    self.options.kmp = $.extend({}, self.options.kmp, storageChange.newValue);
                break;
                case 'iec61107':
                    self.options.iec61107 = $.extend({}, self.options.iec61107, storageChange.newValue);
                break;
            }
          /*
          console.log('Storage key "%s" in namespace "%s" changed. ' +
                      'Old value was "%s", new value is "%s".',
                      key,
                      namespace,
                      JSON.stringify(storageChange.oldValue),
                      JSON.stringify(storageChange.newValue));
            */
        }
    });
}

Application.prototype.saveSettings = function(callback) {
    var settings = $.extend({}, this.defaults);

    settings.mbus.optoWake = $('#settings-mbus-opto').is(':checked');
    settings.mbus.baudrate = parseInt($('#settings-mbus-baudrate').val());
    settings.mbus.address = parseInt($('#settings-mbus-addr').val());

    settings.kmp.legacy = $('#settings-kmp-legacy').is(':checked');

    settings.iec61107.wakeup = parseInt($('#settings-61107-wakeup').val());
    settings.iec61107.optional = $('#settings-61107-optional').is(':checked');

    chrome.storage.sync.set(settings, callback);
};


var SerialPort = function(opts, app) {
    var self = this;

    this.app = app;

    this.connectionId = null;
    this.options = {
        bitrate: app.options.mbus.baudrate,
        dataBits: "eight",
        parityBit: "even",
        stopBits: "one"
    };
    this.state = 'idle';
    this.recv_buf = "";
    this.timer = 100;
    this.eot_char = null;
    this.timeout = null;
    this.recv_callback = null;

    chrome.serial.onReceiveError.addListener(function (e) {
        switch(e.error) {
            case 'break':
                self.reconnect.call(self);
            break;
        }
    });

    chrome.serial.onReceive.addListener(function(info) {
        if (info && info.data) {
            if(self.state == 'recv') {              
                if(info.data) {
                    self.recv_buf += ab2str(info.data);
                }

                self.recvWatchdog(null);
            } else {
                console.log("OutOfOrder> ", ab2str(info.data));
            }
        }
    });

    this.mbus = new MBusProtocol(app, this);
    this.iec61107 = new IEC61107Protocol(app, this);
};
SerialPort.prototype.recvWatchdog = function(callback) {
    var self = this;

    if(callback !== null) {
        self.recv_callback = callback;
        self.recv_buf = "";
    }

    var whenDone = function() {
        self.state = 'idle';
        if(self.recv_callback) {
            self.recv_callback.call(self, self.recv_buf);
        }
        if(self.eot_char !== null && self.recv_buf.indexOf(self.eot_char) !== -1) {
            self.recv_buf = self.recv_buf.slice(self.recv_buf.indexOf(self.eot_char)+1);
        } else {
            self.recv_buf = "";    
        }
        self.eot_char = null;
        clearTimeout(self.timeout);
        self.timeout = null;
    };

    if(self.eot_char !== null && self.recv_buf.indexOf(self.eot_char) !== -1) {
        whenDone();
        return;
    }

    if(self.timeout !== null) {
        clearTimeout(self.timeout);
        self.timeout = null;
    }

    self.timeout = setTimeout(whenDone, self.timer);
};
SerialPort.prototype.connect = function(path, callback) {
    var self = this;
    var options = {

    };

    if(this.connectionId === null) {
        chrome.serial.connect(path, options, function(info) {
            self.connectionId = info.connectionId;

            if(callback) {
                callback.apply(self);
            }
        });
    }
};
SerialPort.prototype.disconnect = function(callback) {
    var self = this;
    chrome.serial.disconnect(this.connectionId, function(result) {
        self.connectionId = null;
        callback();
    });
};
SerialPort.prototype.reconnect = function() {
    var self = this;
    self.disconnect.call(self, function() {
        self.connect.call(self);    
    });
};


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

var IEC61107Protocol = function(app, serialPort) {
    this.app = app;
    this.serialPort = serialPort;
    this.default = {
        bitrate: 300,
        dataBits: "seven",
        parityBit: "even",
        stopBits: "two"
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

window.onload = function() {
    $('document').ready(function() {
        var serialPort = null;
        var app = new Application(null, function() {
            serialPort = new SerialPort(null, this);
        });

        $('#manufacturer').click(function(e) {
            e.preventDefault();

            if($(this).data()) {
                $('#modal-product-info').openModal({
                    ready: function() {
                        var man = $('#manufacturer');
                        $('#modal-product-info .modal-content li span').html('');
                        if(man.data('productName') !== undefined) {
                            $('#modal-product-info .modal-content span.productName').html(man.data('productName'));
                        }
                        if(man.data('idNr') !== undefined) {
                            $('#modal-product-info .modal-content span.idNr').html(man.data('idNr'));
                        }
                        if(man.data('accessNo') !== undefined) {
                            $('#modal-product-info .modal-content span.accessNo').html(man.data('accessNo'));
                        }
                        if(man.data('medium') !== undefined) {
                            $('#modal-product-info .modal-content span.medium').html(man.data('medium'));
                        }
                        if(man.data('type') !== undefined) {
                            $('#modal-product-info .modal-content span.type').html(man.data('type'));
                        }
                    }
                });
            }
        });

        $('#btn-file-load').leanModal();

        $('#btn-settings').leanModal({
            ready: function() {
                var mbusAddr = [];
                for(var i=1; i < 255; i++) {
                    mbusAddr.push({
                        addr: i,
                        selected: i === app.options.mbus.address ? true : false
                    });
                }
                var mb_baud = app.options.mbus.baudrate;
                var iec_wakup = app.options.iec61107.wakeup;
                var template_data = {
                    mbus: {
                        baudrates: [
                            {value: 300, title: "300 (typical)", selected: mb_baud === 300 ? true : false},
                            {value: 600, title: "600", selected: mb_baud === 600 ? true : false},
                            {value: 1200, title: "1200", selected: mb_baud === 1200 ? true : false},
                            {value: 2400, title: "2400 (typical)", selected: mb_baud === 2400 ? true : false},
                        ],
                        addresses: mbusAddr,
                        optoWake: app.options.mbus.optoWake
                    },
                    kmp: {
                        legacy: app.options.kmp.legacy
                    },
                    iec61107: {
                        wakeup: [
                            {value: -1, title: "Disable", selected: iec_wakup === -1 ? true: false},
                            {value: 0, title: "Normal mode with a test seal (default)", selected: iec_wakup === 0 ? true: false},
                            {value: 1, title: "Normal mode without a test seal", selected: iec_wakup === 1 ? true: false},
                            {value: 2, title: "Rolling menu (Pb) or calib mode(Eb)", selected: iec_wakup === 2 ? true: false},
                            {value: 3, title: "IEC62056-21 battery operated tariff", selected: iec_wakup === 3 ? true: false},
                            {value: 4, title: "IEC62056-21 batt. oper. fast wake-up", selected: iec_wakup === 4 ? true: false},
                        ],
                        optional: app.options.iec61107.optional
                    }
                };

                var html = Handlebars.templates['settings.html'](template_data);

                $('#modal-settings .modal-content').html(html);
                $('#modal-settings .modal-content select').material_select();
            },
            complete: function() {
                app.saveSettings(function() {
                    Materialize.toast("Settings updated", 1000);
                });
            }
        });

        $('#btn-mbus-readout').click(function(e) {
            e.preventDefault();
            if(serialPort.connectionId !== null) {
                $('#modal-loading').openModal({
                    dismissible: false,
                    ready: function() {
                        serialPort.mbus.performReadout(function(frame) {
                            if(frame) {
                                $('#manufacturer').removeData();

                                // console.log(frame);
                                // console.log(frame.body.get().header);

                                var hdr = frame.body.get().header;
                                var mbus = new MBus();
                                $('#manufacturer').data({
                                    'productName': mbus.productName(frame.body.get().header),
                                    'idNr': hdr.identification,
                                    'accessNo': hdr.access_no,
                                    'medium': hdr.medium,
                                    'type': hdr.type
                                });

                                var manufacturer = frame.body.get().header.manufacturer;
                                
                                var details_link = '<i class="material-icons left white-text">info</i> ';

                                if(FlagList !== undefined && FlagList.hasOwnProperty(manufacturer)) {
                                    $('#manufacturer').html(details_link + FlagList[manufacturer].company).prop('title', FlagList[manufacturer].company);
                                } else {
                                    $('#manufacturer').html(details_link + manufacturer).prop('title', manufacturer);
                                }

                                var records = frame.body.get().records;
                                for(var i=0; i<records.length;i++) {
                                    records[i].type = records[i].type.replace("VIFUnit.", "").replace("VIFUnitExt.", "").replace("VIFUnitSecExt.", "");
                                    records[i].function = records[i].function.replace("FunctionType.", "");
                                }
                                var html = Handlebars.templates['records-table.html']({records: records});
                                $('#content').html(html);
                            }

                            $('#modal-loading').closeModal();
                        });
                    }
                });
            } else {
                Materialize.toast("Connection not established", 2000);
            }
        });

        $('#btn-kmp-readout').click(function(e) {
            e.preventDefault();
            Materialize.toast('Function not implemented yet', 2000);
        });

        $('#btn-61107-readout').click(function(e) {
            e.preventDefault();
            if(serialPort.connectionId !== null) {
                $('#modal-loading').openModal({
                    dismissible: false,
                    ready: function() {
                        $('#content').html("");
                        $('#manufacturer').html("");
                        serialPort.iec61107.performReadout(function(records) {
                            if(records && records.length) {
                                var html = Handlebars.templates['iec-table.html']({records: records});
                                $('#content').html(html);
                            }
                            $('#modal-loading').closeModal();    
                        });
                    }
                });
            } else {
                Materialize.toast("Connection not established", 2000);
            }
        });

        $('#btn-dev-select').click(function(e) {
            e.preventDefault();

            var modalId = $('#btn-dev-select').data('target');

            if(serialPort.connectionId === null) {
                $('#'+modalId).openModal();

                chrome.serial.getDevices(function(ports) {
                    var eligiblePorts = ports;
                    var modalContent = $('#modal-dev-select .modal-content');
                    modalContent.empty();

                    if (eligiblePorts.length > 0) {
                        eligiblePorts.forEach(function(portObj) {
                            modalContent.append(
                                '<a class="btn-large btn btn-dev-pick transparent grey-text text-darken-3" data-path="'+portObj.path+'"><i class="material-icons left">usb</i>'+portObj.path+' ('+portObj.displayName+')</a>'
                            );
                        });
                    }

                    modalContent.find('a').click(function(e) {
                        e.preventDefault();
                        var path = $(this).data('path');
                        $('#modal-dev-select').closeModal();

                        serialPort.connect(path, function() {
                            var oncolor = $('#btn-dev-select').data('oncolor');
                            var offcolor = $('#btn-dev-select').data('offcolor');
                            $('#btn-dev-select').removeClass(offcolor).addClass(oncolor);
                            Materialize.toast('Connected', 1000);
                        });
                    })
                });
            } else {
                serialPort.disconnect(function() {
                    var oncolor = $('#btn-dev-select').data('oncolor');
                    var offcolor = $('#btn-dev-select').data('offcolor');
                    $('#btn-dev-select').removeClass(oncolor).addClass(offcolor);
                    Materialize.toast('Disconnected', 1000);
                });
            }
            
        });


        function handleFileSelect(evt) {
            var files = evt.target.files; // FileList object
            if(files.length == 0) {
                return;
            }

            var reader = new FileReader();

            // Closure to capture the file information.
            reader.onload = function(e) {
                $('#content').empty();

                var mbus = new MBus();
                try {
                    var frame = mbus.load(e.target.result);    
                } catch(err) {
                    Materialize.toast(err, 2000);
                    return;
                }
                
                var manufacturer = frame.body.get().header.manufacturer;
                var details_link = '<i class="material-icons left white-text">info</i> ';

                var hdr = frame.body.get().header;
                $('#manufacturer').data({
                    'productName': mbus.productName(frame.body.get().header),
                    'idNr': hdr.identification,
                    'accessNo': hdr.access_no,
                    'medium': hdr.medium,
                    'type': hdr.type
                });

                if(FlagList !== undefined && FlagList.hasOwnProperty(manufacturer)) {
                    $('#manufacturer').html(details_link + FlagList[manufacturer].company).prop('title', FlagList[manufacturer].company);
                } else {
                    $('#manufacturer').html(details_link + manufacturer).prop('title', manufacturer);
                }

                var records = frame.body.get().records;
                for(var i=0; i<records.length;i++) {
                    records[i].type = records[i].type.replace("VIFUnit.", "").replace("VIFUnitExt.", "").replace("VIFUnitSecExt.", "");
                    records[i].function = records[i].function.replace("FunctionType.", "");
                }
                var html = Handlebars.templates['records-table.html']({records: records});
                $('#content').html(html);
            };

            reader.readAsBinaryString(files[0]);
        }

        document.getElementById('file-selector').addEventListener('change', handleFileSelect, false);
    });
};

