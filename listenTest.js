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
 * the light should omly turn on if there isn't daylight.
 *   
 * */



//Requirements and initialization.
var express = require('express') //Express is the nodejs framework we will use to create a RESTful API (We will use only GET and POST)
var bodyParser = require('body-parser'); //This is a module that will be used to parse JSON text to JSON objects.
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data
var app = express(); //create the app

var globalOutput = 50;

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
		res.send("Server is running aOK");
})

//Recieve a JSON object at the url /clientupdate This will be the arduino's point of communication with the server.
app.post('/clientupdate',upload.array(), function(req, res){
	
	//If a json string was passed it becomes automatically parsed as a json object in req.body this means we can get the key values from req.body.keyName
	
	console.log("clientupdate POST called"); //Just a little heads up to know what's goin' on.
	
	//Call function to handle the data recieved from the arduino and what to send back. (all in JSON format)
	var output = handleInput(req.body); //Pass in the JSON object of the arduino's message.
	
	console.log("Output instruction: " + output); //Print the output that will be sent to the arduino to the console.
	
	globalOutput = output;
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
		
		//Variable for how the light will be set.
		var out = 0; //Will take values from 0 to 10 (off to 100% intensity)
		
		// light less than 400 and no motion
		if((l < 400) && (m == 0))
		{
			out = 30; //30% intensity
		}
		// light less than 400 and motion!
		else if((l < 400) && (m == 1))
		{
			out = 100; //100% intensity
		}
		else//This means ambient light is >=400 so we'll turn our street light off
		{
			out = 0; //off
		}
		
		//COMMENTED FOR TESTING
		//var jsonRes = '{"lightIntensity":' + out + '}'; //No optional overrides. just conventional response.
		//return jsonRes;
		return out + "";
	
}


app.get('/getupdatevalue', function(req, res){
		res.send(globalOutput);
})



//Aqui tambien, le decimos que es lo que va a ejecutar cuando hace listen...
var server = app.listen(8081, function(){
	var host = server.address().address
	var port = server.address().port
	
	
	console.log("Example app listening at http://",host,":", port)
})
