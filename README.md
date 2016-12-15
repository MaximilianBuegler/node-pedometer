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
    var steps=pedometer(accelerometerData,attitudeData,samplingrate,options);
    
accelerometerdata is a time series of 3D acceleration vectors in m/s^2
[[x1, y1, z1], [x2, y2, z2],...]

attitudeData is a time series of 3D attitude vectors in radians
[[pitch1, roll1, yaw1]. [pitch2, roll2, yaw2],... ]

samplingrate is the number of samples per second. All tests were done with 100Hz

options provides optional parameters. Default values are:

    options={
        windowSize:1, //Length of window in seconds
        minPeak:2, //minimum magnitude of a steps largest positive peak
        maxPeak:8, //maximum magnitude of a steps largest positive peak
        minStepTime: 0.4, //minimum time in seconds between two steps
        peakThreshold: 0.5, //minimum ratio of the current window's maximum to be considered a step
        minConsecutiveSteps: 3, //minimum number of consecutive steps to be counted
        maxStepTime: 0.8, //maximum time between two steps to be considered consecutive
        meanFilterSize: 1 //Amount of smoothing (Values <=1 disable the smoothing)
        debug:false //Enable output of debugging data in matlab format
        }

Returns an array of the indices in the input signal where steps occured

# Test
    npm test

Returns:

            Detect steps in acceleration signal
      The algorithm detected 116 steps.
          ✓ Test 1 - Signal of walk 1 (194ms)
      The algorithm detected 287 steps.
          ✓ Test 2 - Signal of walk 2 (442ms)
      The algorithm detected 25 steps.
          ✓ Test 3 - Signal of walk 3 (48ms)
      The algorithm detected 26 steps.
          ✓ Test 4 - Signal of walk 4 (49ms)
      The algorithm detected 477 steps.
          ✓ Test 5 - Signal of walk 5 (730ms)
      The algorithm detected 8 steps.
          ✓ Test 6 - Signal of not walking 1 (544ms)
      The algorithm detected 0 steps.
          ✓ Test 7 - Signal of not walking 2 (126ms)
      The algorithm detected 20 steps.
          ✓ Test 8 - Signal of not walking 3 (738ms)
      The algorithm detected 0 steps.
          ✓ Test 9 - Signal of not walking 4 (830ms)
      The algorithm detected 23 steps.
          ✓ Test 10 - Signal of not walking 5 (234ms)
      
      
        10 passing (4s)



