
/*
 * Extend MBus with more features
 */
MBus.prototype.productName = function(header) {
    var res = "Unknown product";

    if (header) {
        var manufacturer = header.manufacturer;

        if (manufacturer == "ABB") {
            switch (header.version)
            {
                case 0x02:
                    res = "ABB Delta-Meter"
                    break;
            }
        }
        else if (manufacturer == "ACW")
        {
            switch (header.version)
            {
                case 0x09:
                    res = "Itron CF Echo 2";
                    break;
                case 0x0A:
                    res = "Itron CF 51";
                    break;
                case 0x0B:
                    res = "Itron CF 55";
                    break;
                case 0x0E:
                    res = "Itron BM +m";
                    break;
                case 0x0F:
                    res = "Itron CF 800";
                    break;
                case 0x14:
                    res = "Itron CYBLE M-Bus 1.4";
                    break;
            }
        }
        else if (manufacturer == "AMT")
        {
            switch (header.version)
            {
                case 0x80:
                    res = "Aquametro CALEC MB";
                    break;
                case 0xC0:
                    res = "Aquametro CALEC ST";
                    break;
            }
        }
        else if (manufacturer == "BEC")
        {
            if (header.medium == this.const.MBUS_VARIABLE_DATA_MEDIUM_ELECTRICITY)
            {
                switch (header.version)
                {
                    case 0x00:
                        res = "Berg DCMi";
                        break;
                    case 0x07:
                        res = "Berg BLMi";
                        break;
                }
            }
            else if (header.medium == this.const.MBUS_VARIABLE_DATA_MEDIUM_UNKNOWN)
            {
                switch (header.version)
                {
                    case 0x71:
                        res =  "Berg BMB-10S0";
                        break;
                }
            }
        }
        else if (manufacturer == "EFE")
        {
            switch (header.version)
            {
                case 0x00:
                    res =  ((header.medium == 0x06) ? "Engelmann WaterStar" : "Engelmann / Elster SensoStar 2");
                    break;
                case 0x01:
                    res = "Engelmann SensoStar 2C";
                    break;
            }
        }
        else if (manufacturer == "ELS")
        {
            switch (header.version)
            {
                case 0x02:
                    res = "Elster TMP-A";
                    break;
                case 0x0A:
                    res = "Elster Falcon";
                    break;
                case 0x2F:
                    res = "Elster F96 Plus";
                    break;
            }
        }
        else if (manufacturer == "ELV")
        {
            switch (header.version)
            {
                case 0x14:
                case 0x15:
                case 0x16:
                case 0x17:
                case 0x18:
                case 0x19:
                case 0x1A:
                case 0x1B:
                case 0x1C:
                case 0x1D:
                    res = "Elvaco CMa10";
                    break;
                case 0x32:
                case 0x33:
                case 0x34:
                case 0x35:
                case 0x36:
                case 0x37:
                case 0x38:
                case 0x39:
                case 0x3A:
                case 0x3B:
                    res = "Elvaco CMa11";
                    break;
            }
        }
        else if (manufacturer == "EMH")
        {
            switch (header.version)
            {
                case 0x00:
                    res = "EMH DIZ";
                    break;
            }
        }
        else if (manufacturer == "EMU")
        {
            if (header.medium == this.const.MBUS_VARIABLE_DATA_MEDIUM_ELECTRICITY)
            {
                switch (header.version)
                {
                    case 0x10:
                        res = "EMU Professional 3/75 M-Bus";
                        break;
                }
            }
        }
        else if (manufacturer == "GAV")
        {
            if (header.medium == this.const.MBUS_VARIABLE_DATA_MEDIUM_ELECTRICITY)
            {
                switch (header.version)
                {
                    case 0x2D:
                    case 0x2E:
                    case 0x2F:
                    case 0x30:
                        res = "Carlo Gavazzi EM24";
                        break;
                    case 0x39:
                    case 0x3A:
                        res = "Carlo Gavazzi EM21";
                        break;
                    case 0x40:
                        res = "Carlo Gavazzi EM33";
                        break;
                }
            }
        }
        else if (manufacturer == "GMC")
        {
            switch (header.version)
            {
                case 0xE6:
                    res = "GMC-I A230 EMMOD 206";
                    break;
            }
        }
        else if (manufacturer == "KAM")
        {
            switch (header.version)
            {
                case 0x01:
                    res = "Kamstrup 382 (6850-005)";
                    break;
                case 0x08:
                    res = "Kamstrup Multical 601";
                    break;
            }
        }
        else if (manufacturer == "SLB")
        {
            switch (header.version)
            {
                case 0x02:
                    res = "Allmess Megacontrol CF-50";
                    break;
                case 0x06:
                    res = "CF Compact / Integral MK MaXX";
                    break;
            }
        }
        else if (manufacturer == "HYD")
        {
            switch (header.version)
            {
                case 0x28:
                    res = "ABB F95 Typ US770";
                    break;
            }
        }
        else if (manufacturer == "JAN")
        {
            if (header.medium == this.const.MBUS_VARIABLE_DATA_MEDIUM_ELECTRICITY)
            {
                switch (header.version)
                {
                    case 0x09:
                        res = "Janitza UMG 96S";
                        break;
                }
            }
        }
        else if (manufacturer == "LUG")
        {
            switch (header.version)
            {
                case 0x02:
                    res = "Landis & Gyr Ultraheat 2WR5";
                    break;
                case 0x03:
                    res = "Landis & Gyr Ultraheat 2WR6";
                    break;
                case 0x04:
                    res = "Landis & Gyr Ultraheat UH50";
                    break;
                case 0x07:
                    res = "Landis & Gyr Ultraheat T230";
                    break;
            }
        }
        else if (manufacturer == "LSE")
        {
            switch (header.version)
            {
                case 0x99:
                    res = "Siemens WFH21";
                    break;
            }
        }
        else if (manufacturer == "NZR")
        {
            switch (header.version)
            {
                case 0x01:
                    res = "NZR DHZ 5/63";
                    break;
                case 0x50:
                    res = "NZR IC-M2";
                    break;
            }
        }
        else if (manufacturer == "RAM")
        {
            switch (header.version)
            {
                case 0x03:
                    res =  "Rossweiner ETK/ETW Modularis";
                    break;
            }
        }
        else if (manufacturer == "REL")
        {
            switch (header.version)
            {
                case 0x08:
                    res =  "Relay PadPuls M1";
                    break;
                case 0x12:
                    res =  "Relay PadPuls M4";
                    break;
                case 0x20:
                    res =  "Relay Padin 4";
                    break;
                case 0x30:
                    res =  "Relay AnDi 4";
                    break;
                case 0x40:
                    res =  "Relay PadPuls M2";
                    break;
            }
        }
        else if (manufacturer == "RKE")
        {
            switch (header.version)
            {
                case 0x69:
                    res = "Ista sensonic II mbus";
                    break;
            }
        }
        else if (manufacturer == "SBC")
        {
            /*
            switch (header->id_bcd[3])
            {
                case 0x10:
                case 0x19:
                    res = "Saia-Burgess ALE3";
                    break;
                case 0x11:
                    res = "Saia-Burgess AWD3";
                    break;
            }
            */
        }
        else if (manufacturer == "SEN")
        {
            switch (header.version)
            {
                case 0x0B:
                    res = "Sensus PolluTherm";
                    break;
                case 0x0E:
                    res = "Sensus PolluStat E";
                    break;
                case 0x19:
                    res = "Sensus PolluCom E";
                    break;
            }
        }
        else if (manufacturer == "SON")
        {
            switch (header.version)
            {
                case 0x0D:
                    res = "Sontex Supercal 531";
                    break;
            }
        }
        else if (manufacturer == "SPX")
        {
            switch (header.version)
            {
                case 0x31:
                case 0x34:
                    res = "Sensus PolluTherm";
                    break;
            }
        }
        else if (manufacturer == "SVM")
        {
            switch (header.version)
            {
                case 0x08:
                    res = "Elster F2 / Deltamess F2";
                    break;
                case 0x09:
                    res = "Elster F4 / Kamstrup SVM F22";
                    break;
            }
        }
        else if (manufacturer == "TCH")
        {
            switch (header.version)
            {
                case 0x26:
                    res = "Techem m-bus S";
                    break;
            }
        }
        else if (manufacturer == "ZRM")
        {
            switch (header.version)
            {
                case 0x81:
                    res = "Minol Minocal C2";
                    break;
                case 0x82:
                    res = "Minol Minocal WR3";
                    break;
            }
        }

    }

    return res;
};