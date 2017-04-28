/*
 * Constants
 */
function Constants() {
    this.MBUS_FRAME_ACK_START      = 0xE5;
    this.MBUS_FRAME_SHORT_START    = 0x10;
    this.MBUS_FRAME_CONTROL_START  = 0x68;
    this.MBUS_FRAME_LONG_START     = 0x68;
    this.MBUS_FRAME_STOP           = 0x16;

    this.MBUS_CONTROL_MASK_SND_NKE = 0x40;
    this.MBUS_CONTROL_MASK_DIR_M2S = 0x40;
    this.MBUS_CONTROL_MASK_REQ_UD2 = 0x5B;

    this.MBUS_VARIABLE_DATA_MEDIUM_OTHER = 0x00;
    this.MBUS_VARIABLE_DATA_MEDIUM_OIL = 0x01;
    this.MBUS_VARIABLE_DATA_MEDIUM_ELECTRICITY = 0x02;
    this.MBUS_VARIABLE_DATA_MEDIUM_GAS = 0x03;
    this.MBUS_VARIABLE_DATA_MEDIUM_HEAT_OUT = 0x04;
    this.MBUS_VARIABLE_DATA_MEDIUM_STEAM = 0x05;
    this.MBUS_VARIABLE_DATA_MEDIUM_HOT_WATER = 0x06;
    this.MBUS_VARIABLE_DATA_MEDIUM_WATER = 0x07;
    this.MBUS_VARIABLE_DATA_MEDIUM_HEAT_COST = 0x08;
    this.MBUS_VARIABLE_DATA_MEDIUM_COMPR_AIR = 0x09;
    this.MBUS_VARIABLE_DATA_MEDIUM_COOL_OUT = 0x0A;
    this.MBUS_VARIABLE_DATA_MEDIUM_COOL_IN = 0x0B;
    this.MBUS_VARIABLE_DATA_MEDIUM_HEAT_IN = 0x0C;
    this.MBUS_VARIABLE_DATA_MEDIUM_HEAT_COOL = 0x0D;
    this.MBUS_VARIABLE_DATA_MEDIUM_BUS = 0x0E;
    this.MBUS_VARIABLE_DATA_MEDIUM_UNKNOWN = 0x0F;
    this.MBUS_VARIABLE_DATA_MEDIUM_COLD_WATER = 0x16;
    this.MBUS_VARIABLE_DATA_MEDIUM_DUAL_WATER = 0x17;
    this.MBUS_VARIABLE_DATA_MEDIUM_PRESSURE = 0x18;
    this.MBUS_VARIABLE_DATA_MEDIUM_ADC = 0x19;
};


/*
 * TelegramField
 */
function TelegramField(parts) {
    this.parts = [];
    this.setParts(parts);
}
TelegramField.prototype.setParts = function(parts) {
    if(parts !== null && parts !== undefined) {
        if(Array.isArray(parts)) {
            this.parts = parts;
        } else {
            this.parts = [parts];
        }
    }
};
TelegramField.prototype.decodeInt = function() {
    var int_data = this.parts;
    var value = 0;
    var neg = int_data[-1] & 0x80;
    var i = int_data.length;

    while(i > 0) {
        if(neg) {
            value = (value << 8) + (int_data[i - 1] ^ 0xFF);
        } else {
            value = (value << 8) + int_data[i - 1];
        }

        i--;
    }

    if(neg) {
        value = (value * -1) - 1;
    }

    return value;
};
TelegramField.prototype.decodeBCD = function() {
    var bcd_data = this.parts;
    var val = 0;
    var i = bcd_data.length;
    while(i > 0) {
        val = (val * 10) + ((bcd_data[i-1] >> 4) & 0xF);
        val = (val * 10) + (bcd_data[i-1] & 0xF);
        i--;
    }

    return val;
};
TelegramField.prototype.decodeReal = function() {

    var De754 = function (a, p) {
        var s, e, m, i, d, nBits, mLen, eLen, eBias, eMax;
        var bBE = false; // Not sure if encoded LE or BE...?
        var el = {len: 4, mLen: 23, rt: Math.pow(2, -24) - Math.pow(2, -77)};
        mLen = el.mLen, eLen = el.len*8-el.mLen-1, eMax = (1<<eLen)-1, eBias = eMax>>1;

        i = bBE?0:(el.len-1); d = bBE?1:-1; s = a[p+i]; i+=d; nBits = -7;
        for (e = s&((1<<(-nBits))-1), s>>=(-nBits), nBits += eLen; nBits > 0; e=e*256+a[p+i], i+=d, nBits-=8);
        for (m = e&((1<<(-nBits))-1), e>>=(-nBits), nBits += mLen; nBits > 0; m=m*256+a[p+i], i+=d, nBits-=8);

        switch (e) {
        case 0:
          // Zero, or denormalized number
          e = 1-eBias;
          break;
        case eMax:
          // NaN, or +/-Infinity
          return m?NaN:((s?-1:1)*Infinity);
        default:
          // Normalized number
          m = m + Math.pow(2, mLen);
          e = e - eBias;
          break;
        }
        return (s?-1:1) * m * Math.pow(2, e-mLen);
  };

  return De754(this.parts, 0);
};
TelegramField.prototype.decodeManufacturer = function() {
    var m_id = this.decodeInt();
    return String.fromCharCode(((m_id >> 10) & 0x001F) + 64) + 
        String.fromCharCode(((m_id >> 5) & 0x001F) + 64) + 
        String.fromCharCode(((m_id) & 0x001F) + 64);
};
TelegramField.prototype.decodeASCII = function() {
    return this.parts.reverse().map(function(item) {
        return String.fromCharCode(item);
    }).join("");
};
TelegramField.prototype.decodeDate = function() {
    var dc = new DateCalculator();
    return dc.getDate(this.parts[0], this.parts[1], false);
};
TelegramField.prototype.decodeDateTime = function() {
    var dc = new DateCalculator();
    return dc.getDateTime(this.parts[0], this.parts[1], this.parts[2], this.parts[3], false);
};
TelegramField.prototype.decodeTimeWithSeconds = function() {
    var dc = new DateCalculator();
    return dc.getTimeWithSeconds(this.parts[0], this.parts[1], this.parts[2]);
};
TelegramField.prototype.decodeDateTimeWithSeconds = function() {
    var dc = new DateCalculator();
    return dc.getDateTimeWithSeconds(this.parts[0], this.parts[1], this.parts[2], this.parts[3], this.parts[4], false);
};


/*
 * TelegramHeader
 */
function TelegramHeader() {
    this.startField = new TelegramField();
    this.lField = new TelegramField();
    this.cField = new TelegramField();
    this.aField = new TelegramField();
    this.crcField = new TelegramField();
    this.stopField = new TelegramField();

    this.headerLength = 6;
    this.headerLengthCRCStop = 8;
}
TelegramHeader.prototype.load = function(data) {
    if(data.length == 8) {
        this.startField.setParts(data[0]);
        this.lField.setParts(data[1]);
        // this.lField.setParts(data[2]); // Skip
        // this.startField.setParts(data[3]); // Skip
        this.cField.setParts(data[4]);
        this.aField.setParts(data[5]);
        this.crcField.setParts(data[data.length - 2]);
        this.stopField.setParts(data[data.length - 1]);
    } else if(data.length == 5) {
        this.startField.setParts(data[0]);
        this.cField.setParts(data[1]);
        this.aField.setParts(data[2]);
        this.crcField.setParts(data[data.length - 2]);
        this.stopField.setParts(data[data.length - 1]);
    }
}
TelegramHeader.prototype.get = function() {
    return {
        start: this.startField.parts,
        length: this.lField.parts,
        c: this.cField.parts,
        a: this.aField.parts,
        crc: this.crcField.parts,
        stop: this.stopField.parts
    }
};
TelegramHeader.prototype.parse = function(data) {
    if(data) {
        this.load(data);
    }
};


/*
 * TelegramBodyHeader
 */
function TelegramBodyHeader() {
    this.BYTE_ORDER_MASK = 0x04 // 0000 0100

    this.ci_field = new TelegramField();              // control information field
    this.id_nr_field = new TelegramField();           // identification number field
    this.manufacturer_field = new TelegramField();    // manufacturer
    this.version_field = new TelegramField();         // version
    this.measure_medium_field = new TelegramField();  // measured medium
    this.acc_nr_field = new TelegramField();          // access number
    this.status_field = new TelegramField();          // status
    this.sig_field = new TelegramField();             // signature field
}
TelegramBodyHeader.prototype.load = function(data) {
    if(data.length === 1) {
        this.ci_field.setParts(data[0]);
    } else {
        this.ci_field.setParts(data[0]);
        this.id_nr_field.setParts(data.slice(1, 5));
        this.manufacturer_field.setParts(data.slice(5, 7));
        this.version_field.setParts(data[7]);
        this.measure_medium_field.setParts(data[8]);
        this.acc_nr_field.setParts(data[9]);
        this.status_field.setParts(data[10]);
        this.sig_field.setParts(data.slice(11, 13));
        if(!this.isLSBOrder()) {
            this.id_nr_field.setParts(this.id_nr_field.parts.reverse());
            this.manufacturer_field.setParts(this.manufacturer_field.parts.reverse());
            this.sig_field.setParts(this.sig_field.parts.reverse());
        }
    }
};
TelegramBodyHeader.prototype.getIdNr = function() {
    return this.id_nr_field.decodeBCD();
    // return this.id_nr_field.parts.reverse();
};
TelegramBodyHeader.prototype.isLSBOrder = function() {
    return ! (this.ci_field.parts[0] & this.BYTE_ORDER_MASK);
};
TelegramBodyHeader.prototype.get = function() {
    return {
        type: this.ci_field.parts[0],
        identification: this.getIdNr(),
        manufacturer: this.manufacturer_field.decodeManufacturer(),
        version: this.version_field.parts[0],
        medium: this.measure_medium_field.parts[0],
        access_no: this.acc_nr_field.parts[0],
        sign: this.sig_field.parts
    };
};


/*
 * TelegramBodyPayload
 */
function TelegramBodyPayload(payload, parent) {
    if(payload !== null && payload != undefined) {
        this.body = new TelegramField(payload);
    } else {
        this.body = new TelegramField();
    }
    this.records = [];
    this.parent = parent;
};
TelegramBodyPayload.prototype.get = function() {
    var trec = this.records;

    return {
        records: (function() {
            if(!trec) {
                return [];
            }
            var r = [];
            var i;
            for(i = 0; i < trec.length; i++) {
                r.push(trec[i].get());
            }
            return r;
        })()
    }
}
TelegramBodyPayload.prototype.load = function(data) {
    this.body = new TelegramField(data);
};
TelegramBodyPayload.prototype.parse = function() {
    this.records = [];
    var recordPos = 0;

    try {
        while(recordPos < this.body.parts.length) {
            recordPos = this.parseVariableDataRec(recordPos);
        }
    } catch(err) {
        throw err;
    }
};
TelegramBodyPayload.prototype.parseVariableDataRec = function(startPos) {
    var lowerBound = 0;
    var upperBound = 0;
    var i = 0;

    var rec = new TelegramVariableDataRecord();

    rec.dib.parts.push(this.body.parts[startPos]);

    if(rec.dib.isEOUD()) { // End of User Data
        return this.body.parts.length;
    } else if(rec.dib.functionType() == FunctionType.SPECIAL_FUNCTION_FILL_BYTE) {
        return startPos + 1;
    }

    if(rec.dib.hasExtensionBit()) {
        var slice = this.body.parts.slice(startPos+1);
        for(i=0; i < slice.length; i++) {
            rec.dib.parts.push(slice[i]);

            if(! rec.dib.hasExtensionBit()) {
                break;
            }
        }
    }

    try {
        rec.vib.parts.push(this.body.parts[startPos + rec.dib.parts.length]);
    } catch(err) {
        // Hmmm....
    }

    if(rec.vib.withoutExtensionBit()) {
        var lvext_p = startPos + rec.dib.parts.length + rec.vib.parts.length;
        var vife_len = this.body.parts[lvext_p];

        rec.vib.customVIF.parts = this.body.parts.slice(lvext_p + 1, lvext_p +1 + vife_len);
    }

    if(rec.vib.hasExtensionBit()) {
        var slice = this.body.parts.slice(startPos + 1 + rec.vib.withoutExtensionBit() + rec.dib.parts.length + rec.vib.customVIF.parts.length);
        for(i=0; i < slice.length; i++) {
            rec.vib.parts.push(slice[i]);

            if(! rec.vib.hasExtensionBit()) {
                break;
            }
        }
    }

    lowerBound = startPos + rec.vib.withoutExtensionBit() + rec.dib.parts.length + rec.vib.customVIF.parts.length + rec.vib.parts.length;
    var lobj = rec.dib.lengthEncoding();
    var length = lobj.length;
    var encoding = lobj.encoding;

    if(encoding == DataEncoding.ENCODING_VARIABLE_LENGTH) {
        length = this.body.parts[lowerBound];
        lowerBound++;
    }

    upperBound = lowerBound + length;

    if(length == 0) {
        return upperBound;
    }

    if(this.body.parts.length >= upperBound) {
        var dataField = new TelegramField();
        dataField.parts = dataField.parts.concat(this.body.parts.slice(lowerBound, upperBound));

        if(! this.parent.header.isLSBOrder()) {
            dataField.parts = dataField.parts.reverse();
        }

        rec.dataField = dataField;
    }

    this.records.push(rec);

    return upperBound;
};


/*
 * TelegramVariableDataRecord
 */
function TelegramVariableDataRecord() {
    this.UNIT_MULTIPLIER_MASK = 0x7F;    // 0111 1111
    this.EXTENSION_BIT_MASK   = 0x80     // 1000 0000

    this.dib = new DataInformationBlock();
    this.vib = new ValueInformationBlock();

    this.dataField = new TelegramField();
}
TelegramVariableDataRecord.prototype.parseVifx = function() {
    var robj = {
        factor: null,
        unit: null,
        type: null
    };

    if(this.vib.parts.length === 0) {
        return robj;
    }

    var code = null;
    var vif = this.vib.parts[0];
    var vife = this.vib.parts.slice(1);
    var vtf_ebm = this.EXTENSION_BIT_MASK;

    if(vif == VIFUnit.FIRST_EXT_VIF_CODES.value) {
        code = (vife[0] & this.UNIT_MULTIPLIER_MASK) | 0x200;

    } else if(vif == VIFUnit.SECOND_EXT_VIF_CODES.value) {
        code = (vife[0] & this.UNIT_MULTIPLIER_MASK) | 0x100;

    } else if([VIFUnit.VIF_FOLLOWING.value, 0xFC].indexOf(vif) !== -1) {
        if(vif & vtf_ebm) {
            code = vife[0] & this.UNIT_MULTIPLIER_MASK;
            robj.factor = 1;

            if (0x70 <= code && code <= 0x77) {
                robj.factor = Math.pow(10.0, (vife[0] & 0x07) - 6);
            } else if(0x78 <= code && code <= 0x7B) {
                robj.factor = Math.pow(10.0, (vife[0] & 0x03) - 3);
            } else if(code == 0x7D) {
                robj.factor = 1;
            }

            robj.unit = this.vib.customVIF.decodeASCII();
            robj.type = VIFUnit.VARIABLE_VIF;

            return robj;
        }
    } else if(vif == VIFUnit.VIF_FOLLOWING.value) {
        return {
            factor: 1,
            unit: "FixMe",
            type: "FixMe"
        }
    } else {
        code = (vif & this.UNIT_MULTIPLIER_MASK);
    }

    var vtl = VIFTable.lut[code];

    if(vtl === undefined) {
        return {
            factor: 0,
            unit: "FixMe",
            type: "FixMe"
        };
    }

    return {
        factor: vtl[0],
        unit: vtl[1],
        type: vtl[2]
    };
};
TelegramVariableDataRecord.prototype.getUnit = function() {
    var r = this.parseVifx();
    return r.unit;
};
TelegramVariableDataRecord.prototype.parsedValue = function() {
    var robj = this.parseVifx();
    var lobj = this.dib.lengthEncoding();
    var retval = null;

    if(lobj.length !== this.dataField.parts.length) {
        return null;
    }

    switch(robj.unit) {
        case MeasureUnit.Data:
            // Type G: Day.Month.Year
            retval = this.dataField.decodeDate();
        break;
        case MeasureUnit.DATE_TIME:
            // Type F: Day.Month.Year Hour:Minute    
            retval = this.dataField.decodeDateTime();
        break;
        case MeasureUnit.TIME:
            retval = this.dataField.decodeTimeWithSeconds();
        break;
        case MeasureUnit.DATE_TIME_S:
            retval = this.dataField.decodeDateTimeWithSeconds();
        break;
        case MeasureUnit.DBM: 
            retval = (parseInt(this.dataField.decodeInt()) * 2) - 130;
        break;
    }

    if(retval === null) {
        switch(lobj.encoding) {
            case DataEncoding.ENCODING_INTEGER:
                retval = robj.factor > 1.0 ? parseInt(this.dataField.decodeInt() * robj.factor) : this.dataField.decodeInt() * robj.factor;
            break;

            case DataEncoding.ENCODING_BCD:
                retval = parseFloat(this.dataField.decodeBCD() * robj.factor);
            break;

            case DataEncoding.ENCODING_REAL:
                retval = parseFloat(this.dataField.decodeReal() * robj.factor);
            break;

            case DataEncoding.ENCODING_VARIABLE_LENGTH:
                retval = this.dataField.decodeASCII();
            break;

            case DataEncoding.ENCODING_NULL:
                retval = null;
            break;
        }
    }
    
    return retval;
};
TelegramVariableDataRecord.prototype.get = function() {
    var robj = this.parseVifx();
    return {
        value: this.parsedValue(),
        unit: robj.unit,
        type: robj.type.toString(),
        function: this.dib.functionType().toString(),
    };
};


/*
 * DataInformationBlock
 */
function DataInformationBlock() {
    TelegramField.call(this);
    this.EXTENSION_BIT_MASK = 0x80;      // 1000 0000
    this.FUNCTION_MASK      = 0x30;      // 0011 0000
    this.DATA_FIELD_MASK    = 0x0F;      // 0000 1111
}
DataInformationBlock.prototype = Object.create(TelegramField.prototype);
DataInformationBlock.prototype.hasExtensionBit = function() {
    // Check for extension bit on last byte
    return this.parts.length ? (this.parts[this.parts.length-1] & this.EXTENSION_BIT_MASK) > 0 : false;
};
DataInformationBlock.prototype.hasLVarBit = function() {
    // returns true if first VIFE has LVAR active
    return this.parts.length > 1 ? (this.parts[1] & this.EXTENSION_BIT_MASK) > 0 : false;
};
DataInformationBlock.prototype.isEOUD= function() {
    // Check for end of user data bit VIF byte
    return this.parts.length ? ([0x0F, 0x1F]).indexOf(this.parts[0]) !== -1 : false;
};
DataInformationBlock.prototype.functionType = function() {
    var rval = null;

    if(this.parts[0] == 0x0F) {
        rval = FunctionType.SPECIAL_FUNCTION;

    } else if(this.parts[0] == 0x2F) {
        rval = FunctionType.SPECIAL_FUNCTION_FILL_BYTE;
    } else {
        rval = FunctionType.find((this.parts[0] & this.FUNCTION_MASK) >> 4);    
    }

    return rval;
};
DataInformationBlock.prototype.lengthEncoding = function() {
    var len_enc = this.parts[0] & this.DATA_FIELD_MASK;
    var len_enc_arr = ({
        0: [0, DataEncoding.ENCODING_NULL],
        1: [len_enc, DataEncoding.ENCODING_INTEGER],
        2: [len_enc, DataEncoding.ENCODING_INTEGER],
        3: [len_enc, DataEncoding.ENCODING_INTEGER],
        4: [len_enc, DataEncoding.ENCODING_INTEGER],
        5: [4, DataEncoding.ENCODING_REAL],
        6: [6, DataEncoding.ENCODING_INTEGER],
        7: [8, DataEncoding.ENCODING_INTEGER],
        8: [0, DataEncoding.ENCODING_NULL],
        9: [len_enc - 8, DataEncoding.ENCODING_BCD],
        10: [len_enc - 8, DataEncoding.ENCODING_BCD],
        11: [len_enc - 8, DataEncoding.ENCODING_BCD],
        12: [len_enc - 8, DataEncoding.ENCODING_BCD],
        13: [6, DataEncoding.ENCODING_VARIABLE_LENGTH],
        14: [6, DataEncoding.ENCODING_BCD],
        15: [0, DataEncoding.ENCODING_NULL]  // Not right FIXME
    })[this.parts[0] & this.DATA_FIELD_MASK];

    return {
        length: len_enc_arr[0],
        encoding: len_enc_arr[1]
    };
};

/*
 * ValueInformationBlock
 */
function ValueInformationBlock() {
    TelegramField.call(this);

    this.EXTENSION_BIT_MASK = 0x80;           // 1000 0000
    this.WITHOUT_EXTENSION_BIT_MASK = 0x7F;   // 0111 1111

    this.customVIF = new TelegramField();
}
ValueInformationBlock.prototype = Object.create(TelegramField.prototype);
ValueInformationBlock.prototype.hasExtensionBit = function() {
    return this.parts.length ? (this.parts[this.parts.length-1] & this.EXTENSION_BIT_MASK) > 0 : false;
};
ValueInformationBlock.prototype.withoutExtensionBit = function() {
    return this.parts.length ? (this.parts[0] & this.WITHOUT_EXTENSION_BIT_MASK) === 0x7C : false;
};
ValueInformationBlock.prototype.hasLVarBit = function() {
    return this.parts.length > 1 ? (this.parts[1] & this.EXTENSION_BIT_MASK) > 0 : false;
};


/*
 * TelegramBody
 */
function TelegramBody(dbuf) {
    this.header = new TelegramBodyHeader();
    this.payload = new TelegramBodyPayload(null, this);
    this.headerLength = 13;
}
TelegramBody.prototype.get = function() {
    return {
        header: this.header.get(),
        records: this.payload.get().records
    };
};
TelegramBody.prototype.load = function(data) {
    this.header.load(data.slice(0, this.headerLength));
    this.payload.load(data.slice(this.headerLength));

    this.payload.parse();
};


/*
 * TelegramACK
 */
function TelegramACK() {
    this.base_size = 1;
    this.type = 0xE5;
}
TelegramACK.prototype.parse = function(data) {
    if(data.length && data[0] !== 0xE5) {
        throw "Frame Mismatch";
    }

    if(data && data.length < 1) {
        throw "Invalid M-Bus length";
    }
};


/*
 * TelegramLong
 */
function TelegramLong() {
    this.header = new TelegramHeader();
    this.body = new TelegramBody();
}
TelegramLong.prototype.get = function() {
    return {
        header: this.header.get(),
        body: this.body.get()
    };
};
TelegramLong.prototype.parse = function(data) {
    if(data[0] !== 0x68) {
        throw "Frame Mismatch"
    }

    if(data && data.length < 9) {
        throw "Invalid M-Bus length";
    }

    var tgr = data;
    var hLen = this.header.headerLength;
    var firstHeader = tgr.slice(0, hLen);

    var resultHeader = firstHeader.concat(tgr.slice(-2));
    this.header.load(resultHeader);

    if(this.header.lField.parts[0] < 3) {
        throw "Invalid M-Bus length value";
    }

    this.body.load(tgr.slice(hLen,-2))
/*
        if not self.check_crc():
            raise MBusFrameCRCError(self.compute_crc(),
                                    self.header.crcField.parts[0])
*/
};


/*
 * TelegramShort
 */
function TelegramShort() {
    this.header = new TelegramHeader();
}
TelegramShort.prototype.compute_crc = function() {
    return (this.header.cField.parts[0] + this.header.aField.parts[0]) % 256;
};
TelegramShort.prototype.check_crc = function() {
    return this.compute_crc() === this.header.crcField.parts[0];
};
TelegramShort.prototype.parse = function(data) {
    if(data.length && data[0] !== 0x10) {
        throw "Frame Mismatch"
    }

    if(data && data.length < 5) {
        throw "Invalid M-Bus length";
    }

    this.header.load(data);
    if(!this.check_crc()) {
        throw "CRC Error";
    }
};
TelegramShort.prototype.toString = function() {
    return "\x10" + String.fromCharCode(this.header.cField.parts[0]) + String.fromCharCode(this.header.aField.parts[0]) + String.fromCharCode(this.compute_crc()) + "\x16";
};



const MeasureUnit = {
    KWH: "kWh",
    WH: "WH",
    J: "J",
    M3: "m^3",
    L: "l",
    KG: "kg",
    W: "W",
    J_H: "J/h",
    M3_H: "m^3/h",
    M3_MIN: "m^3/min",
    M3_S: "m^3/s",
    KG_H: "kg/h",
    C: "C",
    K: "K",
    BAR: "bar",
    DATE: "date",
    TIME: "time",
    DATE_TIME: "date time",
    DATE_TIME_S: "date time to second",
    SECONDS: "seconds",
    MINUTES: "minutes",
    HOURS: "hours",
    DAYS: "days",
    NONE: "none",
    V: "V",
    A: "A",
    HCA: "H.C.A",
    CURRENCY: "Currency unit",
    BAUD: "Baud",
    BIT_TIMES: "Bittimes",
    PERCENT: "%",
    DBM: "dBm"
}

var FunctionType = function(name, value) {
    this.name = name;
    this.value = value;
};
FunctionType.prototype.toString = function() {
    return "FunctionType." + this.name;
};
FunctionType.find = function(value) {
    for (var key in this) {
        if(!this.hasOwnProperty(key)) {
            continue;
        }
        if(this[key].value === value) {
            return this[key];
        }
    }
    return null;
};
FunctionType.INSTANTANEOUS_VALUE = new FunctionType("INSTANTANEOUS_VALUE", 0);
FunctionType.MAXIMUM_VALUE = new FunctionType("MAXIMUM_VALUE", 1);
FunctionType.MINIMUM_VALUE = new FunctionType("MINIMUM_VALUE", 2);
FunctionType.ERROR_STATE_VALUE = new FunctionType("ERROR_STATE_VALUE", 3);
FunctionType.SPECIAL_FUNCTION = new FunctionType("SPECIAL_FUNCTION", 4);
FunctionType.SPECIAL_FUNCTION_FILL_BYTE = new FunctionType("SPECIAL_FUNCTION_FILL_BYTE", 5);


const DataEncoding = {
    ENCODING_NULL: 0,
    ENCODING_INTEGER: 1,
    ENCODING_REAL: 2,
    ENCODING_BCD: 3,
    ENCODING_VARIABLE_LENGTH: 4
}

var VIFUnit = function(name, value) {
    this.name = name;
    this.value = value;
};
VIFUnit.prototype.toString = function() {
    return "VIFUnit." + this.name;
};
VIFUnit.ENERGY_WH = new VIFUnit("ENERGY_WH", 0x07); // E000 0xxx
VIFUnit.ENERGY_J = new VIFUnit("ENERGY_J", 0x0F);  // E000 1xxx
VIFUnit.VOLUME = new VIFUnit("VOLUME", 0x17);  // E001 0xxx
VIFUnit.MASS = new VIFUnit("MASS", 0x1F);  // E001 1xxx
VIFUnit.ON_TIME = new VIFUnit("ON_TIME", 0x23);  // E010 00xx
VIFUnit.OPERATING_TIME = new VIFUnit("OPERATING_TIME", 0x27);  // E010 01xx
VIFUnit.POWER_W = new VIFUnit("POWER_W", 0x2F);  // E010 1xxx
VIFUnit.POWER_J_H = new VIFUnit("POWER_J_H", 0x37);  // E011 0xxx
VIFUnit.VOLUME_FLOW = new VIFUnit("VOLUME_FLOW", 0x3F);  // E011 1xxx
VIFUnit.VOLUME_FLOW_EXT = new VIFUnit("VOLUME_FLOW_EXT", 0x47);  // E100 0xxx
VIFUnit.VOLUME_FLOW_EXT_S = new VIFUnit("VOLUME_FLOW_EXT_S", 0x4F);  // E100 1xxx
VIFUnit.MASS_FLOW = new VIFUnit("MASS_FLOW", 0x57);  // E101 0xxx
VIFUnit.FLOW_TEMPERATURE = new VIFUnit("FLOW_TEMPERATURE", 0x5B);  // E101 10xx
VIFUnit.RETURN_TEMPERATURE = new VIFUnit("RETURN_TEMPERATURE", 0x5F);  // E101 11xx
VIFUnit.TEMPERATURE_DIFFERENCE = new VIFUnit("TEMPERATURE_DIFFERENCE", 0x63);  // E110 00xx
VIFUnit.EXTERNAL_TEMPERATURE = new VIFUnit("EXTERNAL_TEMPERATURE", 0x67);  // E110 01xx
VIFUnit.PRESSURE = new VIFUnit("PRESSURE", 0x6B);  // E110 10xx
VIFUnit.DATE = new VIFUnit("DATE", 0x6C);  // E110 1100
VIFUnit.DATE_TIME_GENERAL = new VIFUnit("DATE_TIME_GENERAL", 0x6D);  // E110 1101
VIFUnit.DATE_TIME = new VIFUnit("DATE_TIME", 0x6D);  // E110 1101
VIFUnit.EXTENTED_TIME = new VIFUnit("EXTENTED_TIME", 0x6D);  // E110 1101
VIFUnit.EXTENTED_DATE_TIME = new VIFUnit("EXTENTED_DATE_TIME", 0x6D);  // E110 1101
VIFUnit.UNITS_FOR_HCA = new VIFUnit("UNITS_FOR_HCA", 0x6E);  // E110 1110
VIFUnit.RES_THIRD_VIFE_TABLE = new VIFUnit("RES_THIRD_VIFE_TABLE", 0x6F);  // E110 1111
VIFUnit.AVG_DURATION = new VIFUnit("AVG_DURATION", 0x73);  // E111 00xx
VIFUnit.ACTUALITY_DURATION = new VIFUnit("ACTUALITY_DURATION", 0x77);  // E111 01xx
VIFUnit.FABRICATION_NO = new VIFUnit("FABRICATION_NO", 0x78);  // E111 1000
VIFUnit.IDENTIFICATION = new VIFUnit("IDENTIFICATION", 0x79);  // E111 1001
VIFUnit.ADDRESS = new VIFUnit("ADDRESS", 0x7A);  // E111 1010

// NOT THE ONES FOR SPECIAL PURPOSES
VIFUnit.FIRST_EXT_VIF_CODES = new VIFUnit("FIRST_EXT_VIF_CODES", 0xFB);  // 1111 1011
VIFUnit.VARIABLE_VIF = new VIFUnit("VARIABLE_VIF", 0xFC);  // E111 1111
VIFUnit.VIF_FOLLOWING = new VIFUnit("VIF_FOLLOWING", 0x7C);  // E111 1100
VIFUnit.SECOND_EXT_VIF_CODES = new VIFUnit("SECOND_EXT_VIF_CODES", 0xFD);  // 1111 1101
VIFUnit.THIRD_EXT_VIF_CODES_RES = new VIFUnit("THIRD_EXT_VIF_CODES_RES", 0xEF);  // 1110 1111
VIFUnit.ANY_VIF = new VIFUnit("ANY_VIF", 0x7E);  // E111 1110
VIFUnit.MANUFACTURER_SPEC = new VIFUnit("MANUFACTURER_SPEC", 0x7F);  // E111 1111

var VIFUnitExt = function(name, value) {
    this.name = name;
    this.value = value;
};
VIFUnitExt.prototype.toString = function() {
    return "VIFUnitExt." + this.name;
};
// Currency Units
VIFUnitExt.CURRENCY_CREDIT = new VIFUnitExt("CURRENCY_CREDIT", 0x03);  // E000 00nn Credit of 10 nn-3 of the nominal ...
VIFUnitExt.CURRENCY_DEBIT = new VIFUnitExt("CURRENCY_DEBIT", 0x07);  // E000 01nn Debit of 10 nn-3 of the nominal ...
// Enhanced Identification
VIFUnitExt.ACCESS_NUMBER = new VIFUnitExt("ACCESS_NUMBER", 0x08);  // E000 1000 Access Number [transmission count]
VIFUnitExt.MEDIUM = new VIFUnitExt("MEDIUM", 0x09);  // E000 1001 Medium [as in fixed header]
VIFUnitExt.MANUFACTURER = new VIFUnitExt("MANUFACTURER", 0x0A);  // E000 1010 Manufacturer [as in fixed header]
VIFUnitExt.PARAMETER_SET_ID = new VIFUnitExt("PARAMETER_SET_ID", 0x0B);  // E000 1011 Parameter set identification Enha ...
VIFUnitExt.MODEL_VERSION = new VIFUnitExt("MODEL_VERSION", 0x0C);  // E000 1100 Model / Version
VIFUnitExt.HARDWARE_VERSION = new VIFUnitExt("HARDWARE_VERSION", 0x0D);  // E000 1101 Hardware version //
VIFUnitExt.FIRMWARE_VERSION = new VIFUnitExt("FIRMWARE_VERSION", 0x0E);  // E000 1110 Firmware version //
VIFUnitExt.SOFTWARE_VERSION = new VIFUnitExt("SOFTWARE_VERSION", 0x0F);  // E000 1111 Software version //
// Implementation of all TC294 WG1 requirements [improved selection ..]
VIFUnitExt.CUSTOMER_LOCATION = new VIFUnitExt("CUSTOMER_LOCATION", 0x10);  // E001 0000 Customer location
VIFUnitExt.CUSTOMER = new VIFUnitExt("CUSTOMER", 0x11);  // E001 0001 Customer
VIFUnitExt.ACCESS_CODE_USER = new VIFUnitExt("ACCESS_CODE_USER", 0x12);  // E001 0010 Access Code User
VIFUnitExt.ACCESS_CODE_OPERATOR = new VIFUnitExt("ACCESS_CODE_OPERATOR", 0x13);  // E001 0011 Access Code Operator
VIFUnitExt.ACCESS_CODE_SYSTEM_OPERATOR = new VIFUnitExt("ACCESS_CODE_SYSTEM_OPERATOR", 0x14);  // E001 0100 Access Code System Operator
VIFUnitExt.ACCESS_CODE_DEVELOPER = new VIFUnitExt("ACCESS_CODE_DEVELOPER", 0x15);  // E001 0101 Access Code Developer
VIFUnitExt.PASSWORD = new VIFUnitExt("PASSWORD", 0x16);  // E001 0110 Password
VIFUnitExt.ERROR_FLAGS = new VIFUnitExt("ERROR_FLAGS", 0x17);  // E001 0111 Error flags [binary]
VIFUnitExt.ERROR_MASKS = new VIFUnitExt("ERROR_MASKS", 0x18);  // E001 1000 Error mask
VIFUnitExt.RESERVED = new VIFUnitExt("RESERVED", 0x19);  // E001 1001 Reserved
VIFUnitExt.DIGITAL_OUTPUT = new VIFUnitExt("DIGITAL_OUTPUT", 0x1A);  // E001 1010 Digital Output [binary]
VIFUnitExt.DIGITAL_INPUT = new VIFUnitExt("DIGITAL_INPUT", 0x1B);  // E001 1011 Digital Input [binary]
VIFUnitExt.BAUDRATE = new VIFUnitExt("BAUDRATE", 0x1C);  // E001 1100 Baudrate [Baud]
VIFUnitExt.RESPONSE_DELAY = new VIFUnitExt("RESPONSE_DELAY", 0x1D);  // E001 1101 response delay time
VIFUnitExt.RETRY = new VIFUnitExt("RETRY", 0x1E);  // E001 1110 Retry
VIFUnitExt.RESERVED_2 = new VIFUnitExt("RESERVED_2", 0x1F);  // E001 1111 Reserved
// Enhanced storage management
VIFUnitExt.FIRST_STORAGE_NR = new VIFUnitExt("FIRST_STORAGE_NR", 0x20);  // E010 0000 First storage
VIFUnitExt.LAST_STORAGE_NR = new VIFUnitExt("LAST_STORAGE_NR", 0x21);  // E010 0001 Last storage
VIFUnitExt.SIZE_OF_STORAGE_BLOCK = new VIFUnitExt("SIZE_OF_STORAGE_BLOCK", 0x22);  // E010 0010 Size of storage block
VIFUnitExt.RESERVED_3 = new VIFUnitExt("RESERVED_3", 0x23);  // E010 0011 Reserved
VIFUnitExt.STORAGE_INTERVAL = new VIFUnitExt("STORAGE_INTERVAL", 0x27);  // E010 01nn Storage interval
VIFUnitExt.STORAGE_INTERVAL_MONTH = new VIFUnitExt("STORAGE_INTERVAL_MONTH", 0x28);  // E010 1000 Storage interval month[s]
VIFUnitExt.STORAGE_INTERVAL_YEARS = new VIFUnitExt("STORAGE_INTERVAL_YEARS", 0x29);  // E010 1001 Storage interval year[s]
// E010 1010 Reserved
// E010 1011 Reserved
VIFUnitExt.DURATION_SINCE_LAST_READOUT = new VIFUnitExt("DURATION_SINCE_LAST_READOUT", 0x2F);  // E010 11nn Duration since last ...
//  Enhanced tarif management
VIFUnitExt.START_OF_TARIFF = new VIFUnitExt("START_OF_TARIFF", 0x30);  // E011 0000 Start [date/time] of tariff
VIFUnitExt.DURATION_OF_TARIFF = new VIFUnitExt("DURATION_OF_TARIFF", 0x3);  // E011 00nn Duration of tariff
VIFUnitExt.PERIOD_OF_TARIFF = new VIFUnitExt("PERIOD_OF_TARIFF", 0x37);  // E011 01nn Period of tariff
VIFUnitExt.PERIOD_OF_TARIFF_MONTH = new VIFUnitExt("PERIOD_OF_TARIFF_MONTH", 0x38);  // E011 1000 Period of tariff months[s]
VIFUnitExt.PERIOD_OF_TARIFF_YEARS = new VIFUnitExt("PERIOD_OF_TARIFF_YEARS", 0x39);  // E011 1001 Period of tariff year[s]
VIFUnitExt.DIMENSIONLESS = new VIFUnitExt("DIMENSIONLESS", 0x3A);  // E011 1010 dimensionless / no VIF
// E011 1011 Reserved
// E011 11xx Reserved
// Electrical units
VIFUnitExt.VOLTS = new VIFUnitExt("VOLTS", 0x4F);  // E100 nnnn 10 nnnn-9 Volts
VIFUnitExt.AMPERE = new VIFUnitExt("AMPERE", 0x5F);  // E101 nnnn 10 nnnn-12 A
VIFUnitExt.RESET_COUNTER = new VIFUnitExt("RESET_COUNTER", 0x60);  // E110 0000 Reset counter
VIFUnitExt.CUMULATION_COUNTER = new VIFUnitExt("CUMULATION_COUNTER", 0x61);  // E110 0001 Cumulation counter
VIFUnitExt.CONTROL_SIGNAL = new VIFUnitExt("CONTROL_SIGNAL", 0x62);  // E110 0010 Control signal
VIFUnitExt.DAY_OF_WEEK = new VIFUnitExt("DAY_OF_WEEK", 0x63);  // E110 0011 Day of week
VIFUnitExt.WEEK_NUMBER = new VIFUnitExt("WEEK_NUMBER", 0x64);  // E110 0100 Week number
VIFUnitExt.TIME_POINT_OF_DAY_CHANGE = new VIFUnitExt("TIME_POINT_OF_DAY_CHANGE", 0x65);  // E110 0101 Time point of day ...
VIFUnitExt.STATE_OF_PARAMETER_ACTIVATION = new VIFUnitExt("STATE_OF_PARAMETER_ACTIVATION", 0x66);  // E110 0110 State of parameter
VIFUnitExt.SPECIAL_SUPPLIER_INFORMATION = new VIFUnitExt("SPECIAL_SUPPLIER_INFORMATION", 0x67);  // E110 0111 Special supplier ...
VIFUnitExt.DURATION_SINCE_LAST_CUMULATION = new VIFUnitExt("DURATION_SINCE_LAST_CUMULATION", 0x6B);  // E110 10pp Duration since last
VIFUnitExt.OPERATING_TIME_BATTERY = new VIFUnitExt("OPERATING_TIME_BATTERY", 0x6F);  // E110 11pp Operating time battery
VIFUnitExt.DATEAND_TIME_OF_BATTERY_CHANGE = new VIFUnitExt("DATEAND_TIME_OF_BATTERY_CHANGE", 0x70);  // E111 0000 Date and time of bat...
// E111 0001 to E111 1111 Reserved
VIFUnitExt.RSSI = new VIFUnitExt("RSSI", 0x71);  // E111 0001 RSSI

var VIFUnitSecExt = function(name, value) {
    this.name = name;
    this.value = value;
};
VIFUnitSecExt.prototype.toString = function() {
    return "VIFUnitSecExt." + this.name;
};
VIFUnitSecExt.RELATIVE_HUMIDITY = new VIFUnitSecExt("RELATIVE_HUMIDITY", 0x1A);


const VIFTable = {
    // Primary VIFs [main table], range 0x00 - 0xFF

    lut: {
        // E000 0nnn    Energy Wh [0.001Wh to 10000Wh]
        0x00: [1.0e-3, MeasureUnit.WH, VIFUnit.ENERGY_WH],
        0x01: [1.0e-2, MeasureUnit.WH, VIFUnit.ENERGY_WH],
        0x02: [1.0e-1, MeasureUnit.WH, VIFUnit.ENERGY_WH],
        0x03: [1.0e0,  MeasureUnit.WH, VIFUnit.ENERGY_WH],
        0x04: [1.0e1,  MeasureUnit.WH, VIFUnit.ENERGY_WH],
        0x05: [1.0e2,  MeasureUnit.WH, VIFUnit.ENERGY_WH],
        0x06: [1.0e3,  MeasureUnit.WH, VIFUnit.ENERGY_WH],
        0x07: [1.0e4,  MeasureUnit.WH, VIFUnit.ENERGY_WH],

        // E000 1nnn    Energy  J [0.001kJ to 10000kJ]
        0x08: [1.0e0, MeasureUnit.J, VIFUnit.ENERGY_J],
        0x09: [1.0e1, MeasureUnit.J, VIFUnit.ENERGY_J],
        0x0A: [1.0e2, MeasureUnit.J, VIFUnit.ENERGY_J],
        0x0B: [1.0e3, MeasureUnit.J, VIFUnit.ENERGY_J],
        0x0C: [1.0e4, MeasureUnit.J, VIFUnit.ENERGY_J],
        0x0D: [1.0e5, MeasureUnit.J, VIFUnit.ENERGY_J],
        0x0E: [1.0e6, MeasureUnit.J, VIFUnit.ENERGY_J],
        0x0F: [1.0e7, MeasureUnit.J, VIFUnit.ENERGY_J],

        // E001 0nnn    Volume m^3 [0.001l to 10000l]
        0x10: [1.0e-6, MeasureUnit.M3, VIFUnit.VOLUME],
        0x11: [1.0e-5, MeasureUnit.M3, VIFUnit.VOLUME],
        0x12: [1.0e-4, MeasureUnit.M3, VIFUnit.VOLUME],
        0x13: [1.0e-3, MeasureUnit.M3, VIFUnit.VOLUME],
        0x14: [1.0e-2, MeasureUnit.M3, VIFUnit.VOLUME],
        0x15: [1.0e-1, MeasureUnit.M3, VIFUnit.VOLUME],
        0x16: [1.0e0,  MeasureUnit.M3, VIFUnit.VOLUME],
        0x17: [1.0e1,  MeasureUnit.M3, VIFUnit.VOLUME],

        // E001 1nnn    Mass kg [0.001kg to 10000kg] 
        0x18: [1.0e-3, MeasureUnit.KG, VIFUnit.MASS],
        0x19: [1.0e-2, MeasureUnit.KG, VIFUnit.MASS],
        0x1A: [1.0e-1, MeasureUnit.KG, VIFUnit.MASS],
        0x1B: [1.0e0,  MeasureUnit.KG, VIFUnit.MASS],
        0x1C: [1.0e1,  MeasureUnit.KG, VIFUnit.MASS],
        0x1D: [1.0e2,  MeasureUnit.KG, VIFUnit.MASS],
        0x1E: [1.0e3,  MeasureUnit.KG, VIFUnit.MASS],
        0x1F: [1.0e4,  MeasureUnit.KG, VIFUnit.MASS],

        // E010 00nn    On Time s 
        0x20: [1.0, MeasureUnit.SECONDS, VIFUnit.ON_TIME],  // seconds 
        0x21: [60.0, MeasureUnit.SECONDS, VIFUnit.ON_TIME],  // minutes 
        0x22: [3600.0, MeasureUnit.SECONDS, VIFUnit.ON_TIME],  // hours   
        0x23: [86400.0, MeasureUnit.SECONDS, VIFUnit.ON_TIME],  // days    

        // E010 01nn    Operating Time s 
        0x24: [1.0, MeasureUnit.SECONDS, VIFUnit.OPERATING_TIME],  // sec
        0x25: [60.0, MeasureUnit.SECONDS, VIFUnit.OPERATING_TIME],  // min
        0x26: [3600.0, MeasureUnit.SECONDS, VIFUnit.OPERATING_TIME],  // hours
        0x27: [86400.0, MeasureUnit.SECONDS, VIFUnit.OPERATING_TIME],  // days

        // E010 1nnn    Power W [0.001W to 10000W] 
        0x28: [1.0e-3, MeasureUnit.W, VIFUnit.POWER_W],
        0x29: [1.0e-2, MeasureUnit.W, VIFUnit.POWER_W],
        0x2A: [1.0e-1, MeasureUnit.W, VIFUnit.POWER_W],
        0x2B: [1.0e0,  MeasureUnit.W, VIFUnit.POWER_W],
        0x2C: [1.0e1,  MeasureUnit.W, VIFUnit.POWER_W],
        0x2D: [1.0e2,  MeasureUnit.W, VIFUnit.POWER_W],
        0x2E: [1.0e3,  MeasureUnit.W, VIFUnit.POWER_W],
        0x2F: [1.0e4,  MeasureUnit.W, VIFUnit.POWER_W],

        // E011 0nnn    Power J/h [0.001kJ/h to 10000kJ/h] 
        0x30: [1.0e0, MeasureUnit.J_H, VIFUnit.POWER_J_H],
        0x31: [1.0e1, MeasureUnit.J_H, VIFUnit.POWER_J_H],
        0x32: [1.0e2, MeasureUnit.J_H, VIFUnit.POWER_J_H],
        0x33: [1.0e3, MeasureUnit.J_H, VIFUnit.POWER_J_H],
        0x34: [1.0e4, MeasureUnit.J_H, VIFUnit.POWER_J_H],
        0x35: [1.0e5, MeasureUnit.J_H, VIFUnit.POWER_J_H],
        0x36: [1.0e6, MeasureUnit.J_H, VIFUnit.POWER_J_H],
        0x37: [1.0e7, MeasureUnit.J_H, VIFUnit.POWER_J_H],

        // E011 1nnn    Volume Flow m3/h [0.001l/h to 10000l/h] 
        0x38: [1.0e-6, MeasureUnit.M3_H, VIFUnit.VOLUME_FLOW],
        0x39: [1.0e-5, MeasureUnit.M3_H, VIFUnit.VOLUME_FLOW],
        0x3A: [1.0e-4, MeasureUnit.M3_H, VIFUnit.VOLUME_FLOW],
        0x3B: [1.0e-3, MeasureUnit.M3_H, VIFUnit.VOLUME_FLOW],
        0x3C: [1.0e-2, MeasureUnit.M3_H, VIFUnit.VOLUME_FLOW],
        0x3D: [1.0e-1, MeasureUnit.M3_H, VIFUnit.VOLUME_FLOW],
        0x3E: [1.0e0,  MeasureUnit.M3_H, VIFUnit.VOLUME_FLOW],
        0x3F: [1.0e1,  MeasureUnit.M3_H, VIFUnit.VOLUME_FLOW],

        // E100 0nnn     Volume Flow ext.  m^3/min [0.0001l/min to 1000l/min] 
        0x40: [1.0e-7, MeasureUnit.M3_MIN, VIFUnit.VOLUME_FLOW_EXT],
        0x41: [1.0e-6, MeasureUnit.M3_MIN, VIFUnit.VOLUME_FLOW_EXT],
        0x42: [1.0e-5, MeasureUnit.M3_MIN, VIFUnit.VOLUME_FLOW_EXT],
        0x43: [1.0e-4, MeasureUnit.M3_MIN, VIFUnit.VOLUME_FLOW_EXT],
        0x44: [1.0e-3, MeasureUnit.M3_MIN, VIFUnit.VOLUME_FLOW_EXT],
        0x45: [1.0e-2, MeasureUnit.M3_MIN, VIFUnit.VOLUME_FLOW_EXT],
        0x46: [1.0e-1, MeasureUnit.M3_MIN, VIFUnit.VOLUME_FLOW_EXT],
        0x47: [1.0e0,  MeasureUnit.M3_MIN, VIFUnit.VOLUME_FLOW_EXT],

        // E100 1nnn     Volume Flow ext.  m^3/s [0.001ml/s to 10000ml/s] 
        0x48: [1.0e-9, MeasureUnit.M3_S, VIFUnit.VOLUME_FLOW_EXT_S],
        0x49: [1.0e-8, MeasureUnit.M3_S, VIFUnit.VOLUME_FLOW_EXT_S],
        0x4A: [1.0e-7, MeasureUnit.M3_S, VIFUnit.VOLUME_FLOW_EXT_S],
        0x4B: [1.0e-6, MeasureUnit.M3_S, VIFUnit.VOLUME_FLOW_EXT_S],
        0x4C: [1.0e-5, MeasureUnit.M3_S, VIFUnit.VOLUME_FLOW_EXT_S],
        0x4D: [1.0e-4, MeasureUnit.M3_S, VIFUnit.VOLUME_FLOW_EXT_S],
        0x4E: [1.0e-3, MeasureUnit.M3_S, VIFUnit.VOLUME_FLOW_EXT_S],
        0x4F: [1.0e-2, MeasureUnit.M3_S, VIFUnit.VOLUME_FLOW_EXT_S],

        // E101 0nnn     Mass flow kg/h [0.001kg/h to 10000kg/h] 
        0x50: [1.0e-3, MeasureUnit.KG_H, VIFUnit.MASS_FLOW],
        0x51: [1.0e-2, MeasureUnit.KG_H, VIFUnit.MASS_FLOW],
        0x52: [1.0e-1, MeasureUnit.KG_H, VIFUnit.MASS_FLOW],
        0x53: [1.0e0,  MeasureUnit.KG_H, VIFUnit.MASS_FLOW],
        0x54: [1.0e1,  MeasureUnit.KG_H, VIFUnit.MASS_FLOW],
        0x55: [1.0e2,  MeasureUnit.KG_H, VIFUnit.MASS_FLOW],
        0x56: [1.0e3,  MeasureUnit.KG_H, VIFUnit.MASS_FLOW],
        0x57: [1.0e4,  MeasureUnit.KG_H, VIFUnit.MASS_FLOW],

        // E101 10nn     Flow Temperature degC [0.001degC to 1degC] 
        0x58: [1.0e-3, MeasureUnit.C, VIFUnit.FLOW_TEMPERATURE],
        0x59: [1.0e-2, MeasureUnit.C, VIFUnit.FLOW_TEMPERATURE],
        0x5A: [1.0e-1, MeasureUnit.C, VIFUnit.FLOW_TEMPERATURE],
        0x5B: [1.0e0,  MeasureUnit.C, VIFUnit.FLOW_TEMPERATURE],

        // E101 11nn Return Temperature degC [0.001degC to 1degC] 
        0x5C: [1.0e-3, MeasureUnit.C, VIFUnit.RETURN_TEMPERATURE],
        0x5D: [1.0e-2, MeasureUnit.C, VIFUnit.RETURN_TEMPERATURE],
        0x5E: [1.0e-1, MeasureUnit.C, VIFUnit.RETURN_TEMPERATURE],
        0x5F: [1.0e0,  MeasureUnit.C, VIFUnit.RETURN_TEMPERATURE],

        // E110 00nn    Temperature Difference  K   [mK to  K] 
        0x60: [1.0e-3, MeasureUnit.K, VIFUnit.TEMPERATURE_DIFFERENCE],
        0x61: [1.0e-2, MeasureUnit.K, VIFUnit.TEMPERATURE_DIFFERENCE],
        0x62: [1.0e-1, MeasureUnit.K, VIFUnit.TEMPERATURE_DIFFERENCE],
        0x63: [1.0e0,  MeasureUnit.K, VIFUnit.TEMPERATURE_DIFFERENCE],

        // E110 01nn     External Temperature degC [0.001degC to 1degC] 
        0x64: [1.0e-3, MeasureUnit.C, VIFUnit.EXTERNAL_TEMPERATURE],
        0x65: [1.0e-2, MeasureUnit.C, VIFUnit.EXTERNAL_TEMPERATURE],
        0x66: [1.0e-1, MeasureUnit.C, VIFUnit.EXTERNAL_TEMPERATURE],
        0x67: [1.0e0,  MeasureUnit.C, VIFUnit.EXTERNAL_TEMPERATURE],

        // E110 10nn     Pressure bar [1mbar to 1000mbar] 
        0x68: [1.0e-3, MeasureUnit.BAR, VIFUnit.PRESSURE],
        0x69: [1.0e-2, MeasureUnit.BAR, VIFUnit.PRESSURE],
        0x6A: [1.0e-1, MeasureUnit.BAR, VIFUnit.PRESSURE],
        0x6B: [1.0e0,  MeasureUnit.BAR, VIFUnit.PRESSURE],

        // E110 110n     Time Point 
        0x6C: [1.0e0, MeasureUnit.DATE, VIFUnit.DATE],            // type G
        0x6D: [1.0e0, MeasureUnit.DATE_TIME, VIFUnit.DATE_TIME],  // type F

        // E110 1110     Units for H.C.A. dimensionless 
        0x6E: [1.0e0, MeasureUnit.HCA, VIFUnit.UNITS_FOR_HCA],

        // E110 1111     Reserved 
        0x6F: [0.0, MeasureUnit.NONE, VIFUnit.RES_THIRD_VIFE_TABLE],

        // E111 00nn     Averaging Duration s 
        0x70: [1.0, MeasureUnit.SECONDS, VIFUnit.AVG_DURATION],  // seconds
        0x71: [60.0, MeasureUnit.SECONDS, VIFUnit.AVG_DURATION],  // minutes
        0x72: [3600.0, MeasureUnit.SECONDS, VIFUnit.AVG_DURATION],  // hours
        0x73: [86400.0, MeasureUnit.SECONDS, VIFUnit.AVG_DURATION],  // days

        // E111 01nn     Actuality Duration s 
        0x74: [1.0, MeasureUnit.SECONDS, VIFUnit.ACTUALITY_DURATION],
        0x75: [60.0, MeasureUnit.SECONDS, VIFUnit.ACTUALITY_DURATION],
        0x76: [3600.0, MeasureUnit.SECONDS, VIFUnit.ACTUALITY_DURATION],
        0x77: [86400.0, MeasureUnit.SECONDS, VIFUnit.ACTUALITY_DURATION],

        // Fabrication No 
        0x78: [1.0, MeasureUnit.NONE, VIFUnit.FABRICATION_NO],

        // E111 1001 [Enhanced] Identification 
        0x79: [1.0, MeasureUnit.NONE, VIFUnit.IDENTIFICATION],

        // E111 1010 Bus Address 
        0x7A: [1.0, MeasureUnit.NONE, VIFUnit.ADDRESS],

        // Unknown VIF: 7Ch
        0x7C: [1.0, MeasureUnit.NONE, VIFUnit.ANY_VIF],

        // Any VIF: 7Eh
        0x7E: [1.0, MeasureUnit.NONE, VIFUnit.ANY_VIF],

        // Manufacturer specific: 7Fh 
        0x7F: [1.0, MeasureUnit.NONE, VIFUnit.MANUFACTURER_SPEC],

        // Any VIF: 7Eh 
        0xFE: [1.0, MeasureUnit.NONE, VIFUnit.ANY_VIF],

        // Manufacturer specific: FFh 
        0xFF: [1.0, MeasureUnit.NONE, VIFUnit.MANUFACTURER_SPEC],


        // Main VIFE-Code Extension table [following VIF=FDh for primary VIF]
        // See 8.4.4 a, only some of them are here. Using range 0x100 - 0x1FF

        // E000 00nn Credit of 10nn-3 of the nominal local legal currency units
        0x100: [1.0e-3, MeasureUnit.CURRENCY, VIFUnitExt.CURRENCY_CREDIT],
        0x101: [1.0e-2, MeasureUnit.CURRENCY, VIFUnitExt.CURRENCY_CREDIT],
        0x102: [1.0e-1, MeasureUnit.CURRENCY, VIFUnitExt.CURRENCY_CREDIT],
        0x103: [1.0e0,  MeasureUnit.CURRENCY, VIFUnitExt.CURRENCY_CREDIT],

        // E000 01nn Debit of 10nn-3 of the nominal local legal currency units
        0x104: [1.0e-3, MeasureUnit.CURRENCY, VIFUnitExt.CURRENCY_DEBIT],
        0x105: [1.0e-2, MeasureUnit.CURRENCY, VIFUnitExt.CURRENCY_DEBIT],
        0x106: [1.0e-1, MeasureUnit.CURRENCY, VIFUnitExt.CURRENCY_DEBIT],
        0x107: [1.0e0,  MeasureUnit.CURRENCY, VIFUnitExt.CURRENCY_DEBIT],

        // E000 1000 Access Number [transmission count] 
        0x108: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.ACCESS_NUMBER],

        // E000 1001 Medium [as in fixed header] 
        0x109: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.MEDIUM],

        // E000 1010 Manufacturer [as in fixed header] 
        0x10A: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.MANUFACTURER],

        // E000 1011 Parameter set identification 
        0x10B: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.PARAMETER_SET_ID],

        // E000 1100 Model / Version 
        0x10C: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.MODEL_VERSION],

        // E000 1101 Hardware version // 
        0x10D: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.HARDWARE_VERSION],

        // E000 1110 Firmware version // 
        0x10E: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.FIRMWARE_VERSION],

        // E000 1111 Software version // 
        0x10F: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.SOFTWARE_VERSION],

        // E001 0000 Customer location 
        0x110: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.CUSTOMER_LOCATION],

        // E001 0001 Customer 
        0x111: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.CUSTOMER],

        // E001 0010 Access Code User 
        0x112: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.ACCESS_CODE_USER],

        // E001 0011 Access Code Operator 
        0x113: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.ACCESS_CODE_OPERATOR],

        // E001 0100 Access Code System Operator 
        0x114: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.ACCESS_CODE_SYSTEM_OPERATOR],

        // E001 0101 Access Code Developer 
        0x115: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.ACCESS_CODE_DEVELOPER],

        // E001 0110 Password 
        0x116: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.PASSWORD],

        // E001 0111 Error flags [binary] 
        0x117: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.ERROR_FLAGS],

        // E001 1000 Error mask 
        0x118: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.ERROR_MASKS],

        // E001 1001 Reserved 
        0x119: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],

        // E001 1010 Digital Output [binary] 
        0x11A: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.DIGITAL_OUTPUT],

        // E001 1011 Digital Input [binary] 
        0x11B: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.DIGITAL_INPUT],

        // E001 1100 Baudrate [Baud] 
        0x11C: [1.0e0,  MeasureUnit.BAUD, VIFUnitExt.BAUDRATE],

        // E001 1101 Response delay time [bittimes] 
        0x11D: [1.0e0,  MeasureUnit.BIT_TIMES, VIFUnitExt.RESPONSE_DELAY],

        // E001 1110 Retry 
        0x11E: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RETRY],

        // E001 1111 Reserved 
        0x11F: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED_2],

        // E010 0000 First storage // for cyclic storage 
        0x120: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.FIRST_STORAGE_NR],

        // E010 0001 Last storage // for cyclic storage 
        0x121: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.LAST_STORAGE_NR],

        // E010 0010 Size of storage block 
        0x122: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.SIZE_OF_STORAGE_BLOCK],

        // E010 0011 Reserved 
        0x123: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED_3],

        // E010 01nn Storage interval [sec[s]..day[s]] 
        0x124: [1.0,  MeasureUnit.SECONDS, VIFUnitExt.STORAGE_INTERVAL],
        0x125: [60.0,  MeasureUnit.SECONDS, VIFUnitExt.STORAGE_INTERVAL],
        0x126: [3600.0,  MeasureUnit.SECONDS, VIFUnitExt.STORAGE_INTERVAL],
        0x127: [86400.0,  MeasureUnit.SECONDS, VIFUnitExt.STORAGE_INTERVAL],
        0x128: [2629743.83, MeasureUnit.SECONDS, VIFUnitExt.STORAGE_INTERVAL],
        0x129: [31556926.0, MeasureUnit.SECONDS, VIFUnitExt.STORAGE_INTERVAL],

        // E010 1010 Reserved 
        0x12A: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],

        // E010 1011 Reserved 
        0x12B: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],

        // E010 11nn Duration since last readout [sec[s]..day[s]] 
        0x12C: [1.0, MeasureUnit.SECONDS, VIFUnitExt.DURATION_SINCE_LAST_READOUT],  // seconds 
        0x12D: [60.0, MeasureUnit.SECONDS, VIFUnitExt.DURATION_SINCE_LAST_READOUT],  // minutes 
        0x12E: [3600.0, MeasureUnit.SECONDS, VIFUnitExt.DURATION_SINCE_LAST_READOUT],  // hours   
        0x12F: [86400.0, MeasureUnit.SECONDS, VIFUnitExt.DURATION_SINCE_LAST_READOUT],  // days    

        // E011 0000 Start [date/time] of tariff  
        // The information about usage of data type F [date and time] or data type G [date] can 
        // be derived from the datafield [0010b: type G / 0100: type F]. 
        0x130: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],  // ???? 

        // E011 00nn Duration of tariff [nn=01 ..11: min to days] 
        0x131: [60.0,  MeasureUnit.SECONDS, VIFUnitExt.STORAGE_INTERVAL],   // minute[s] 
        0x132: [3600.0,  MeasureUnit.SECONDS, VIFUnitExt.STORAGE_INTERVAL],   // hour[s]   
        0x133: [86400.0,  MeasureUnit.SECONDS, VIFUnitExt.STORAGE_INTERVAL],   // day[s]    

        // E011 01nn Period of tariff [sec[s] to day[s]]  
        0x134: [1.0, MeasureUnit.SECONDS, VIFUnitExt.PERIOD_OF_TARIFF],  // seconds  
        0x135: [60.0, MeasureUnit.SECONDS, VIFUnitExt.PERIOD_OF_TARIFF],  // minutes  
        0x136: [3600.0, MeasureUnit.SECONDS, VIFUnitExt.PERIOD_OF_TARIFF],  // hours    
        0x137: [86400.0, MeasureUnit.SECONDS, VIFUnitExt.PERIOD_OF_TARIFF],  // days     
        0x138: [2629743.83, MeasureUnit.SECONDS, VIFUnitExt.PERIOD_OF_TARIFF],  // month[s] 
        0x139: [31556926.0, MeasureUnit.SECONDS, VIFUnitExt.PERIOD_OF_TARIFF],  // year[s]  

        // E011 1010 dimensionless / no VIF 
        0x13A: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.DIMENSIONLESS],

        // E011 1011 Reserved 
        0x13B: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],

        // E011 11xx Reserved 
        0x13C: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],
        0x13D: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],
        0x13E: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],
        0x13F: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],

        // E100 nnnn   Volts electrical units 
        0x140: [1.0e-9, MeasureUnit.V, VIFUnitExt.VOLTS],
        0x141: [1.0e-8, MeasureUnit.V, VIFUnitExt.VOLTS],
        0x142: [1.0e-7, MeasureUnit.V, VIFUnitExt.VOLTS],
        0x143: [1.0e-6, MeasureUnit.V, VIFUnitExt.VOLTS],
        0x144: [1.0e-5, MeasureUnit.V, VIFUnitExt.VOLTS],
        0x145: [1.0e-4, MeasureUnit.V, VIFUnitExt.VOLTS],
        0x146: [1.0e-3, MeasureUnit.V, VIFUnitExt.VOLTS],
        0x147: [1.0e-2, MeasureUnit.V, VIFUnitExt.VOLTS],
        0x148: [1.0e-1, MeasureUnit.V, VIFUnitExt.VOLTS],
        0x149: [1.0e0,  MeasureUnit.V, VIFUnitExt.VOLTS],
        0x14A: [1.0e1,  MeasureUnit.V, VIFUnitExt.VOLTS],
        0x14B: [1.0e2,  MeasureUnit.V, VIFUnitExt.VOLTS],
        0x14C: [1.0e3,  MeasureUnit.V, VIFUnitExt.VOLTS],
        0x14D: [1.0e4,  MeasureUnit.V, VIFUnitExt.VOLTS],
        0x14E: [1.0e5,  MeasureUnit.V, VIFUnitExt.VOLTS],
        0x14F: [1.0e6,  MeasureUnit.V, VIFUnitExt.VOLTS],

        // E101 nnnn   A 
        0x150: [1.0e-12, MeasureUnit.A, VIFUnitExt.AMPERE],
        0x151: [1.0e-11, MeasureUnit.A, VIFUnitExt.AMPERE],
        0x152: [1.0e-10, MeasureUnit.A, VIFUnitExt.AMPERE],
        0x153: [1.0e-9,  MeasureUnit.A, VIFUnitExt.AMPERE],
        0x154: [1.0e-8,  MeasureUnit.A, VIFUnitExt.AMPERE],
        0x155: [1.0e-7,  MeasureUnit.A, VIFUnitExt.AMPERE],
        0x156: [1.0e-6,  MeasureUnit.A, VIFUnitExt.AMPERE],
        0x157: [1.0e-5,  MeasureUnit.A, VIFUnitExt.AMPERE],
        0x158: [1.0e-4,  MeasureUnit.A, VIFUnitExt.AMPERE],
        0x159: [1.0e-3,  MeasureUnit.A, VIFUnitExt.AMPERE],
        0x15A: [1.0e-2,  MeasureUnit.A, VIFUnitExt.AMPERE],
        0x15B: [1.0e-1,  MeasureUnit.A, VIFUnitExt.AMPERE],
        0x15C: [1.0e0,   MeasureUnit.A, VIFUnitExt.AMPERE],
        0x15D: [1.0e1,   MeasureUnit.A, VIFUnitExt.AMPERE],
        0x15E: [1.0e2,   MeasureUnit.A, VIFUnitExt.AMPERE],
        0x15F: [1.0e3,   MeasureUnit.A, VIFUnitExt.AMPERE],

        // E110 0000 Reset counter 
        0x160: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESET_COUNTER],

        // E110 0001 Cumulation counter 
        0x161: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.CUMULATION_COUNTER],

        // E110 0010 Control signal 
        0x162: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.CONTROL_SIGNAL],

        // E110 0011 Day of week 
        0x163: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.DAY_OF_WEEK],

        // E110 0100 Week number 
        0x164: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.WEEK_NUMBER],

        // E110 0101 Time point of day change 
        0x165: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.TIME_POINT_OF_DAY_CHANGE],

        // E110 0110 State of parameter activation 
        0x166: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.STATE_OF_PARAMETER_ACTIVATION],

        // E110 0111 Special supplier information 
        0x167: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.SPECIAL_SUPPLIER_INFORMATION],

        // E110 10pp Duration since last cumulation [hour[s]..years[s]] 
        0x168: [3600.0, MeasureUnit.SECONDS, VIFUnitExt.DURATION_SINCE_LAST_CUMULATION],  // hours    
        0x169: [86400.0, MeasureUnit.SECONDS, VIFUnitExt.DURATION_SINCE_LAST_CUMULATION],  // days     
        0x16A: [2629743.83, MeasureUnit.SECONDS, VIFUnitExt.DURATION_SINCE_LAST_CUMULATION],  // month[s] 
        0x16B: [31556926.0, MeasureUnit.SECONDS, VIFUnitExt.DURATION_SINCE_LAST_CUMULATION],  // year[s]  

        // E110 11pp Operating time battery [hour[s]..years[s]] 
        0x16C: [3600.0, MeasureUnit.SECONDS, VIFUnitExt.OPERATING_TIME_BATTERY],  // hours    
        0x16D: [86400.0, MeasureUnit.SECONDS, VIFUnitExt.OPERATING_TIME_BATTERY],  // days     
        0x16E: [2629743.83, MeasureUnit.SECONDS, VIFUnitExt.OPERATING_TIME_BATTERY],  // month[s] 
        0x16F: [31556926.0, MeasureUnit.SECONDS, VIFUnitExt.OPERATING_TIME_BATTERY],  // year[s]  

        // E111 0000 Date and time of battery change 
        0x170: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.DATEAND_TIME_OF_BATTERY_CHANGE],

        // E111 0001-1111 Reserved 
        0x171: [1.0e0,  MeasureUnit.DBM, VIFUnitExt.RSSI],
        0x172: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],
        0x173: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],
        0x174: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],
        0x175: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],
        0x176: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],
        0x177: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],
        0x178: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],
        0x179: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],
        0x17A: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],
        0x17B: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],
        0x17C: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],
        0x17D: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],
        0x17E: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],
        0x17F: [1.0e0,  MeasureUnit.NONE, VIFUnitExt.RESERVED],


        // Alternate VIFE-Code Extension table [following VIF=0FBh for primary VIF]
        // See 8.4.4 b, only some of them are here. Using range 0x200 - 0x2FF 

        // E000 000n Energy 10[n-1] MWh 0.1MWh to 1MWh 
        0x200: [1.0e5,  MeasureUnit.WH, "Energy"],
        0x201: [1.0e6,  MeasureUnit.WH, "Energy"],

        // E000 001n Reserved 
        0x202: [1.0e0,  "Reserved", "Reserved"],
        0x203: [1.0e0,  "Reserved", "Reserved"],

        // E000 01nn Reserved 
        0x204: [1.0e0,  "Reserved", "Reserved"],
        0x205: [1.0e0,  "Reserved", "Reserved"],
        0x206: [1.0e0,  "Reserved", "Reserved"],
        0x207: [1.0e0,  "Reserved", "Reserved"],

        // E000 100n Energy 10[n-1] GJ 0.1GJ to 1GJ 
        0x208: [1.0e8,  "Reserved", "Energy"],
        0x209: [1.0e9,  "Reserved", "Energy"],

        // E000 101n Reserved 
        0x20A: [1.0e0,  "Reserved", "Reserved"],
        0x20B: [1.0e0,  "Reserved", "Reserved"],

        // E000 11nn Reserved 
        0x20C: [1.0e0,  "Reserved", "Reserved"],
        0x20D: [1.0e0,  "Reserved", "Reserved"],
        0x20E: [1.0e0,  "Reserved", "Reserved"],
        0x20F: [1.0e0,  "Reserved", "Reserved"],

        // E001 000n Volume 10[n+2] m3 100m3 to 1000m3 
        0x210: [1.0e2,  MeasureUnit.M3, "Volume"],
        0x211: [1.0e3,  MeasureUnit.M3, "Volume"],

        // E001 001n Reserved 
        0x212: [1.0e0,  "Reserved", "Reserved"],
        0x213: [1.0e0,  "Reserved", "Reserved"],

        // E001 01nn Reserved 
        0x214: [1.0e0,  "Reserved", "Reserved"],
        0x215: [1.0e0,  "Reserved", "Reserved"],
        0x216: [1.0e0,  "Reserved", "Reserved"],
        0x217: [1.0e0,  "Reserved", "Reserved"],

        // E001 100n Mass 10[n+2] t 100t to 1000t 
        0x218: [1.0e5,  MeasureUnit.KG, "Mass"],
        0x219: [1.0e6,  MeasureUnit.KG, "Mass"],

        // E001 1010 to E010 0000 Reserved 
        0x21A: [1.0e-1,  MeasureUnit.PERCENT, VIFUnitSecExt.RELATIVE_HUMIDITY],
        0x21B: [1.0e0,  "Reserved", "Reserved"],
        0x21C: [1.0e0,  "Reserved", "Reserved"],
        0x21D: [1.0e0,  "Reserved", "Reserved"],
        0x21E: [1.0e0,  "Reserved", "Reserved"],
        0x21F: [1.0e0,  "Reserved", "Reserved"],
        0x220: [1.0e0,  "Reserved", "Reserved"],

        // E010 0001 Volume 0,1 feet^3 
        0x221: [1.0e-1, "feet^3", "Volume"],

        // E010 001n Volume 0,1-1 american gallon 
        0x222: [1.0e-1, "American gallon", "Volume"],
        0x223: [1.0e-0, "American gallon", "Volume"],

        // E010 0100    Volume flow 0,001 american gallon/min 
        0x224: [1.0e-3, "American gallon/min", "Volume flow"],

        // E010 0101 Volume flow 1 american gallon/min 
        0x225: [1.0e0,  "American gallon/min", "Volume flow"],

        // E010 0110 Volume flow 1 american gallon/h 
        0x226: [1.0e0,  "American gallon/h", "Volume flow"],

        // E010 0111 Reserved 
        0x227: [1.0e0, "Reserved", "Reserved"],

        // E010 100n Power 10[n-1] MW 0.1MW to 1MW 
        0x228: [1.0e5, MeasureUnit.W, "Power"],
        0x229: [1.0e6, MeasureUnit.W, "Power"],

        // E010 101n Reserved 
        0x22A: [1.0e0, "Reserved", "Reserved"],
        0x22B: [1.0e0, "Reserved", "Reserved"],

        // E010 11nn Reserved 
        0x22C: [1.0e0, "Reserved", "Reserved"],
        0x22D: [1.0e0, "Reserved", "Reserved"],
        0x22E: [1.0e0, "Reserved", "Reserved"],
        0x22F: [1.0e0, "Reserved", "Reserved"],

        // E011 000n Power 10[n-1] GJ/h 0.1GJ/h to 1GJ/h 
        0x230: [1.0e8, MeasureUnit.J, "Power"],
        0x231: [1.0e9, MeasureUnit.J, "Power"],

        // E011 0010 to E101 0111 Reserved 
        0x232: [1.0e0, "Reserved", "Reserved"],
        0x233: [1.0e0, "Reserved", "Reserved"],
        0x234: [1.0e0, "Reserved", "Reserved"],
        0x235: [1.0e0, "Reserved", "Reserved"],
        0x236: [1.0e0, "Reserved", "Reserved"],
        0x237: [1.0e0, "Reserved", "Reserved"],
        0x238: [1.0e0, "Reserved", "Reserved"],
        0x239: [1.0e0, "Reserved", "Reserved"],
        0x23A: [1.0e0, "Reserved", "Reserved"],
        0x23B: [1.0e0, "Reserved", "Reserved"],
        0x23C: [1.0e0, "Reserved", "Reserved"],
        0x23D: [1.0e0, "Reserved", "Reserved"],
        0x23E: [1.0e0, "Reserved", "Reserved"],
        0x23F: [1.0e0, "Reserved", "Reserved"],
        0x240: [1.0e0, "Reserved", "Reserved"],
        0x241: [1.0e0, "Reserved", "Reserved"],
        0x242: [1.0e0, "Reserved", "Reserved"],
        0x243: [1.0e0, "Reserved", "Reserved"],
        0x244: [1.0e0, "Reserved", "Reserved"],
        0x245: [1.0e0, "Reserved", "Reserved"],
        0x246: [1.0e0, "Reserved", "Reserved"],
        0x247: [1.0e0, "Reserved", "Reserved"],
        0x248: [1.0e0, "Reserved", "Reserved"],
        0x249: [1.0e0, "Reserved", "Reserved"],
        0x24A: [1.0e0, "Reserved", "Reserved"],
        0x24B: [1.0e0, "Reserved", "Reserved"],
        0x24C: [1.0e0, "Reserved", "Reserved"],
        0x24D: [1.0e0, "Reserved", "Reserved"],
        0x24E: [1.0e0, "Reserved", "Reserved"],
        0x24F: [1.0e0, "Reserved", "Reserved"],
        0x250: [1.0e0, "Reserved", "Reserved"],
        0x251: [1.0e0, "Reserved", "Reserved"],
        0x252: [1.0e0, "Reserved", "Reserved"],
        0x253: [1.0e0, "Reserved", "Reserved"],
        0x254: [1.0e0, "Reserved", "Reserved"],
        0x255: [1.0e0, "Reserved", "Reserved"],
        0x256: [1.0e0, "Reserved", "Reserved"],
        0x257: [1.0e0, "Reserved", "Reserved"],

        // E101 10nn Flow Temperature 10[nn-3] degF 0.001degF to 1degF 
        0x258: [1.0e-3, "degF", "Flow temperature"],
        0x259: [1.0e-2, "degF", "Flow temperature"],
        0x25A: [1.0e-1, "degF", "Flow temperature"],
        0x25B: [1.0e0,  "degF", "Flow temperature"],

        // E101 11nn Return Temperature 10[nn-3] degF 0.001degF to 1degF 
        0x25C: [1.0e-3, "degF", "Return temperature"],
        0x25D: [1.0e-2, "degF", "Return temperature"],
        0x25E: [1.0e-1, "degF", "Return temperature"],
        0x25F: [1.0e0,  "degF", "Return temperature"],

        // E110 00nn Temperature Difference 10[nn-3] degF 0.001degF to 1degF 
        0x260: [1.0e-3, "degF", "Temperature difference"],
        0x261: [1.0e-2, "degF", "Temperature difference"],
        0x262: [1.0e-1, "degF", "Temperature difference"],
        0x263: [1.0e0,  "degF", "Temperature difference"],

        // E110 01nn External Temperature 10[nn-3] degF 0.001degF to 1degF 
        0x264: [1.0e-3, "degF", "External temperature"],
        0x265: [1.0e-2, "degF", "External temperature"],
        0x266: [1.0e-1, "degF", "External temperature"],
        0x267: [1.0e0,  "degF", "External temperature"],

        // E110 1nnn Reserved 
        0x268: [1.0e0, "Reserved", "Reserved"],
        0x269: [1.0e0, "Reserved", "Reserved"],
        0x26A: [1.0e0, "Reserved", "Reserved"],
        0x26B: [1.0e0, "Reserved", "Reserved"],
        0x26C: [1.0e0, "Reserved", "Reserved"],
        0x26D: [1.0e0, "Reserved", "Reserved"],
        0x26E: [1.0e0, "Reserved", "Reserved"],
        0x26F: [1.0e0, "Reserved", "Reserved"],

        // E111 00nn Cold / Warm Temperature Limit 10[nn-3] degF 0.001degF to 1degF 
        0x270: [1.0e-3, "degF", "Cold / Warm Temperature Limit"],
        0x271: [1.0e-2, "degF", "Cold / Warm Temperature Limit"],
        0x272: [1.0e-1, "degF", "Cold / Warm Temperature Limit"],
        0x273: [1.0e0,  "degF", "Cold / Warm Temperature Limit"],

        // E111 01nn Cold / Warm Temperature Limit 10[nn-3] degC 0.001degC to 1degC 
        0x274: [1.0e-3, MeasureUnit.C, "Cold / Warm Temperature Limit"],
        0x275: [1.0e-2, MeasureUnit.C, "Cold / Warm Temperature Limit"],
        0x276: [1.0e-1, MeasureUnit.C, "Cold / Warm Temperature Limit"],
        0x277: [1.0e0,  MeasureUnit.C, "Cold / Warm Temperature Limit"],

        // E111 1nnn cumul. count max power 10[nnn-3] W 0.001W to 10000W 
        0x278: [1.0e-3, MeasureUnit.W, "Cumul count max power"],
        0x279: [1.0e-3, MeasureUnit.W, "Cumul count max power"],
        0x27A: [1.0e-1, MeasureUnit.W, "Cumul count max power"],
        0x27B: [1.0e0,  MeasureUnit.W, "Cumul count max power"],
        0x27C: [1.0e1,  MeasureUnit.W, "Cumul count max power"],
        0x27D: [1.0e2,  MeasureUnit.W, "Cumul count max power"],
        0x27E: [1.0e3,  MeasureUnit.W, "Cumul count max power"],
        0x27F: [1.0e4,  MeasureUnit.W, "Cumul count max power"]
    }
}

const TelegramDateMasks = {
    DATE: 0x02,             // "Auctual Date",            0010 Type G
    DATE_TIME: 0x04,        // "Actual Date and Time",    0100 Type F
    EXT_TIME: 0x03,         // "Extented Date",           0011 Type J
    EXT_DATE_TIME: 0x60,    // "Extented Daten and Time", 0110 Type I
}

function DateCalculator() {
    this.SECOND_MASK = 0x3F;          // 0011 1111
    this.MINUTE_MASK = 0x3F;          // 0011 1111
    this.HOUR_MASK = 0x1F;            // 0001 1111
    this.DAY_MASK = 0x1F;             // 0001 1111
    this.MONTH_MASK = 0x0F;           // 0000 1111
    this.YEAR_MASK = 0xE0;            // 1110 0000
    this.YEAR_MASK_2 = 0xF0;          // 1111 0000
    this.HUNDERT_YEAR_MASK = 0xC0;    // 1100 0000
    this.WEEK_DAY = 0xE0;             // 1110 0000
    this.WEEK = 0x3F;                 // 0011 1111
    this.TIME_INVALID = 0x80;         // 1000 0000
    this.SOMMERTIME = 0x40;           // 0100 0000
    this.LEAP_YEAR = 0x80;            // 1000 0000
    this.DIF_SOMMERTIME = 0xC0;       // 1100 0000
    this.pad = "00";
};
DateCalculator.prototype.zeroPad = function(val) {
    return (this.pad + val).slice(-this.pad.length);
};
DateCalculator.prototype.getTimeWithSeconds = function(second, minute, hour) {
    return this.getTime(minute, hour) + ":" + this.getSeconds(second);
};
DateCalculator.prototype.getTime = function(minute, hour) {
    return this.getHour(hour) + ":" + this.getMinutes(minute);
};
DateCalculator.prototype.getDate = function(day, month, century) {
    return this.getYear(day, month, 0, false) + '-' + this.getMonth(month) + '-' + this.getDay(day);
};
DateCalculator.prototype.getDateTime = function(minute, hour, day, month, century) {
    return this.getDate(day, month, century) + " " + this.getTime(minute, hour);
};
DateCalculator.prototype.getDateTimeWithSeconds = function(second, minute, hour, day, month, century) {
    return this.getDate(day, month, century) + " " + this.getTimeWithSeconds(second, minute, hour);
};
DateCalculator.prototype.getSeconds = function(second) {
    return this.zeroPad(second & this.SECOND_MASK);
};
DateCalculator.prototype.getMinutes = function(minute) {
    return this.zeroPad(minute & this.MINUTE_MASK);
};
DateCalculator.prototype.getHour = function(hour) {
    return this.zeroPad(hour & this.HOUR_MASK);
};
DateCalculator.prototype.getDay = function(day) {
    return this.zeroPad(day & this.DAY_MASK);
};
DateCalculator.prototype.getMonth = function(month) {
    return this.zeroPad(month & this.MONTH_MASK);
};
DateCalculator.prototype.getYear = function(yearValue1, yearValue2, hundertYearValue, calcHundertYear) {
    var year1 = yearValue1 & this.YEAR_MASK;
    var year2 = yearValue2 & this.YEAR_MASK_2;
    var hundertYear = 1;

    /* we move the bits of year1 value 4 bits to the right
     * and concat (or) them with year2. Afterwards we have
     * to move the result one bit to the right so that it
     * is at the right position (0xxx xxxx).
     */
    var year = (year2 | (year1 >> 4)) >> 1;

    /*
     * to be compatible with older meters it is recommended to interpret the
     * years 0 to 80 as 2000 to 2080. Only year values in between 0 and 99
     * should be used
     *
     * another option is to calculate the hundert year value (in new meters)
     * from a third value the hundert year is generated and calculated
     * the year is then calculated according to following formula:
     * year = 1900 + 100 * hundertYear + year
     */

    if(calcHundertYear) {
        // We have to load the hundert year format as well
        hundertYear = (hundertYearValue & this.HUNDERT_YEAR_MASK) >> 6;
        year = 1900 + (100 * hundertYear) + year
    } else {
        if(year < 81) {
            year = 2000 + year;
        } else {
            year = 1900 + year;
        }                
    }
            
    return year;   
};


(function (global) {
    'use strict';

    var MBus = function (options) {
        this.telegrams = [
            TelegramACK,
            TelegramShort,
            TelegramLong
        ];

        this.const = new Constants();
    };

    MBus.prototype.isPrimaryAddress = function(address) {
        return ((address >= 0x00) && (address <= 0xFF));
    };

    MBus.prototype.pingFrame = function(address, callback) {
        if(this.isPrimaryAddress(address) === 0) {
            throw "Invalid address " + address;
        }

        var frame = new TelegramShort();

        frame.header.aField.parts = [address];
        frame.header.cField.parts = [this.const.MBUS_CONTROL_MASK_SND_NKE | this.const.MBUS_CONTROL_MASK_DIR_M2S];

        if(callback) {
            callback.call(this, frame.toString());
        } else {
            return frame.toString();
        }

        return this; 
    };

    MBus.prototype.requestFrame = function(address, callback) {
        if(this.isPrimaryAddress(address) === 0) {
            throw "Invalid address " + address;
        }

        var frame = new TelegramShort();

        frame.header.aField.parts = [address];
        frame.header.cField.parts = [this.const.MBUS_CONTROL_MASK_REQ_UD2 | this.const.MBUS_CONTROL_MASK_DIR_M2S];

        if(callback) {
            callback.call(this, frame.toString());
        } else {
            return frame.toString();
        }

        return this; 
    };

    MBus.prototype.load = function(data, callback) {
        var retval = null;

        if(!data) {
            throw "Empty Frame";
        }

        if(typeof data == 'string') {
            data = data.split('').map(function(item) {
                return item.charCodeAt(); 
            });
        }

        for (var i = this.telegrams.length - 1; i >= 0 && retval === null; i--) {
            try {
                var t = new this.telegrams[i]();
                t.parse(data);
                retval = t;
            } catch(err) {
                if(err != 'Frame Mismatch') {
                    throw(err);
                }
            }
        }

        if(callback) {
            callback.call(retval);
            return this;
        }

        return retval;
    };

    MBus.prototype.loadFile = function(filename, callback) {
        if(process.env.hasOwnProperty('BOARD')) {
            try {
                var retval = this.load(require("fs").readFile(filename));
                if(callback) {
                    callback.apply(retval);
                }
            } catch(e) {
                trace(e);
            }
        
        } else {
            Buffer.prototype.toByteArray = function () {
                return Array.prototype.slice.call(this, 0)
            }
            var caller = this;
            require("fs").readFile(filename, function read(err, data) {
                var retval = caller.load(data.toByteArray());
                if(callback) {
                    callback.apply(retval);
                }
            });
        }
    };

    // AMD support
    if (typeof define === 'function' && define.amd) {
        define(function () { return MBus; });
    // CommonJS and Node.js module support.
    } else if (typeof exports !== 'undefined') {
        // Support Node.js specific `module.exports` (which can be a function)
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = MBus;
        }
        // But always support CommonJS module 1.1.1 spec (`exports` cannot be a function)
        exports.MBus = MBus;
    } else {
        global.MBus = MBus;
    }
})(this);

