exports.get_projects = function(req,res,db){
	var user_col = db.collection('users');
	var user_id = req.session.user_id;
	user_col.findOne({id:user_id}, function(err, doc){
		var all_projects = [];
		var all_p_ids = doc.project_ids;
		var all_ids = [];
		for(var i in all_p_ids){
			all_projects.push(all_p_ids[i]);	
		}
		for(var i in all_p_ids){
			all_ids.push(i);
		}	
		
		
		console.log(all_ids);
		if(all_projects.length>0){
			res.send({
				success: true,
				projects: all_projects,
				project_ids: all_ids
			});
		}else{
			res.send({
				success: false,
				msg: "You have no projects."
			});
		}
	});
}

exports.add_new_project = function(req,res,db){
	var user_col = db.collection('users');
	var project_col = db.collection('projects');
	var p_name = req.body.p_name;
	if(p_name.length>2){
		var string = req.body.string;
		var user_id = req.session.user_id;
		
		user_col.findOne({id:user_id}, function(err, doc){
			var all_p_ids = doc.project_ids;
			project_col.count(function(err, count){
				var pid = count+1;
				
				project_col.insert({id:pid, name:p_name, string:string}, function(err, doc){
					all_p_ids[pid] = p_name;
					user_col.update({id:user_id},{$set:{project_ids:all_p_ids}},function(){
					
						res.send({
							success: true,
							p_id: pid,
							msg: "Success"
						});
						
					});
					
				});
		
			});
			
		});	
	}else{
		
		res.send({
			success: false,
			msg: "Your project name is too short."
		});	
	
	}	
}


exports.get_project_string = function(req, res, db){
	var project_col = db.collection('projects');
	var project_id = parseInt(req.body.p_id);
	
	project_col.findOne({id:project_id}, function(err, docs){
		res.send({
			string:docs.string,
			name: docs.name,
			success: true
		});
	
	});	
}

exports.delete_project = function(req, res,db){
	var project_col = db.collection('projects');
	var user_col = db.collection('users');
	var p_id = req.body.proj_id;
	project_col.remove({id:parseInt(p_id)}, function(){
	
		var user_id = req.session.user_id;
		user_col.findOne({id:user_id}, function(err, doc){
			var all_projects = [];
			console.log(doc);
			var all_p_ids = doc.project_ids;
			var new_p_list = {};
			
			for(var i in all_p_ids){
				console.log(i + "---" + all_p_ids[i]);
				if(i!=p_id){
					new_p_list[i]=all_p_ids[i];
				}
			}
			
			user_col.update(
				{id:user_id},
				{$set:{project_ids:new_p_list}},
				 function(){
					res.send({
						success: true
				});
			});
		});	
	});	
}


exports.save_p_changes = function(req,res,db){
	var user_col = db.collection('users');
	var project_col = db.collection("projects");
	var user_id = req.session.user_id;
	var p_id = req.body.p_id;
	var proj_name = req.body.p_name;
	var new_string = req.body.string;
	if(p_id!="hold"){
		project_col.update(
					{id:parseInt(p_id)},
					{$set: {string: new_string, name:proj_name}});
		user_col.findOne({id:parseInt(user_id)}, function(err, doc){
			var all_p_ids = doc.project_ids;
			all_p_ids[p_id] = proj_name;
			user_col.update(
					{id:parseInt(user_id)},
					{$set: {project_ids:all_p_ids}});
		});			
		res.send({
			success: true
			
		});
	}else{
		user_col.findOne({id:user_id}, function(err, doc){
			var all_p_ids = doc.project_ids;
			project_col.count(function(err, count){
				var pid = count+1;
				
				project_col.insert({id:pid, name:proj_name, string:new_string}, function(err, doc){
					all_p_ids[pid] = proj_name;
					
					user_col.update({id:user_id},{$set:{project_ids:all_p_ids}},function(){
					
						res.send({
							success: true,
							p_id: pid,
							msg: "Success"
						});
						
					});
					
				});
		
			});
			
		});	
	}
		
}
