import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, switchMap } from 'rxjs';
import { ActionType, IAction, initialAction } from '../models/component.model';
import { IDigestToken, IInsightItem, InsightItem, ISearchConfig, ISharePointPerson, ISortOrder, ITagItem, IUserInfo, SortOrder, TheInsightItem } from '../models/data.model';
import { IAppSetting, } from './utility.service';
import { DataService } from './data.service';



@Injectable({
  providedIn: 'root'
})
export class GatewayService {
    private PageBehavior = new BehaviorSubject<IAction>(initialAction);

    private MyAssetList = new BehaviorSubject<IInsightItem[]>([]);
    private AutoCompleteList = new BehaviorSubject<ITagItem[]>([]);
    private AssetList = new BehaviorSubject<IInsightItem[]>([]);
    private AssetListMore = new BehaviorSubject<boolean>(false);
    private AssetListCount = new BehaviorSubject<number>(0);
    private AssetItem = new BehaviorSubject<IInsightItem>(new InsightItem() as IInsightItem);
    private SiteUsers = new BehaviorSubject<ISharePointPerson[]>([]);
    private UserInformation = new BehaviorSubject<IUserInfo>({} as IUserInfo);
    private Approvers = new BehaviorSubject<number[]>([6,28,20,10,1073741822]);
    pagesize:number=12;
    currentPageNumber = 1;
    search:string[]=[];
        hash:string[]=[];
    initialized:boolean=false;
    sortOrder:ISortOrder=Object.assign(new SortOrder(),{
        name:'Modified',
        ascending:false
    });
    nextTokenExpiry:number=0;
    
  constructor(
    @Inject('APP_CONFIG') private config:IAppSetting,
    private service:DataService) {
    console.log('gatewayservice started.');
   }

    private _setAction = (action:IAction) => {
        const thisaction = this.PageBehavior.value;
        switch (action.type) {
            case ActionType.expand:
                // this._saveMoreDetailsAnalytics(action.payload.card.Id);
                // this._getAssetItemDetails(action.payload.card.Id);
                thisaction.type = action.type;
                thisaction.payload = Object.assign(thisaction.payload,action.payload,{
                    fullscreen:true
                });
                break;
            case ActionType.collapse:
                thisaction.type = action.type;
                thisaction.payload = Object.assign(thisaction.payload,action.payload,{
                    fullscreen:false
                });
                break;
            case ActionType.openAssetEntryForm:
                thisaction.type = action.type;
                thisaction.payload = Object.assign(thisaction.payload,action.payload,{
                    open:true
                });
                break;
            case ActionType.closeAssetEntryForm:
                thisaction.type = action.type;
                thisaction.payload = Object.assign(thisaction.payload,action.payload,{
                    open:false
                });
                break;    
            default:
                break;
        }
        this.PageBehavior.next(thisaction);
    };

    public OnChangeAssetMore(): Observable<boolean> {
        return this.AssetListMore;
    }
  
    public OnChangeResultCount(): Observable<number> {
        return this.AssetListCount;
    }

    public onReceivingSearchResult():Observable<IInsightItem[]> {
        return this.AssetList;
    }

    public onReceivingTags():Observable<ITagItem[]> {
        return this.AutoCompleteList;
    }

        // page behavior
    public onChangeBehavior():Observable<IAction> {
        return this.PageBehavior;
    }

    public onChangeMyAssetList(): Observable<IInsightItem[]> {
        return this.MyAssetList;
    }

    public onReceivingAssetItem() : Observable<IInsightItem> {
        return this.AssetItem;
    }

    private _getNewAssetItem(item:IInsightItem) {
        const obj = Object.assign(new InsightItem(),item);
        console.log(JSON.stringify(obj));
       // obj.InMyFavouriteList = this.Favourites?.value?.FavouritesIds?.find(x => x === obj.Id) != null;
        return obj;
    }

    private _resolveAssetList(data:IInsightItem[]) {
        const access = data.map(x => this.service.GetAssetItem(x.ID));
        forkJoin(access)
            .subscribe(results => {
                const list = results.map(y => this._getNewAssetItem(y));
                this.AssetList.next(list);
                const more = this.AssetList.value.length < this.AssetListCount.value;
                this.AssetListMore.next(more);
            });
    }

    private _getAssetList(config:ISearchConfig) {
        this.service.GetAssetList(config.pageSize,config.pageNo,config.fields,config.search,config.orders,config.hashTags)
            .subscribe(data => {
               this._resolveAssetList(data);
            })
    }

    private _initialize() {
        const tags:string[] = [];
        const push_tags = (rec:string) => {
            const arr = rec.split(',');
            arr.forEach(x => 
                {
                    var text = x.trim();
                    if (text.length > 0 && !tags.find(y => y == text)) {
                        tags.push(text);
                }
            });
        }

        

        
        //get hash tag
        this.service.GetTags().subscribe(data => {
            this.AutoCompleteList.next(data);
        });

        
        this.service.GetUserInfo()
            .subscribe((user:IUserInfo) => {
                user.isApprover = this.Approvers.value.find(x => x === user.Id) != null;
                this.UserInformation.next(user);
                //this.GetMyAssetsList();
            });
      
        forkJoin([
            this.service.GetAssetList(this.pagesize,1,'ID',[],this.sortOrder.getWord(),[]),
            this.service.GetAssetListCount([],[]),
        ])

        .subscribe(result => {
            // result
            const asset_count = result[1];
            this.AssetListCount.next(asset_count);

            // // dashboard
            // const dashboard = result[2];
            // this.Favourites.next(dashboard);
            // console.log(`favourite Id: ${dashboard.Id}`);
            // if (dashboard.FavouritesIds?.length > 0) {
            //     this.service.GetAssetFavourites(this.page_size,dashboard.FavouritesIds,null)
            //         .subscribe((y:IAssetItem[]) => {
            //             let list = y.map(x => this._getNewAssetItem(x));
            //             list =  _.sortBy(list,[function (o) {
            //                 return dashboard.JsonObj.find(k => k.AssetId == o.Id)?.Date
            //             }]).reverse();
                        
            //             this.FavouriteAssetList.next(list);
            //         });
            // }

            const asset_list = result[0] as IInsightItem[];
            this._resolveAssetList(asset_list);
                
            const more = (asset_count > asset_list?.length);
            this.AssetListMore.next(more);
        });

        // if (islocalhost()) {
        //     setInterval(() => {
        //         this.service.GetLocalToken()
        //             .subscribe({
        //                 next:(result:string) => {
        //                     this.config.token = result;
        //                 }
        //             })
        //     }, 58 * 60000);
        // } else {
        //     console.log(`Page first load: ${new Date().toString()}`);
        //     setInterval(() =>{
        //         this.service.RefreshToken()
        //             .subscribe((token:IDigestToken) => {
        //                 this.config.token = token.FormDigestValue;
        //             })
        //     },29 * 60000);
        // };
    }


    // initialize
    public Initialize() {
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        this.service.GetLocalConfig()
            .subscribe({
                next:(value:boolean) => {
                    this._initialize();
                }
            });
    }

    public SetSearchTag(search:string[]) {
        this.search = search;
    }

    public SetNewSortingOrder(selected:ISortOrder) {
        this.sortOrder = Object.assign(new SortOrder(),selected);
    }

    // when user click search
    public  GetSearchResult() {
        this.currentPageNumber = 1;
        this.service.GetAssetListCount(this.search,this.hash)
            .subscribe(count => {
                this.AssetListCount.next(count);
                if (count > 0) {
                    const config = {
                        pageSize:this.pagesize,
                        pageNo:this.currentPageNumber,
                        fields:'ID',
                        search:this.search,
                        orders:this.sortOrder.getWord(),
                        hashTags:this.hash
                    } as ISearchConfig;
                    this._getAssetList(config);
                } else {
                    this.AssetList.next([]);
                    this.AssetListMore.next(false);
                }
            })
    }

    private _getAssetItemDetails(id:number) {
        this.service.GetAssetItem(id)
            .subscribe(data => {
                const obj = this._getNewAssetItem(data);
                const hash = obj.GroupTagIdentifier();
                if (hash) {
                    this.service.GetAssetList(this.pagesize,1,'ID,Title,Location',[],null,[hash])
                        .subscribe((list:IInsightItem[]) => {
                            const items = list.map(x => this._getNewAssetItem(x));
                            //obj.RelatedArticles = items;
                            this.AssetItem.next(obj);
                        });
                } else {
                    this.AssetItem.next(obj);
                }
            });
    }



    public GetMoreSearchResult() {
        this.currentPageNumber++;
        const config = {
            pageSize:this.pagesize,
            pageNo:this.currentPageNumber,
            fields:'ID',
            search:this.search,
            orders:this.sortOrder.getWord(),
            hashTags:this.hash
        } as ISearchConfig;
        this.service.GetAssetList(config.pageSize,config.pageNo,config.fields,config.search,config.orders,config.hashTags)
            .subscribe((data:IInsightItem[]) => {
                const alist = this.AssetList.value;
                const access = data.map(x => this.service.GetAssetItem(x.ID));
                forkJoin(access)
                    .subscribe(results => {
                        const tlist = results.map(y => this._getNewAssetItem(y));
                        alist.push(...tlist);
                        this.AssetList.next(alist);
                        const more = this.AssetList.value.length < this.AssetListCount.value;
                        this.AssetListMore.next(more);
                    });
            });
    }

    public SetBehavior(action:IAction) {
        this._setAction(action);
        //console.log(`set action=${action.type.toString()}`);
    }

    // get my list for approval
    public GetMyAssetsList() {
        if (this.UserInformation.value.isApprover) {
            this.service.GetMyAssetsList()
                .subscribe(data => {
                    this.MyAssetList.next(data);
                })
        }
    }

    public GetAssetItemModifiedDate(id:number):Observable<string> {
        return this.service.GetAssetItemModifiedDate(id);
    }
}
