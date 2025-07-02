import { HttpClient } from '@angular/common/http';
import {  Inject, Injectable } from '@angular/core';
import { map, Observable,  switchMap } from 'rxjs';
import { InsightItem,IInsightItem, SharePointError, IDigestToken, IUserInfo, ITagItem, IAttachementFile, AttachmentFile } from '../models/data.model';
import { SharePointErrorHandler, IAppSetting, ShowErrorHandler,  islocalhost } from './utility.service';
import { HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';


@Injectable({
  providedIn: 'root'
})
export class DataService {
  private token:string='';
  private baseUrl:string='';
  constructor(
    @Inject('APP_CONFIG') private config:IAppSetting,
    private toastService:ToastrService,
    private http:HttpClient) {
      console.log('dataservice started.');
   }

  private _httpHeaders = () => {
    var headers:HttpHeaders = new HttpHeaders();
    headers = headers.append('Accept','application/json;odata=verbose');
    headers = headers.append('Content-Type','application/json;odata=verbose');

     if (!islocalhost())
         headers = headers.append("X-RequestDigest",this.token);
     else
         headers = headers.append("Authorization",`Bearer ${this.token}`);

    return headers;
  }

private _httpHeadersForUpload = () => {
  var headers:HttpHeaders = new HttpHeaders();
  headers = headers.append('Content-Type','application/x-www-urlencoded; charset=UTC-8');
  headers = headers.append('Accept','application/josn;odata-verbose');
  if (!islocalhost())
    headers = headers.append('X-RequestDigest',this.token);
  else
    headers = headers.append('Authorization',`Bearer ${this.token}`);
  return headers;
}


private _httpOptionsUpdate = () => {
  let headers = this._httpHeaders();
  headers = headers.append("IF-MATCH","*");
  headers = headers.append("X-HTTP-Method", "MERGE");
  const options = {
    headers:headers
  };
  return options;
}

private _httpOptions() {
  return {
    headers:this._httpHeaders()
  }
}



private _getLocalToken():Observable<string> {
    console.log(`refreshing local token ... ${new Date().toString()}`);
    const url = `http://localhost:8080/api/token`;
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept':'application/json'
      }),
      withCredentials:false
    };
    return new Observable(subscriber => {
      this.http.get(url,options)
        .subscribe({
          next:(result:any) => {
            subscriber.next(result.token);
            subscriber.complete();
          },
          error:(error) => {
            ShowErrorHandler('Error in getting local token',this.toastService);
            console.log(error);
          }
        })
    })
  }

    private _getLocalEnvironment():Observable<IUserInfo> {
      const url = `http://localhost:8080/api/environments/docuzone`;
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept':'application/json'
      }),
      withCredentials:false
    };
    return new Observable<IUserInfo>(subscriber => {
      this.http.get(url,options)
        .subscribe({
          next:(result:any) => {
            console.log(JSON.stringify(result));
            const obj:IUserInfo = result.environment;
            subscriber.next(obj);
            subscriber.complete();
          },
          error:(error) => {
            ShowErrorHandler('Error in getting local environment',this.toastService);
            console.log(error);
          }
        })
    })
  }

  private _getToken():Observable<boolean> {
    return new Observable<boolean>(subscriber => {
      if (islocalhost()) {
        this._getLocalToken()
          .subscribe({
            next:(token:string) => {
              this.token = token;
              subscriber.next(true);
              subscriber.complete();
            }
          });
      } else {
        this.token = this.config.token;
        subscriber.next(true);
        subscriber.complete();
      }
    });
  }

  private _getBaseUrl():Observable<boolean> {
    return new Observable<boolean>(subscriber => {
      if (islocalhost()) {
        this._getLocalEnvironment()
          .subscribe({
            next:(record:any) => {
              console.log(JSON.stringify(record));
              this.baseUrl = record.baseUrl;
              subscriber.next(true);
              subscriber.complete();
            }
          })
      } else {
        this.baseUrl = this.config.baseUrl;
        subscriber.next(true);
        subscriber.complete();
      }
    })
  }

private _getDefaultFilter() {
  //return `OData__ModerationStatus eq 0 and Status ne 'DRAFT'`;
  return `Status ne 'DRAFT'`;
}
  

private _getfilter = (words:string[],field:string) => {
  if (!words || words?.length <= 0)
      return '';
  let line = '';
  words.forEach(x => {
    line = line + `${line ? ' and ' : ''}substringof('${encodeURIComponent(x)}',${field})`
  });
  return ` and ${line}`;
};

private _getListUrl<I>(action:string,ctype:new () => I,url:string): Observable<I[]> {
  return new Observable(subscriber => {
    this.http.get<I[]>(url,this._httpOptions())
      .pipe(
        map((x:any) => {
            return x.value
        })
      )
      .subscribe({
        next:(result:any) => {
            const data = result.map((item:any,index:number) => {
            return Object.assign(new ctype() as object, item) as I;
          });

          subscriber.next(data);
          subscriber.complete();
        },
        error:(error:any) => {
          const err = Object.assign(new SharePointError(),error);
          SharePointErrorHandler(err,this.toastService);
          this.LogError(action,err.GetErrorMessage());
        }
      })
  });
}

public GetLocalConfig():Observable<boolean> {
  return new Observable<boolean>(subscriber => {
    this._getToken()
      .pipe(
        switchMap((value:boolean) => {
          return this._getBaseUrl();
        })
      )
      .subscribe({
        next:(value:boolean) => {
          subscriber.next(true);
          subscriber.complete();
        }
      });
  })
  
}

public GetUserInfo(): Observable<IUserInfo> {
  const url = `${this.baseUrl}/_api/web/currentuser`;
  return new Observable(subscriber => {
    this.http.get<IUserInfo>(url,this._httpOptions())
      .pipe(
        map((x:any) => {
          return x.d;
        })
      )
      .subscribe({
        next:(result:any) => {
          console.log(result);
          subscriber.next(result);
          subscriber.complete();
        },
        error:(error:any) => {
          const err = Object.assign(new SharePointError(),error);
          SharePointErrorHandler(err,this.toastService);
          this.LogError('Get user info',err.GetErrorMessage());
        }
      })
  })
}




  public RefreshToken(): Observable<IDigestToken> {
      console.log(`Refreshing token ... ${new Date().toString()}`);
      const url = `${this.baseUrl}/_api/contextinfo`;
      return new Observable(subscriber => {
          this.http.post(url,this._httpOptions())
            .pipe(
              map((x:any) => x)
            )
            .subscribe((token:IDigestToken) => {
                subscriber.next(token);
                subscriber.complete();
            })
      });
    }



  public GetMyAssetsList(): Observable<IInsightItem[]> {
    //const filters = `$filter=OData__ModerationStatus ne 0`;
    const filters = '';
    const select = InsightItem.getSelectText();
    const url = `$this.baseUrl}/_api/web/lists/getbytitle('InsightAssets')/items?get_myassets&${filters}&$select=${select}`;
    return new Observable(subscriber => {
      this.http.get<IInsightItem[]>(url, this._httpOptions())
        .pipe(
          map((x:any) => {
            return x.value;
          })
        )
        .subscribe({
          next:(d:IInsightItem[]) => {
            const list = d.map(x => Object.assign(new InsightItem(),x));
            subscriber.next(list);
            subscriber.complete();
          },
          error:(error:any) => {
            const err = Object.assign(new SharePointError(),error);
            SharePointErrorHandler(err,this.toastService);
            this.LogError('get my asset list',err.GetErrorMessage());
          }
        })
    })
  }

    public GetAssetListCount(search:string[],hash:string[]): Observable<number> {
      const dfilter = this._getDefaultFilter();
      const sfilter = this._getfilter(search,'Tags');
      const hfilter = this._getfilter(hash,'HashTags');
      const filter = `$filter=${dfilter}${sfilter}${hfilter}`;
      const url = `${this.baseUrl}/_api/web/lists/getbytitle('InsightAssets')/items?get_asset_count&$select=ID&${filter}&$top=5000`;
      return new Observable<number>(subscriber => {
        this.http.get(url,this._httpOptions())
          .pipe(
            map((x:any) => x.d.results)
          )
          .subscribe({
            next:(records:IInsightItem[]) => {
              subscriber.next(records.length);
              subscriber.complete();
            }
          })
      });
    }

    public GetAssetList(pageSize:number,pageNo:number,fields:string,search:string[],orders:string | null,hashTags:string[]): Observable<IInsightItem[]> {
      const select = fields;
      const expectedCount = pageSize * pageNo;
      const top = `&$top=${expectedCount}`;
      const dfilter = this._getDefaultFilter();
      const sfilter = this._getfilter(search,'Tags');
      const hfilter = this._getfilter(hashTags,'HashTags');
      const filter = `&$filter=${dfilter}${sfilter}${hfilter}`;
      const orderby = orders ?  `&$orderby=${orders}` : '';
      const url = `${this.baseUrl}/_api/web/lists/getbytitle('InsightAssets')/items?get_asset_list&$select=${select}${filter}${top}${orderby}`;
      //const url = search.nexturl ? search.nexturl : turl;
      return new Observable<IInsightItem[]>(subscriber => {
          this.http.get<any>(url,this._httpOptions())
              .pipe(
                map((x:any) => {
                    return x.d.results
                })
              )
              .subscribe({
                next:(results:IInsightItem[]) => {
                  let finallist = results;
                  if (pageNo > 1) {
                      let getCount = pageSize;
                      if (results.length < expectedCount)
                        getCount = results.length - (pageSize * (pageNo - 1));
                      let list = results.reverse();
                      list = list.slice(0,getCount);
                      finallist = list.reverse();
                  }
                  subscriber.next(finallist);
                  subscriber.complete();
                },
                error:(error:any) => {
                  const err = Object.assign(new SharePointError(),error);
                  SharePointErrorHandler(err,this.toastService);
                  this.LogError('Get asset list',err.GetErrorMessage());
                }
              })
          });
    };

  public LogError(action:string,text:string) {
    const url = `${this.baseUrl}/_api/web/lists/GetByTitle('Issues')/items?log_error`;
    const data = {
      "__metadata": {
          "type": 'SP.Data.IssuesListItem'
      },
      "Title": action,
      "Description": text,
      "Status":'New',
      "Source":'System'
    };

    this.http.post(url,data,this._httpOptions())
      .subscribe(data => {
        console.log('error logged.');
      });

  }

  public GetTags(): Observable<ITagItem[]> {
    const obj = new InsightItem();
    const filter = this._getDefaultFilter();
    const url = `${this.baseUrl}/_api/web/lists/getbytitle('InsightAssets')/items?get_asset_tag&$select=Tags&$filter=${filter}`;
    const tagslist:ITagItem[] = [];
    const pushit = (tags:string) => {
      const lines = tags?.split(',').filter(x => x.trim().length > 0).map(x => x.trim());
      lines?.forEach(x =>
        {
          const found_item = tagslist.find(y => y.Word?.toLowerCase() == x.toLowerCase()) as ITagItem;
          if (found_item)  {
            found_item.Count++;
          } else {
            tagslist.push({
              Word:x,
              Count:1
            });
          }
        })
    };
    return new Observable(subscriber => {
      this.http.get(url,this._httpOptions())
        .pipe(
          map((x:any) => {
              return x.d.results
          })
        )
        .subscribe({
          next:(x:any[]) => {
            x.forEach(r => pushit(r.Tags));
            subscriber.next(tagslist);
            subscriber.complete();
          }
        })
    });
  }

  public GetAssetItem(id:number): Observable<IInsightItem> {
    const select = InsightItem.getSelectText();
    const url = `${this.baseUrl}/_api/web/lists/getbytitle('InsightAssets')/items(${id})?$select=${select}`;
    return new Observable(subscriber => {
      this.http.get<IInsightItem>(url,this._httpOptions())
          .pipe(
            map((x:any) => {
                return x.d
            })
          )
          .pipe(
            switchMap((item:IInsightItem) => {
              return this.GetAttachments(item);
            })
          )
          .subscribe({
            next:((d:IInsightItem) => {
              subscriber.next(d);
              subscriber.complete();
            }),
            error:(error:any) => {
              const err = Object.assign(new SharePointError(),error);
              SharePointErrorHandler(err,this.toastService);
              this.LogError('get asset item',err.GetErrorMessage());
            }
          })
    });
  }

  public GetAssetItemModifiedDate(id:number):Observable<string> {
      const url = `${this.baseUrl}/_api/web/lists/getbytitle('InsightAssets')/items(${id})?$select=Id,Modified`;
      return new Observable<string>(subscriber => {
        this.http.get<any>(url,this._httpOptions())
            .pipe(
              map(x => x.d)
            )
            .subscribe({
              next:(data:any) => {
                subscriber.next(data.Modified);
                subscriber.complete();
              },
              error:((error:any) => {
                const err = Object.assign(new SharePointError(),error);
                SharePointErrorHandler(err,this.toastService);
                this.LogError('get asset item modified date',err.GetErrorMessage());
              })
            })
      });
    }


    public UploadDocument(file:any,contents:any,user:any):Observable<any> {
      const teamfolder = user.Department;
      const relative = 'folder';
      const url = `${this.baseUrl}/_api/web/GetFolderByServerRelativeUrl('${relative}/Shared Document/${teamfolder}')/Files/Add(url='${file.name}',overwrite=true)`;
      const body = contents;
      const options = {
        headers:this._httpHeadersForUpload()
      };
      return new Observable<any>(subscriber => {
        this.http.post(url,body,options)
          .pipe(
            map((x:any) => x.d)
          )
          .subscribe(data => {
            subscriber.next(data);
            subscriber.complete();
          })
      })
      //
    }

    public GetAttachments(item:IInsightItem):Observable<IInsightItem> {
      const url = `${this.baseUrl}/_api/web/lists/getbytitle('InsightAssets')/items(${item.Id})/AttachmentFiles`;
      return new Observable<IInsightItem>(subscriber => {
        this.http.get(url,this._httpOptions())
          .pipe(
            map((x:any) => x.d.results)
          )
          .subscribe({
            next:(records:IAttachementFile[]) => {
              const attachments = records.map(x => Object.assign(new AttachmentFile(),x));
              item.Attachments = attachments;
              subscriber.next(item);
              subscriber.complete();
            }
          })
      })
    }


}
