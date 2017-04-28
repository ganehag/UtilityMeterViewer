# Utility Meter Viewer
A Chrome OS application to read information from M-Bus, IEC61107 and Kamstrup 6XX/8XX (KMP) utility meters.

# Features
- Read M-Bus from adress 1-254 using 300, 600, 1200, 2400, 4800 or 9600 baud.
- Supports "optical wake-up" using ~2 seconds of 'U' characters.
- Can perform basic querying of IEC61107.
- Can read data from Kamstrup 6XX/8XX meters.

# Limitations
- Can only read data. Does not have the ability to write any settings to the utility meter.
- Does not understand 'multi-frame' M-Bus telegrams.
- Can not handle M-Bus secondary adresses.
- 

