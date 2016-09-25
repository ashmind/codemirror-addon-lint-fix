// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  'use strict';
  if (typeof exports === "object" && typeof module === "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define === "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";
  var GUTTER_ID = "CodeMirror-contextactions-gutter";
  var Pos = CodeMirror.Pos;

  CodeMirror.defineOption("contextActions", false, function(cm, options, old) {
    if (old && old !== CodeMirror.Init) {

    }

    if (!options) return;
    var line = 0;
    var type = "default";
    var marker = document.createElement("div");
    marker.className = "CodeMirror-contextactions-gutter-marker CodeMirror-contextactions-gutter-marker-" + type;

    setTimeout(function() {
      cm.setGutterMarker(line, GUTTER_ID, marker);
    }, 0);
  });
});
