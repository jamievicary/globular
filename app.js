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
app.post('/profile', function(req, res){
	users.get_profile(req, res);
});    

app.post('/get-project-meta', function(req,res){
	projects.get_meta(req, res);
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

app.post('/get_projects', function(req, res){
	if(req.session.user_id!=undefined){
		projects.get_projects(req,res);
	}
});

app.post('/add_new_project', function(req, res){
	if(req.session.user_id!=undefined){
		projects.add_new_project(req,res);
	}
});

app.post('/get_project_string', function(req,res){
	projects.get_project_string(req, res);
});

app.post('/delete_project', function(req, res){
	projects.delete_project(req, res);
})

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




console.log('Express server listening on port ' + app.get('port'));
