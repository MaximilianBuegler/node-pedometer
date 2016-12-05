var synaptic = require('synaptic');
var parse = require('csv-parse/lib/sync');
var fs = require('fs');
var stats = require('stats-lite');
var fft = require('fft-js').fft;
var kinetics = require('kinetics');
var autocorrelation = require('autocorrelation').autocorrelation;

/**
 * Based on Zhang, S., Rowlands, A. V., Murray, P., & Hurst, T. L. (2012). Physical activity classification using the GENEA wrist-worn accelerometer. Medicine and Science in Sports and Exercise, 44(4), 742–748. https://doi.org/10.1249/MSS.0b013e31823bf95c
 * Zhang uses a 128 samples window at a sampling rate of 10Hz, hence 12.8 seconds, as we have 100Hz, and powers of 2 are computationally more efficient for the algorithm, we use a window of 1024 samples, hence 10,24 seconds.
 **/
var timeWindow=512; //Must be power of 2
var timeStep=128; //Stepsize in samples of window to be slided along signal
var fftPeakCount=5; //Number of dominant frequencies to take into account
var autocorrelationPeakCount=5;
var binCount=10; //Bins according to Kwapisz, et al 2011
var taoMin=0.4;
var taoMax=2.0;




function getFFTPeaks(segment,fftPeakCount,samplingRate){
    var i,j,k;
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
    var i,j,k;
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
    var i,j,k, bin;
    
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

function generateDataForSegment(segment, target, Samplingrate){
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
        return {
            input:inputdata,
            output:[target]
        };
        
}

var set=[];
var setcounter=0;
var offset,segment;

var walkingdata=[];
walkingdata[0]=fs.readFileSync('./data/DataHike.csv','utf8');
walkingdata[1]=fs.readFileSync('./data/DataLiving1.csv','utf8');
walkingdata[2]=fs.readFileSync('./data/DataLiving2.csv','utf8');
walkingdata[3]=fs.readFileSync('./data/DataLiving3.csv','utf8');
walkingdata[4]=fs.readFileSync('./data/DataLiving4.csv','utf8');
walkingdata[5]=fs.readFileSync('./data/DataLiving5.csv','utf8');
walkingdata[6]=fs.readFileSync('./data/DataLiving6.csv','utf8');

var negativeCounter=0,positiveCounter=0;

for (i=0;i<walkingdata.length;i++){
    walkingdata[i]=parse(walkingdata[i], {trim: true, auto_parse: true });
    
    for (offset=0;offset<walkingdata[i].length-timeWindow;offset+=timeStep){
        segment=walkingdata[i].slice(offset,offset+timeWindow);
        
  
        set[setcounter++]=generateDataForSegment(segment, 1, 100);
        positiveCounter++;
    }
}

var notWalkingData=[];
notWalkingData[0]=fs.readFileSync('./data/DataNoise1.csv','utf8');
notWalkingData[1]=fs.readFileSync('./data/DataNoise2.csv','utf8');



for (i=0;i<notWalkingData.length;i++){
    notWalkingData[i]=parse(notWalkingData[i], {trim: true, auto_parse: true });
    
    for (offset=0;offset<notWalkingData[i].length-timeWindow;offset+=timeStep){
        segment=notWalkingData[i].slice(offset,offset+timeWindow);
        
  
        set[setcounter++]=generateDataForSegment(segment, 0, 100);
        negativeCounter++;
    }
}
//set=JSON.parse(fs.readFileSync('./data/inputdata.json','utf8'));


var inputs=set[0].input.length;

console.log(inputs+" inputs "+positiveCounter+" positive samples and "+negativeCounter+ " negative samples");

var Trainer = synaptic.Trainer,
    Architect = synaptic.Architect;
var myPerceptron = new Architect.Perceptron(inputs, 10, 1);
var trainer = new Trainer(myPerceptron);


fs.writeFileSync("/tmp/inputdata.json",JSON.stringify(set));

function shuffle(o) { //v1.0
  for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
}

shuffle(set);

trainer.train(set,{
    rate: 0.001,
    iterations: 10000,//set.length*20,
    error: 0.01,
    shuffle: true,
    log: 10,
    cost: Trainer.cost.MSE,
    crossValidate: {
        testSize: 0.4
    }
});

/*function(targetValues, outputValues){
        if (targetValues[0]==0){
            if (outputValues[0]>0)
                return outputValues[0]*100;
            return Math.abs(outputValues[0]);
        }
        return Math.abs(1-outputValues[0]);
        },*/

//myPerceptron.optimize();
fs.writeFileSync('./data/neuralnetworkWindowed.json',JSON.stringify(myPerceptron.toJSON()),'utf8');

console.log('trained with '+set.length+' samples. Final test MSE: '+trainer.test(set).error);