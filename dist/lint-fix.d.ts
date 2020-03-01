declare module "codemirror" {
  export interface Editor {
    setOption(name: 'lintFix', value: LintFixOptions|undefined|null): void;
    execCommand(name: 'lintFixShow'): void;
  }

  export interface LintFixOptions {
      getFixes: (cm: Editor, line: number, annotations: ReadonlyArray<CodeMirror.Annotation>) => ReadonlyArray<Readonly<AnnotationFix>>
  }

  interface EditorConfiguration {
      lintFix?: LintFixOptions;
  }

  export interface AnnotationFix {
      text: string;
      apply: (cm: Editor, line: number, fix: Readonly<AnnotationFix>) => void;
  }
}

// just to make TS happy
export {};