declare module "xml2js" {
  export class Parser {
    constructor(options?: any);
    parseString(xml: string, callback?: (err: any, result: any) => void): void;
    parseStringPromise(xml: string): Promise<any>;
  }

  export function parseString(
    xml: string,
    callback?: (err: any, result: any) => void
  ): void;
  export function parseString(
    xml: string,
    options: any,
    callback?: (err: any, result: any) => void
  ): void;

  export function parseStringPromise(xml: string, options?: any): Promise<any>;

  export const defaults: any;
}
