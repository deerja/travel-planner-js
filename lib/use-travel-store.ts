"use client";
import { useEffect,useState } from "react";
import { initialData } from "./mock-data";
import type { AppData, PlaceCategory, TransportSegment, Trip } from "./models";
const KEY="roamly-travel-data-v1";
function cloneInitial(){return JSON.parse(JSON.stringify(initialData)) as AppData}
export function useTravelStore(){
 const [data,setData]=useState<AppData>(cloneInitial); const [ready,setReady]=useState(false);
 useEffect(()=>{queueMicrotask(()=>{try{const saved=localStorage.getItem(KEY);if(saved)setData(JSON.parse(saved))}catch{/* 손상된 로컬 데이터는 기본값으로 복구합니다. */}setReady(true)})},[]);
 useEffect(()=>{if(ready)localStorage.setItem(KEY,JSON.stringify(data))},[data,ready]);
 function createTrip(input:Omit<Trip,"id">){const id=`trip-${Date.now()}`;const trip={...input,id};const start=new Date(`${input.startDate}T00:00:00`),end=new Date(`${input.endDate}T00:00:00`);const count=Math.max(1,Math.round((end.getTime()-start.getTime())/86400000)+1);setData(d=>({...d,trips:[...d.trips,trip],days:[...d.days,...Array.from({length:count},(_,i)=>{const date=new Date(start);date.setDate(start.getDate()+i);return{id:`${id}-d${i+1}`,tripId:id,day:i+1,date:date.toISOString().slice(0,10),label:new Intl.DateTimeFormat("ko-KR",{month:"long",day:"numeric",weekday:"long"}).format(date),scheduleItemIds:[]}})]}));return id}
 function addPlaceToDay(placeId:string,dayId:string){setData(d=>{const id=`s-${Date.now()}`;const item={id,tripDayId:dayId,placeId,time:"미정",duration:60,note:"메모를 추가해보세요"};return{...d,scheduleItems:[...d.scheduleItems,item],days:d.days.map(day=>day.id===dayId?{...day,scheduleItemIds:[...day.scheduleItemIds,id]}:day),savedPlaces:d.savedPlaces.map(s=>s.placeId===placeId?{...s,status:"scheduled"}:s)}})}
 function savePlace(placeId:string,tripId:string){setData(d=>d.savedPlaces.some(s=>s.placeId===placeId&&s.tripId===tripId)?d:{...d,savedPlaces:[...d.savedPlaces,{id:`sp-${Date.now()}`,tripId,placeId,status:"saved"}]})}
 function removeSchedule(itemId:string){setData(d=>({...d,scheduleItems:d.scheduleItems.filter(s=>s.id!==itemId),days:d.days.map(day=>({...day,scheduleItemIds:day.scheduleItemIds.filter(id=>id!==itemId)})),segments:d.segments.filter(s=>s.fromScheduleItemId!==itemId&&s.toScheduleItemId!==itemId)}))}
 function reorder(dayId:string,fromId:string,toId:string){setData(d=>{const day=d.days.find(x=>x.id===dayId);if(!day)return d;const ids=[...day.scheduleItemIds],from=ids.indexOf(fromId),to=ids.indexOf(toId);if(from<0||to<0)return d;ids.splice(to,0,...ids.splice(from,1));const old=d.segments.filter(s=>s.tripDayId===dayId);const rebuilt:TransportSegment[]=ids.slice(0,-1).map((id,i)=>({id:`seg-${dayId}-${i}`,tripDayId:dayId,fromScheduleItemId:id,toScheduleItemId:ids[i+1],mode:old[i]?.mode??"도보",minutes:old[i]?.minutes??15}));return{...d,days:d.days.map(x=>x.id===dayId?{...x,scheduleItemIds:ids}:x),segments:[...d.segments.filter(s=>s.tripDayId!==dayId),...rebuilt]}})}
 function applyOrder(dayId:string,ids:string[]){setData(d=>({...d,days:d.days.map(day=>day.id===dayId?{...day,scheduleItemIds:ids}:day)}))}
 function updateItem(itemId:string,patch:{time?:string;duration?:number;note?:string}){setData(d=>({...d,scheduleItems:d.scheduleItems.map(s=>s.id===itemId?{...s,...patch}:s)}))}
 function updateTrip(tripId:string,patch:Partial<Omit<Trip,"id">>){setData(d=>({...d,trips:d.trips.map(trip=>trip.id===tripId?{...trip,...patch}:trip)}))}
 function updateDayTitle(dayId:string,title:string){setData(d=>({...d,days:d.days.map(day=>day.id===dayId?{...day,title:title.trim()||undefined}:day)}))}
 function moveSchedule(itemId:string,targetDayId:string){setData(d=>{const item=d.scheduleItems.find(s=>s.id===itemId);if(!item||item.tripDayId===targetDayId)return d;return{...d,scheduleItems:d.scheduleItems.map(s=>s.id===itemId?{...s,tripDayId:targetDayId}:s),days:d.days.map(day=>day.id===item.tripDayId?{...day,scheduleItemIds:day.scheduleItemIds.filter(id=>id!==itemId)}:day.id===targetDayId?{...day,scheduleItemIds:[...day.scheduleItemIds,itemId]}:day),segments:d.segments.filter(s=>s.fromScheduleItemId!==itemId&&s.toScheduleItemId!==itemId)}})}
 function addCustomPlace(tripId:string,input:{name:string;category:PlaceCategory;address:string}){const id=`p-${Date.now()}`;setData(d=>({...d,places:[...d.places,{...input,id,description:"새로 저장한 장소",coordinates:{x:35+Math.random()*35,y:25+Math.random()*40}}],savedPlaces:[...d.savedPlaces,{id:`sp-${Date.now()}`,tripId,placeId:id,status:"saved"}]}));return id}
 function reset(){const fresh=cloneInitial();setData(fresh);localStorage.removeItem(KEY)}
 return{data,createTrip,updateTrip,addPlaceToDay,savePlace,removeSchedule,reorder,applyOrder,updateItem,updateDayTitle,moveSchedule,addCustomPlace,reset};
}
