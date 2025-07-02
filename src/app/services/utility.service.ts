import { HttpHeaders } from "@angular/common/http";
import { ISharePointError } from "../models/data.model";
import { environment } from "../../environments/environment";
import { ToastrService } from 'ngx-toastr';
import { Observable } from "rxjs";

declare global {
  interface Window { 
    _spPageContextInfo?: any; 
  }
}

export const islocalhost = () => {
  return window.location.host.indexOf('localhost') >= 0;
}

export interface IAppSetting {
     moduleName:string;
     token:string;
     baseUrl:string;
}

export const getBaseUrl = () => {
    var text = '';
    function getpath() {
      var list = window.location.pathname.split('/');
      for (var i=0;i<list.length - 2;i++) {
        if (text != "/") {
          text = text + "/";
        }
        text = text + list[i];
      }
      return text;
    }
    if (islocalhost()) {
      return '';
    } else {
    //return document.getElementsByTagName('base')[0].href;
      const getUrl = window.location;
      const baseUrl = getUrl.protocol + "//" + getUrl.host + getpath();
      return baseUrl;
    }
}

export const httpOptions = (token:string) => {
    const headers = httpHeaders(token);

    return  {
        headers:headers
    };
  };

  export const httpHeaders = (token:string) => {
    var headers:HttpHeaders = new HttpHeaders();
    headers = headers.append('Accept','application/json;odata=verbose');
    headers = headers.append('Content-Type','application/json;odata=verbose');

    if (islocalhost())
      headers = headers.append("Authorization",`Bearer ${token}`);
    else
      headers = headers.append("X-RequestDigest", token);
         
    return headers;
  }


export const SharePointErrorHandler = (error:ISharePointError,tservice:ToastrService) => {
    tservice.error(error.GetErrorMessage(),"Error");
}

export const ShowErrorHandler = (error:string,tservice:ToastrService) => {
  tservice.error(error,"Error");
}


export const getUserEnvironment = ():IAppSetting => {
    const token = window._spPageContextInfo?.formDigestValue;
    const baseUrl = getBaseUrl();
    return {
        token:islocalhost() ? environment.token : token,
        moduleName:'sharepoint-sample',
        baseUrl:islocalhost() ? environment.baseUrl : baseUrl
    };
}