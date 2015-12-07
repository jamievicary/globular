var crypto = require('crypto');
var fs = require('fs');
var Mailgun = require('mailgun-js');


var mailGunKey = 'key-b78a23d2476ddc0ec839ed917499dfa0';

var mailGunDomain = 'sandboxfe39079370fe48b5993432b5ab510c8f.mailgun.org';

var mailGunFrom = 'postmaster@globular.science';



/*var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'casparwylie@gmail.com',
        pass: 'test'
    }
});*/


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
  			if(data.temp_fp_password){
	  			delete data.temp_fp_password;
	  			fs.writeFileSync('database/users/'+login_email+"/data.json", JSON.stringify(data));
	  		}
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
	
	if(!email.match(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/)){
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
		
		var jsonFileStr = JSON.stringify({user_password : enPass, full_name:"Test Name", published_projects:[]});
		
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
	
};

exports.forgot_pass = function(req,res){
	var email = req.body.email;
	var error = "";
	
	if(!fs.existsSync('database/users/'+email)&&email!==""){
		error = "There is no existing account with this email.";
	}
	
	if(error===""){
		var new_pass =encrypt_hash("43vdji8t"+email+"IUbyV45v7Uytvi").substring(0,8);
		
		fs.readFile('database/users/'+email+"/data.json",'utf-8', function(err,data){
			data = JSON.parse(data);
			data.temp_fp_password = new_pass;
			data = JSON.stringify(data);
			fs.writeFile("database/users/"+email + "/data.json", data, function (err) {
				req.session.fpcc = encrypt_hash(new_pass+"fhBIb76");
				req.session.cookie.secure = false;
				var cclink = "https://globular-casparwylie.c9.io/fpcc/"+req.session.fpcc+"/"+email;
				
				
				var mailgun = new Mailgun({apiKey: mailGunKey, domain: mailGunDomain});
				 var emailData = {
			      from: mailGunFrom,
			      to: email,
			      subject: 'New Password Request',
			      html: "Hello,<br>Your new password for Globular is: <b>"+new_pass+"</b><br>Please click <a href = '"+cclink+"'>here</a> to activate it. <br> We suggest you login now and change it to something easier to remember!"
			    }

			   
			    mailgun.messages().send(emailData, function (err, body) {
			        if (err) {
			            
			            console.log("got an error: ", err);
			        }else {
			            res.send({success:true,msg:"Successfully sent new password! Please check your emails."});
			        }
			    });

				/*var mailOptions = {
				    from: 'Globular.Science <support@globular.science>', 
				    to: email, 
				    subject: 'New Password Request', // Subject line
				    html: "Hello,<br>Your new password for Globular is: <b>"+new_pass+"</b><br>Please click <a href = '"+cclink+"'>here</a> to activate it. <br> We suggest you login now and change it to something easier to remember!"
				};
				transporter.sendMail(mailOptions, function(error, info){
				    if(error){
				        console.log(error);
				    }
				    res.send({success:true,msg:"Successfully sent new password! Please check your emails."});
				});*/
				
				
			});
		});
		
	}else{
		res.send({success:false,msg:error});
	}
};

exports.activate_pass = function(req,res){
	var url_conf_code = req.params.concode;
	var email = req.params.email;
	var fpcc = req.session.fpcc;//forgot password confirmation code session
	
	if(url_conf_code==fpcc){
		fs.readFile('database/users/'+email+"/data.json",'utf-8', function(err,data){
			data = JSON.parse(data);
			data.user_password = encrypt_hash(data.temp_fp_password);
			delete data.temp_fp_password;
			delete req.session.fpcc;
			data = JSON.stringify(data);
			fs.writeFile("database/users/"+email + "/data.json", data, function (err) {
				res.redirect("/");
			});
		});	
	}else{
			res.redirect("/");
	}
	
};
