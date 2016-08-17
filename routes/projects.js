var fs = require('fs'),
    Promise = require('bluebird'),
    _ = require('lodash');

function get_new_private_project_id(email) {
	var data = fs.readdirSync('database/users/' + email + '/projects');
	var new_id = 0;
	for (var i = 0; i < data.length; i++) {
		var id = Number(data[i]);
		if (isNaN(id)) continue;
		new_id = Math.max(new_id, Number(data[i]) + 1);
	}
	return new_id;
}

/*  FileLocationString, StringFormat -> Promise ()
 *  Promisification of fs.readFile
 */
function readFileP(){
    var args = Array.prototype.slice.call(arguments);

    return Promise.fromCallback(function curried(cb){
        args.push(cb);
        return fs.readFile.apply(fs.readFile, args);
    });
}

/*  FileLocationString -> Promise ()
 *  Promisification of fs.writeFile
 */
function writeFileP(){
    var args = Array.prototype.slice.call(arguments);
    return Promise.fromCallback(function(cb){
        args.push(cb);
        return fs.writeFile.apply(fs.writeFile, args);
    });
}
/*  FileLocationString, StringFormat -> Promise ()
 *  Promisification of fs.readFile
 */
function createDirP(){
    var args = Array.prototype.slice.call(arguments);
    return Promise.fromCallback(function(cb){
        args.push(cb);
        return fs.mkdir.apply(fs.mkdir, args);
    });
}

exports.get_projects = function(req, res) {
	var user_id = req.session.user_id;
}

exports.get_project_list = function(req, res) {
	var listType = parseInt(req.body.listType);
	var user_id = req.session.user_id;
	switch (listType) {
		case 1:
			// get users private projects - as linear array of project IDS e.g (1,2,4).
			fs.readdir('database/users/' + user_id + '/projects', function(err, all_ids) {
				console.log(err);
				res.send({
					success: true,
					project_ids: all_ids,
					user_id: user_id
				});
			});
			break;
		case 2:
			//get users public projects - as list of public project IDS e,g (1510.001, 1508.004)
			fs.readFile('database/users/' + user_id + '/data.json', 'utf8', function(err, result) {
				console.log(result);
				result = JSON.parse(result);
				var ids = result.published_projects;
				if (ids === undefined) ids = [];
				res.send({
					project_ids: ids
				});
			});
			break;
		case 3:

			//get all public projects - as list of  public project IDS e,g (1510.001, 1508.004)
			var dateName = req.body.projectData;

			fs.readdir('database/projects/' + dateName, function(err, files) {
				var pp_addresses = [];
				if (files != undefined) {
					for (var i = 0; i <= files.length - 1; i++) {
						pp_addresses.push(dateName + "." + files[i]);
					}

					res.send({
						project_ids: pp_addresses
					});
				} else {
					res.send({
						project_ids: []
					});
				}
			});
			break;
	}
}
exports.add_new_project = function(req, res) {
	var p_name = req.body.p_name;
	if (p_name == "") {
		p_name = "(No Name)";
	}
	var p_desc = req.body.p_desc;
	var string = req.body.string;
	var user_id = req.session.user_id;
	var newID = get_new_private_project_id(user_id);

	//data.projects.push({"id":newID, "name":p_name});
	//	data.projects_count = data.projects_count + 1;
	var metaData = JSON.stringify({
		project_name: p_name,
		project_desc: p_desc
	});

	fs.mkdir("database/users/" + user_id + "/projects/" + newID, function() {
		fs.writeFile('database/users/' + user_id + "/projects/" + newID + "/string.json", string, function() {
			fs.writeFile('database/users/' + user_id + "/projects/" + newID + "/meta.json", metaData, function() {
				res.send({
					success: true,
					p_id: newID,
					msg: "Success"
				});
			});
		});
	});

};

exports.delete_project = function(req, res) {
	var p_id = req.body.proj_id;
	var user_id = req.session.user_id;

	fs.unlink('database/users/' + user_id + '/projects/' + p_id + '/string.json', function() {
		fs.unlink('database/users/' + user_id + '/projects/' + p_id + '/meta.json', function() {
			fs.rmdir('database/users/' + user_id + '/projects/' + p_id, function() {
				res.send({
					success: true
				});
			});
		});
	});

};

exports.save_project_changes = function(req, res) {

	var user_id = req.session.user_id;
	var p_id = req.body.p_id;
	var p_name = req.body.p_name;
	var p_string = req.body.string;
	var p_desc = req.body.p_desc;

	// Tidy up project name
	if (p_name == '') p_name = '(Untitled)';

	// If necessary, get a fresh project ID
	if (p_id == '') p_id = get_new_private_project_id(user_id);

	// Collect metadata
	var p_meta = JSON.stringify({
		project_name: p_name,
		project_desc: p_desc
	});

	// Save data and return success
	fs.mkdir("database/users/" + user_id + "/projects/" + p_id, function() {
		fs.writeFile('database/users/' + user_id + "/projects/" + p_id + "/string.json", p_string, function() {
			fs.writeFile('database/users/' + user_id + "/projects/" + p_id + "/meta.json", p_meta, function() {
				res.send({
					success: true,
					p_id: p_id,
					msg: "Success"
				});
			});
		});
	});


};

exports.publish_project = function(req, res) {

	var pid = req.body.pid;
	var user_id = req.session.user_id;
	var date = new Date();
	var month = (date.getMonth() + 1).toString();
	var string = fs.readFileSync('database/users/' + user_id + '/projects/' + pid + '/string.json', 'utf8');
	var metaData = fs.readFileSync('database/users/' + user_id + '/projects/' + pid + '/meta.json', 'utf8');
	console.log(string);
	var day = date.getDate();

	if (month.length == 1) {
		month = "0" + month;
	}
	var year = date.getFullYear().toString().substr(2, 2);
	var dateName = year + month;
	var publish_date = day.toString() + "/" + month + "/" + year;


	function construct_project() {

		fs.readdir('database/projects/' + dateName, function(err, files) {
			var pcount = (files.length + 1).toString();
			switch (pcount.length) {
				case 1:
					pcount = "00" + pcount;
					break;
				case 2:
					pcount = "0" + pcount;
					break;
			}

			var userData = fs.readFileSync('database/users/' + user_id + '/data.json');
			userData = JSON.parse(userData);
			if (userData.published_projects == undefined) userData.published_projects = [];
			userData.published_projects.push(dateName + "." + pcount);

			var data = JSON.stringify({
				owners: [user_id],
				date_published: publish_date
			});
			fs.writeFile('database/users/' + user_id + '/data.json', JSON.stringify(userData), function() {
				fs.mkdir('database/projects/' + dateName + '/' + pcount, function() {
					fs.writeFile('database/projects/' + dateName + '/' + pcount + '/data.json', data, function() {
						fs.mkdir('database/projects/' + dateName + '/' + pcount + '/versions/', function() {
							fs.mkdir('database/projects/' + dateName + '/' + pcount + '/versions/v1/', function() {
								fs.writeFile('database/projects/' + dateName + '/' + pcount + '/versions/v1/string.json', string, function() {
									fs.writeFile('database/projects/' + dateName + '/' + pcount + '/versions/v1/meta.json', metaData, function() {

										res.send({
											projectURL: dateName + "." + pcount
										});

									});
								});
							});
						});
					});
				});
			});
		});

	}

	if (!fs.existsSync('database/projects/' + dateName)) {
		fs.mkdir('database/projects/' + dateName, function() {
			construct_project();
		});
	} else {
		construct_project();
	}
}

exports.get_pp = function(req, res) {
	var dateName = req.body.dateName;

	var version = req.body.version;
	var projectNo = req.body.projectNo;
	fs.readFile('database/projects/' + dateName + '/' + projectNo + '/versions/' + version + '/string.json', 'utf8', function(err, string) {

		fs.readFile('database/projects/' + dateName + '/' + projectNo + '/versions/' + version + '/meta.json', 'utf8', function(err, meta) {

			meta = JSON.parse(meta);
			res.send({
				string: string,
				meta: meta,
				pid: "public"
			});
		});

	});
};

exports.get_pp_versions = function(req, res) {
	var pID = req.body.pid;
	var dateName = pID.substring(0, 4);
	var projectNo = pID.substring(5);
	fs.readdir('database/projects/' + dateName + '/' + projectNo + '/versions/', function(err, result) {
		res.send(result);
	});
};

exports.add_version_pp = function(req, res) {
	//add private project as version to a published.
	var public_id = req.body.public_id;
	var private_id = req.body.private_id;
	var user_id = req.session.user_id;
	var dateName = public_id.substring(0, 4);
	var projectNo = public_id.substring(5);

	var newDir = "";
	fs.readdir('database/projects/' + dateName + '/' + projectNo + '/versions/', function(err, versions) {
		newDir = "v" + (versions.length + 1).toString();
		fs.readFile('database/users/' + user_id + '/projects/' + private_id + '/string.json', 'utf8', function(err, string) {
			fs.readFile('database/users/' + user_id + '/projects/' + private_id + '/meta.json', 'utf8', function(err, meta) {
				fs.mkdir('database/projects/' + dateName + '/' + projectNo + '/versions/' + newDir, function(err) {
					fs.writeFile('database/projects/' + dateName + '/' + projectNo + '/versions/' + newDir + '/meta.json', meta, function(err) {
						fs.writeFile('database/projects/' + dateName + '/' + projectNo + '/versions/' + newDir + '/string.json', string, function(err) {
							res.send("success");
						});
					});
				});
			});
		});
	});
};

/* UserId, ProjectId -> Promise [ProjectString, ProjectMetaString]
 *   Reads given ProjectId for the given UserId and returns the project and project
 *   meta strings.
 */
exports.read_project = function(user_id, p_id) {

    var projectString = readFileP('database/users/' + user_id + '/projects/' + p_id + '/string.json', 'utf8');
    var projectMeta = readFileP('database/users/' + user_id + '/projects/' + p_id + '/meta.json', 'utf8');

    return Promise.all([projectString, projectMeta]);
};


/* UserIdEmail, ProjectString, ProjectMetaString -> Promise ()
 *   Creates a new project using given UserEmail, ProjectString, and ProjectMetaString
 */
exports.write_project = function(user_email, projectString, projectMetaString) {

    var new_id = get_new_private_project_id(user_email);

    return createDirP('database/users/' + user_email + '/projects/' + new_id)
        .then(function(){
            return  writeFileP('database/users/' + user_email + '/projects/' + new_id + '/string.json',  projectString);
        })
        .then(function(){
            return writeFileP('database/users/' + user_email + '/projects/' + new_id + '/meta.json', projectMetaString);
        });
};

/*  UserEmail, ProjectId, UserEmail, Object -> Promise ()
 *    Takes project from the first given user, and pushes the project to the second given user,
 *    updating the meta data using the last given object.
 */
exports.create_from_existing_project = function(existing_user_id, existing_p_id, new_project_user_id, meta) {

    return exports.read_project(existing_user_id, existing_p_id)
        .spread(function(projectString, projectMetaString){
            var newMeta = _.extend({}, JSON.parse(projectMetaString), meta);
            var newMetaString = JSON.stringify(newMeta);
            return exports.write_project(new_project_user_id, projectString, newMetaString);
        });

};

exports.share_project = function(req, res) {
	var emails = req.body.emails.split(",");
	var p_id = req.body.p_id;
	var errors = "";
	var user_id = req.session.user_id;
	var invalid_emails = [];
	var valid_emails = [];

	for (var i in emails) {
		var email = emails[i].trim();
		if (!fs.existsSync('database/users/' + email)) {
			invalid_emails.push(email);
		} else {
			valid_emails.push(email);
		}
	}

	if (emails.length == 0) {
		res.send({
			successcolor: 1,
			msg: "You must supply at least one email address."
		});
		return;
	}

	if (invalid_emails.length > 0) {
		res.send({
			successcolor: 1,
			msg: "The following emails are invalid or are not registered: " + invalid_emails.join(",")
		});
		return;
	}

    Promise.map(valid_emails, function(new_project_user_id){
        var updatingMeta = {
            project_source: "(shared by " + user_id + ")"
        };
        return exports.create_from_existing_project(user_id, p_id, new_project_user_id, updatingMeta);
    }).then(function(){
        res.send({
            successcolor: 2,
            msg: "Successfully shared project."
        });
    });
};
