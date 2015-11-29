// Global project object
var gProject = {
    initialized: false
};
var MainDisplay = null;
var global_p_id = "null";
var timeout = null;

$(document).ready(function() {

    globular_prepare_renderer();
    MainDisplay = new Display($('#diagram-canvas'));

    // Handle key presses
    $(document).keypress(function(event) {
        var key = String.fromCharCode(event.charCode).toLowerCase();
        if (key == 's') {
            gProject.saveSourceTarget('source');
        } else if (key == 't') {
            gProject.saveSourceTarget('target');
        } else if (key == 'i') {
            gProject.takeIdentity();
        } else if (key == 'c') {
            this.cacheSourceTarget = null;
            gProject.clearDiagram();
            //} else if (key == 'p') {
            //    gProject.applyStochasticProcess(1);
            //} else if (key == 'z') {
            //    gProject.displayInterchangers();
        } else if (key == 'q') {
            gProject.storeTheorem();
        }
        /*
        else if (key == ' ') {
            if (timeout == null) {
                timeout = setInterval(function() {
                    gProject.applyStochasticProcess(1);
                }, 1000);
            } else {
                clearInterval(timeout);
                timeout = null;
            }
        }
        */
    });

    $("div.enable_if-in").hide();
    //$("div.enable_if-out").show();

    //Menu item instructions
    $("#mm-login").click(function() {
        $("#login-box").fadeIn();
    });
    $("#mm-logout").click(function() {
        window.location = "/logout";
    });
    $("#msg-close-opt-log").click(function() {
        $("#login-box").fadeOut();
    });
    $("#msg-close-opt-cell").click(function() {
        $("#options-box").fadeOut();
    });
    $("#mm-signup").click(function() {
        $("#signup-box").fadeIn();
    });
    $("#msg-close-opt-su").click(function() {
        $("#signup-box").fadeOut();
    });

    // Create the slider
    $("#slider").on("input change", function() {
        gProject.renderDiagram();
    });

    var original_msg_html = $("#errors").html();
    $(".box").draggable({
        containment: "document",
        cursor: "crosshair"
    });

    var dbltoggle = 0;

    $("#view-p-desc").click(function() {

        if (dbltoggle % 2 == 0) {
            $("#view-desc-body").animate({
                marginTop: "-=225px"
            }, 500);

        } else {
            $("#view-desc-body").animate({
                marginTop: "+=225px"
            }, 500);

        }
        dbltoggle = dbltoggle + 1;
    });

    // Prevent keypress bubbling when editing project name
    $("#diagram-title").keypress(function(e) {
        e.stopPropagation()
    });
    $("input.text-field-style-1").keypress(function(e) {
        e.stopPropagation()
    });

    // Click handler on main diagram
    // Handle navigation by forward and back buttons
    window.onpopstate = function(event) {
        if (event.state === null) {
            // do nothing
        } else if (event.state === "") {
            render_project_front(null);
            $("#diagram-title").val("New Project");
        } else {
            render_project_front(JSON.parse(event.state.string));
        }
    };

    //function for producing all pop ups/errors
    function show_msg(value, dur, type) {
        var color = "";
        switch (type) {
            case 1:
                //error msg
                color = "salmon";
                break;

            case 2:
                //success msg
                color = "#4cd2bb";
                break;

            case 3:
                //standard msg
                color = "";
                break;
        }
        $("#errors").css("background-color", color);
        $("#errors").html(value + original_msg_html);
        $("#errors").fadeIn();

        if (dur != false) {
            setTimeout(function() {
                $("#errors").fadeOut();
            }, dur);
        }

        $("#msg-close-opt-err").click(function() {
            $("#errors").fadeOut();
        });
    }

    //renders buffering wheel
    $(document).ajaxStart(function() {
        $("#ajax-loading").fadeIn();
    });
    $(document).ajaxStop(function() {
        $("#ajax-loading").fadeOut();
    });

    //determines whether user is logged in or out - renders different home pages
    function render_frontend(state) {
        if (state === "out") {
            $("div.enable_if-in").hide();
            $("div.enable_if-out").show();
        } else {
            $("div.enable_if-in").show();
            $("div.enable_if-out").hide();
        }
        //if (window.location.pathname.length < 3) {
        if (!gProject.initialized) {
            render_project_front('');
            $("#diagram-title").val("New Project");
        }
    }

    //actually renders page.
    function render_page() {
        $.post("/c-loggedin", {
            valid: true
        }, function(result, status) {
            render_frontend(result.status);
            if (result.status === "in") {
                $("#value-email").html(result.email);
                $("#mm-profile").html(result.email);
            }
        });
    }

    render_page();

    //login trigger
    $("#login-button").click(function() {
        var login_email = $("#login_email").val();
        var login_pass = $("#login_pass").val();
        $.post("/login", {
            login_pass: login_pass,
            login_email: login_email
        }, function(result, status) {
            if (status == "success") {

                if (result.success) {
                    $("#login-box").fadeOut();
                    render_page();
                } else {
                    render_page();

                    show_msg("Incorrect login details, please try again.", 3000, 1);
                }
            } else {
                show_msg("Could not connect to server, please try again later.", 3000, 1);
            }
        });
    });

    //request to view profile (fetches user data, and includes change password system)
    $("#mm-profile").click(function() {
        $.post("/profile", {
            valid: true
        }, function(result, status) {
            $("#errors").css("text-align", "left");
            $("#profile-email").html(result);
            $("#profile-box").fadeIn();
            $("#c-p-submit").click(function() {
                var npass = $("#c-p-verify_pass").val();
                var vpass = $("#c-p-new_pass").val();
                $.post("/change-pass", {
                    new_pass: npass,
                    verify_pass: vpass
                }, function(result, status) {
                    var type;
                    if (result.success == true) {
                        type = 2;
                    } else {
                        type = 1;
                    }
                    show_msg(result.error, 3000, type);
                });
            });
        });
    });


    $("#reg_submit").click(function() {
        var email = $("#reg_email").val();
        var pass = $("#reg_pass").val();
        var vpass = $("#reg_vpass").val();
        $("#reg_pass").val("");
        $("#reg_vpass").val("");
        $.post("/register_user", {
            reg_email: email,
            reg_pass: pass,
            reg_vpass: vpass
        }, function(result, status) {
            var type;
            if (result.success == true) {
                $("#signup-box").fadeOut();
                type = 2;
            } else {
                type = 1;
            }
            show_msg(result.msg, 4000, type);
        });
    });

    //renders a project
    function render_project_front(s) {
        $("#cell-body").html("");
        $("#my-projects-box").fadeOut();
        // Make sure diagram canvas has the right size
        $('#diagram-canvas').css('width', window.innerWidth - 300);
        $('#diagram-canvas').css('height', window.innerHeight - 20);

        // Construct new project
        gProject = new Project(s);
        gProject.signature.prepare();
        if (gProject.diagram != null) gProject.diagram.prepare();
        gProject.initialized = true;
        if (gProject.signature.getAllCells().length == 0) gProject.addZeroCell();

        // Render main diagram
        gProject.renderDiagram();

        // Bind resizing to the correct rendering function		
        $(window).unbind('resize');
        $(window).bind('resize', function() {
            $('#diagram-canvas').css('width', window.innerWidth - $('#control-body').width() - 150);
            $('#diagram-canvas').css('height', window.innerHeight - $('#header').height() - 50);
            globular_set_viewbox();
            //gProject.renderDiagram();
        })
        $('#diagram-canvas').css('width', window.innerWidth - $('#control-body').width() - 150);
        $('#diagram-canvas').css('height', window.innerHeight - $('#header').height() - 50);

        gProject.redrawAllCells();

        $("#add-0-cell-opt").click(function() {
            gProject.addZeroCell();
        });
        $("#project-menu").show();
        $("#diagram-canvas").show();
        $("#diagram-title").show();

        function close_project() {
            $("#diagram-canvas").fadeOut(1000);
            setTimeout(function() {
                $("#project-menu").fadeOut(1000);
                $("#diagram-title").html("");
                $(".cell-group").slideUp(1000);
                $(".cell-opt").slideUp(1000);
                setTimeout(function() {
                    $("#cell-body").html("");
                }, 1000);
            }, 1000);
        }
        $("#get-str-opt").click(function() {
            var msg = "<textarea class = 'text-area-style-1' style = 'height: 400px;width:255px;'>" + gProject.currentString() + "</textarea>";
            show_msg(msg, false, 3);
        });
        $("#run-process").click(function() {
            $("#run-proc-box").fadeIn();
        });
        $("#run-process-go").click(function() {
            var iterations = $("#rp-iters").val();
            iterations = Number(iterations);
            gProject.applyStochasticProcess(iterations);
            gProject.renderDiagram();
        });
    }

    $("#save-project-opt").click(function() {
        var currentString = gProject.currentString();
        $.post("/c-loggedin", {
                valid: true
            },
            function(result, status) {
                if (result.status === "in" && global_p_id == "null") {
                    global_p_id = "hold";
                }
                if (global_p_id == "null") {
                    show_msg("Please log in to save this project.", 7000, 3);
                } else {
                    var name = $("#diagram-title").val();
                    $.post("/save_project_changes", {
                        string: currentString,
                        p_id: global_p_id,
                        p_name: name,
                        p_desc: $("#text-p-desc").val()
                    }, function(result, status) {
                        if (global_p_id == "hold") {
                            global_p_id = result.newID;
                        }
                        show_msg("Successfully saved changes.", 2000, 2);
                    });
                }
            }
        );
    });

    $("#use-t-opt").click(function() {
        gProject.saveSourceTarget('target');
    });

    $("#use-s-opt").click(function() {
        gProject.saveSourceTarget('source');
    });

    $("#use-id-opt").click(function() {
        gProject.takeIdentity();
    });

    $("#clear-project-opt").click(function() {
        gProject.clearDiagram();
    });

    /*
        var main_string;
        var client = new XMLHttpRequest();
        client.open('GET', 'javascripts/front/Example-Project');
        client.onreadystatechange = function () {
            main_string = client.responseText;
        }
        client.send();
    */


    $("#msg-close-opt-profile").click(function() {
        $("#profile-box").fadeOut();
    });
    $("#msg-close-opt-cc").click(function() {
        $("#cc-box").fadeOut();
    });
    $("#msg-close-opt-projects").click(function() {
        $("#my-projects-box").fadeOut();
    });
    $("#r-p-cc").click(function() {
        $("#run-proc-box").fadeOut();
    });

    $("#msg-close-opt-help").click(function() {
        $("#help-box").fadeOut();
    });
    $("#msg-close-opt-about").click(function() {
        $("#about-box").fadeOut();
    });
    $("#msg-close-opt-gallery").click(function() {
        $("#gallery-box").fadeOut();
    });
    $("#mm-help").click(function() {
        $("#help-box").fadeIn();
    });

    $("#mm-about").click(function() {
        $("#about-box").fadeIn();
    });

    var pathName = window.location.pathname;
    pathName = pathName.substring(1);
    var regexResult = pathName.search(/^([0-9]{4}\.[0-9]{3,}[v][1-9][0-9]{0,})|([0-9]{4}\.[0-9]{3,})$/);
    if (regexResult == 0) {

        var dateName = pathName.substring(0, 4);

        var posVersion = pathName.search(/([v])/);
        var version;
        var projectNo;
        if (posVersion == -1) {
            version = "v1";
            projectNo = pathName.substring(5);
        } else {
            version = pathName.substring(posVersion);
            projectNo = pathName.substring(5, posVersion);
        }
        $.post('/get_public_project', {
            dateName: dateName,
            version: version,
            projectNo: projectNo

        }, function(result) {
            if (result.string == "") {
                result.string = null;
            } else {
                result.string = JSON.parse(result.string);
            }
            render_project_front(result.string, result.meta.project_name, pathName);
            $("#text-p-desc").val(result.meta.project_desc);
            $("#diagram-title").val(result.meta.project_name);
        });
    } else {

    }

    var addingVersion = false;

    function render_project_list(listType, projectData) {

        $("#plist").html("");
        if (listType == 2 || listType == 3) {
            $("#pl-addnew").html("");
        }
        $("#gallery-box").fadeIn();

        $.post("/get_project_list", {
            listType: listType,
            projectData: projectData
        }, function(result) {
            var metaData;
            var project_ids = result.project_ids;
            if (project_ids.length > 0) {
                for (var i = 0; i <= project_ids.length - 1; i++) {
                    var pID = project_ids[i];
                    var pIDu = project_ids[i];
                    var datePubHTML = "";
                    var authHTML = "";
                    var delProjectHTML = "";
                    var publishOptHTML = "";
                    var shareOptHTML = "";
                    var versionOptionsHTML = "";
                    var versions = [];
                    var ppOptHTML = "";
                    var addVersionSelectOptHTML = "";
                    if (listType == 2 || listType == 3) {
                        var dateName = pID.substring(0, 4);
                        var projectNo = pID.substring(5);

                        pIDu = dateName + "_" + projectNo;
                        datePubHTML = "Date Published: <span id = 'date" + pIDu + "'></span><br>";
                        authHTML = "Authors: <span id = 'authors" + pIDu + "'></span><br>";
                        if (listType != 1) {
                            versionOptionsHTML = "View Different Versions: <span id = 'version-list" + pIDu + "'></span>";

                        } else if (projectData.substring(0, 2) == "av" && listType == 2) {
                            addVersionSelectOptHTML = "<span id = 'AV-select" + pIDu + "' class = 'AV-select'>SELECT</span>";
                            $(".AV-select").animate({
                                letterSpacing: "3px"
                            }, 700);
                            $(".AV-select").animate({
                                letterSpacing: "1px"
                            }, 700);
                            setInterval(function() {
                                $(".AV-select").animate({
                                    letterSpacing: "3px"
                                }, 700);
                                $(".AV-select").animate({
                                    letterSpacing: "1px"
                                }, 700);
                            }, 1400);
                        }
                    } else if (listType == 1) {
                        delProjectHTML = "<div class = 'delete-container'><span class = 'del-project' id = 'del" + pIDu + "'>Delete</span><span id = 'indel-" + pIDu + "' style = 'display:none'><input id = 'dct-" + pIDu + "' type = 'text' placeholder = 'Type \"delete\" to confirm' class = 'del-confirm-field'> <span id = 'cancel-del-" + pIDu + "' class = 'cancel-del'>x</span></span></div>";
                        publishOptHTML = "<span class = 'publish-project' id = 'pub" + pIDu + "'>Publish</span>";
                        shareOptHTML = "<span class = 'share-project-opt' id = 'share-p" + pIDu + "'>Share</span>";
                        ppOptHTML = "<div class = 'pp-opts'>" + publishOptHTML + shareOptHTML + delProjectHTML + "</div>";
                    }


                    var listComponents = "<div id = '" + pIDu + "' class = 'gallery-pcomp' link = '" + pIDu + "'>" +
                        "<b style = 'color: dimgrey;font-size:115%;' id = 'title" + pIDu + "' class = 'gallery-comp-title'></b>" + addVersionSelectOptHTML + "<br>" +
                        datePubHTML + ppOptHTML +
                        authHTML +
                        "<span style = 'color:#887f8d;' id = 'desc" + pIDu + "'></span><br>" +
                        versionOptionsHTML +
                        "</div>";
                    $("#plist").append($(listComponents));

                }

                for (var i = 0; i <= project_ids.length - 1; i++) {
                    var pID = project_ids[i];
                    var pIDu = project_ids[i].replace('.', '_');
                    if (listType == 1) {
                        (function(pID) {
                            var user_id = result.user_id;

                            $.get('/private/' + user_id + '/projects/' + pID + '/meta.json', function(meta) {
                                $("#title" + pID).html(meta.project_name);
                                if (meta.project_desc == "") {
                                    meta.project_desc = "No Abstract Supplied";
                                }
                                $("#desc" + pID).html(meta.project_desc);
                            });
                        })(pID);
                    } else if (listType == 2 || listType == 3) {
                        (function(pIDu, pID) {
                            var Edata;
                            var dateName = project_ids[i].substring(0, 4);
                            var projectNo = project_ids[i].substring(5);

                            var latestVersion = "v1";
                            $.get('/public/' + dateName + '/' + projectNo + '/versions/' + latestVersion + '/meta.json', function(meta) {
                                $("#title" + pIDu).html(meta.project_name);
                                if (meta.project_desc == "") {
                                    meta.project_desc = "No Abstract Supplied";
                                }
                                $("#desc" + pIDu).html(meta.project_desc);
                            });
                            $.get('/public/' + dateName + '/' + projectNo + '/data.json', function(data) {
                                $("#date" + pIDu).html(data.date_published);
                                $("#authors" + pIDu).html(data.owners.join());
                            });

                            $.post('/get_pp_versions', {
                                pid: pIDu
                            }, function(result) {

                                for (var i = 0; i <= result.length - 1; i++) {
                                    $("#version-list" + pIDu).append("<a href = '/" + pID + result[i] + "'>" + result[i] + "</a>,");
                                }
                            });

                        })(pIDu, pID);
                    }
                }

                if (listType == 1) {

                    // select/open a private project
                    $(".gallery-comp-title").click(function() {
                        global_p_id = $(this).attr("id").substring(5);
                        $("#errors").fadeOut();
                        $.post("/profile", {
                            valid: true
                        }, function(email, status) {
                            $.get("/private/" + email + "/projects/" + global_p_id + "/string.json",
                                function(result, status) {
                                    render_project_front(result);
                                    gProject.saveState();
                                });
                            $.get("/private/" + email + "/projects/" + global_p_id + "/meta.json",
                                function(result) {
                                    $("#text-p-desc").val(result.project_desc);
                                    $("#diagram-title").val(result.project_name);
                                    $("#gallery-box").fadeOut();
                                });
                        });
                    });

                    //delete private project
                    $(".del-project").click(function() {
                        var p_id = $(this).attr("id").substring(3);
                        $("#del" + p_id).hide();
                        $("#indel-" + p_id).show();
                        $("#dct-" + p_id).animate({
                            width: "200px"
                        }, 1000).focus();
                        $("#dct-" + p_id).keyup(function() {
                            if ($(this).val() == "delete") {
                                $("#dct-" + p_id).animate({
                                    width: "0px"
                                }, 1000).animate({
                                    padding: "0px"
                                }, 100);
                                setTimeout(function() {

                                    $("#errors").fadeOut();

                                    $.post('/delete_project', {
                                        proj_id: p_id
                                    }, function(result, status) {
                                        if (result.success == true) {
                                            $("#gallery-box").fadeOut();
                                            show_msg("Successfully deleted.", 2000, 2);
                                        }
                                    });
                                }, 1000);
                            }
                        });
                        $("#cancel-del-" + p_id).click(function() {
                            $("#dct-" + p_id).animate({
                                width: "0px"
                            }, 1000, function() {
                                $("#indel-" + p_id).hide();
                                $("#del" + p_id).show();
                            });

                        });
                    });

                    //specific project is requested to be published
                    $(".publish-project").click(function() {
                        var p_id = $(this).attr("id").substring(3);
                        show_msg("Would you like to publish this project as " +
                            "a new version of an existing public project?" +
                            "<div id = 'publish-opt-no' class = 'button-style-3'>No</div><div class = 'button-style-3' style = 'float:right;margin-top: -31px;' id = 'publish-opt-yes'>Yes</div>", 20000, 3);
                        $("#publish-opt-no").click(function() {
                            $.post('/publish_project', {
                                pid: p_id
                            }, function(result) {
                                show_msg("Successfully published your new project. View it here: <a href = '" + window.location.href + result.projectURL + "'>" + window.location.href + result.projectURL + "</a>", 4000, 2);
                            });
                        });
                        $("#publish-opt-yes").click(function() {
                            $("#errors").animate({
                                marginTop: "-160px"
                            }, 1200);
                            show_msg("Please select which public project you would like to add this version to...", 20000, 3);

                            $("#change-list-type").val("3").change();
                            render_project_list(2, "av" + p_id);
                        });
                    });
                    $(".share-project-opt").click(function() {
                        var p_id = $(this).attr("id").substring(7);
                        show_msg("Enter user emails: <input type = 'text' id = 'share-p-emails' class = 'text-field-style-1' placeholder = 'email@example.com, test@example.com, etc'><input type = 'button' id = 'share-p' value = 'Share' class = 'submit-field-style-1'>", 40000, 3);
                        $("#share-p").click(function() {

                            var emails = $("#share-p-emails").val();
                            $.post('share_project', {
                                p_id: p_id,
                                emails: emails
                            }, function(result) {
                                show_msg(result.msg, 5000, result.successcolor);
                            });
                        });

                    });
                } else if (listType == 3 || listType == 2) {
                    $(".gallery-comp-title").click(function() {
                        global_p_id = $(this).attr("id").substring(5);
                        var dateName = global_p_id.substring(0, 4);
                        var projectNo = global_p_id.substring(5);
                        var latestVersion = "v1";
                        $("#errors").fadeOut();
                        $.post("/get_public_project", {
                            dateName: dateName,
                            version: latestVersion,
                            projectNo: projectNo
                        }, function(result, status) {
                            render_project_front(JSON.parse(result.string));
                            $("#text-p-desc").val(result.meta.project_desc);
                            $("#diagram-title").val(result.meta.project_name);
                            $("#gallery-box").fadeOut();
                        });
                    });
                    if (listType == 2 && projectData.substring(0, 2) == "av") {
                        $(".AV-select").click(function() {
                            var public_id = $(this).attr("id").substring(9);
                            var private_id = projectData.substring(2);
                            $("#errors").animate({
                                marginTop: "0"
                            }, 1200);
                            $.post('add_version_pp', {
                                public_id: public_id,
                                private_id: private_id
                            }, function(result) {
                                if (result == "success") {
                                    show_msg("Successfully added new version.", 3000, 2);
                                    render_project_list(1, "");
                                }
                            });
                        });
                    }
                }
            } else {
                $("#plist").html("<span style = 'top: 150px;position: relative;font-size:130%;color: grey;text-align: center;'>This list of projects is empty.</span>");
            }
        });
    }

    //renders gallery project list
    var date = new Date();
    var curYear = date.getFullYear().toString().substr(2, 2);
    var curMonth = (date.getMonth() + 1).toString();
    var currentDateName = curYear + curMonth;
    var cDateNoDir = false;
    $("#mm-gallery").click(function() {
        $.post('/get_all_datenames', function(result) {
            var optionsHTML = "";
            for (var i = result.length - 1; i >= 0; i--) {
                console.log("if " + result[i] + " == " + currentDateName);
                if (result[i] == currentDateName) {
                    cDateNoDir = true;
                }
                optionsHTML = optionsHTML + "<option value = '" + result[i] + "'>" + result[i] + "</options>";
            }
            if (cDateNoDir == false) {
                //if is new month but no projects yet (no dir made yet for new month) 
                optionsHTML = "<option value = '" + currentDateName + "'>" + currentDateName + "</options>" + optionsHTML;
            }
            $("#pl-title").html("The Globular Gallery <select id = 'change-gg-month' class = 'pl-selects'>" + optionsHTML + "</select>");
            render_project_list(3, currentDateName);
            $("#change-gg-month").change(function() {
                render_project_list(3, $(this).val());
            });
        });
    });

    //renders user project list
    $("#mm-projects").click(function() {

        function controlAddP() {

            $("#add-project-submit").click(function() {
                var p_name = $("#ap-name").val();
                var p_desc = $("#proj_desc").val();
                var main_string = $("#ap-string").val();
                $.post("/add_new_project", {
                    p_name: p_name,
                    p_desc: p_desc,
                    string: main_string
                }, function(result, status) {
                    var colour = 2;
                    if (result.success == true) {
                        if (main_string == "") {
                            main_string = null;
                        } else {
                            main_string = JSON.parse(main_string);
                        }
                        global_p_id = result.p_id;
                        render_project_front(main_string);
                        $("#text-p-desc").val(p_desc);
                        $("#diagram-title").val(p_name);
                        gProject.saveState();
                        $("#add-project-opt").animate({
                            height: "20px"
                        }, 500);
                        $("#add-project-opt").css("box-shadow", "0px 0px 0px");
                        $("#gallery-box").fadeOut();
                    } else {
                        colour = 1;
                    }
                    show_msg(result.msg, 2000, colour);
                });
            });
        }

        $("#pl-title").html("Your <select id = 'change-list-type' class = 'pl-selects'><option value = '1'>Private</option><option value = '2'>Published</option></select> Projects ");
        render_project_list(1, "");
        var addNewProjectHTML = "<div id='add-project-opt'>" +
            "<div id = 'addp-title'>Create Project +</div>" +
            "<input type='text' placeholder='Project Name...' id='ap-name' class='text-field-style-1' style='width: 90%;margin-top:15px;'>" +
            "<textarea id='ap-string' class='text-area-style-1' placeholder='Default String...(optional)'  style='width: 90%;margin-top:10px;'></textarea>" +
            "<textarea id='proj_desc' class='text-area-style-1' placeholder='Description...(optional)'  style='width: 90%;height: 80px;'></textarea>" +
            "<input type='button' id='add-project-submit' class='submit-field-style-1' value='Add'>" +
            "</div>";
        $("#pl-addnew").html(addNewProjectHTML);
        controlAddP();

        $("#change-list-type").change(function() {
            if ($(this).val() == "1") {
                $("#pl-addnew").html(addNewProjectHTML);
            }
            if ($(this).val() == "3") {
                //
            } else {
                render_project_list($(this).val(), "");
                controlAddP();
            }

        });
    });
});
