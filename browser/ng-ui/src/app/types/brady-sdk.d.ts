// The @bradycorporation/brady-web-sdk package ships without .d.ts files.
// Declare it as `any` so the dynamic import in BradySdkService type-checks.
// The service itself already types the instance as `any` and treats the API
// as untyped, mirroring the desktop frontend.
declare module '@bradycorporation/brady-web-sdk';
