import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { provideAnimations } from '@angular/platform-browser/animations';

import { provideToastr } from 'ngx-toastr';
import { getUserEnvironment } from './services/utility.service';

export const appConfig: ApplicationConfig = {
  providers: [
   provideZoneChangeDetection({ eventCoalescing: true }), 
   provideRouter(routes),
    provideHttpClient(withFetch()),
    {
      provide: 'APP_CONFIG',
      useFactory: () => {
        return getUserEnvironment();
      },
      deps:[]
    },
    provideToastr({
      maxOpened:10
    }),
    provideAnimations()
  ],
};
