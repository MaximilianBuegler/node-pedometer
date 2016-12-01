var synaptic = require('synaptic');
var parse = require('csv-parse/lib/sync');
var fs = require('fs');
var stats = require('stats-lite');
var fft = require('fft-js').fft;

var stepdata=fs.readFileSync('./data/stepsCombo.csv','utf8');
stepdata=parse(stepdata, {trim: true, auto_parse: true,relax_column_count:true });


var nostepdata=fs.readFileSync('./data/noStepsCombo.csv','utf8');
nostepdata=parse(nostepdata, {trim: true, auto_parse: true,relax_column_count:true });


var set=[];

var signalLength=16;

var setcounter=0;
for (var i=0;i<stepdata.length;i++){
    if (stepdata[i].length>=signalLength){
        var inputdata=[];
        for (var j=0;j<signalLength;j++){
            var scaledPosition=j*stepdata[i].length/signalLength;
            //Linear interpolation
            inputdata[j]=stepdata[i][Math.floor(scaledPosition)]*(1-(scaledPosition%1))+stepdata[i][Math.ceil(scaledPosition)]*(scaledPosition%1);
        }

        var freq=fft(inputdata);
        for (var k=0;k<signalLength/2;k++){
            inputdata[signalLength+k]=Math.pow(freq[k][0],2)+Math.pow(freq[k][1],2);
        }
        
        inputdata[1.5*signalLength]=stats.mean(stepdata[i]);
        inputdata[1.5*signalLength+1]=stats.variance(stepdata[i]);
        inputdata[1.5*signalLength+2]=stepdata[i].length;
        //console.log(inputdata);
        set[setcounter++]={
            input:inputdata,
            output:[1]
        };
    }
}
for (var i=0;i<nostepdata.length;i++){
    if (nostepdata[i].length>=signalLength){    
        var inputdata=[];
        for (var j=0;j<signalLength;j++){
            var scaledPosition=j*nostepdata[i].length/signalLength;
            //Linear interpolation
            inputdata[j]=nostepdata[i][Math.floor(scaledPosition)]*(1-(scaledPosition%1))+nostepdata[i][Math.ceil(scaledPosition)]*(scaledPosition%1);
        }
        
        var freq=fft(inputdata);
        for (var k=0;k<signalLength/2;k++){
            inputdata[signalLength+k]=Math.pow(freq[k][0],2)+Math.pow(freq[k][1],2);
        }

        
        inputdata[1.5*signalLength]=stats.mean(nostepdata[i]);
        inputdata[1.5*signalLength+1]=stats.variance(nostepdata[i]);
        inputdata[1.5*signalLength+2]=nostepdata[i].length;
        //console.log(inputdata);
        set[setcounter++]={
            input:inputdata,
            output:[0]
        };
    }
}


var Trainer = synaptic.Trainer,
    Architect = synaptic.Architect;
var myPerceptron = new Architect.Perceptron(1.5*signalLength+3, 20,10, 1);
var trainer = new Trainer(myPerceptron);

function shuffle(o) { //v1.0
  for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
}

shuffle(set);

trainer.train(set,{
    rate: 0.001,
    iterations: set.length*2,
    error: 0.01,
    shuffle: true,
    log: 10,
    cost: Trainer.cost.MSE,
    crossValidate: {
        testSize: 0.4
    }
});


//myPerceptron.optimize();
fs.writeFileSync('./data/neuralnetwork.json',JSON.stringify(myPerceptron.toJSON()),'utf8');

console.log('trained with '+set.length+' samples. Final test MSE: '+trainer.test(set).error);