export type PlaceCategory = "관광" | "음식점" | "카페" | "쇼핑" | "숙소" | "기타";
export type TransportMode = "도보" | "대중교통" | "택시";
export type AppScreen = "trips" | "home" | "planner" | "map" | "saved" | "info";
export interface Trip { id:string; name:string; country:string; city:string; startDate:string; endDate:string; flight?:string; accommodation?:string; travelers?:number; styles?:string[]; }
export interface TripDay { id:string; tripId:string; day:number; date:string; label:string; title?:string; scheduleItemIds:string[]; }
export interface Place { id:string; name:string; category:PlaceCategory; address:string; description:string; cost?:number; link?:string; coordinates:{x:number;y:number}; }
export interface SavedPlace { id:string; tripId:string; placeId:string; status:"saved"|"scheduled"; }
export interface ScheduleItem { id:string; tripDayId:string; placeId:string; time:string; duration:number; note:string; reservationId?:string; }
export interface TransportSegment { id:string; tripDayId:string; fromScheduleItemId:string; toScheduleItemId:string; mode:TransportMode; minutes:number; }
export interface Reservation { id:string; tripId:string; scheduleItemId?:string; type:"항공"|"숙소"|"관광지"|"레스토랑"|"교통"; name:string; date:string; time:string; confirmation:string; }
export interface Flight { id:string; tripId:string; route:string; number:string; departure:string; arrival:string; }
export interface Accommodation { id:string; tripId:string; name:string; address:string; checkIn:string; checkOut:string; }
export interface Expense { id:string; tripId:string; category:"항공"|"숙박"|"교통"|"식비"|"관광"|"쇼핑"|"기타"; amount:number; }
export interface AppData { trips:Trip[]; days:TripDay[]; places:Place[]; savedPlaces:SavedPlace[]; scheduleItems:ScheduleItem[]; segments:TransportSegment[]; reservations:Reservation[]; flights:Flight[]; accommodations:Accommodation[]; expenses:Expense[]; }
