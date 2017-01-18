//! Copyright (c) Andrey Shchekin (MIT, see LICENSE.txt)
(function(mod) {
  "use strict";
  if (typeof exports === "object" && typeof module === "object") // CommonJS
    mod(require("codemirror"), require("codemirror/addon/lint/lint"));
  else if (typeof define === "function" && define.amd) // AMD
    define(["codemirror", "codemirror/addon/lint/lint"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";
  var GUTTER_ID = "CodeMirror-lint-markers";
  var CLASS_PREFIX = "CodeMirror-lintfix";
  var CLASS_MARKER = CLASS_PREFIX + "-marker-fixable";
  var CLASS_SELECTED = CLASS_PREFIX + "-fix-selected";

  function createPopup() {
    var currentEditor;
    var currentLine;
    var currentFixes;
    var selectedIndex;

    var popupMarker;
    var popup = document.createElement("div");
    popup.className = CLASS_PREFIX + "-popup";
    var ul = document.createElement("ul");
    ul.className = CLASS_PREFIX + "-list";
    CodeMirror.on(ul, "click", function(e) {
      findFixIndexAndCall(applyFix, e.target || e.srcElement);
    });
    CodeMirror.on(ul, "mouseover", function(e) {
      findFixIndexAndCall(selectFix, e.target || e.srcElement);
    });
    popup.appendChild(ul);
    var body = document.getElementsByTagName("body")[0];

    var keyMap = {
      Up: function() { selectFix(selectedIndex-1); },
      Down: function() { selectFix(selectedIndex+1); },
      Esc: hide,
      Enter: function() { applyFix(selectedIndex); }
    };

    function findFixIndexAndCall(action, element) {
      if (element.tagName === "LI")
        return action(element.fixIndex);

      if (element.tagName === "UL")
        return null;

      return findFixIndexAndCall(action, element.parentNode);
    }

    function selectFix(index) {
      if (index === selectedIndex)
        return;

      var li = ul.children[selectedIndex];
      if (li)
        li.className = li.className.replace(CLASS_SELECTED, '');

      selectedIndex = index;
      if (selectedIndex < 0) {
        selectedIndex = currentFixes.length - 1;
      }
      else if (selectedIndex > currentFixes.length - 1) {
        selectedIndex = 0;
      }
      ul.children[selectedIndex].className += ' ' + CLASS_SELECTED;
    }

    function applyFix(index) {
      var cm = currentEditor;
      var fix = currentFixes[index];
      fix.apply(cm, currentLine, fix);
      hide();
      cm.performLint();
      cm.focus();
    }

    var visible = false;
    var justAppeared = false;
    function show(cm, marker, line, fixes) {
      hide();

      currentEditor = cm;
      currentFixes = fixes;
      currentLine = line;
      selectedIndex = 0;

      cm.addKeyMap(keyMap);

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
        if (i === 0)
          li.className += ' ' + CLASS_SELECTED;
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

      currentEditor.removeKeyMap(keyMap);
      body.removeChild(popupMarker);
      body.removeChild(popup);
      visible = false;
      justAppeared = false;
    }

    CodeMirror.on(document, "click", function(e) {
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
  function getLintMarker(cm, line) {
      var info = cm.lineInfo(line);
      if (!info.gutterMarkers)
        return;

      return info.gutterMarkers[GUTTER_ID];
  }

  function onUpdateLinting(_, annotationsByLine, cm) {
    var state = cm.state.lintFix;
    state.annotationsByLine = annotationsByLine;
    for (var line = 0; line < annotationsByLine.length; line += 1) {
      var annotations = annotationsByLine[line];
      if (!annotations)
        continue;

      var marker = getLintMarker(cm, line);
      if (!marker)
        continue;

      var getFixes = cm.getOption("lintFix").getFixes || cm.getHelper(CodeMirror.Pos(0, 0), "lintFix");
      var fixes = getFixes(cm, line, annotations);
      if (fixes && fixes.length > 0) {
        marker.className += " " + CLASS_MARKER;
        state.fixesByLine[line] = fixes;
      }
      else {
        marker.className = marker.className.replace(CLASS_MARKER, "");
        state.fixesByLine[line] = null;
      }
    }
  }

  function showIfAvailable(cm, line) {
    var fixes = cm.state.lintFix.fixesByLine[line];
    if (!fixes)
      return;

    var marker = getLintMarker(cm, line);
    if (!marker)
      return;

    popup.show(cm, marker, line, fixes);
  }

  function onGutterClick(cm, line, gutter) {
    if (gutter !== GUTTER_ID)
      return;
    showIfAvailable(cm, line);
  }

  function removeFrom(cm) {
    var state = cm.state.lintFix;
    if (!state)
      return;

    var saved = state.saved;
    if (saved.lint) {
      cm.setOption("lint", saved.lint);
    }
    else {
      var lint = cm.getOption("lint");
      if (lint)
        lint.onUpdateLinting = saved.onUpdateLinting;
    }
    delete cm.state.lintFix;
  }

  CodeMirror.defineOption("lintFix", false, function(cm, options, old) {
    if (old && old !== CodeMirror.Init) {
      if (!options) {
        removeFrom(cm);
        return;
      }
      cm.performLint();
      return;
    }

    if (!popup)
      popup = createPopup();

    var state = {
      fixesByLine: {},
      saved: {}
    };
    cm.state.lintFix = state;

    var lint = cm.getOption("lint");
    if (typeof lint === "boolean") {
      state.saved.lint = lint;
      lint = {};
      cm.setOption("lint", lint);
    }

    state.saved.onUpdateLinting = lint.onUpdateLinting;
    lint.onUpdateLinting = function() {
      if (state.saved.onUpdateLinting)
        state.saved.onUpdateLinting.apply(this, arguments);
      onUpdateLinting.apply(this, arguments);
    };
    cm.performLint();
    cm.on("gutterClick", onGutterClick);
  });
  CodeMirror.commands.lintFixShow = function(cm) {
    showIfAvailable(cm, cm.getCursor().line);
  };
});
