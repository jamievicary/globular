var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var routes = require('./routes/index');
var users = require('./routes/users');
var projects = require('./routes/projects');
var session = require('express-session');

var app = express();

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

//database connection
var MongoClient = require('mongodb').MongoClient;
MongoClient.connect('mongodb://localhost:27017/globular', function (err, db) {
    if (err) {
        console.log(err);
    } else {
    	console.log("successfully connected to the database");
    
    	//routes
    	
    	app.post('/login', function(req, res){
			users.login_user(req, res, db);
			
			
		});  
		
		app.post('/c-loggedin', function(req, res){
			console.log(req.session.user_id + "c-loggedin");
			if(req.session.user_id!=undefined){
				var user_col = db.collection('users');
				var user_id = req.session.user_id;

				var cursor = user_col.findOne({id:user_id}, function(err, docs){
					res.send({
						status: "in",
						email: docs.email
					});
				});			
				
			}else{
				res.send({
					status: "out"
				});
			}	
		}); 
		
		app.post('/change-pass', function(req, res){

			users.change_pass(req,res,db);
			
		});  
		app.post('/profile', function(req, res){
			users.get_profile(req, res, db);
		});    
		
		app.post('/register_user', function(req, res){
			if(req.session.user_id==undefined){
				users.register_user(req,res,db);
			}
		});
		
		app.post('/get_projects', function(req, res){
			if(req.session.user_id!=undefined){
				projects.get_projects(req,res,db);
			}
		});
		
		app.post('/add_new_project', function(req, res){
			if(req.session.user_id!=undefined){
				projects.add_new_project(req,res,db);
			}
		});
		
		app.post('/get_project_string', function(req,res){
			projects.get_project_string(req, res, db);
		});
		
		app.post('/delete_project', function(req, res){
			projects.delete_project(req, res, db);
		})
		
		app.get('/logout', function(req, res){
			req.session.destroy(function(err) {
				res.redirect("/");
			});
		});
		
		app.post('/save_project_changes', function(req, res){
			projects.save_p_changes(req,res,db);	
		});
    }

});


console.log('Express server listening on port ' + app.get('port'));
