import { Component } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
import firebase from 'firebase';
import { HTTP } from '@ionic-native/http/ngx';

declare var window: any;
declare var cordova: any;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  provider = new firebase.auth.TwitterAuthProvider();
  providerFb = new firebase.auth.FacebookAuthProvider();
  providerGoogle = new firebase.auth.GoogleAuthProvider();
  providerLinkedin = new firebase.auth.OAuthProvider('linkedin.com');
  result: any;

  constructor(public navCtrl: NavController, public http: HTTP, public platform: Platform) {
    let self = this;

    var firebaseConfig = {
      apiKey: "",
      authDomain: "",
      databaseURL: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: "",
      measurementId: ""
    };
    
    firebase.initializeApp(firebaseConfig);
    firebase.analytics();

    firebase.auth().getRedirectResult().then(function(result) {
      self.result = result;
      if(self.result.user != null) {
        console.log('result', self.result);

        switch(self.result.additionalUserInfo.providerId) {
          case 'twitter.com':
            document.getElementsByClassName('twitter-btn-text')[0].textContent = 'Conectado';
            break;
          case 'facebook.com':
            document.getElementsByClassName('fb-btn-text')[0].textContent = 'Conectado';
            break;
          case 'google.com':
            document.getElementsByClassName('google-btn-text')[0].textContent = 'Conectado';
            break;
        }
      }
    }, function(error) {
      console.log('error', error);
    });
  }

  ionViewDidLoad() {
    this.platform.ready().then(() => {
      var code = new URL(window.location.href).searchParams.get('code');

      if(code) {
        this.getAccessToken(code).then((data) => {
          this.getLinkedinAccess(data['access_token']).then((result) => {
            console.log(result);
            if(result['idUserRRSS']) {
              document.getElementsByClassName('linkedin-btn-text')[0].textContent = 'Conectado';
              console.log(result);
            }
          });
        });
      }
    })
  }

  getAccessToken(urlCode) {
    
    let grantType = 'grant_type=authorization_code';
    let code = 'code=' + urlCode;
    let redirectUri = 'redirect_uri=http://localhost:8000';
    let clientId = 'client_id=86j8iwmv4t8j34';
    let clientSecret = 'client_secret=dDWvZHqMUbpGmFV2';

    return new Promise((resolve, reject) => {
      cordova.plugin.http.setDataSerializer('json');
      cordova.plugin.http.post(
        'https://www.linkedin.com/oauth/v2/accessToken?' + grantType + '&' + code + '&' + redirectUri + '&' + clientId + '&' + clientSecret,
          {}, { 'Content-Type': 'application/x-www-form-urlencoded' }, function(response) {
        console.log(JSON.parse(response.data));
        resolve(JSON.parse(response.data));
      }, function(response) {
        reject(response.error);
      });
    });
  }

  getLinkedinAccess(token) {
    let headers: any = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer ' + token,
      'cache-control': 'no-cache',
      'X-Restli-Protocol-Version': '2.0.0'
    };

    return new Promise((resolve, reject) => {
      cordova.plugin.http.setDataSerializer('urlencoded');
      cordova.plugin.http.get('https://api.linkedin.com/v2/me', {}, headers, function(response) {
        resolve({ tokenRRSS: token, idUserRRSS: JSON.parse(response.data).id });
      }, function(response) {
        reject(response);
      });
    });
  }

  twitter() {
    this.provider.setCustomParameters({
      'lang': 'es'
    });
    
    firebase.auth().signInWithRedirect(this.provider);

  }

  linkedin() {
    window.location = 'https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=&redirect_uri=http://localhost:8000&scope=r_liteprofile';
  }

  facebook() {
    this.provider.setCustomParameters({
      'lang': 'es'
    });
    
    firebase.auth().signInWithRedirect(this.providerFb);
  }

  google() {
    this.providerGoogle.setCustomParameters({
      'lang': 'es'
    });
    
    firebase.auth().signInWithRedirect(this.providerGoogle);
  }
}
