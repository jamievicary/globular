"use strict";

/*
    Diagram rendering with Three.js
*/

// Implementation idea for the future:
// http://stackoverflow.com/questions/30541121/multiple-webgl-models-on-the-same-page

// Choose "SVG" or "THREE"
var render_mode = "SVG";
//var render_mode = "THREE";

var globular_offscreen = {};
var pixelScale = 1;
//var line_width = 0.01;
//var sphere_radius = 0.05;
var item_size = 0.05;
var Pi = 3.141592654;

// Create offscreen WebGL canvas
function globular_prepare_renderer() {
    
    if (render_mode == 'SVG') {
        // No init required for SVG
    }
    else if (render_mode == 'THREE') {
        globular_prepare_renderer_THREE();
    }
    else {
        alert ("Invalid render mode");
        return;
    }
}

// Render a diagram on the offscreen canvas, then copy to the specified container
function globular_render(container, diagram, subdiagram, suppress) {
    
    if (render_mode == 'SVG') {
        globular_render_SVG(container, diagram, subdiagram, suppress);
    }
    else if (render_mode == 'THREE') {
        globular_render_THREE(container, diagram, subdiagram);
    }
    else {
        alert("Invalid render mode");
    }

}

function SVGtoPNG(svgElement, callback) {
  var svgURL = new XMLSerializer().serializeToString(svgElement);
  alert(svgURL);
  var img = new Image();
  img.onload = function() {
  	var canvas = $('#mycanvas')[0];
    canvas.getContext('2d').drawImage(this, 0, 0);
    callback(canvas.toDataURL());
  }
  img.src = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(svgURL);
}

// Adds canvas.toBlob function
(function(a){"use strict";var b=a.HTMLCanvasElement&&a.HTMLCanvasElement.prototype,c=a.Blob&&function(){try{return Boolean(new Blob)}catch(a){return!1}}(),d=c&&a.Uint8Array&&function(){try{return(new Blob([new Uint8Array(100)])).size===100}catch(a){return!1}}(),e=a.BlobBuilder||a.WebKitBlobBuilder||a.MozBlobBuilder||a.MSBlobBuilder,f=(c||e)&&a.atob&&a.ArrayBuffer&&a.Uint8Array&&function(a){var b,f,g,h,i,j;a.split(",")[0].indexOf("base64")>=0?b=atob(a.split(",")[1]):b=decodeURIComponent(a.split(",")[1]),f=new ArrayBuffer(b.length),g=new Uint8Array(f);for(h=0;h<b.length;h+=1)g[h]=b.charCodeAt(h);return i=a.split(",")[0].split(":")[1].split(";")[0],c?new Blob([d?g:f],{type:i}):(j=new e,j.append(f),j.getBlob(i))};a.HTMLCanvasElement&&!b.toBlob&&(b.mozGetAsFile?b.toBlob=function(a,c,d){d&&b.toDataURL&&f?a(f(this.toDataURL(c,d))):a(this.mozGetAsFile("blob",c))}:b.toDataURL&&f&&(b.toBlob=function(a,b,c){a(f(this.toDataURL(b,c)))})),typeof define=="function"&&define.amd?define(function(){return f}):a.dataURLtoBlob=f})(this);

// Downloads SVG as PNG
function download_SVG_as_PNG(svgElement, coords, filename) {
  var svgURL = new XMLSerializer().serializeToString(svgElement);
  var img = new Image();
  img.onload = function() {
  	var canvas = $('<canvas>')[0];
  	var scale = 300;
  	canvas.width = coords.logical_width * scale;
  	canvas.height = coords.logical_height * scale;
    canvas.getContext('2d').drawImage(this, coords.sx, coords.sy, coords.sWidth, coords.sHeight, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(function(blob) {
        saveAs(blob, filename);
    }, "image/png");
  }
  img.src = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(svgURL);
}

