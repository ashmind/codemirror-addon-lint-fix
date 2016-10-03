// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  "use strict";
  if (typeof exports === "object" && typeof module === "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define === "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";
  var GUTTER_ID = "CodeMirror-lint-markers";
  var CLASS_PREFIX = "CodeMirror-lintfix";

  function createPopup() {
    var currentEditor;
    var currentLine;
    var currentFixes;

    var popupMarker;
    var popup = document.createElement("div");
    popup.className = CLASS_PREFIX + "-popup";
    var ul = document.createElement("ul");
    ul.className = CLASS_PREFIX + "-list";
    CodeMirror.on(ul, "click", function(e) {
      var li = findLI(e.target || e.srcElement);
      if (!li || li.fixIndex == null)
        return;

      applyFix(li.fixIndex);
    });
    popup.appendChild(ul);
    var body = document.getElementsByTagName("body")[0];

    function findLI(element) {
      if (element.tagName === "LI")
        return element;

      if (element.tagName === "UL")
        return null;

      return findLI(element.parentNode);
    }

    function applyFix(index) {
      var cm = currentEditor;
      var fix = currentFixes[index];
      fix.apply(cm, currentLine, fix);
      hide();
      cm.focus();
    }

    var visible = false;
    var justAppeared = false;
    function show(cm, marker, line, fixes) {
      hide();

      currentEditor = cm;
      currentFixes = fixes;
      currentLine = line;

      var markerRect = marker.getBoundingClientRect();
      popupMarker = marker.cloneNode(true);
      popupMarker.className += " " + CLASS_PREFIX + "-popup-marker";
      popupMarker.style.left = markerRect.left + "px";
      popupMarker.style.top = markerRect.top + "px";

      popup.style.left = markerRect.left + "px";
      popup.style.top = markerRect.bottom + "px";

      while (ul.firstChild) {
        ul.removeChild(ul.firstChild);
      }
      for (var i = 0; i < fixes.length; i++) {
        var fix = fixes[i];
        var li = document.createElement("li");
        li.className = CLASS_PREFIX + "-fix";
        if (fix.render) {
          fix.render(li, fix);
        }
        else {
          li.innerText = fix.text;
        }
        li.fixIndex = i;
        ul.appendChild(li);
      }
      body.appendChild(popupMarker);
      body.appendChild(popup);
      visible = true;
      justAppeared = true;
      setTimeout(function() { justAppeared = false; }, 400);
    }

    function hide() {
      if (!visible)
        return;

      body.removeChild(popupMarker);
      body.removeChild(popup);
      visible = false;
      justAppeared = false;
    }

    CodeMirror.on(document, 'click', function(e) {
      if (!visible || justAppeared)
        return;

      var target = e.target || e.srcElement;
      var element = target.parentElement;
      while (element) {
        if (element === popup)
          return;
        element = element.parentNode;
      }
      hide();
    });

    return {
      show: show,
      hide: hide
    };
  }

  var popup;
  CodeMirror.defineOption("lintFix", false, function(cm, options, old) {
    if (old !== CodeMirror.Init) {
      throw new Error('Option changes are not yet implemented.');
    }

    if (!options) return;
    popup = createPopup();
    cm.on("gutterClick", function(cm, line, gutter) {
      if (gutter !== GUTTER_ID)
        return;

      var info = cm.lineInfo(line);
      var marker = info.gutterMarkers[gutter];
      if (!marker)
        return;

      var annotations = cm.getLintAnnotations(line);
      if (annotations.length === 0)
        return;

      var getFixes = options.getFixes || cm.getHelper(CodeMirror.Pos(0, 0), "lintFix");
      var fixes = getFixes(cm, line, annotations);
      if (!fixes || fixes.length === 0)
        return;

      popup.show(cm, marker, line, fixes);
    });
  });
});
