var fs = require('fs');

exports.get_projects = function(req,res){
	var user_id = req.session.user_id;
	fs.readFile('database/users/'+user_id+'/data.json','utf-8', function(err,data){
		data = JSON.parse(data);
		var projects = data.projects;
		var all_ids = [];
		var all_names = [];
		for (var i in projects){
			console.log();
			all_ids.push(projects[i].id);
			all_names.push(projects[i].name);
		}
		if(all_names.length>0){
			res.send({
				success: true,
				projects: all_names,
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

exports.add_new_project = function(req,res){
	var p_name = req.body.p_name;
	if(p_name.length>2){
		var p_desc = req.body.p_desc;
		var string = req.body.string;
		var user_id = req.session.user_id;
		console.log(user_id);
		var data = fs.readFileSync('database/users/'+user_id+'/data.json');
		data = JSON.parse(data);
		console.log(data);
		if(data.projects.length>0){
			var newID = data.projects[data.projects.length-1].id + 1;
		}else{
			var newID = 0;	
		}
		data.projects.push({"id":newID, "name":p_name});
		data.projects_count = data.projects_count + 1;
		var metaData = JSON.stringify({project_name : p_name, project_desc: p_desc});
		fs.writeFile('database/users/'+user_id+'/data.json', JSON.stringify(data), function(){
			fs.mkdir("database/users/"+user_id + "/projects/" + newID, function(){
				fs.writeFile('database/users/'+user_id + "/projects/" + newID + "/string.json", string, function(){
					fs.writeFile('database/users/'+user_id + "/projects/" + newID + "/meta.json", metaData, function(){
						res.send({
							success: true,
							p_id: newID,
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
};


exports.get_project_string = function(req, res){
	var project_id = parseInt(req.body.p_id);
	var user_id = req.session.user_id;
	fs.readFile('database/users/'+user_id+'/projects/'+project_id+'/string.json','utf-8', function(err,data){
		fs.readFile('database/users/'+user_id+'/data.json','utf-8', function(err,pdata){
			pdata = JSON.parse(pdata);
			var pname = "";
			for (var i in pdata.projects){
				if(pdata.projects[i].id==project_id){
					pname = pdata.projects[i].name;
				}
			}
			res.send({
				string:data,
				name: pname,
				success: true
			});
		});
	});	
};

exports.delete_project = function(req, res){
	var p_id = req.body.proj_id;
	var user_id = req.session.user_id;
	fs.readFile('database/users/'+user_id+'/data.json','utf-8', function(err,data){
		data = JSON.parse(data);
		for (var i in data.projects){
			if(data.projects[i].id==p_id){
				data.projects.splice(i,1);
			}
		}
		fs.unlink('database/users/'+user_id +'/projects/'+p_id+'/string.json', function(){
			fs.unlink('database/users/'+user_id +'/projects/'+p_id+'/meta.json', function(){
				fs.rmdir('database/users/'+user_id +'/projects/'+p_id, function(){
					fs.writeFile('database/users/'+user_id + '/data.json', JSON.stringify(data), function(){
						res.send({
							success: true
						});
					});
				});
			});
		});
		
	
	});
};


exports.save_p_changes = function(req,res){

	var user_id = req.session.user_id;
	var p_id = req.body.p_id;
	var proj_name = req.body.p_name;
	var new_string = req.body.string;
	var p_desc = req.body.p_desc;
	if(p_id!="hold"){
		fs.readFile('database/users/'+user_id+'/data.json','utf-8', function(err,data){
			data = JSON.parse(data);
			var name = "";
			for (var i in data.projects){
				if(data.projects[i].id==p_id){
					data.projects[i].name = proj_name;
				}
			}
			var newMeta = JSON.stringify({project_name:proj_name,project_desc:p_desc});
			fs.writeFile('database/users/'+user_id+'/data.json', JSON.stringify(data), function(){
				fs.writeFile('database/users/'+user_id+'/projects/'+p_id+'/string.json', new_string, function(){
					fs.writeFile('database/users/'+user_id+'/projects/'+p_id+'/meta.json', newMeta, function(){
						res.send({
							success: true
						});
					});
				});
			});
		});
	}else{
		
		if(proj_name.length>2){
			var data = fs.readFileSync('database/users/'+user_id+'/data.json');
			data = JSON.parse(data);
			if(data.projects.length>0){
				var newID = data.projects[data.projects.length-1].id + 1;
			}else{
				var newID = 0;	
			}
			data.projects.push({"id":newID, "name":proj_name});
			data.projects_count = data.projects_count + 1;
			var metaData = JSON.stringify({project_name : proj_name, project_desc: p_desc});
			fs.writeFile('database/users/'+user_id+'/data.json', JSON.stringify(data), function(){
			fs.mkdir("database/users/"+user_id + "/projects/" + newID, function(){
				fs.writeFile('database/users/'+user_id + "/projects/" + newID + "/string.json", new_string, function(){
					fs.writeFile('database/users/'+user_id + "/projects/" + newID + "/meta.json", metaData, function(){
						res.send({
							success: true,
							p_id: newID,
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
		
};

exports.get_meta = function (req, res){
	var pid = req.body.pid;
	
	if(pid!==""&&pid!==null){
		console.log(pid);
		var user_id = req.session.user_id;
		var dir = 'database/users/'+user_id+'/projects/'+pid+'/meta.json';
		console.log(dir);
		fs.readFile(dir, 'utf8', function(err,data){
			data = JSON.parse(data);
			res.send(data);
		});	
	}else{
		res.send({result: ""});
	}
};