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
  var CLASS_PREFIX = 'CodeMirror-contextactions';
  var GUTTER_ID = CLASS_PREFIX + '-gutter';
  var Pos = CodeMirror.Pos;

  function createPopup() {
    var popup = document.createElement('div');
    popup.className = CLASS_PREFIX + '-popup';
    var ul = document.createElement('ul');
    ul.className = CLASS_PREFIX + '-list';
    popup.appendChild(ul);
    var body = document.getElementsByTagName('body')[0];

    var visible = false;
    return {
      show: function(marker, actions) {
        var markerRect = marker.getBoundingClientRect();
        var markerClone = marker.cloneNode(true);
        if (popup.firstChild !== ul)
          popup.removeChild(popup.firstChild);

        popup.insertBefore(markerClone, ul);

        popup.style.left = markerRect.left + 'px';
        popup.style.top = markerRect.top + 'px';

        while (ul.firstChild) {
          ul.removeChild(ul.firstChild);
        }
        for (var i = 0; i < actions.length; i++) {
          var li = document.createElement('li');
          li.className = CLASS_PREFIX + '-action';
          li.innerText = actions[i];
          ul.appendChild(li);
        }
        body.appendChild(popup);
        visible = true;
      },

      hide: function() {
        if (!visible)
          return;

        body.removeChild(popup);
        visible = false;
      }
    };
  }

  function createMarker() {
    var marker = document.createElement("div");
    marker.className = CLASS_PREFIX + '-gutter-marker ' + CLASS_PREFIX + '-gutter-marker-type-default';
    return marker;
  }

  var popup;
  var marker;
  var markerLine;
  var actions;
  CodeMirror.defineOption("contextActions", false, function(cm, options, old) {
    if (old && old !== CodeMirror.Init) {

    }

    if (!options) return;
    popup = createPopup();
    cm.on('gutterClick', function(cm, line, gutter) {
      if (gutter !== GUTTER_ID)
        return;

      if (line !== markerLine)
        return;

      popup.show(marker, actions);
    });

    cm.on('cursorActivity', function() {
      var cursor = cm.getCursor();
      actions = options.getActions(cm, cursor);
      popup.hide();
      if (markerLine != null) {
        cm.setGutterMarker(markerLine, GUTTER_ID, null);
      }

      if (actions) {
        marker = marker || createMarker();
        cm.setGutterMarker(cursor.line, GUTTER_ID, marker);
        markerLine = cursor.line;
      }
    });

    cm.on('blur', function() {
      popup.hide();
    });
  });
});
