var network = require('synaptic').Network;
var fs = require('fs');
var neuralnetwork=network.fromJSON(JSON.parse(fs.readFileSync('./data/neuralnetwork.json','utf8')));
var neuralnetworkinputsize=neuralnetwork.layers.input.size;

function getPeakMetrics(stepdata){
    var inputdata=[];
    
    var signalLength=neuralnetworkinputsize;
    var j;
    var scaledPosition;
    
    for (j=0;j<signalLength;j++){
        scaledPosition=j*stepdata.length/signalLength;
        //Linear interpolation
        inputdata[j]=stepdata[Math.floor(scaledPosition)]*(1-(scaledPosition%1))+stepdata[Math.ceil(scaledPosition)]*(scaledPosition%1);
    }

    var min=Infinity,max=-Infinity;
    var sum=0,sum2=0;
    for (j=0;j<stepdata.length;j++){
        if (stepdata[j]<min)
            min=stepdata[j];
        if (stepdata[j]>max)
            max=stepdata[j];
        sum+=stepdata[j];
        sum2+=stepdata[j]*stepdata[j];
    }    
    
    inputdata[signalLength]=sum/stepdata.length;
    inputdata[signalLength+1]=(sum2/stepdata.length)-inputdata[signalLength]*inputdata[signalLength];
    inputdata[signalLength+2]=min;
    inputdata[signalLength+3]=max;
    return inputdata;
}

module.exports = function classifyPeak(signal,start,end){
    var stepdata=signal.slice(start,end);
    var input=getPeakMetrics(stepdata);
    return neuralnetwork.activate(input);
};