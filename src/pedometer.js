/*===========================================================================*\
 * Pedometer algorithm for node.js
 *
 * Uses autocorrelation and neural networks for robust step detection.
 *
 * (c) 2016 Maximilian Bügler
 *
 *===========================================================================*/


var fs = require('fs');
var network = require('synaptic').Network;
var extractVerticalComponent = require('kinetics').extractVerticalComponent;
var autocorrelation = require('autocorrelation').autocorrelation;
var neuralnetwork=network.fromJSON(JSON.parse(fs.readFileSync('./data/neuralnetwork.json','utf8')));
var stats = require("stats-lite");
var fft = require('fft-js').fft;

var config={
    windowTime: 3,
    windowStep: 0.5,
    minStepTime: 0.4,
    maxStepTime: 2,
    autocorrelationThreshold: 0.6,
    neuralnetworkInputSize: neuralnetwork.inputs()
};

module.exports = {
    pedometer: function pedometer(accelerometerData, attitudeData, samplingrate){
        var verticalComponent=extractVerticalComponent(accelerometerData,attitudeData);
        var taoMin=config.minStepTime*samplingrate;
        var taoMax=config.maxStepTime*samplingrate; //one step lasts between taoMin and taoMax samples
        var windowSize=config.windowTime*samplingrate;
        var windowStep=config.windowStep*samplingrate; //The window of windowSize is moved along in steps of size windowStep
        var windowedAcf=[]; //windowed signal
        
        var i,j,k; //loop counters
        k=0; //index in windowed signal
        //Shift window along vertical component signal
        for (i=0;i<verticalComponent.length-windowSize-1; i+=windowStep){
            
            //console.log(verticalComponent.slice(i,i+windowSize));
            
            //Autocorrelation of signal segment in window
            var acf=autocorrelation(verticalComponent.slice(i,i+windowSize));
            
            //Find minimal step lag with autocorrelation exceeding threshold
            //  in the lag range taoMin:taoMax
            var minCorrelatedStepLag=[i,0,0];
            for (j=taoMin;j<=taoMax;j++){
                if (acf[j]>acf[j+1] && acf[j]>config.autocorrelationThreshold){
                    minCorrelatedStepLag=[i,j,acf[j]]; //Time, lag, autocorrelation
                }
            }
            
            //Accumulate results in windowed signal array
            windowedAcf[k++]=minCorrelatedStepLag;
        }
        
        var windowedClassification=[[0,0]];
        
        var signalLength=(config.neuralnetworkInputSize-3)/1.5;
        
        //var l=0;
        for (i=1;i<verticalComponent.length-taoMin; i++){
            if(typeof windowedClassification[i] === 'undefined') {
                windowedClassification[i]=[i,0];
            }


            
            //if i is a local minimum
            if (verticalComponent[i]<=verticalComponent[i-1] && verticalComponent[i]<verticalComponent[i+1]){
                
                //Find a second local minimum taoMin-taoMax in the future
                for (j=i+taoMin;j<=i+taoMax && j+1<verticalComponent.length;j++){
                    if (verticalComponent[j]<=verticalComponent[j-1] && verticalComponent[i]<verticalComponent[j+1]){

                        var stepdata=verticalComponent.slice(i,j);
                    
                        
                    
                        var inputdata=[];
                        for (k=0;k<signalLength;k++){
                            var scaledPosition=k*stepdata.length/signalLength;
                            //Linear interpolation
                            inputdata[k]=stepdata[Math.floor(scaledPosition)]*(1-(scaledPosition%1))+stepdata[Math.ceil(scaledPosition)]*(scaledPosition%1);
                        }

                        var freq=fft(inputdata);
                        for (k=0;k<signalLength/2;k++){
                            inputdata[signalLength+k]=Math.pow(freq[k][0],2)+Math.pow(freq[k][1],2);
                        }
                        
                        
                        inputdata[1.5*signalLength]=stats.mean(stepdata);
                        inputdata[1.5*signalLength+1]=stats.variance(stepdata);
                        inputdata[1.5*signalLength+2]=stepdata.length;
                        
                        //Input candidate to network
                        var activation=neuralnetwork.activate(inputdata);
                        
                        //Save result
                        for (k=i;k<j;k++)
                            windowedClassification[k]=[k, activation];
                        
                        //If result is positive, we do not need to look for another step in the interval.
                        if (activation>0.9){
                            //i=j;
                            break;
                        }
                    }
                }
            }
        }

        console.log("WACF=[...");
        for (i=0;i<windowedAcf.length;i++){
            console.log(windowedAcf[i][0]+","+windowedAcf[i][1]+","+windowedAcf[i][2]+";...");
        }
        console.log("];");
        console.log("VERT=[...");
        for (i=0;i<verticalComponent.length;i++){
            console.log(verticalComponent[i]+";...");
        }
        console.log("];");
        console.log("NNACT=[...");
        for (i=0;i<windowedClassification.length;i++){
            console.log(windowedClassification[i][0]+","+windowedClassification[i][1]+";...");
        }
        console.log("];");        
    }
    

};

function average2D(arr, wl) {
    function average(arr) {
        var acc = [];
        var i,j;
        for (j = 0; j < arr[0].length; j++) {
            acc[j]=0;
        }
        for (i = 0; i < arr.length; i++) {
            for (j = 0; j < arr[i].length; j++) {
                acc[j] += arr[i][j];
            }
        }
        for (j = 0; j < arr[0].length; j++) {
            acc[j]/=arr.length;
        }
        return acc;
    }

    wl = wl || 3;

    var w = [];
    var f = [];
    for (var i = 0; i < arr.length; i++) 
    {
        if (w.length >= wl)
            w.shift();

        w.push(arr[i]);

        f.push(average(w));
    }

    return f;
}

var parse = require('csv-parse/lib/sync');
var stepdata=fs.readFileSync('./test/DataNoise1.csv','utf8');
hikedata=parse(stepdata, {trim: true, auto_parse: true,relax_column_count:true });
var acc=[],att=[];
for (var i=0;i<hikedata.length;i++){
    acc[i]=hikedata[i].slice(0,3);
    att[i]=[hikedata[i][4], -hikedata[i][5],hikedata[i][3]];
    
}

//acc=average2D(acc,3);
//att=average2D(att,3);

module.exports.pedometer(acc,att,100);