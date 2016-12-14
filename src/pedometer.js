/*===========================================================================*\
 * Pedometer algorithm for node.js
 *
 * Uses windowed average peak counting algorithm step detection.
 *
 * (c) 2016 Maximilian Bügler
 * 
 * Assumes all data to be 2D arrays
 *
 * [[x1, y1, z1],[x2, y2, z2],...]
 * [[pitch1, roll1, yaw1]. [pitch2, roll2, yaw2],... ] (in Radians)
 *
 *===========================================================================*/



var extractVerticalComponent = require('kinetics').extractVerticalComponent;

var config={
    windowSize:1, //Length of window in seconds
    minPeak:3, //minimum magnitude of a steps largest positive peak
    maxPeak:8, //maximum magnitude of a steps largest positive peak
    minStepTime: 0.4, //minimum time in seconds between two steps
    peakThreshold: 0.6, //minimum ratio of the current window's maximum to be considered a step
};

module.exports = {
    pedometer: function pedometer(accelerometerData, attitudeData, samplingrate){

        //Calcualte minimal step time and windowsize from samplingrate
        var windowSize=config.windowSize*samplingrate,
            taoMin=config.minStepTime*samplingrate;
            
        //extract vertical component from input signals
        var verticalComponent=extractVerticalComponent(accelerometerData,attitudeData);
        
        //array to output indices where steps occur
        var steps=[];
        
        //array to store current window
        var window=[];
        
        //index of last step
        var lastPeak=-Infinity;
        
        //offset is half the window size, we can't detect steps in the first and last half seconds of the signal.
        var offset=Math.ceil(windowSize/2);
        
        //Iteration indices
        var i,j;
        
        //Maximum value in current window
        var windowMax=-Infinity;
        
        //Sum of values in current window
        var windowSum=0;
        
        //Fill intial window
        for (i=0;i<windowSize;i++){
            
            //assign values
            window[i]=verticalComponent[i];
            
            //Add to sum
            windowSum+=window[i];
            
            //Note down maximum value
            if (window[i]>windowMax){
                windowMax=window[i];
            }
        }
        
        //If maximum exceeds the maximum likely peak for a step, upper bound it.
        if (windowMax>config.maxPeak){
            windowMax=config.maxPeak;
        }
        
        //If maximum is lower than minimum likely peak for a step, lower bound it, there's probably no walking happening within the window.
        else if (windowMax<config.minPeak){
            windowMax=config.minPeak;
        }

        //Iterate through signal
        for (i=offset;i<verticalComponent.length-offset-1;i++){
            
            //If the current value minus the mean value of the current window is larger than the thresholded maximum
            //and the values decrease after i, but increase prior to i
            //and the last peak is at least taoMin steps before
            //
            //Then add the current index to the steps array and note it down as last peak
            if (verticalComponent[i]-(windowSum/windowSize)>config.peakThreshold*windowMax &&
                verticalComponent[i]>=verticalComponent[i-1] && 
                verticalComponent[i]<verticalComponent[i+1] &&
                lastPeak<i-taoMin){
                steps.push(i);
                lastPeak=i;
            }
            
            //Push next value to the end of the window
            window.push(verticalComponent[i+offset]);
            
            //remove value from the start of the window
            var removed=window.shift();
            
            //Update sum of window by substracting the removed and adding the added value
            windowSum+=verticalComponent[i+offset]-removed;
            
            //If the removed value was the maximum or the new value exceeds the old maximum, we recheck the window
            if (removed==windowMax || verticalComponent[i+offset]>windowMax){
                
                //Intialize new maximum
                windowMax=-Infinity;
                
                //Iterate over window
                for (j=0;j<windowSize;j++){
                    if (window[j]>windowMax){
                        windowMax=window[j];
                    }
                }
                
                //If maximum exceeds the maximum likely peak for a step, upper bound it.
                if (windowMax>config.maxPeak){
                    windowMax=config.maxPeak;
                }
                
                //If maximum is lower than minimum likely peak for a step, lower bound it, there's probably no walking happening within the window.
                else if (windowMax<config.minPeak){
                    windowMax=config.minPeak;
                }
            }
        }
        
        //Return array of steps
        return steps;           
    }
};

