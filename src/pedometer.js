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

var defaults={
    windowSize:1, //Length of window in seconds
    minPeak:2, //minimum magnitude of a steps largest positive peak
    maxPeak:8, //maximum magnitude of a steps largest positive peak
    minStepTime: 0.4, //minimum time in seconds between two steps
    peakThreshold: 0.5, //minimum ratio of the current window's maximum to be considered a step
    minConsecutiveSteps: 3, //minimum number of consecutive steps to be counted
    maxStepTime: 0.8 //maximum time between two steps to be considered consecutive
};

module.exports = {
    pedometer: function pedometer(accelerometerData, attitudeData, samplingrate, options){

         //set default options. Factor in sampling rate where neccessary
        var windowSize=defaults.windowSize*samplingrate,
            taoMin=defaults.minStepTime*samplingrate,
            taoMax=defaults.maxStepTime*samplingrate,
            minPeak=defaults.minPeak,
            maxPeak=defaults.maxPeak,
            peakThreshold=defaults.peakThreshold,
            minConsecutiveSteps=defaults.minConsecutiveSteps;
            
    
        //Apply custom options. Factor in sampling rate where neccessary
        if (options){
            if (options.windowSize !== undefined)
                windowSize=options.windowSize*samplingrate;
            if (options.minStepTime !== undefined)
                taoMin=options.minStepTime*samplingrate;
            if (options.maxStepTime !== undefined)
                taoMax=options.maxStepTime*samplingrate;                                
            if (options.minPeak !== undefined)
                minPeak=options.minPeak;
            if (options.maxPeak !== undefined)
                maxPeak=options.maxPeak;
            if (options.peakThreshold !== undefined)
                peakThreshold=options.peakThreshold;
            if (options.minConsecutiveSteps !== undefined)
                minConsecutiveSteps=options.minConsecutiveSteps;                
        }
   
            
        //extract vertical component from input signals
        var verticalComponent=extractVerticalComponent(accelerometerData,attitudeData);
        
        //array to output indices where steps occur
        var steps=[];
        
        //array to store current window
        var window=[];
        
        //index of last step
        var lastPeak=-Infinity;
        
        //Number of consecutive Peaks
        var consecutivePeaks=0;
        
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
        if (windowMax>maxPeak){
            windowMax=maxPeak;
        }
        
        //If maximum is lower than minimum likely peak for a step, lower bound it, there's probably no walking happening within the window.
        else if (windowMax<minPeak){
            windowMax=minPeak;
        }

        //Iterate through signal
        for (i=offset;i<verticalComponent.length-offset-1;i++){
            
            //If the current value minus the mean value of the current window is larger than the thresholded maximum
            //and the values decrease after i, but increase prior to i
            //and the last peak is at least taoMin steps before
            //
            //Then add the current index to the steps array and note it down as last peak
            if (verticalComponent[i]-(windowSum/windowSize)>peakThreshold*windowMax &&
                verticalComponent[i]>=verticalComponent[i-1] && 
                verticalComponent[i]<verticalComponent[i+1] &&
                lastPeak<i-taoMin)
            {
                if (i-lastPeak>=taoMax){
                    if (consecutivePeaks<minConsecutiveSteps){
                        steps.pop();
                    }
                    consecutivePeaks=1;
                }
                else{
                    consecutivePeaks++;
                }
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
                if (windowMax>maxPeak){
                    windowMax=maxPeak;
                }
                
                //If maximum is lower than minimum likely peak for a step, lower bound it, there's probably no walking happening within the window.
                else if (windowMax<minPeak){
                    windowMax=minPeak;
                }
            }
        }
       
        //Return array of steps
        return steps;           
    }
};

