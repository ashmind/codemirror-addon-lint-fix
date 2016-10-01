// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";
  // declare global: JSHINT

  var bogus = [ "Dangerous comment" ];

  var warnings = [ [ "Expected '{'",
                     "Statement body should be inside '{ }' braces." ] ];

  var errors = [ "Missing semicolon", "Extra comma", "Missing property name",
                 "Unmatched ", " and instead saw", " is not defined",
                 "Unclosed string", "Stopping, unable to continue" ];

  function validator(text, options) {
    if (!window.JSHINT) return [];
    JSHINT(text, options, options.globals);
    var errors = JSHINT.data().errors, result = [];
    if (errors) parseErrors(errors, result);
    return result;
  }

  CodeMirror.registerHelper("lint", "javascript", validator);

  function cleanup(error) {
    var result = {description: error.reason, severity: error.severity};
    // All problems are warnings by default
    fixWith(result, warnings, "warning", true);
    fixWith(result, errors, "error");

    return isBogus(result.description) ? null : result;
  }

  function fixWith(data, fixes, severity, force) {
    var description, fix, find, replace, found;

    description = data.description;

    for ( var i = 0; i < fixes.length; i++) {
      fix = fixes[i];
      find = (typeof fix === "string" ? fix : fix[0]);
      replace = (typeof fix === "string" ? null : fix[1]);
      found = description.indexOf(find) !== -1;

      if (force || found) {
        data.severity = severity;
      }
      if (found && replace) {
        data.description = replace;
      }
    }
  }

  function isBogus(description) {
    for ( var i = 0; i < bogus.length; i++) {
      if (description.indexOf(bogus[i]) !== -1) {
        return true;
      }
    }
    return false;
  }

  function parseErrors(errors, output) {
    for ( var i = 0; i < errors.length; i++) {
      var error = errors[i];
      if (error) {
        var linetabpositions, index;

        linetabpositions = [];

        var start = error.character - 1;
        // This next block is to fix a problem in jshint. Jshint
        // replaces
        // all tabs with spaces then performs some checks. The error
        // positions (character/space) are then reported incorrectly,
        // not taking the replacement step into account. Here we look
        // at the evidence line and try to adjust the character position
        // to the correct value.
        if (error.evidence) {
          // Tab positions are computed once per line and cached
          var tabpositions = linetabpositions[error.line];
          if (!tabpositions) {
            var evidence = error.evidence;
            tabpositions = [];
            // ugggh phantomjs does not like this
            // forEachChar(evidence, function(item, index) {
            Array.prototype.forEach.call(evidence, function(item,
                                                            index) {
              if (item === '\t') {
                // First col is 1 (not 0) to match error
                // positions
                tabpositions.push(index + 1);
              }
            });
            linetabpositions[error.line] = tabpositions;
          }
          if (tabpositions.length > 0) {
            var pos = error.character;
            tabpositions.forEach(function(tabposition) {
              if (pos > tabposition) pos -= 1;
            });
            start = pos - 1;
          }
        }

        var end = start + 1;
        if (error.evidence) {
          index = error.evidence.substring(start).search(/.\b/);
          if (index > -1) {
            end += index;
          }
        }

        var clean = cleanup(error);
        if (clean)
          output.push({message: clean.description,
                       severity: clean.severity,
                       from: CodeMirror.Pos(error.line - 1, start),
                       to: CodeMirror.Pos(error.line - 1, end),
                       jshint:error});
      }
    }
  }
});