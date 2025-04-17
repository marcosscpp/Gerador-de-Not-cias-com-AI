declare module "xml2js" {
  export interface ParserOptions {
    attrkey?: string;
    charkey?: string;
    explicitArray?: boolean;
    normalize?: boolean;
    normalizeTags?: boolean;
    explicitRoot?: boolean;
    emptyTag?: any;
    explicitCharkey?: boolean;
    trim?: boolean;
    attrNameProcessors?: Array<(name: string) => string>;
    attrValueProcessors?: Array<(value: string, name: string) => any>;
    tagNameProcessors?: Array<(name: string) => string>;
    valueProcessors?: Array<(value: string, name: string) => any>;
    xmlns?: boolean;
  }

  export class Parser {
    constructor(options?: ParserOptions);
    parseString(
      str: string,
      callback?: (err: Error, result: any) => void
    ): void;
    parseStringPromise(str: string): Promise<any>;
  }

  export function parseString(
    str: string,
    callback?: (err: Error, result: any) => void
  ): void;
  export function parseString(
    str: string,
    options: ParserOptions,
    callback?: (err: Error, result: any) => void
  ): void;
  export function parseStringPromise(
    str: string,
    options?: ParserOptions
  ): Promise<any>;

  export const defaults: {
    parseString: ParserOptions;
  };

  export const processors: {
    parseNumbers: (value: string) => number;
    parseBooleans: (value: string) => boolean;
    stripPrefix: (value: string) => string;
  };
}
