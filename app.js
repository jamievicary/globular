var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var fs = require('fs');
var routes = require('./routes/index');
var users = require('./routes/users');
var projects = require('./routes/projects');
var session = require('express-session');
var app = express();

if(!fs.existsSync('database/')){
	fs.mkdir('database/');	
}
if(!fs.existsSync('database/projects')){
	fs.mkdir('database/projects/');	
}
if(!fs.existsSync('database/users')){
	fs.mkdir('database/users/');	
}

var user_projects = {};

// Set large limit for POST requests
app.use(bodyParser({limit: '50mb'}));

app.set('port', process.env.PORT || 3000);
app.listen(app.get("port"));
// view engine setup
app.set('views', __dirname + '/views');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use('/', express.static(__dirname + '/public/'));

app.use(session({
  secret: 'Viu65Cc5VTU6cu',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: true }
}));



// user will ask for '/private/casparwylie@gmail.com/projects/%EH^%YJERTHE/string.json'
app.use('/private', function(req, res) {
	if(req.session.user_id==undefined) return false;
		
	var user_requested = req.url.substring(1,req.url.indexOf("/",1));
	console.log(user_requested);
	if(req.session.user_id!=user_requested) return false;
	
	console.log('requesting ' + req.url);
	express.static(__dirname + '/database/users')(req, res);
});

app.use('/public',  express.static(__dirname + '/database/projects'));

    	//routes

app.post('/login', function(req, res){
	users.login_user(req, res);
	
});  

app.post('/c-loggedin', function(req, res){
	if(req.session.user_id!=undefined){
	
		var user_id = req.session.user_id;

		res.send({
			status: "in",
			email: user_id
		});
				
	}else{
		res.send({
			status: "out"
		});
	}	
}); 

app.post('/change-pass', function(req, res){

	users.change_pass(req,res);
	
});

app.post('/get_project_list', function(req,res){
	projects.get_project_list(req,res);	
});

app.post('/profile', function(req, res){
	users.get_profile(req, res);
});    

app.post('/register_user', function(req, res){
	if(req.session.user_id==undefined){
		users.register_user(req,res);
	}
});

app.post('/publish_project', function(req, res){
	if(req.session.user_id!=undefined){
		projects.publish_project(req,res);
	}
});

app.post('/add_new_project', function(req, res){
	if(req.session.user_id!=undefined){
		projects.add_new_project(req,res);
	}
});

app.post('/delete_project', function(req, res){
	projects.delete_project(req, res);
});

app.get('/logout', function(req, res){
	req.session.destroy(function(err) {
		res.redirect("/");
	});
});

app.post('/save_project_changes', function(req, res){
	projects.save_p_changes(req,res);	
});
    
app.get("/:value", function(req, res){
	res.sendfile("public/index.html");
});

app.post('/get_public_project', function(req, res){
	projects.get_pp(req, res);
});

app.post('/get_all_datenames', function(req,res){
	fs.readdir('database/projects', function(err,files){
		res.send(files);
	});	
});

app.post('/get_pp_versions', function(req,res){
	projects.get_pp_versions(req,res);	
});

app.post('/add_version_pp', function(req,res){
	projects.add_version_pp(req,res);
});

app.post('/share_project',function(req,res){
	projects.share_project(req,res);
});
console.log('Express server listening on port ' + app.get('port'));
