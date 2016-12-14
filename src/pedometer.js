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

        var windowSize=config.windowSize*samplingrate,
            taoMin=config.minStepTime*samplingrate;
            
        var verticalComponent=extractVerticalComponent(accelerometerData,attitudeData);
        var steps=[];
        var window=[];//verticalComponent.slice(0,windowSize);
        var lastPeak=-Infinity;
        var offset=Math.ceil(windowSize/2);
        var i,j;
        var windowMax=-Infinity;
        var windowSum=0;
        for (i=0;i<windowSize;i++){
            window[i]=verticalComponent[i];
            windowSum+=window[i];
            if (window[i]>windowMax){
                windowMax=window[i];
            }
        }
        if (windowMax>config.maxPeak){
            windowMax=config.maxPeak;
        }
        else if (windowMax<config.minPeak){
            windowMax=config.minPeak;
        }

        for (i=offset;i<verticalComponent.length-offset-1;i++){
            
            if (verticalComponent[i]-(windowSum/windowSize)>config.peakThreshold*windowMax &&
                verticalComponent[i]>=verticalComponent[i-1] &&
                verticalComponent[i]<verticalComponent[i+1] &&
                lastPeak<i-taoMin){
                steps.push(i);
                lastPeak=i;
            }
            window.push(verticalComponent[i+offset]);
            var removed=window.shift();
            windowSum+=verticalComponent[i+offset]-removed;
            if (removed==windowMax || verticalComponent[i+offset]>windowMax){
                windowMax=-Infinity;
                for (j=0;j<windowSize;j++){
                    if (window[j]>windowMax){
                        windowMax=window[j];
                    }
                }
                if (windowMax>config.maxPeak){
                    windowMax=config.maxPeak;
                }
                else if (windowMax<config.minPeak){
                    windowMax=config.minPeak;
                }
            }
        }
        
        return steps;           
    }
};

