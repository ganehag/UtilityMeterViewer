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

String.prototype.hexEncode = function(useArray){
    var hex, i;

    var result = useArray ? [] : "";
    for (i=0; i<this.length; i++) {
        hex = this.charCodeAt(i).toString(16);
        if(useArray) {
            result.push(("000"+hex).slice(-4));
        } else {
            result += ("000"+hex).slice(-4);
        }
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
            registers: [], // 0x3c, 0x44, 0x50, 0x56, 0x57, 0x4a
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
    settings.kmp.registers = [];
    $.each($("#settings-kmp-registers option:selected"), function(){
        settings.kmp.registers.push(parseInt($(this).val()));
    });

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
    this.kmp = new KMPProtocol(app, this);
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


window.onload = function() {
    $('document').ready(function() {
        var serialPort = null;
        var app = new Application(null, function() {
            serialPort = new SerialPort(null, this);
        });

        $('#modal-product-info').modal({
            ready: function(modal, trigger) {
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

        $('#modal-file-load').modal({
            ready: function(modal, trigger) {
            }
        });

        $('#modal-dev-select').modal({
            ready: function(modal, trigger) {

                if(serialPort.connectionId === null) {
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
                            $(modal).modal('close');

                            serialPort.connect(path, function() {
                                var oncolor = $('#btn-dev-select').data('oncolor');
                                var offcolor = $('#btn-dev-select').data('offcolor');
                                $('#btn-dev-select').removeClass(offcolor).addClass(oncolor);
                                Materialize.toast('Connected', 1000);
                            });
                        })
                    });
                }
            }
        });

        $('#modal-settings').modal({
            ready: function(modal, trigger) {
                var mbusAddr = [];
                for(var i=1; i < 255; i++) {
                    mbusAddr.push({
                        addr: i,
                        selected: i === app.options.mbus.address ? true : false
                    });
                }

                var kmp_regs = JSON.parse(JSON.stringify(KMPRegisters));
                $.each(kmp_regs, function(index, item) {
                    if(app.options.kmp.registers.indexOf(item.addr) >= 0) {
                        item.selected = true;
                    } else {
                        item.selected = false;
                    }
                });

                var mb_baud = app.options.mbus.baudrate;
                var iec_wakup = app.options.iec61107.wakeup;
                var template_data = {
                    mbus: {
                        baudrates: [
                            {value: 300, title: "300 (typical)", selected: mb_baud === 300 ? true : false},
                            {value: 600, title: "600", selected: mb_baud === 600 ? true : false},
                            {value: 1200, title: "1200", selected: mb_baud === 1200 ? true : false},
                            {value: 2400, title: "2400 (typical)", selected: mb_baud === 2400 ? true : false},
                            {value: 4800, title: "4800", selected: mb_baud === 4800 ? true : false},
                            {value: 9600, title: "9600", selected: mb_baud === 9600 ? true : false},
                            {value: 115200, title: "115200 (debug)", selected: mb_baud === 115200 ? true : false},
                        ],
                        addresses: mbusAddr,
                        optoWake: app.options.mbus.optoWake
                    },
                    kmp: {
                        registers: kmp_regs,
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

        $('#manufacturer').click(function(e) {
            e.preventDefault();

            if($(this).data()) {
                $('#modal-product-info').modal('open');
            }
        });

        $('#btn-dev-select').click(function(e) {
            e.preventDefault();

            if(serialPort.connectionId === null) {
                $('#modal-dev-select').modal('open');
            } else {
                serialPort.disconnect(function() {
                    var oncolor = $('#btn-dev-select').data('oncolor');
                    var offcolor = $('#btn-dev-select').data('offcolor');
                    $('#btn-dev-select').removeClass(oncolor).addClass(offcolor);
                    Materialize.toast('Disconnected', 1000);
                });
            }
        });

        $('#btn-mbus-readout').click(function(e) {
            e.preventDefault();
            if(serialPort.connectionId !== null) {
                $('#modal-loading').modal({
                    dismissible: false,
                    ready: function(modal, trigger) {
                        $('#content').html("");
                        $('#manufacturer').html("");

                        serialPort.mbus.performReadout(function(frame) {
                            if(frame) {
                                $('#manufacturer').removeData();

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

                            $('#modal-loading').modal('close');
                        });
                    }
                });
                $('#modal-loading').modal('open');
            } else {
                Materialize.toast("Connection not established", 2000);
            }
        });

        $('#btn-kmp-readout').click(function(e) {
            e.preventDefault();
            if(serialPort.connectionId !== null) {
                $('#modal-loading').modal({
                    dismissible: false,
                    ready: function(modal, trigger) {
                        $('#content').html("");
                        $('#manufacturer').html("");


                        // KMP4..
                        // In general, the reading is built-up according to EN61107/IEC1107, Mode A, but BCC is calculated arithmatically as on M-Bus and not as module 2-binary sum ISO1155.

                        serialPort.kmp.performReadout(function(records) {
                            if(records && records.length) {
                                $('#manufacturer').html("Kamstrup 6XX/8XX");
                                var html = Handlebars.templates['kmp-table.html']({records: records});
                                $('#content').html(html);
                            }

                            $('#modal-loading').modal('close');
                        }, app.options.kmp.registers.slice(0, 8));
                    }
                });
                $('#modal-loading').modal('open');
            } else {
                Materialize.toast("Connection not established", 2000);
            }
        });

        $('#btn-61107-readout').click(function(e) {
            e.preventDefault();
            if(serialPort.connectionId !== null) {
                $('#modal-loading').modal({
                    dismissible: false,
                    ready: function(modal, trigger) {
                        $('#content').html("");
                        $('#manufacturer').html("");
                        serialPort.iec61107.performReadout(function(records) {
                            if(records && records.length) {
                                var html = Handlebars.templates['iec-table.html']({records: records});
                                $('#content').html(html);
                            }
                            $('#modal-loading').modal('close');    
                        });
                    }
                });
                $('#modal-loading').modal('open');
            } else {
                Materialize.toast("Connection not established", 2000);
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

