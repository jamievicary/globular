var crypto = require('crypto');
var fs = require('fs');

encrypt_hash = function (string){
	var hash_sha512 = crypto.createHash("sha512");
	var value = hash_sha512.update(string+ "hvtItvv5854b").digest("hex");
	console.log(value);
	return value;
};

exports.login_user = function(req, res){
	var login_email = req.body.login_email;
	var login_pass = req.body.login_pass;
	if(fs.existsSync('database/users/'+login_email)){
  		fs.readFile('database/users/'+login_email+"/data.json",'utf-8', function(err,data){
  			data = JSON.parse(data);
  			if(data.user_password == encrypt_hash(login_pass)){
  				req.session.user_id  = login_email;
				req.session.cookie.secure = false;
 				res.send({
 					user_id: req.session.user_id,
 					email:   login_email,
 					success: true
 				});
  			}else{
  				res.send({
 					success: false
 				});
  			}
  		});
  	}
}

exports.get_profile = function(req, res){
	var valid = req.body.valid;
	if(valid){
		var user_id = req.session.user_id;
		res.send(user_id);
	}
}

exports.change_pass = function(req, res){
	var user_id = req.session.user_id;
	var npass = req.body.new_pass;
	var vpass = req.body.verify_pass;
	var errormsg = "";
	if(npass!=vpass){
		errormsg = "Your passwords do not match.";
	}
	if(npass.length<4){
		errormsg = "Your password is too short.";
	}
	if(errormsg==""){
		errormsg = "Successfully updated password.";
		fs.readFile('database/users/'+user_id+"/data.json",'utf-8', function(err,data){
			data = JSON.parse(data);
			data.user_password = encrypt_hash(npass);
			fs.writeFile('database/users/'+user_id+"/data.json", JSON.stringify(data), function(){
				res.send({
					success: true,
					error: errormsg
				})
			});
		});
	}else{
		res.send({
			success: false,
			error: errormsg
		});
	}
}

exports.register_user = function(req,res){
	var email = req.body.reg_email;
	var pass = req.body.reg_pass;
	var vpass = req.body.reg_vpass;
	var enPass = encrypt_hash(pass);
	var errors = "";
	var email_chars = email.split("");
	if((email_chars.indexOf('@') === -1)||(email_chars.indexOf('.') === -1)){
		errors = errors + "<br>You have supplied an invalid email address.";
	}
	if(pass!=vpass){
		errors = errors + "<br>Your passwords do not match.";
	}
	if(pass.length<4){
		errors = errors + "<br>Your password is too short.";
	}
	
	
  	if(fs.existsSync('database/users/'+email)){
  		errors = errors + "<br>Your email is already being used.";
  	}
	
	if(errors===""){
		
		var jsonFileStr = JSON.stringify({user_password : enPass, projects_count:0, projects: []});
		
		fs.mkdir("database/users/"+email, function(){
			fs.writeFile("database/users/"+email + "/data.json", jsonFileStr, function (err) {
				fs.mkdir("database/users/"+email + "/projects", function(){
					res.send({
						success: true,
						msg: "Successfully registered your account!"
					});
				});
			});

		});
		
	}else{
		console.log(errors);
		res.send({
			success: false,
			msg: errors
		});
	}
	
}