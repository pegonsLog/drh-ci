import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';



export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp({
      "projectId": "drh-ci",
      "appId": "1:768613774145:web:8ea84ddfea125df35be7c0",
      "storageBucket": "drh-ci.firebasestorage.app",
      "apiKey": "AIzaSyDTWFMwvmZdLcmcTIc9cjpchw7cEjQZ31A",
      "authDomain": "drh-ci.firebaseapp.com",
      "messagingSenderId": "768613774145",
      "measurementId": "G-ZSWZG9WGNW"
    })),
    provideFirestore(() => getFirestore()), provideAnimationsAsync()
  ]
};
