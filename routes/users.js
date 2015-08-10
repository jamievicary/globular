var crypto = require('crypto');

encrypt_hash= function (string){
	var hash_sha512 = crypto.createHash("sha512");
	var value = hash_sha512.update(string+ "hvtItvv5854b").digest("hex");
	console.log(value);
	return value;
}

exports.login_user = function(req, res, db){
	var login_email = req.body.login_email;
	var login_pass = req.body.login_pass;
	var user_col = db.collection('users');
	var cursor = user_col.findOne({email:login_email, password:encrypt_hash(login_pass)}, function(err,doc){
		if(doc!=null){
			req.session.user_id  = doc.id;
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

exports.get_profile = function(req, res, db){
	var user_col = db.collection('users');
	var valid = req.body.valid;
	if(valid){
		var user_id = req.session.user_id;
		var cursor = user_col.findOne({id:user_id}, function(err, docs){
			res.send(docs);
		});
	}
}

exports.change_pass = function(req, res, db){
	var user_col = db.collection('users');
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
		user_col.update(
			{id:user_id},
			{$set:{password:encrypt_hash(npass)}},
			 function(){
				res.send({
					success: true,
					error: errormsg
				});
		});
	}else{
		res.send({
			success: false,
			error: errormsg
		});
	}
}

exports.register_user = function(req,res,db){
	var user_col = db.collection('users');
	var email = req.body.reg_email;
	var pass = req.body.reg_pass;
	var vpass = req.body.reg_vpass;
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
	
	user_col.findOne({email:email}, function(err, doc){
		if(doc!=null){
			errors = errors + "<br>Your email is already being used.";
			console.log(errors);
		}
		if(errors===""){
		
			user_col.count(function(err, count){
				var new_id = count + 1;
				user_col.insert({id:new_id, email:email, password: encrypt_hash(pass), project_ids:{}}, function(){
					res.send({
						success: true,
						msg: "Successfully created your account."
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
	});
}