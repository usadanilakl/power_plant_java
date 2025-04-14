import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

const bootstrap = () => bootstrapApplication(AppComponent, config);

export default bootstrap;

// import { APP_BASE_HREF } from '@angular/common';
// import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
// import { appConfig } from './app/app.config';

// const serverConfig: ApplicationConfig = {
//   providers: [
//     { provide: APP_BASE_HREF, useValue: '/angular/browser/' }
//   ]
// };

// export const config = mergeApplicationConfig(appConfig, serverConfig);
