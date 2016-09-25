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
  var DEFAULT_GUTTER_ID = CLASS_PREFIX + '-gutter';
  var Pos = CodeMirror.Pos;

  function createPopup() {
    var currentActions;
    var currentEditor;

    var popup = document.createElement('div');
    popup.className = CLASS_PREFIX + '-popup';
    var ul = document.createElement('ul');
    ul.className = CLASS_PREFIX + '-list';
    CodeMirror.on(ul, 'click', function(e) {
      var li = findLI(e.target || e.srcElement);
      if (!li || li.actionIndex == null)
        return;

      runAction(li.actionIndex);
    });
    popup.appendChild(ul);
    var body = document.getElementsByTagName('body')[0];

    function findLI(element) {
      if (element.tagName === 'LI')
        return element;

      if (element.tagName === 'UL')
        return null;

      return findLI(element.parentNode);
    }

    function runAction(index) {
      var cm = currentEditor;
      currentActions[index].action(cm);
      hide();
      cm.focus();
    }

    var visible = false;
    function show(cm, marker, actions) {
      currentEditor = cm;
      currentActions = actions;
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
        li.innerText = actions[i].text;
        li.actionIndex = i;
        ul.appendChild(li);
      }
      body.appendChild(popup);
      visible = true;
    }

    function hide() {
      if (!visible)
        return;

      body.removeChild(popup);
      visible = false;
    }

    return {
      show: show,
      hide: hide
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
    var gutterId = options.gutter || DEFAULT_GUTTER_ID;
    popup = createPopup();
    cm.on('gutterClick', function(cm, line, gutter) {
      if (gutter !== gutterId)
        return;

      if (line !== markerLine)
        return;

      popup.show(cm, marker, actions);
    });

    cm.on('cursorActivity', function() {
      var cursor = cm.getCursor();
      actions = options.getActions(cm, cursor);
      popup.hide();
      if (markerLine != null) {
        cm.setGutterMarker(markerLine, gutterId, null);
      }

      if (actions) {
        marker = marker || createMarker();
        cm.setGutterMarker(cursor.line, gutterId, marker);
        markerLine = cursor.line;
      }
    });

    var blurCloseTimer;
    cm.on("blur", function() { blurCloseTimer = setTimeout(function() { popup.hide(); }, 100); });
    cm.on("focus", function() { clearTimeout(blurCloseTimer); });
  });
});
