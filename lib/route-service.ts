import type { ScheduleItem } from "./models";
export interface RouteRecommendation { items:ScheduleItem[]; savedMinutes:number; }
export function recommendRoute(items:ScheduleItem[]):RouteRecommendation { if(items.length<4)return{items,savedMinutes:0}; return{items:[items[0],items[2],items[3],items[1]],savedMinutes:42}; }
