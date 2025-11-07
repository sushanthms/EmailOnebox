declare module 'imap-simple' {
  const content: any;
  export default content;
}

declare module 'mailparser' {
  export function simpleParser(input: any, options?: any, callback?: any): Promise<any>;
}
