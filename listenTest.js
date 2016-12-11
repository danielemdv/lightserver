/*
 * This is a server implementation to control the smart street light implemented with an arduino yun.
 * (the smart street light project can be found at https://github.com/gangsterdan/lightitup)
 * 
 * This server implementation can be found at https://github.com/gangsterdan/lightserver
 * 
 * The objective is simple. Since the arduino has a light sensor and a motion sensor, the server 
 * can give it instructions to turn on with a certain light intensity or completely off.
 * 
 * The precedence of these measurments should be light > motion, since even if there is human motion detected,
 * the light should only turn on if there isn't daylight.
 *   
 * */



//Requirements and initialization.
var express = require('express') //Express is the nodejs framework we will use to create a RESTful API (We will use only GET and POST)
var bodyParser = require('body-parser'); //This is a module that will be used to parse JSON text to JSON objects.
var multer = require('multer'); // v1.0.5
var fs = require('fs');
var path = require("path");
var upload = multer(); // for parsing multipart/form-data
var app = express(); //create the app




//Variables
var globalOutput = 50;
var lightThreshold = 400;
var override = 0;
var overrideValue = 100;
//Variables for light output level



app.use(bodyParser.json()); // for parsing 'application/json'
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

//Le decimos al programa que tengamos acceso a los archivos estaticos de cierta carpeta (carpeta /public)
app.use(express.static('public'));


//Le estamos pasando una funcion que estamos construyendo on the fly al framework. Lo que pongamos en res.send(...) se le manda al cliente que nos accedio con el url simple (e.g. localhost:8081/)
app.get('/', function(req, res){
	res.send("Hello World! I'm a server designed to run an intelligent lighting system!");
})


//Regresar que el servidor esta funcionado si se accede a el url '/status'
app.get('/status', function(req, res){
	res.send("Server is running OK");
})

//Recieve a JSON object at the url /clientupdate This will be the arduino's point of communication with the server.
app.post('/clientupdate',upload.array(), function(req, res){
	
	//If a json string was passed it becomes automatically parsed as a json object in req.body this means we can get the key values from req.body.keyName
	
	//console.log("clientupdate POST called"); //Just a little heads up to know what's goin' on.
	
	//Call function to handle the data recieved from the arduino and what to send back. (all in JSON format)
	var output = handleInput(req.body); //Pass in the JSON object of the arduino's message.
	
	console.log("Output instruction: " + output); //Print the output that will be sent to the arduino to the console.
	
	//globalOutput = output;
	
	
	//Log the data to the CSV
		//Tendre que pasarle (light, motion, output value, timestamp)
	logData(req.body, output);

	
	res.send(output); //Send the JSON string with the lightIntensity back to the arduino
	//res.send(output); //original, pal debugging
	
	/*Notas
	 * JSON.stringify(JSONOBJECT) nos devuelve el string del json.
	 * JSON.parse(JSONSTRING) nos devuelve el objeto json.
	 * */
})

//Function to handle what to respond according to the arduino's state. returns a JSON string that will be sent to the arduino.
function handleInput(objIn){
		//Remember precedence: light > motion.
		
		//Extracting values for light, motion from the JSON object.
		var l = objIn.light;
		var m = objIn.motion;
		
		//Logging received values
		
		console.log("Light sensor in: " + l);
		console.log("Motion sensor in: " + m);
		
		
		//Variable for how the light will be set.
		var out = 0; //Will take values from 0 to 10 (off to 100% intensity)
		
		
		//Check to see if override is turned on.
		if(override == 0){
			// light less than threshold and no motion
			if((l < lightThreshold) && (m == 0))
			{
				out = 20; //20% intensity
			}
			// light less than threshold and motion!
			else if((l < lightThreshold) && (m == 1))
			{
				out = 100; //100% intensity
			}
			else//This means ambient light is >=threshold so we'll turn our street light off
			{
				//Aqui debe ser 0
				out = 0; //off
			}
		
		}else if(override == 1){
			out = overrideValue;
		}
		
		//COMMENTED FOR TESTING
		//var jsonRes = '{"lightIntensity":' + out + '}'; //No optional overrides. just conventional response.
		//return jsonRes;
		return out + "";
	
}

function logData(objIn, out){
//Logs light, motion, output, timestamp

	var l = objIn.light;
	var m = objIn.motion;
	
	var date = new Date().getTime();
	
	fs.appendFile("./public/data/data.csv", l + "," + m + "," + out + "," + date + "\n", function(err) {
    	if(err) {
        	return console.log(err);
    	}

    		console.log("log to csv succesful");
		}); 
	
	
}

app.post('/updatethreshold',upload.array(), function(req, res){
	
	//If a json string was passed it becomes automatically parsed as a json object in req.body this means we can get the key values from req.body.keyName
	
	console.log("updatethreshold POST called"); //Just a little heads up to know what's goin' on.
	
	var input = req.body.threshold;
	console.log("Received new threshold: " + input);
	
	
	lightThreshold = input;
	
	res.send("New light threshold set to: " + input);
	
})



app.get('/updateoverride',upload.array(), function(req, res){
	res.sendFile(path.join(__dirname+'/public/html/controlpanel.html'));
})

app.post('/updateoverride',upload.array(), function(req, res){
	
	//Recieves JSON {"override":0,"overrideValue":80}
	//override 0 for false 1 for true
	//overrideValue int in [0,100] for percentage of light intensity.
	
	
	var over = req.body.override;
	var overVal = req.body.overrideValue;
	var thresh = req.body.threshold;
	
	//Check if values are in the appropriate ranges
	if((over>=0 && over <= 1) && (overVal >= 0 && overVal <= 100) && (thresh >= 0 && thresh <= 1023)){
		console.log("Received new override, value, threshold: " + over + ", " + overVal + ", " + thresh);
	
		override = over;
		overrideValue = overVal;
		lightThreshold = thresh;
	
		res.send("Override settings now set to: " + over + ", " + overVal);	
		
	}else{
		res.send("ERROR: Override or threshold setting values out of range");
	}
	
	
	
})


app.get('/getupdatevalue', function(req, res){
		res.send(globalOutput);
})



//Aqui tambien, le decimos que es lo que va a ejecutar cuando hace listen...
var server = app.listen(8081, function(){
	var host = server.address().address
	var port = server.address().port
	
	
	console.log("Example app listening at http://" + host + ":" + port)
})
