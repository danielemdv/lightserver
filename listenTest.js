var express = require('express')
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data
var app = express();

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

//Le decimos al programa que tengamos acceso a los archivos estaticos de cierta carpeta (carpeta /public)
app.use(express.static('public'));


//Le estamos pasando una funcion que estamos construyendo on the fly al framework
app.get('/', function(req, res){
		res.send("Hello World! I'm a server designed to run an intelligent lighting system!");
})

//Le decimos que regresarnos cuando el url tiene /otro despues de la direccion
app.get('/otro', function(req, res){
		res.send("Entraste al otro!!");
})

app.get('/status', function(req, res){
		res.send("Server is running aOK");
})

//Test to see if we can get a json with a post
app.post('/clientupdate',upload.array(), function(req, res){
	
	//If a json string was passed it becomes automatically parsed as a json object in req.body this means we can get the key values from req.body.keyName
	
	console.log("clientupdate POST called");
	
	
	console.log(JSON.stringify(req.body));
	var responseString = "Echo light: " + req.body.light;
	
	res.send(responseString);
	
	/*Notas
	 * JSON.stringify(JSONOBJECT) nos devuelve el string del json.
	 * JSON.parse(JSONSTRING) nos devuelve el objeto json.
	 * */
})


//Aqui tambien, le decimos que es lo que va a ejecutar cuando hace listen...
var server = app.listen(8081, function(){
	var host = server.address().address
	var port = server.address().port
	
	
	console.log("Example app listening at http://",host,":", port)
})
