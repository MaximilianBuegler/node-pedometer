# node-pedometer
Pedometer implementation for node.js

#Notes
    Uses windowed average peak counting algorithm step detection.
    
    Assumes all input data to be 2D arrays

    [[x1, y1, z1], [x2, y2, z2],...]
    [[pitch1, roll1, yaw1]. [pitch2, roll2, yaw2],... ] (in Radians)


# Installation
    npm install pedometer --save

# Usage
    var pedometer = require('../').pedometer;

    var steps=pedometer(accelerometerData,attitudeData,100);

# Test
    npm test

Returns:

  Detect steps in acceleration signal
    ✓ Signal of long walk (186ms)
    ✓ Signal of random movement (577ms)


  2 passing (772ms)


