"use strict";

// Global project object
var gProject = {};

$(document).ready(function() {
	
    globular_prepare_renderer();

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
    });

    // ADD STOCHASTIC PROCESSING BUTTON

    var original_msg_html = $("#errors").html();
	$(".box").draggable({ containment: "document", cursor: "crosshair" });
	
    // Click handler on main diagram
    var c = $('#diagram-canvas').click(function(event) {
        if ($(this).width() == 0) return;
        if ($(this).height() == 0) return;
        var b = this.bounds;
        var x = b.left + ((b.right - b.left) * event.offsetX / $(this).width());
        var y = b.top + ((b.bottom - b.top) * event.offsetY / $(this).height());
        var rectangles = $('#diagram-canvas')[0].rectangles;
        //console.log("Clicked pixel=(" + event.offsetX + "," + event.offsetY + ") = logical " + x + "," + y + ")");

        for (var i = 0; i < rectangles.length; i++) {
            var r = rectangles[i];
            if (x < r.x_min) continue;
            if (x > r.x_max) continue;
            if (y < r.y_min) continue;
            if (y > r.y_max) continue;

            // Tell the project object that we've clicked on a rectangle
            gProject.clickCell(r.height);
            return;
        }

    });

    // Handle navigation by forward and back buttons
    window.onpopstate = function(event) {
        if (event.state == null) {
            render_project_front("", "", "");
        }
        else {
            render_project_front(event.state.string, "test", 0);
        }
    };

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

    $(document).ajaxStart(function() {
        $("#ajax-loading").fadeIn();
    });
    $(document).ajaxStop(function() {
        $("#ajax-loading").fadeOut();
    });

    function render_frontend(state) {
        if (state === "out") {
            $(".enable_if-out").show();
            render_project_front("", "New Project", "null", state);
            $(".enable_if-in").hide();
        }
        else {
            $(".enable_if-out").hide();
            $(".enable_if-in").show();
            $("#cell-body").css("margin-top", "-120px");
            $("#cell-body").css("height", "calc( 100% - 180px )");
        }
        var pair1 = "1";
        var pair2 = "2";

        $("#opt-section-" + pair2).hide();
        $("#opt-" + pair2).css("border-bottom", "2px solid black");
        $("#opt-" + pair1).click(function() {
            $(this).css("border-bottom", "2px solid #00b8ff");
            $("#opt-" + pair2).css("border-bottom", "2px solid black");
            $("#opt-section-" + pair1).show();
            $("#opt-section-" + pair2).hide();
        });
        $("#opt-" + pair2).click(function() {
            $(this).css("border-bottom", "2px solid #00b8ff");
            $("#opt-" + pair1).css("border-bottom", "2px solid black");
            $("#opt-section-" + pair2).show();
            $("#opt-section-" + pair1).hide();
        });


    }

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

    $("#login-button").click(function() {
        var login_email = $("#login_email").val();
        var login_pass = $("#login_pass").val();
        $.post("/login", {
            login_pass: login_pass,
            login_email: login_email
        }, function(result, status) {
            if (status == "success") {
                if (result.success) {
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

    $("#view-profile-opt").click(function() {
        $.post("/profile", {
            valid: true
        }, function(result, status) {
            $("#errors").css("text-align", "left");

            $("#profile-email").html(result.email);
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
                type = 2;
            }
            else {
                type = 1;
            }
            show_msg(result.msg, 4000, type);
        });
    });


    function render_project_front(s, name, p_id) {
        $("#cell-body").html("");
        $("#my-projects-box").fadeOut();
        $("#save-project-opt").attr("p_id", p_id);
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
            $('#diagram-canvas').css('width', window.innerWidth - 300);
            $('#diagram-canvas').css('height', window.innerHeight - 20);
            gProject.renderDiagram();
        })

        // Render the list of n-cells
        gProject.renderCells();

        $("#add-0-cell-opt").click(function() {

            gProject.addZeroCell();
            gProject.renderCells();

        });

        $("#project-menu").fadeIn(1000);
        $("#diagram-canvas").fadeIn(1000);
        $("#diagram-title").val(name).fadeIn(3000);

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

        $("#save-project-opt").click(function() {
            var currentString = gProject.currentString();
            var p_id = $(this).attr("p_id");
            $.post("/c-loggedin", {
                    valid: true
                },
                function(result, status) {
                    if (result.status === "in" && p_id == "null") {
                        p_id = "hold";
                    }
                    if (p_id == "null") {
                        show_msg("Please login in order to save this project. If you do not have an account then sign up now!", 7000, 3);

                    }
                    else {
                        var name = $("#diagram-title").val();
                        $.post("/save_project_changes", {
                            string: currentString,
                            p_id: p_id,
                            p_name: name
                        }, function(result, status) {

                            show_msg("Successfully saved changes.", 2000, 2);

                        });
                    }

                });

        });
        $("#get-str-opt").click(function() {
            var msg = "<textarea class = 'text-area-style-1' style = 'height: 400px;width:255px;'>" + gProject.currentString() + "</textarea>";
            show_msg(msg, false, 3);
        });

    }

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

    $("#my-projects-opt").click(function() {
        $.post("/get_projects", {}, function(result, status) {
            if (result.success == false) {
                $("#project-list").html(result.msg);
                $("#my-projects-box").fadeIn();
            }
            else {
                var projects = result.projects;
                var p_ids = result.project_ids;
                var strings = result.project_strings;
                var projects_str = "";
                for (var i = 0; i < projects.length; i++) {
                    projects_str = projects_str + "<span id = '1-p-row-" + p_ids[i] + "'></span><span id = '2-p-row-" + p_ids[i] + "'><span class = 'select-project' id = 'id-" + p_ids[i] + "'>" + projects[i] + "</span><span class = 'del-project' id = 'id-" + p_ids[i] + "' p_name = '" + projects[i] + "'>Delete</span></span><hr size = '1'>";
                }

                $("#project-list").html(projects_str);
                $("#my-projects-box").fadeIn();

                $(".select-project").click(function() {

                    var p_id = $(this).attr("id").substring(3);
                    $("#errors").fadeOut();

                    $.post("/get_project_string", {
                        p_id: p_id
                    }, function(result, status) {
                        var s = result.string;
                        render_project_front(s, result.name, p_id);
                        gProject.saveState();
                    });

                });
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
            }
        });
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
            height: "170px"
        }, 500);
    });
    $("#add-project-submit").click(function() {
        var p_name = $("#ap-name").val();
        $.post("/add_new_project", {
            p_name: p_name,
            //string: main_string
            string: ""
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
});
