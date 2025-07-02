export enum ActionType {
    none = 0,
    expand = 1,
    collapse = 2,
    addFavourite = 3,
    removeFavourite = 4,
    openAssetEntryForm = 5,
    closeAssetEntryForm = 6,
}

export interface IAction {
    type:ActionType;
    payload:any;
}

export const initialAction: IAction = {
    type:ActionType.none,
    payload:{
        fullscreen:false
    }
}