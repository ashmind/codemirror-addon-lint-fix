import * as CodeMirror from "codemirror";

// Tests that CodeMirror types are extended correctly
const lintFix: CodeMirror.LintFixOptions = {
  getFixes(cm, line, annotations) {
    cm as CodeMirror.Editor;
    line as number;
    annotations[0] as CodeMirror.Annotation;

    return [{
      text: 'test',
      apply(cm, line, fix) {
        cm as CodeMirror.Editor;
        line as number;
        fix as CodeMirror.AnnotationFix;
      }
    }];
  }
};

export function testCreate(textarea: HTMLTextAreaElement) {
  CodeMirror.fromTextArea(textarea, { lintFix });
}

export function testSetOption(cm: CodeMirror.Editor) {
  cm.setOption('lintFix', lintFix);
  cm.setOption('lintFix', undefined);
  cm.setOption('lintFix', null);
}

export function testExecCommand(cm: CodeMirror.Editor) {
  cm.execCommand('lintFixShow');
}