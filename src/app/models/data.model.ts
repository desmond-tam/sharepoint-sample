export interface IInsightItem {
  Id:number;
    ID:number;
    Title:string;
    Description:string;
    Summary:string;
    Tags:string;
    Author:{
      Title:string;
    }
    Attachments:IAttachementFile[];
}

export class TheInsightItem {
  constructor() {}
}

export class InsightItem implements IInsightItem {
    ID=-1;
    Id=-1;
    Title='';
    Description='';
    Summary='';
    Tags='';
    HashTags:string | null=null;
    Author={
      Title:''
    };
    Attachments: IAttachementFile[]=[];
    constructor(){}

    static getSelectText() {
      const expand = 'Editor,Author';
      const select = ['ID,GUID,Title,Status,Summary,',
                      'Description,Tags,',
                      'AuthorId,Author/Title,EditorId,Editor/Title,',
                      'Created,Modified'];
      return `${select.join('')}&$expand=${expand}`;
    }
  
    public GroupTagIdentifier() {
      const findtag = (hash:string | null):string | null => {
        const regex = /#GP_[0-9]*#/g;
        const match = regex.exec(hash ?? '');
        return match && match.length > 0 ? match[0] : null;
      }
      return findtag(this.HashTags);
    }
}

export interface ISharePointError {
    error: {
        error_description:string,
        error:{
            code:string;
            message: {
                lang:string;
                value:string;
            }
        },
        message:string;
       
    }
    ok:boolean;
    status:number;
    statusText:string;

    GetErrorMessage:() => string;
}

  export class SharePointError implements ISharePointError {
    statusText: any;
    constructor() {}
    error: {
      error_description: string; 
      error: {
        code: string;
        message: {
          lang: string;
          value: string;
        };
      }; 
      message: string;
    } = {
      error_description: "",
      error: {
        code: "",
        message: {
          lang: "",
          value: ""
        }
      },
      message: ""
    };
    ok: boolean=false;
    status: number = -1;

    private _getText():string {
        return this.statusText?.toUpperCase();
    }

    private _getDescription() :string {
        return this.error?.error?.message?.value || this.error?.error_description || '';
    }

    public GetErrorMessage() {
        return `${this._getText()} - ${this._getDescription()}`
    }


    
}


export interface IDigestToken {
  FormDigestTimeoutSecond:number;
  FormDigestValue:string;
  LibraryVersion:string;
  SiteFullUrl:string;
  WebFullUrl:string;
  BearerToken:string;
}

export interface IUserInfo {
    Email:string;
    Expiration:string;
    Id:number;
    Title:string;
    UserId:{
        NameId:string;
        NameIdIssuer:string;
    },
    UserPrincipalName:string;
    isApprover:boolean;
}

export interface ISortOrder {
  name:string;
  ascending:boolean;
  getWord:() => string;
}

export class SortOrder implements ISortOrder {
  name:string='Modified';
  ascending:boolean=false;
  public getWord() {
    let field = '';
    switch (this.name) {
      case 'Modified':
        field = 'Modified';
        break;
      case 'Favourite':
        field = 'FavouriteCount';
        break;
      default:
        field = 'FavouriteCount';
        break;
    }
    return `${field} ${this.ascending ? 'asc' : 'desc'}`
  }
}

export interface ITagItem
{
  Word:string;
  Count:number;
}


export interface ISharePointPerson {
  Id:number;
  Title:string;
  EMail:string;
  JobTitle:string;
  Department:string;
  UserPrincipalName:string;
}

export interface ITagItem
{
  Word:string;
  Count:number;
}

export interface ISearchConfig {
  pageSize:number;
  pageNo:number;
  fields:string;
  search:string[];
  orders:string;
  hashTags:string[];
}

export interface IAttachementFile {
  FileName:string;
  ServerRelativeUrl:string;
}

export class AttachmentFile implements IAttachementFile {
  FileName='';
  ServerRelativeUrl='';
}