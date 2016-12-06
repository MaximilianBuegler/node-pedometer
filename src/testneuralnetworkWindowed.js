var network = require('synaptic').Network;
var parse = require('csv-parse/lib/sync');
var fs = require('fs');
var fft = require('fft-js').fft;
var kinetics = require('kinetics');
var autocorrelation = require('autocorrelation').autocorrelation;

/**
 * Based on Zhang, S., Rowlands, A. V., Murray, P., & Hurst, T. L. (2012). Physical activity classification using the GENEA wrist-worn accelerometer. Medicine and Science in Sports and Exercise, 44(4), 742-748. https://doi.org/10.1249/MSS.0b013e31823bf95c
 * Zhang uses a 128 samples window at a sampling rate of 10Hz, hence 12.8 seconds, as we have 100Hz, and powers of 2 are computationally more efficient for the algorithm, we use a window of 1024 samples, hence 10,24 seconds.
 **/
var timeWindow=512; //Must be power of 2
var timeStep=16; //Stepsize in samples of window to be slided along signal
var fftPeakCount=5; //Number of dominant frequencies to take into account
var autocorrelationPeakCount=5;
var binCount=10; //Bins according to Kwapisz, et al 2011
var taoMin=0.4;
var taoMax=2.0;




function getFFTPeaks(segment,fftPeakCount,samplingRate){
    var i,j;
    var n=segment.length;
    var res={
        fftPeaksMagnitude:[],
        fftPeaks:[]
        };
    var fftRes=fft(segment);
    var fftPeaks=[];
    for (j=0;j<fftPeakCount;j++){
        fftPeaks[j]=[0,0];
    }
    for (i=0;i<n/2;i++){
        var val=Math.sqrt(Math.pow(fftRes[i][0],2)+Math.pow(fftRes[i][1],2));
        for (j=0;j<fftPeakCount;j++){
            if (val>fftPeaks[j][0]){
                fftPeaks.splice(j,0,[val, samplingRate*(i+1)/n]);
                fftPeaks.pop();
                break;
            }
        }
    }
    for (j=0;j<fftPeakCount;j++){
        res.fftPeaksMagnitude[j]=fftPeaks[j][0];
        res.fftPeaks[j]=fftPeaks[j][1];
    }
    return res;
}

function getAutocorrelationPeaks(segment,autocorrelationPeakCount,samplingRate){
    var i,j;
    var res={
        autocorrelationValues:[],
        autocorrelationPeaks:[]
        };
        
    var autocorrelationRes=autocorrelation(segment);
    
    var autocorrelationPeaks=[];
    for (j=0;j<autocorrelationPeakCount;j++){
        autocorrelationPeaks[j]=[0,0];
    }
    for (i=taoMin*samplingRate;i<=taoMax*samplingRate;i++){
        for (j=0;j<autocorrelationPeakCount;j++){
            if (autocorrelationRes[i]>autocorrelationPeaks[j][0]){
                autocorrelationPeaks.splice(j,0,[autocorrelationRes[i], i/samplingRate]);
                autocorrelationPeaks.pop();
                break;
            }
        }
    }
    for (j=0;j<autocorrelationPeakCount;j++){
        res.autocorrelationValues[j]=autocorrelationPeaks[j][0];
        res.autocorrelationPeaks[j]=autocorrelationPeaks[j][1];
    }    
    return res;
}

function getMetrics(segment, samplingRate){
    var res={
        mean:[0, 0, 0],
        stddev:[0, 0, 0],
        aad:[0, 0, 0],
        min:[Infinity, Infinity, Infinity],
        max:[-Infinity, -Infinity, -Infinity],
        ara:0,
        bins:[[], [], []],
        fftPeaks:[],
        fftPeaksMagnitude:[],
        autocorrelationPeaks:[],
        autocorrelationValues:[]
        };
    var i, bin;
    
    var n=segment.length;
    
    var acc=[];
    var att=[];
    for (i=0;i<n;i++){
        acc[i]=segment[i].slice(0,3);
        att[i]=[segment[i][4], -segment[i][5],segment[i][3]];
    }
    segment=kinetics.rotateSignal(acc,att);
    
    
    
    for (i=0;i<n;i++){
        res.mean[0]+=segment[i][0];
        res.mean[1]+=segment[i][1];
        res.mean[2]+=segment[i][2];
        res.stddev[0]+=Math.pow(segment[i][0],2);
        res.stddev[1]+=Math.pow(segment[i][1],2);
        res.stddev[2]+=Math.pow(segment[i][2],2);
        res.ara+=Math.pow(segment[i][0],2)+Math.pow(segment[i][1],2)+Math.pow(segment[i][2],2);
        res.max[0]=Math.max(segment[i][0],res.max[0]);
        res.max[1]=Math.max(segment[i][1],res.max[1]);
        res.max[2]=Math.max(segment[i][2],res.max[2]);
        res.min[0]=Math.min(segment[i][0],res.min[0]);
        res.min[1]=Math.min(segment[i][1],res.min[1]);
        res.min[2]=Math.min(segment[i][2],res.min[2]);
    }
    
    res.mean[0]/=n;
    res.mean[1]/=n;
    res.mean[2]/=n;

    res.ara/=n;
    
    res.stddev[0]=res.stddev[0]/segment.length-Math.pow(res.mean[0],2);
    res.stddev[1]=res.stddev[1]/segment.length-Math.pow(res.mean[1],2);
    res.stddev[2]=res.stddev[2]/segment.length-Math.pow(res.mean[2],2);
    
    for (i=0;i<binCount;i++){
        res.bins[0][i]=0;
        res.bins[1][i]=0;
        res.bins[2][i]=0;
    }
    for (i=0;i<n;i++){
        res.aad[0]+=Math.abs(res.mean[0]-segment[i][0]);
        res.aad[1]+=Math.abs(res.mean[1]-segment[i][1]);
        res.aad[2]+=Math.abs(res.mean[2]-segment[i][2]);
        bin=Math.floor(binCount*(segment[i][0]-res.min[0])/(res.max[0]-res.min[0]));
        res.bins[0][Math.min(binCount-1,bin)]++;
        bin=Math.floor(binCount*(segment[i][1]-res.min[1])/(res.max[1]-res.min[1]));
        res.bins[1][Math.min(binCount-1,bin)]++;
        bin=Math.floor(binCount*(segment[i][2]-res.min[2])/(res.max[2]-res.min[2]));
        res.bins[2][Math.min(binCount-1,bin)]++;
    }
    
    var components={
        x:[],y:[],z:[]
    };
    for (i=0;i<n;i++){
        components.x[i]=segment[i][0];
        components.y[i]=segment[i][1];
        components.z[i]=segment[i][2];
    }
    
    var fftRes={
        x:getFFTPeaks(components.x,fftPeakCount, samplingRate),
        y:getFFTPeaks(components.y,fftPeakCount, samplingRate),
        z:getFFTPeaks(components.z,fftPeakCount, samplingRate)
    };
    res.fftPeaks[0]=fftRes.x.fftPeaks;
    res.fftPeaksMagnitude[0]=fftRes.x.fftPeaksMagnitude;
    res.fftPeaks[1]=fftRes.y.fftPeaks;
    res.fftPeaksMagnitude[1]=fftRes.y.fftPeaksMagnitude;
    res.fftPeaks[2]=fftRes.z.fftPeaks;
    res.fftPeaksMagnitude[2]=fftRes.z.fftPeaksMagnitude;
    
    var autocorrelationRes={
        x:getAutocorrelationPeaks(components.x,autocorrelationPeakCount,samplingRate),
        y:getAutocorrelationPeaks(components.y,autocorrelationPeakCount,samplingRate),
        z:getAutocorrelationPeaks(components.z,autocorrelationPeakCount,samplingRate)
    };
    res.autocorrelationPeaks[0]=autocorrelationRes.x.autocorrelationPeaks;
    res.autocorrelationValues[0]=autocorrelationRes.x.autocorrelationValues;
    res.autocorrelationPeaks[1]=autocorrelationRes.y.autocorrelationPeaks;
    res.autocorrelationValues[1]=autocorrelationRes.y.autocorrelationValues;
    res.autocorrelationPeaks[2]=autocorrelationRes.z.autocorrelationPeaks;
    res.autocorrelationValues[2]=autocorrelationRes.z.autocorrelationValues;

   
    return res;
}

function generateDataForSegment(segment, Samplingrate){
       /**
         * Based on Kwapisz, J. R., Weiss, G. M., & Moore, S. a. (2011). Activity recognition using cell phone accelerometers. ACM SIGKDD Explorations Newsletter, 12(2), 74. https://doi.org/10.1145/1964897.1964918, J. R., Weiss, G. M., & Moore, S. a. (2011). Activity recognition using cell phone accelerometers. ACM SIGKDD Explorations Newsletter, 12(2), 74. https://doi.org/10.1145/1964897.1964918
         * Kwapisz uses the time window prposed by Zhang and provides a list of features. 
         **/
        var metrics=getMetrics(segment,Samplingrate);
        var inputdata=[];
        var i,j,k=0;
        for (i=0;i<3;i++){
            inputdata[k++]=metrics.mean[i];
            inputdata[k++]=metrics.stddev[i];
            inputdata[k++]=metrics.aad[i];
            inputdata[k++]=metrics.min[i];
            inputdata[k++]=metrics.max[i];
            
        }

        inputdata[k++]=metrics.ara;
        for (i=0;i<3;i++){
            for (j=0;j<metrics.bins[i].length;j++){
                inputdata[k++]=metrics.bins[i][j];
            }
        }
        for (i=0;i<3;i++){
            for (j=0;j<metrics.fftPeaks[i].length;j++){
                inputdata[k++]=metrics.fftPeaks[i][j];
                inputdata[k++]=metrics.fftPeaksMagnitude[i][j];
            }
        }
        for (i=0;i<3;i++){
            for (j=0;j<metrics.autocorrelationPeaks[i].length;j++){
                inputdata[k++]=metrics.autocorrelationPeaks[i][j];
                inputdata[k++]=metrics.autocorrelationValues[i][j];
            }
        }
        //console.log(inputdata);
        return inputdata;
        
}

var neuralnetwork=network.fromJSON(JSON.parse(fs.readFileSync('./data/neuralnetworkWindowed3.json','utf8')));

var offset,segment;

var walkingdata=parse(fs.readFileSync('./data/DataByTheFrog.csv','utf8'), {trim: true, auto_parse: true });

var res=[];
var inputData=[];

for (offset=0;offset<walkingdata.length-timeWindow;offset+=timeStep){
    segment=walkingdata.slice(offset,offset+timeWindow);
 
    var input=generateDataForSegment(segment, 100);
    var activation=neuralnetwork.activate(input);
    
    //console.log(input);
    
    
    for (var i=0;i<timeStep;i++){
        inputData[offset+i]=walkingdata[offset+i][2];
        res[offset+i]=activation[0];
    }
}

console.log("input=[...");
for (i=0;i<inputData.length;i++){
    console.log(inputData[i]+";...");
}
console.log("];");

console.log("res=[...");
for (i=0;i<res.length;i++){
    console.log(res[i]+";...");
}
console.log("];");



