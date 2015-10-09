//!
// Coordinate systems
//
resolution = 0.02;  // meter/pix
width  = $("#canvas").width();  // pix
height = $("#canvas").height();  // pix

function pix2world(pix) { return pix * resolution; }
function world2pix(meter) { return meter / resolution; }

function x2v(x) { return height / 2 - world2pix(x); }
function y2u(y) { return width / 2 - world2pix(y); }
function v2x(v) { return pix2world(height / 2 - v); }
function u2y(u) { return pix2world(width / 2 - u); }


//!
// Main loop
//

var map_mode = "VISUAL";
var drive_mode = 0;

function domReady() {
    // canvas setting
    ctx = $("#canvas")[0].getContext("2d");
    //updateScreen();
    //setGoal();

    //setDriveMode($("#drive_mode li").first().children());
    //
    //
    //

    refleshImages(1);
    refleshMeasurements(2);

    $("[name=map-mode]").change(function() {
        map_mode = $(this).val();
    });

    $("[name=auto-drive]").change(function() {
        drive_mode = $(this).val();
    });
}

function refleshImages(rate) {
    switch (map_mode) {
        case "VISUAL":
            $("#map-snapshot").attr("src", getBaseUrl() + "img/_images_visual_map.png?" + Math.random());
            break;
        case "HAZARD":
            $("#map-snapshot").attr("src", getBaseUrl() + "img/_images_hazard_map.png?" + Math.random());
            break;
    }
    $("#camera-snapshot").attr("src", getBaseUrl() + "img/_images_left.png?" + Math.random());
    setTimeout(function() {
        refleshImages(rate);
    }, 1000.0 / rate);
}

function refleshMeasurements(rate) {
    getResource('sensor/imu/roll', function(arg) { 
        var obj = $("#global-pose-roll");
        obj.text(arg); 
        obj.css("color", (Math.abs(parseFloat(arg)) > 20 ? "red": "black"));

        $("#img-roll").css("transform", "rotate(" + Math.round(arg) + "deg)"); 
    });

    getResource('sensor/imu/pitch', function(arg) { 
        var obj = $("#global-pose-pitch");
        obj.text(arg); 
        obj.css("color", (Math.abs(parseFloat(arg)) > 20 ? "red": "black"));
        $("#img-pitch").css("transform", "rotate(" + Math.round(arg) + "deg)"); 
    });

    getResource('sensor/bus/com-busv', function(arg) { 
        var obj = $("#state-com-busv");
        obj.text(arg); 
        obj.css("color", (parseFloat(arg) < 28 ? "red": "black"));
    });

    getResource('sensor/bus/mob-busv', function(arg) { 
        var obj = $("#state-mob-busv");
        obj.text(arg); 
        obj.css("color", (parseFloat(arg) < 28 ? "red": "black"));
    });

    setTimeout(function() {
        refleshMeasurements(rate);
    }, 1000.0 / rate);
}

//!
// Visualization utility
//

function selectMapMode(mode) {
    switch (mode) {
        case "VISUAL":
            break;
        case "HAZARD":
            break;
        case "ELEVATION":
            break;
    }

}


//!
// Network utility
//

function getResource(resource, callback) {
    $.ajax({
        type: "GET",
        url: resource,
        success: function(result, status, xhr) {
            //console.log(result);
            callback(result);
        },
        error: function(result, status, xhr) {
        }
    });
}

function updateScreen() {
    var view_terrain = new Image();
    var view_left = new Image();
    view_terrain.onload = function() {
        $("#alert-comm").hide();
        $("#view_terrain").attr("src", this.src);
        setTimeout(updateScreen, 3000);
    }
    view_terrain.onerror = function() {
        $("#alert-comm").show();
        setTimeout(updateScreen, 1000);
    }
    view_terrain.src = getBaseUrl() + "img/_images_cost_map.png?" + (new Date()).getTime();
    view_left.src = getBaseUrl() + "img/_images_left.png?" + (new Date()).getTime();

    var view_class = new Image();
    view_class.src = getBaseUrl() + "img/_images_cost_map.png?" + (new Date()).getTime();
    view_class.onload = function() {
        $("#view_class").attr("src", this.src);
    }

}

function clearCanvas() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function setDriveMode(obj) {
    // set menu active
    $("#drive_mode").children().each(function(i) {$("#drive_mode").children(i).removeClass("active");});
    obj.parent().addClass("active");

    // show controller
    $(".control_pane_item").each(function(i,ob) { jQuery(ob).hide(); });
    if (obj.text()[0] == "M") $("#manual_pane").show();
    else if (obj.text()[0] == "A") $("#autonav_pane").show();
}

function toggleButtonGroup(obj) {
    obj.siblings().each(function(i, ob) { jQuery(ob).removeClass("active"); });
    obj.addClass("active");
}

function setGoal() {
    mousedown = false;

    function _setGoalToInput(e) {
        var rect = canvas.getBoundingClientRect();
        u = e.clientX - rect.left;
        v = e.clientY - rect.top;

        $("#goalX").val(v2x(v).toFixed(2));
        $("#goalY").val(u2y(u).toFixed(2));
    }

    canvas.onmousedown = function(e) {
        mousedown = true;
    }
    
    canvas.onmousemove = function(e) {
        if (mousedown == false) return;
        _setGoalToInput(e);
    }

    canvas.onmouseup = function(e) {
        mousedown = false;
        _setGoalToInput(e);
    }
}

function sendGoal() {
    $.post('/send_goal', {
        startU: y2u(0),
        startV: x2v(0),
        goalU: y2u($("#goalY").val()),
        goalV: x2v($("#goalX").val()),
    }).done(function() {
    });
}

function makePath() {
    $("#alert-path").hide();
    $.post('/planning', {
        startU: y2u(0),
        startV: x2v(0),
        goalU: y2u($("#goalY").val()),
        goalV: x2v($("#goalX").val()),
    }).done(function(arg) {
        msg(arg);
        $.ajax({
            url: "{{ url_for('static', filename='data/path.csv') }}?" + (new Date()).getTime(),
            success: function (csvd) {
                waypoints = $.csv2Array(csvd);
                drawPath(waypoints);
            },
            dataType: "text",
            complete: function () {
            }
        });
    }).fail(function() {                        
        $("#alert-path").show();
    });
}

function drawPath(waypoints) {
    clearCanvas();
    ctx.lineCap = "round";
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "#FF00FF";
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width / 2, height / 2);
    for (var i = 0; i < waypoints.length; ++i) {
        ctx.lineTo(y2u(waypoints[i][1]), x2v(waypoints[i][0]));
        ctx.stroke();
    }
}


function msg(text) {
    $("#notification").html(text);
}

$( domReady ); 
