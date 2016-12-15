# node-pedometer
Pedometer implementation for node.js

# Notes
    Uses a windowed average peak counting algorithm to perform low-cost step detection.
    
    Assumes all input data to be 2D arrays

    [[x1, y1, z1], [x2, y2, z2],...]
    [[pitch1, roll1, yaw1]. [pitch2, roll2, yaw2],... ] (in Radians)


# Installation
    npm install pedometer --save

# Usage
    var pedometer = require('pedometer').pedometer;
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
        meanFilterSize: 1, //Amount of smoothing (Values <=1 disable the smoothing)
        debug:false //Enable output of debugging data in matlab format
        }

Returns an array of the indices in the input signal where steps occured
    
    See src/debug.js and test/test.js for more examples

# Example

Before you run this, make sure to have installed the modules fs and csv-parse.

    var pedometer = require('pedometer').pedometer,
        fs = require('fs'),
        parse = require('csv-parse/lib/sync');

    //Function to load Data from csv file
    function loadData(filename){
        
        //Load file
        var data=fs.readFileSync(filename,'utf8');
        
        //parse CSV
        data=parse(data, {trim: true, auto_parse: true});
        
        //Store data in arrays
        var acc=[],att=[];
        for (var i=0;i<data.length;i++){
            acc[i]=data[i].slice(0,3);
            att[i]=[data[i][4], -data[i][5],data[i][3]];   //Attitude is adjusted to correctly match [ pitch, roll, yaw ]
        }
        
        //Return arrays
        return {acc:acc,att:att};
    }
       
    //Load first test case
    var data=loadData('node_modules/pedometer/test/DataWalking1.csv');      //You might need to adjust the path here
    
    //Define algorithm options (optional). All recommended default values here.
    var options={
                    windowSize:1, //Length of window in seconds
                    minPeak:2, //minimum magnitude of a steps largest positive peak
                    maxPeak:8, //maximum magnitude of a steps largest positive peak
                    minStepTime: 0.4, //minimum time in seconds between two steps
                    peakThreshold: 0.5, //minimum ratio of the current window's maximum to be considered a step
                    minConsecutiveSteps: 3, //minimum number of consecutive steps to be counted
                    maxStepTime: 0.8, //maximum time between two steps to be considered consecutive
                    meanFilterSize: 1, //Amount of smoothing (Values <=1 disable the smoothing)
                    debug:false //Enable output of debugging data in matlab format
    };
            
    //Perform step detection. Leaving away ,options here (recommended), will use the default settings as specified above.
    var steps=pedometer(data.acc,data.att,100,options);
    
    //Print number of detected steps
    console.log("The algorithm detected "+steps.length+" steps.");

Output:

    The algorithm detected 116 steps.

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


# License

MIT License

Copyright (c) 2016 Maximilian Bügler

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
