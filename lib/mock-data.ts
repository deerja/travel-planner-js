import type { AppData, Place, ScheduleItem, TransportSegment, TripDay } from "./models";
const places:Place[]=[
 {id:"hotel",name:"The Shanghai EDITION",category:"숙소",address:"199 Nanjing Rd E, Huangpu",description:"와이탄과 난징동루 사이의 도심 호텔",coordinates:{x:23,y:26}},
 {id:"funk",name:"Funk & Kale",category:"카페",address:"Fumin Rd, Jing'an",description:"가벼운 브런치와 스페셜티 커피",coordinates:{x:22,y:23}},
 {id:"yuyuan",name:"예원",category:"관광",address:"279 Yuyuan Old St, Huangpu",description:"명나라 시대 정원과 상하이 구시가지",cost:8000,coordinates:{x:54,y:39}},
 {id:"xintiandi",name:"신천지",category:"쇼핑",address:"Madang Rd, Huangpu",description:"스쿠먼 건축과 라이프스타일 숍이 모인 거리",coordinates:{x:38,y:57}},
 {id:"concession",name:"프랑스 조계지",category:"관광",address:"Wukang Rd, Xuhui",description:"플라타너스 길과 오래된 서양식 건물이 아름다운 동네",coordinates:{x:66,y:67}},
 {id:"bund",name:"와이탄",category:"관광",address:"Zhongshan East 1st Rd",description:"푸동 스카이라인을 마주 보는 상하이 대표 산책로",coordinates:{x:69,y:28}},
 {id:"museum",name:"상하이 박물관 동관",category:"관광",address:"1952 Century Ave, Pudong",description:"중국 고대 미술과 청동기 컬렉션",coordinates:{x:78,y:45}},
 {id:"nanjing",name:"난징동루",category:"쇼핑",address:"Nanjing East Rd",description:"상하이의 대표 보행자 쇼핑 거리",coordinates:{x:45,y:24}},
 {id:"heytea",name:"HEYTEA LAB",category:"카페",address:"Huaihai Middle Rd",description:"상하이 한정 메뉴가 있는 티 카페",coordinates:{x:43,y:51}},
 {id:"nanxiang",name:"난샹만터우뎬",category:"음식점",address:"Yuyuan Old St",description:"예원에서 즐기는 전통 샤오롱바오",coordinates:{x:57,y:42}},
 {id:"wukang",name:"우캉맨션",category:"관광",address:"1850 Huaihai Middle Rd",description:"프랑스 조계지의 포토 스팟",coordinates:{x:72,y:70}},
];
const days:TripDay[]=[
 {id:"d1",tripId:"shanghai",day:1,date:"2026-08-20",label:"8월 20일 목요일",title:"도착 & 예원",scheduleItemIds:["s11","s12","s13"]},
 {id:"d2",tripId:"shanghai",day:2,date:"2026-08-21",label:"8월 21일 금요일",title:"예원 / 신천지",scheduleItemIds:["s21","s22","s23","s24"]},
 {id:"d3",tripId:"shanghai",day:3,date:"2026-08-22",label:"8월 22일 토요일",title:"박물관 & 난징동루",scheduleItemIds:["s31","s32"]},
 {id:"d4",tripId:"shanghai",day:4,date:"2026-08-23",label:"8월 23일 일요일",title:"와이탄과 출국",scheduleItemIds:["s41"]},
 {id:"t1",tripId:"tokyo",day:1,date:"2026-11-06",label:"11월 6일 금요일",scheduleItemIds:[]},
 {id:"t2",tripId:"tokyo",day:2,date:"2026-11-07",label:"11월 7일 토요일",scheduleItemIds:[]},
 {id:"t3",tripId:"tokyo",day:3,date:"2026-11-08",label:"11월 8일 일요일",scheduleItemIds:[]},
];
const scheduleItems:ScheduleItem[]=[
 {id:"s11",tripDayId:"d1",placeId:"hotel",time:"09:00",duration:30,note:"체크인 전 짐 맡기기"},{id:"s12",tripDayId:"d1",placeId:"yuyuan",time:"10:30",duration:90,note:"정원과 구시가지 산책",reservationId:"r-yuyuan"},{id:"s13",tripDayId:"d1",placeId:"nanxiang",time:"12:30",duration:60,note:"샤오롱바오 점심"},
 {id:"s21",tripDayId:"d2",placeId:"funk",time:"09:30",duration:60,note:"브런치와 커피"},{id:"s22",tripDayId:"d2",placeId:"yuyuan",time:"10:50",duration:90,note:"오전에는 비교적 한적해요",reservationId:"r-yuyuan"},{id:"s23",tripDayId:"d2",placeId:"xintiandi",time:"13:00",duration:120,note:"점심 후 골목 산책"},{id:"s24",tripDayId:"d2",placeId:"concession",time:"15:30",duration:120,note:"우캉루에서 노을 보기"},
 {id:"s31",tripDayId:"d3",placeId:"museum",time:"10:00",duration:120,note:"동관 2층부터 관람",reservationId:"r-museum"},{id:"s32",tripDayId:"d3",placeId:"nanjing",time:"13:00",duration:120,note:"기념품 쇼핑"},{id:"s41",tripDayId:"d4",placeId:"bund",time:"08:30",duration:60,note:"출국 전 마지막 산책"}
];
function segment(id:string,day:string,from:string,to:string,mode:TransportSegment["mode"],minutes:number):TransportSegment{return{id,tripDayId:day,fromScheduleItemId:from,toScheduleItemId:to,mode,minutes}}
export const initialData:AppData={
 trips:[{id:"shanghai",name:"상하이 3박 4일",country:"중국",city:"상하이",startDate:"2026-08-20",endDate:"2026-08-23",flight:"인천 → 상하이",accommodation:"The Shanghai EDITION",travelers:2,styles:["맛집","관광","쇼핑"]},{id:"tokyo",name:"도쿄 주말 여행",country:"일본",city:"도쿄",startDate:"2026-11-06",endDate:"2026-11-08",flight:"김포 → 하네다",accommodation:"Trunk Hotel",travelers:2,styles:["맛집","자유여행"]}],
 days,places,scheduleItems,
 segments:[segment("sg11","d1","s11","s12","대중교통",24),segment("sg12","d1","s12","s13","도보",12),segment("sg21","d2","s21","s22","대중교통",27),segment("sg22","d2","s22","s23","대중교통",22),segment("sg23","d2","s23","s24","택시",12),segment("sg31","d3","s31","s32","도보",18)],
 savedPlaces:[{id:"sp1",tripId:"shanghai",placeId:"heytea",status:"saved"},{id:"sp2",tripId:"shanghai",placeId:"wukang",status:"saved"},{id:"sp3",tripId:"shanghai",placeId:"yuyuan",status:"scheduled"},{id:"sp4",tripId:"shanghai",placeId:"xintiandi",status:"scheduled"},{id:"sp5",tripId:"shanghai",placeId:"bund",status:"scheduled"}],
 reservations:[{id:"r-yuyuan",tripId:"shanghai",scheduleItemId:"s22",type:"관광지",name:"예원 전자 입장권",date:"2026-08-21",time:"10:30",confirmation:"YU-260821-48"},{id:"r-hotel",tripId:"shanghai",type:"숙소",name:"The Shanghai EDITION",date:"2026-08-20",time:"15:00",confirmation:"ED-0820-JC"},{id:"r-museum",tripId:"shanghai",scheduleItemId:"s31",type:"관광지",name:"상하이 박물관 동관",date:"2026-08-22",time:"10:00",confirmation:"SHM-1172"}],
 flights:[{id:"f1",tripId:"shanghai",route:"ICN → PVG",number:"KE893",departure:"08.20 08:40",arrival:"08.20 09:55"},{id:"f2",tripId:"shanghai",route:"PVG → ICN",number:"KE896",departure:"08.23 14:05",arrival:"08.23 17:10"}],
 accommodations:[{id:"a1",tripId:"shanghai",name:"The Shanghai EDITION",address:"199 Nanjing Rd E, Huangpu",checkIn:"08.20 15:00",checkOut:"08.23 12:00"}],
 expenses:[{id:"e1",tripId:"shanghai",category:"항공",amount:380000},{id:"e2",tripId:"shanghai",category:"숙박",amount:420000},{id:"e3",tripId:"shanghai",category:"교통",amount:80000},{id:"e4",tripId:"shanghai",category:"식비",amount:250000}],
};
