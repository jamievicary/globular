"use strict";

// Global project object
var gProject = {};
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
        }
        else if (key == 't') {
            gProject.saveSourceTarget('target');
        }
        else if (key == 'i') {
            gProject.takeIdentity();
        }
        else if (key == 'c') {
            gProject.clearDiagram();
        }
        else if (key == 'p') {
            gProject.applyStochasticProcess(1);
        }
        else if (key == 'z') {
            gProject.displayInterchangers();
        }
        else if (key == 'q') {
            gProject.storeTheorem();
        }
        else if (key == ' ') {
            if (timeout == null) {
                timeout = setInterval(function() {
                    gProject.applyStochasticProcess(1);
                }, 1000);
            }
            else {
                clearInterval(timeout);
                timeout = null;
            }
        }
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
            $("#view-desc-plate, #view-p-desc").animate({
                marginLeft: "-=300px"
            }, 1500);

        }
        else {
            $("#view-desc-plate, #view-p-desc").animate({
                marginLeft: "+=300px"
            }, 1500);

        }
        dbltoggle = dbltoggle + 1;
    });

    // Click handler on main diagram
    // Handle navigation by forward and back buttons
    window.onpopstate = function(event) {
        if (event.state === null) {
            // do nothing
        }
        else if (event.state === "") {
            render_project_front(null);
            $("#diagram-title").val("New Project");
        }
        else {
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

    //determines wether user is logged in or out - renders different home pages
    function render_frontend(state) {
        if (state === "out") {
            $("div.enable_if-in").hide();
            $("div.enable_if-out").show();

        }
        else {
            $("div.enable_if-in").show();
            $("div.enable_if-out").hide();
        }
        if (window.location.pathname.length < 3) {
            render_project_front(null);
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
                }
                else {
                    render_page();

                    show_msg("Incorrect login details, please try again.", 3000, 1);
                }
            }
            else {
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
                    }
                    else {
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
            }
            else {
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

        // Render main diagram
        gProject.renderDiagram();

        // Bind resizing to the correct rendering function		
        $(window).unbind('resize');
        $(window).bind('resize', function() {
            $('#diagram-canvas').css('width', window.innerWidth - $('#control-body').width());
            $('#diagram-canvas').css('height', window.innerHeight - $('#header').height());
            globular_set_viewbox();
            //gProject.renderDiagram();
        })
        $('#diagram-canvas').css('width', window.innerWidth - $('#control-body').width());
        $('#diagram-canvas').css('height', window.innerHeight - $('#header').height());

        // Render the list of n-cells
        gProject.renderCells();

        $("#add-0-cell-opt").click(function() {

            gProject.addZeroCell();
            gProject.renderCells();

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

    //on request to see list of projects
    $("#mm-projects").click(function() {
        $.post("/get_projects", {}, function(result, status) {
            if (result.success == false) {
                $("#project-list").html(result.msg);
                $("#my-projects-box").fadeIn();
            }
            else {
                var projects = result.projects;
                var p_ids = result.project_ids;

                var projects_str = "";
                for (var i = 0; i < projects.length; i++) {
                    projects_str = projects_str + "<span id = '1-p-row-" + p_ids[i] + "'></span>" +
                        "<span id = '2-p-row-" + p_ids[i] + "'>" +
                        "<span class = 'select-project' id = 'id-" + p_ids[i] + "'>" +
                        projects[i] +
                        "</span>" +
                        "<span style = 'font-size:80%;color: #335566;float: right;margin-top:3px;'>" +
                        "<span class = 'publish-project' id = 'id-" + p_ids[i] + "'>Publish</span>&middot;" +
                        "<span class = 'del-project' id = 'id-" + p_ids[i] + "' p_name = '" + projects[i] + "'>Delete</span>" +
                        "</span></span><hr size = '1'>";
                }

                $("#project-list").html(projects_str);
                $("#my-projects-box").fadeIn();

                //when one project on list is requested to be deleted
                $(".del-project").click(function() {
                    var org_name = $(this).attr("p_name");
                    var p_id = $(this).attr("id").substring(3);

                    $("#2-p-row-" + p_id).hide();
                    $("#1-p-row-" + p_id).html("<input id = 'dct-" + p_id + "' type = 'text' placeholder = 'Type \"delete\" to confirm' class = 'del-confirm-field'> <span id = 'cancel-del-" + p_id + "' class = 'cancel-del'>x</span>");
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
                                        $("#my-projects-box").fadeOut();
                                        show_msg("Successfully deleted.", 2000, 2);
                                    }
                                });
                            }, 1000);
                        }
                    });

                    $("#cancel-del-" + p_id).click(function() {
                        $("#1-p-row-" + p_id).html("");
                        $("#2-p-row-" + p_id).show();
                    });
                });

                //when a specific project is selected to be rendered.
                $(".select-project").click(function() {
                    var global_p_id = $(this).attr("id").substring(3);
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

                            });

                    });
                });

                //specific project is requested to be published
                $(".publish-project").click(function() {
                    var p_id = $(this).attr("id").substring(3);
                    $.post('/publish_project', {
                        pid: p_id
                    }, function() {

                    });
                });
            }
        });
    });


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
                    show_msg("Please login in order to save this project. If you do not have an account then sign up now!", 7000, 3);
                }
                else {
                    var name = $("#diagram-title").val();
                    $.post("/save_project_changes", {
                        string: currentString,
                        p_id: global_p_id,
                        p_name: name,
                        p_desc: $("#text-p-desc").val()
                    }, function(result, status) {

                        show_msg("Successfully saved changes.", 2000, 2);

                    });
                }

            });
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

    $("#add-project-opt").click(function() {
        $("#add-project-opt").animate({
            height: "230px"
        }, 500);
    });
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
                render_project_front("", p_name, result.p_id);
                gProject.saveState();
                $("#add-project-opt").animate({
                    height: "20px"
                }, 500);
            }
            else {
                colour = 1;
            }
            show_msg(result.msg, 2000, colour);
        });
    });

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
        }
        else {
            version = pathName.substring(posVersion);
            projectNo = pathName.substring(5, posVersion);
        }
        $.post('/get_public_project', {
            dateName: dateName,
            version: version,
            projectNo: projectNo

        }, function(result) {
            render_project_front(JSON.parse(result.string), result.meta.project_name, pathName);
            $("#text-p-desc").val(result.meta.project_desc);
            $("#diagram-title").val(result.meta.project_name);
        });
    }
    else {

    }

    function render_gallery(dateName) {
        $.post('/get_gallery_data', {
            dateName: dateName
        }, function(result) {
            var projects = result.projectNoArr;
            // create all the divs for the different projects
            for (var num = 0; num < projects.length; num++) {
                var projectNo = projects[num];
                var pID = dateName + "_" + projectNo;
                $("#gallery-box").append($("<a href = '/" + pID + "' id = 'a" + pID + "' style = 'text-decoration: none;'></a>"));
            }
            for (var num = 0; num < projects.length; num++) {
                var latestVersion = "v1";
                var projectNo = projects[num];
                (function(projectNo) {
                    $.get("/public/" + dateName + "/" + projectNo + "/versions/" + latestVersion + "/meta.json", function(meta) {
                        $.get("/public/" + dateName + "/" + projectNo + "/data.json", function(data) {
                            var pname = meta.project_name;
                            var pdesc = meta.project_desc;
                            if (pdesc == "") {
                                pdesc = "No description provided.";
                            }
                            var datePublished = data.date_published;
                            var owners = data.owners.join();
                            var disDateName = dateName.substring(0, 2) + "/" + dateName.substring(2, 4);
                            $("#gg-date-title").html(" - " + disDateName);
                            var pID = dateName + "_" + projectNo;
                            console.log("#a" + pID);
                            var obj = $('#a' + pID);
                            obj.append($("<div>Hi there my friend</div>"));
                            /*
                            $("#a" + pID).html(
                                "<div id = '" + pID + "' class = 'gallery-pcomp'>" +
                                "<b style = 'color: dimgrey;font-size:115%;'>" + pname + "</b><br>" +
                                "Date Published: " + datePublished + "<br>" +
                                "Authors: " + owners + "<br>" +
                                "<span style = 'color:#887f8d'>" + pdesc + "</span>" +
                                "</div>");
                            */
                        });
                    })
                })(projectNo);
            }
        });
    }
    var date = new Date();
    var curYear = date.getFullYear().toString().substr(2, 2);
    var curMonth = (date.getMonth() + 1).toString();
    var currentDateName = curYear + curMonth;
    $("#mm-gallery").click(function() {
        $("#gallery-box").fadeIn();
        render_gallery(currentDateName);
    });


});
