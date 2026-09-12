"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleEllipsis,
  Compass,
  GripVertical,
  Hotel,
  Info,
  LocateFixed,
  MapPin,
  Navigation,
  Pencil,
  Plane,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type {
  AppData,
  Place,
  ScheduleItem,
  Trip,
  TripDay,
} from "@/lib/models";
import { googleMapsProvider } from "@/lib/providers";
import { useTravelStore } from "@/lib/use-travel-store";

type GlobalView = "trips" | "journey" | "saved" | "info";
type JourneyView = "home" | "timeline";
type StopStatus = "completed" | "current" | "next" | "upcoming";

const today = new Date("2026-08-18T12:00:00");
const formatDay = (date: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${date}T00:00:00`));
const formatMonthDay = (date: string) =>
  new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(
    new Date(`${date}T00:00:00`),
  );
const daysUntil = (date: string) =>
  Math.ceil(
    (new Date(`${date}T00:00:00`).getTime() - today.getTime()) / 86400000,
  );
const isTraveling = (trip: Trip) =>
  today >= new Date(`${trip.startDate}T00:00:00`) &&
  today <= new Date(`${trip.endDate}T23:59:59`);
const itemsForDay = (data: AppData, day: TripDay) =>
  day.scheduleItemIds
    .map((id) => data.scheduleItems.find((item) => item.id === id))
    .filter(Boolean) as ScheduleItem[];
const placeFor = (data: AppData, item: ScheduleItem) =>
  data.places.find((place) => place.id === item.placeId)!;
const travelMinutes = (data: AppData, day: TripDay) =>
  data.segments
    .filter((segment) => segment.tripDayId === day.id)
    .reduce((sum, segment) => sum + segment.minutes, 0);
const statusLabel: Record<StopStatus, string> = {
  completed: "완료",
  current: "현재",
  next: "다음 일정",
  upcoming: "예정",
};

function stopStatus(
  day: TripDay,
  item: ScheduleItem,
  index: number,
  items: ScheduleItem[],
): StopStatus {
  const todayKey = today.toISOString().slice(0, 10);
  if (day.date < todayKey) return "completed";
  if (day.date > todayKey) return index === 0 ? "next" : "upcoming";

  const [hour, minute] = item.time.split(":").map(Number);
  const start = hour * 60 + minute;
  const end = start + item.duration;
  const now = today.getHours() * 60 + today.getMinutes();
  if (end <= now) return "completed";
  if (start <= now) return "current";

  const firstFuture = items.find((candidate) => {
    const [candidateHour, candidateMinute] = candidate.time.split(":").map(Number);
    return candidateHour * 60 + candidateMinute > now;
  });
  return firstFuture?.id === item.id ? "next" : "upcoming";
}

export function TravelPlannerApp() {
  const store = useTravelStore();
  const { data } = store;
  const [globalView, setGlobalView] = useState<GlobalView>("journey");
  const [journeyView, setJourneyView] = useState<JourneyView>("home");
  const [activeTripId, setActiveTripId] = useState("shanghai");
  const [activeDayId, setActiveDayId] = useState("d2");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>("yuyuan");
  const [editMode, setEditMode] = useState(false);
  const [actionItemId, setActionItemId] = useState<string | null>(null);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<"create" | "search" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const trip = data.trips.find((item) => item.id === activeTripId) ?? data.trips[0];
  const days = data.days.filter((day) => day.tripId === trip.id);
  const day = days.find((item) => item.id === activeDayId) ?? days[0];
  const items = day ? itemsForDay(data, day) : [];
  const selectedItem =
    items.find((item) => item.placeId === selectedPlaceId) ?? items[0] ?? null;

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };
  const openTrip = (id: string) => {
    const nextDays = data.days.filter((candidate) => candidate.tripId === id);
    const first =
      nextDays.find((candidate) => candidate.date === today.toISOString().slice(0, 10)) ??
      nextDays[0];
    setActiveTripId(id);
    if (first) setActiveDayId(first.id);
    setSelectedPlaceId(null);
    setGlobalView("journey");
    setJourneyView("home");
  };
  const openDay = (id: string) => {
    const next = days.find((candidate) => candidate.id === id);
    const first = next?.scheduleItemIds[0];
    setActiveDayId(id);
    setSelectedPlaceId(
      first ? data.scheduleItems.find((item) => item.id === first)?.placeId ?? null : null,
    );
    setJourneyView("timeline");
    setGlobalView("journey");
  };

  return (
    <main className="app-shell">
      <GlobalNavigation
        active={globalView}
        onHome={() => {
          setGlobalView("journey");
          setJourneyView("home");
        }}
        onTrips={() => setGlobalView("trips")}
        onSaved={() => setGlobalView("saved")}
      />
      <section
        className="app-content"
      >
        {globalView === "trips" ? (
          <TripsView
            trips={data.trips}
            onOpen={openTrip}
            onEdit={setEditingTripId}
            onCreate={() => setOverlay("create")}
          />
        ) : (
          <>
            <TripHeader
              trip={trip}
              journeyView={journeyView}
              onBack={() => setGlobalView("trips")}
              onHome={() => setJourneyView("home")}
              onInfo={() => setGlobalView("info")}
            />
            {globalView === "journey" && journeyView === "home" && (
              <TripHome
                data={data}
                trip={trip}
                days={days}
                onOpenDay={openDay}
                onRenameDay={store.updateDayTitle}
                onEditTrip={() => setEditingTripId(trip.id)}
              />
            )}
            {globalView === "journey" && journeyView !== "home" && day && (
              <PlannerWorkspace
                data={data}
                days={days}
                day={day}
                items={items}
                selectedItem={selectedItem}
                view={journeyView}
                editMode={editMode}
                onSelectDay={(id) => {
                  setActiveDayId(id);
                  const next = days.find((candidate) => candidate.id === id);
                  const first = next?.scheduleItemIds[0];
                  setSelectedPlaceId(
                    first
                      ? data.scheduleItems.find((item) => item.id === first)?.placeId ?? null
                      : null,
                  );
                }}
                onSelectPlace={setSelectedPlaceId}
                onToggleEdit={() => setEditMode((value) => !value)}
                onActions={setActionItemId}
                onAdd={() => setOverlay("search")}
                onReorder={store.reorder}
              />
            )}
            {globalView === "saved" && (
              <SavedPlaces
                data={data}
                trip={trip}
                days={days}
                onAddPlace={() => setOverlay("search")}
                onSchedule={(placeId, dayId) => {
                  store.addPlaceToDay(placeId, dayId);
                  notify(`DAY ${days.find((candidate) => candidate.id === dayId)?.day ?? ""}에 추가했어요`);
                }}
              />
            )}
            {globalView === "info" && <TravelInfo data={data} trip={trip} />}
          </>
        )}
      </section>
      <MobileGlobalNavigation
        active={globalView}
        onJourney={() => {
          setGlobalView("journey");
          setJourneyView("home");
        }}
        onTrips={() => setGlobalView("trips")}
        onSaved={() => setGlobalView("saved")}
      />
      {overlay === "create" && (
        <CreateTripSheet
          onClose={() => setOverlay(null)}
          onCreate={(input) => {
            const id = store.createTrip(input);
            setOverlay(null);
            openTrip(id);
          }}
        />
      )}
      {overlay === "search" && day && (
        <PlaceSearch
          places={data.places}
          onClose={() => setOverlay(null)}
          onSave={(id) => {
            store.savePlace(id, trip.id);
            notify("가고 싶은 곳에 저장했어요");
          }}
          onAdd={(id) => {
            store.addPlaceToDay(id, day.id);
            setOverlay(null);
            setSelectedPlaceId(id);
            notify(`DAY ${day.day}에 추가했어요`);
          }}
        />
      )}
      {editingTripId && (
        <EditTripSheet
          trip={data.trips.find((item) => item.id === editingTripId)!}
          onClose={() => setEditingTripId(null)}
          onSave={(patch) => {
            store.updateTrip(editingTripId, patch);
            setEditingTripId(null);
            notify("여행 정보를 수정했어요");
          }}
        />
      )}
      {actionItemId && (
        <ContextBottomSheet
          item={data.scheduleItems.find((item) => item.id === actionItemId)!}
          place={placeFor(
            data,
            data.scheduleItems.find((item) => item.id === actionItemId)!,
          )}
          days={days}
          onClose={() => setActionItemId(null)}
          onUpdate={store.updateItem}
          onMove={(target) => {
            store.moveSchedule(actionItemId, target);
            setActionItemId(null);
            notify("다른 날짜로 옮겼어요");
          }}
          onDelete={() => {
            store.removeSchedule(actionItemId);
            setActionItemId(null);
            notify("일정에서 삭제했어요");
          }}
        />
      )}
      {toast && (
        <div className="toast">
          <Check />
          {toast}
        </div>
      )}
    </main>
  );
}

function GlobalNavigation({
  active,
  onHome,
  onTrips,
  onSaved,
}: {
  active: GlobalView;
  onHome: () => void;
  onTrips: () => void;
  onSaved: () => void;
}) {
  return (
    <aside className="global-rail">
      <button className="wordmark" onClick={onHome} aria-label="Roamly 여행 홈">
        R
      </button>
      <nav aria-label="주요 메뉴">
        <button className={active === "journey" ? "active" : ""} onClick={onHome}>
          <Compass />
          <span>여행 홈</span>
        </button>
        <button className={active === "trips" ? "active" : ""} onClick={onTrips}>
          <CalendarDays />
          <span>내 여행</span>
        </button>
        <button className={active === "saved" ? "active" : ""} onClick={onSaved}>
          <Bookmark />
          <span>가고 싶은 곳</span>
        </button>
      </nav>
    </aside>
  );
}

function MobileGlobalNavigation({
  active,
  onJourney,
  onTrips,
  onSaved,
}: {
  active: GlobalView;
  onJourney: () => void;
  onTrips: () => void;
  onSaved: () => void;
}) {
  return (
    <nav className="mobile-global-nav" aria-label="주요 메뉴">
      <button className={active === "journey" ? "active" : ""} onClick={onJourney}>
        <Compass />
        <span>현재 여행</span>
      </button>
      <button className={active === "trips" ? "active" : ""} onClick={onTrips}>
        <CalendarDays />
        <span>내 여행</span>
      </button>
      <button className={active === "saved" ? "active" : ""} onClick={onSaved}>
        <Bookmark />
        <span>가고 싶은 곳</span>
      </button>
    </nav>
  );
}

function TripHeader({
  trip,
  journeyView,
  onBack,
  onHome,
  onInfo,
}: {
  trip: Trip;
  journeyView: JourneyView;
  onBack: () => void;
  onHome: () => void;
  onInfo: () => void;
}) {
  const dday = daysUntil(trip.startDate);
  return (
    <header className="trip-header">
      <button className="quiet-icon" onClick={onBack} aria-label="내 여행으로 돌아가기">
        <ArrowLeft />
      </button>
      <button className="trip-context" onClick={onHome}>
        <strong>{trip.name}</strong>
        <span>
          {dday > 0 ? `출발까지 ${dday}일` : dday === 0 ? "오늘 출발" : "여행 중"}
        </span>
      </button>
      {journeyView !== "home" && (
        <button className="header-home" onClick={onHome}>
          여행 홈
        </button>
      )}
      <button className="quiet-icon" onClick={onInfo} aria-label="여행 정보">
        <Info />
      </button>
    </header>
  );
}

function TripHome({
  data,
  trip,
  days,
  onOpenDay,
  onRenameDay,
  onEditTrip,
}: {
  data: AppData;
  trip: Trip;
  days: TripDay[];
  onOpenDay: (id: string) => void;
  onRenameDay: (id: string, title: string) => void;
  onEditTrip: () => void;
}) {
  const traveling = isTraveling(trip);
  const todayKey = today.toISOString().slice(0, 10);
  const todayDay = days.find((day) => day.date === todayKey) ?? days[0];
  const items = todayDay ? itemsForDay(data, todayDay) : [];
  const next =
    items.find((item, index) => stopStatus(todayDay, item, index, items) === "next") ??
    items.find((item, index) => stopStatus(todayDay, item, index, items) === "current") ??
    items[0];
  const [expandedDayId, setExpandedDayId] = useState<string | null>(days[0]?.id ?? null);

  if (traveling && todayDay && next) {
    const place = placeFor(data, next);
    return (
      <div className="home-view today-mode">
        <section className="home-intro">
          <button className="section-edit-action" onClick={onEditTrip}>
            <Pencil />여행 수정
          </button>
          <p className="kicker">
            {trip.country} · {trip.city}
          </p>
          <h1>{trip.name}</h1>
          <div className="trip-date-row">
            <span>
              DAY {todayDay.day} · {formatDay(todayDay.date)}
            </span>
            <strong>오늘 여행</strong>
          </div>
        </section>
        <section className="today-summary">
          <span>오늘 일정</span>
          <h2>다음에 갈 곳을 확인해보세요</h2>
          <p>
            장소 {items.length}곳 · 총 이동 약 {travelMinutes(data, todayDay)}분
          </p>
        </section>
        <section className="next-destination">
          <div className="next-label">
            <span />다음 일정
          </div>
          <time>{next.time}</time>
          <PlaceIdentity item={next} place={place} prominent />
          <p className="from-current">
            <LocateFixed />현재 위치에서 약 18분
          </p>
          <button
            className="primary-cta"
            onClick={() =>
              googleMapsProvider.openDirections({ destination: place, travelMode: "transit" })
            }
          >
            <Navigation />길찾기 시작하기
          </button>
        </section>
        <section className="upcoming-preview">
          <div className="section-title-row">
            <h2>이후 일정</h2>
            <button onClick={() => onOpenDay(todayDay.id)}>
              오늘 일정 보기 <ArrowRight />
            </button>
          </div>
          {items
            .filter((item) => item.id !== next.id)
            .slice(0, 3)
            .map((item) => (
              <HomePlaceRow
                key={item.id}
                item={item}
                place={placeFor(data, item)}
                onClick={() => onOpenDay(todayDay.id)}
              />
            ))}
        </section>
      </div>
    );
  }

  const totalPlaces = days.reduce((sum, day) => sum + day.scheduleItemIds.length, 0);
  const plannedDays = days.filter((day) => day.scheduleItemIds.length > 0).length;
  const emptyDay = days.find((day) => day.scheduleItemIds.length === 0);
  const targetDay = emptyDay ?? days[0];
  const cta =
    totalPlaces === 0
      ? "첫 일정 만들기"
      : emptyDay
        ? `DAY ${emptyDay.day} 일정 이어서 만들기`
        : "전체 일정 확인하기";

  return (
    <div className="home-view pretrip-mode">
      <section className="home-intro">
        <button className="section-edit-action" onClick={onEditTrip}>
          <Pencil />여행 수정
        </button>
        <p className="kicker">
          {trip.country} · {trip.city}
        </p>
        <h1>{trip.name}</h1>
        <div className="trip-date-row">
          <span>
            {formatMonthDay(trip.startDate)} - {formatMonthDay(trip.endDate)}
          </span>
          <strong>
            {daysUntil(trip.startDate) > 0
              ? `출발까지 ${daysUntil(trip.startDate)}일`
              : "여행 중"}
          </strong>
        </div>
      </section>
      <section className="travel-essentials home-essentials">
        <button>
          <Plane />
          <span>항공</span>
          <strong>{trip.flight}</strong>
        </button>
        <button>
          <Hotel />
          <span>숙소</span>
          <strong>{trip.accommodation}</strong>
        </button>
      </section>
      <section className="prepare-section">
        <div className="preparation-summary">
          <span>여행 일정</span>
          <h2>
            {days.length}일 중 {plannedDays}일의 일정을 만들었어요
          </h2>
          <p>총 {totalPlaces}곳을 방문할 예정이에요.</p>
          <div
            className="preparation-progress"
            role="progressbar"
            aria-label="여행 일정 준비율"
            aria-valuemin={0}
            aria-valuemax={days.length}
            aria-valuenow={plannedDays}
          >
            <span style={{ width: `${days.length ? (plannedDays / days.length) * 100 : 0}%` }} />
          </div>
        </div>
        <div className="day-progress-list">
          {days.map((day) => (
            <HomeDayAccordion
              key={day.id}
              data={data}
              day={day}
              expanded={expandedDayId === day.id}
              onToggle={() => setExpandedDayId((current) => (current === day.id ? null : day.id))}
              onOpenDay={() => onOpenDay(day.id)}
              onRename={(title) => onRenameDay(day.id, title)}
            />
          ))}
        </div>
        <button className="primary-cta" onClick={() => onOpenDay(targetDay.id)}>
          {cta} <ArrowRight />
        </button>
      </section>
    </div>
  );
}

function HomeDayAccordion({
  data,
  day,
  expanded,
  onToggle,
  onOpenDay,
  onRename,
}: {
  data: AppData;
  day: TripDay;
  expanded: boolean;
  onToggle: () => void;
  onOpenDay: () => void;
  onRename: (title: string) => void;
}) {
  const dayItems = itemsForDay(data, day);
  const preview = dayItems
    .slice(0, 3)
    .map((item) => placeFor(data, item).name)
    .join(" · ");
  const fallbackTitle = dayItems
    .slice(0, 2)
    .map((item) => placeFor(data, item).name)
    .join(" & ");
  const title = day.title || fallbackTitle || `DAY ${day.day} 일정`;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  return (
    <article className={`home-day-accordion ${expanded ? "open" : ""}`}>
      <div className="home-day-header">
        <button className="home-day-toggle" onClick={onToggle} aria-expanded={expanded}>
          <span className="home-day-title">
            <small>DAY {day.day}</small>
            <strong>{title}</strong>
          </span>
          <span className="home-day-meta">
            <small>{formatDay(day.date)}</small>
            <em>{dayItems.length ? `장소 ${dayItems.length}곳` : "아직 일정이 없어요"}</em>
          </span>
          <span className="home-day-preview">{preview || "장소를 추가해 이날의 여행을 만들어보세요"}</span>
          <ChevronDown className="accordion-chevron" />
        </button>
        <button
          className="day-title-edit"
          onClick={() => {
            setDraft(title);
            setEditing(true);
          }}
          aria-label={`DAY ${day.day} 일정명 수정`}
        >
          <Pencil />
        </button>
      </div>
      {editing && (
        <form
          className="day-title-form"
          onSubmit={(event) => {
            event.preventDefault();
            onRename(draft);
            setEditing(false);
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-label="일정명"
            maxLength={32}
          />
          <button type="submit">저장</button>
          <button type="button" onClick={() => setEditing(false)}>
            취소
          </button>
        </form>
      )}
      {expanded && (
        <div className="home-day-content">
          {dayItems.length ? (
            <div className="home-day-schedule">
              {dayItems.map((item, index) => {
                const place = placeFor(data, item);
                const segment = data.segments.find(
                  (candidate) =>
                    candidate.tripDayId === day.id && candidate.fromScheduleItemId === item.id,
                );
                return (
                  <div className="home-day-stop" key={item.id}>
                    <time>{item.time}</time>
                    <span>{index + 1}</span>
                    <div>
                      <strong>{place.name}</strong>
                      <small>
                        {segment
                          ? `${segment.mode} ${segment.minutes}분 · 다음 장소로 이동`
                          : "마지막 일정"}
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="home-day-empty">아직 등록된 장소가 없어요.</p>
          )}
          <button className="home-day-detail" onClick={onOpenDay}>
            DAY {day.day} 상세 일정 보기 <ArrowRight />
          </button>
        </div>
      )}
    </article>
  );
}

function HomePlaceRow({
  item,
  place,
  onClick,
}: {
  item: ScheduleItem;
  place: Place;
  onClick: () => void;
}) {
  return (
    <button className="home-place-row" onClick={onClick}>
      <time>{item.time}</time>
      <PlaceIdentity item={item} place={place} />
      <ArrowRight />
    </button>
  );
}

function PlannerWorkspace({
  data,
  days,
  day,
  items,
  selectedItem,
  view,
  editMode,
  onSelectDay,
  onSelectPlace,
  onToggleEdit,
  onActions,
  onAdd,
  onReorder,
}: {
  data: AppData;
  days: TripDay[];
  day: TripDay;
  items: ScheduleItem[];
  selectedItem: ScheduleItem | null;
  view: JourneyView;
  editMode: boolean;
  onSelectDay: (id: string) => void;
  onSelectPlace: (id: string) => void;
  onToggleEdit: () => void;
  onActions: (id: string) => void;
  onAdd: () => void;
  onReorder: (day: string, from: string, to: string) => void;
}) {
  return (
    <div className={`planner-workspace view-${view}`}>
      <div className="planner-context-bar">
        <DaySelector days={days} activeDayId={day.id} onSelect={onSelectDay} />
      </div>
      <div className="planner-split">
        <DailyTimeline
          data={data}
          day={day}
          items={items}
          selectedItem={selectedItem}
          editMode={editMode}
          onSelectPlace={onSelectPlace}
          onToggleEdit={onToggleEdit}
          onActions={onActions}
          onAdd={onAdd}
          onReorder={onReorder}
        />
        <MapView
          data={data}
          day={day}
          items={items}
          selectedItem={selectedItem}
          onSelectPlace={onSelectPlace}
        />
      </div>
    </div>
  );
}

function DaySelector({
  days,
  activeDayId,
  onSelect,
}: {
  days: TripDay[];
  activeDayId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="day-selector">
      {days.map((day) => (
        <button
          key={day.id}
          className={day.id === activeDayId ? "active" : ""}
          onClick={() => onSelect(day.id)}
          aria-pressed={day.id === activeDayId}
        >
          <span>DAY {day.day}</span>
          <small>{formatDay(day.date)}</small>
        </button>
      ))}
    </div>
  );
}

function DailyTimeline({
  data,
  day,
  items,
  selectedItem,
  editMode,
  onSelectPlace,
  onToggleEdit,
  onActions,
  onAdd,
  onReorder,
}: {
  data: AppData;
  day: TripDay;
  items: ScheduleItem[];
  selectedItem: ScheduleItem | null;
  editMode: boolean;
  onSelectPlace: (id: string) => void;
  onToggleEdit: () => void;
  onActions: (id: string) => void;
  onAdd: () => void;
  onReorder: (day: string, from: string, to: string) => void;
}) {
  const [dragged, setDragged] = useState<string | null>(null);
  return (
    <section className="timeline-panel">
      <header className="timeline-heading">
        <div>
          <p>DAY {day.day}</p>
          <h1>{day.label}</h1>
          <span>
            장소 {items.length}곳 · 총 이동 약 {travelMinutes(data, day)}분
          </span>
        </div>
        <button className={editMode ? "active" : ""} onClick={onToggleEdit}>
          {editMode ? <Check /> : <Pencil />}
          {editMode ? "편집 완료" : "일정 편집"}
        </button>
      </header>
      {items.length > 0 && <RoutePreview data={data} day={day} items={items} />}
      {items.length === 0 ? (
        <EmptyDay day={day.day} onAdd={onAdd} />
      ) : (
        <div className="journey-timeline">
          {items.map((item, index) => {
            const place = placeFor(data, item);
            const selected = selectedItem?.id === item.id;
            const status = stopStatus(day, item, index, items);
            return (
              <div
                key={item.id}
                data-place-id={place.id}
                draggable={editMode}
                className={`journey-stop status-${status} ${selected ? "selected" : ""} ${dragged === item.id ? "dragging" : ""}`}
                onDragStart={() => setDragged(item.id)}
                onDragOver={(event) => editMode && event.preventDefault()}
                onDrop={() => {
                  if (editMode && dragged && dragged !== item.id) {
                    onReorder(day.id, dragged, item.id);
                  }
                  setDragged(null);
                }}
              >
                <SchedulePlaceItem
                  item={item}
                  place={place}
                  index={index}
                  status={status}
                  selected={selected}
                  editMode={editMode}
                  onSelect={() => onSelectPlace(place.id)}
                  onActions={() => onActions(item.id)}
                />
              </div>
            );
          })}
        </div>
      )}
      <button className="add-place-cta" onClick={onAdd}>
        <Plus />장소 추가
      </button>
    </section>
  );
}

function SchedulePlaceItem({
  item,
  place,
  index,
  status,
  selected,
  editMode,
  onSelect,
  onActions,
}: {
  item: ScheduleItem;
  place: Place;
  index: number;
  status: StopStatus;
  selected: boolean;
  editMode: boolean;
  onSelect: () => void;
  onActions: () => void;
}) {
  return (
    <article className={`schedule-place ${editMode ? "editing" : ""}`}>
      {editMode && (
        <button className="drag-handle" aria-label={`${place.name} 순서 변경`}>
          <GripVertical />
        </button>
      )}
      <div className="timeline-axis">
        <span className={`${selected ? "active" : ""} marker-${status}`}>
          {status === "completed" ? <Check /> : index + 1}
        </span>
      </div>
      <time>{item.time}</time>
      <div className="place-content">
        <button className="place-focus" onClick={onSelect} aria-pressed={selected}>
          {(status === "current" || status === "next") && (
            <span className={`place-status ${status}`}>{statusLabel[status]}</span>
          )}
          <PlaceIdentity item={item} place={place} />
        </button>
        <button
          className="directions-action"
          onClick={() =>
            googleMapsProvider.openDirections({ destination: place, travelMode: "transit" })
          }
        >
          <Navigation />길찾기
        </button>
      </div>
      {editMode && (
        <button className="more-actions" onClick={onActions} aria-label={`${place.name} 수정`}>
          <CircleEllipsis />
        </button>
      )}
    </article>
  );
}

function PlaceIdentity({
  item,
  place,
  prominent = false,
}: {
  item: ScheduleItem;
  place: Place;
  prominent?: boolean;
}) {
  return (
    <div className={`place-identity ${prominent ? "prominent" : ""}`}>
      <h3>{place.name}</h3>
      <p>
        {place.category} · {place.address.split(",")[0]}
      </p>
      {prominent && <span>예상 체류 {item.duration}분</span>}
    </div>
  );
}

function RoutePreview({
  data,
  day,
  items,
}: {
  data: AppData;
  day: TripDay;
  items: ScheduleItem[];
}) {
  const places = items.map((item) => placeFor(data, item));
  const points = places.map((place) => ({ ...place.coordinates, name: place.name, id: place.id }));
  const segments = points.slice(0, -1).map((point, index) => {
    const next = points[index + 1];
    const deltaX = next.x - point.x;
    const deltaY = next.y - point.y;
    return {
      left: point.x,
      top: point.y,
      width: Math.hypot(deltaX, deltaY),
      angle: Math.atan2(deltaY, deltaX) * (180 / Math.PI),
    };
  });
  return (
    <section className="route-preview" aria-label="오늘의 이동 루트 미리보기">
      <div className="route-preview-copy">
        <span>오늘의 이동 루트</span>
        <strong>
          {places.length}곳 · 총 이동 약 {travelMinutes(data, day)}분
        </strong>
      </div>
      <div className="route-mini-map" aria-hidden="true">
        <span className="route-mini-road road-one" />
        <span className="route-mini-road road-two" />
        {segments.map((segment, index) => (
          <span
            className="route-mini-segment"
            key={`segment-${index}`}
            style={{
              left: `${segment.left}%`,
              top: `${segment.top}%`,
              width: `${segment.width}%`,
              transform: `rotate(${segment.angle}deg)`,
            }}
          />
        ))}
        {points.map((point, index) => (
          <span
            className="route-mini-pin"
            key={`${point.id}-${index}`}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
          >
            <i>{index + 1}</i>
            <small>{point.name}</small>
          </span>
        ))}
      </div>
    </section>
  );
}

function MapView({
  data,
  day,
  items,
  selectedItem,
  onSelectPlace,
}: {
  data: AppData;
  day: TripDay;
  items: ScheduleItem[];
  selectedItem: ScheduleItem | null;
  onSelectPlace: (id: string) => void;
}) {
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.id === selectedItem?.id),
  );
  const activeItem = items[selectedIndex] ?? items[0];
  const activePlace = activeItem ? placeFor(data, activeItem) : null;
  const [touchX, setTouchX] = useState<number | null>(null);
  const move = (direction: number) => {
    if (!items.length) return;
    const index = Math.min(items.length - 1, Math.max(0, selectedIndex + direction));
    onSelectPlace(placeFor(data, items[index]).id);
  };

  return (
    <section className="map-view">
      <div className="map-paper" />
      <div className="map-river river-a" />
      <div className="map-river river-b" />
      <div className="route-path" />
      <div className="current-location">
        <span />
        <small>내 위치</small>
      </div>
      <div className="map-topbar">
        <strong>DAY {day.day}</strong>
        <span>
          장소 {items.length}곳 · 총 이동 약 {travelMinutes(data, day)}분
        </span>
      </div>
      {items.map((item, index) => {
        const place = placeFor(data, item);
        const selected = activeItem?.id === item.id;
        const status = stopStatus(day, item, index, items);
        return (
          <button
            key={item.id}
            className={`numbered-marker marker-${status} ${selected ? "selected" : ""}`}
            style={{ left: `${place.coordinates.x}%`, top: `${place.coordinates.y}%` }}
            onClick={() => onSelectPlace(place.id)}
            aria-label={`${index + 1}. ${place.name}`}
            aria-pressed={selected}
          >
            <span>{status === "completed" ? <Check /> : index + 1}</span>
            {selected && <b>{place.name}</b>}
          </button>
        );
      })}
      {activeItem && activePlace && (
        <MapPlaceCard
          item={activeItem}
          place={activePlace}
          index={selectedIndex}
          total={items.length}
          onPrevious={() => move(-1)}
          onNext={() => move(1)}
          onDirections={() =>
            googleMapsProvider.openDirections({
              destination: activePlace,
              travelMode: "transit",
            })
          }
          onTouchStart={setTouchX}
          onTouchEnd={(x) => {
            if (touchX !== null && Math.abs(x - touchX) > 45) move(x < touchX ? 1 : -1);
            setTouchX(null);
          }}
        />
      )}
    </section>
  );
}

function MapPlaceCard({
  item,
  place,
  index,
  total,
  onPrevious,
  onNext,
  onDirections,
  onTouchStart,
  onTouchEnd,
}: {
  item: ScheduleItem;
  place: Place;
  index: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  onDirections: () => void;
  onTouchStart: (x: number) => void;
  onTouchEnd: (x: number) => void;
}) {
  return (
    <article
      className="map-place-card"
      onTouchStart={(event) => onTouchStart(event.touches[0].clientX)}
      onTouchEnd={(event) => onTouchEnd(event.changedTouches[0].clientX)}
    >
      <button
        className="card-arrow previous"
        onClick={onPrevious}
        disabled={index === 0}
        aria-label="이전 장소"
      >
        <ChevronLeft />
      </button>
      <div>
        <span>
          {index + 1} / {total}
        </span>
        <h2>{place.name}</h2>
        <p>
          {item.time} · {place.category}
        </p>
        <small>
          <LocateFixed />현재 위치에서 약 {18 + index * 4}분
        </small>
      </div>
      <button
        className="card-arrow next"
        onClick={onNext}
        disabled={index === total - 1}
        aria-label="다음 장소"
      >
        <ChevronRight />
      </button>
      <button className="card-directions" onClick={onDirections}>
        <Navigation />길찾기
      </button>
    </article>
  );
}

function SavedPlaces({
  data,
  trip,
  days,
  onAddPlace,
  onSchedule,
}: {
  data: AppData;
  trip: Trip;
  days: TripDay[];
  onAddPlace: () => void;
  onSchedule: (place: string, day: string) => void;
}) {
  const [tab, setTab] = useState<"saved" | "scheduled">("saved");
  const rows = data.savedPlaces.filter(
    (item) => item.tripId === trip.id && item.status === tab,
  );
  return (
    <div className="saved-view page-container">
      <PageHeading
        kicker="장소 모음"
        title="가고 싶은 곳"
        copy="날짜가 정해지면 일정에 바로 추가하세요."
        action={
          <button className="primary-cta compact" onClick={onAddPlace}>
            <Plus />장소 찾기
          </button>
        }
      />
      <div className="saved-tabs">
        <button className={tab === "saved" ? "active" : ""} onClick={() => setTab("saved")}>
          가고 싶은 곳
        </button>
        <button
          className={tab === "scheduled" ? "active" : ""}
          onClick={() => setTab("scheduled")}
        >
          일정에 추가됨
        </button>
      </div>
      <div className="saved-list">
        {rows.map((saved) => {
          const place = data.places.find((item) => item.id === saved.placeId)!;
          return (
            <article key={saved.id} className="saved-place-item">
              <div className="saved-place-pin">
                <MapPin />
              </div>
              <div>
                <span>{place.category}</span>
                <h2>{place.name}</h2>
                <p>{place.address}</p>
              </div>
              {tab === "saved" ? (
                <select
                  defaultValue=""
                  aria-label={`${place.name} 일정에 추가`}
                  onChange={(event) => event.target.value && onSchedule(place.id, event.target.value)}
                >
                  <option value="">DAY에 추가</option>
                  {days.map((day) => (
                    <option key={day.id} value={day.id}>
                      DAY {day.day}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="scheduled-copy">일정에 추가됨</span>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function TripsView({
  trips,
  onOpen,
  onEdit,
  onCreate,
}: {
  trips: Trip[];
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="trips-view page-container">
      <PageHeading
        kicker="여행 목록"
        title="내 여행"
        copy="계획 중인 여행을 이어서 준비하세요."
        action={
          <button className="primary-cta compact" onClick={onCreate}>
            <Plus />새 여행
          </button>
        }
      />
      <div className="trip-list">
        {trips.map((trip) => (
          <article key={trip.id} className="trip-list-item">
            <button className="trip-open-action" onClick={() => onOpen(trip.id)}>
              <div>
                <span>
                  {trip.country} · {trip.city}
                </span>
                <h2>{trip.name}</h2>
                <p>
                  {formatMonthDay(trip.startDate)} - {formatMonthDay(trip.endDate)}
                </p>
              </div>
              <strong>
                {daysUntil(trip.startDate) > 0
                  ? `출발까지 ${daysUntil(trip.startDate)}일`
                  : "여행 중"}
              </strong>
              <ArrowRight />
            </button>
            <button
              className="trip-edit-action"
              onClick={() => onEdit(trip.id)}
              aria-label={`${trip.name} 수정`}
            >
              <Pencil />
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

function PageHeading({
  kicker,
  title,
  copy,
  action,
}: {
  kicker: string;
  title: string;
  copy: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <p>{kicker}</p>
        <h1>{title}</h1>
        <span>{copy}</span>
      </div>
      {action}
    </header>
  );
}

function TravelInfo({ data, trip }: { data: AppData; trip: Trip }) {
  const flights = data.flights.filter((item) => item.tripId === trip.id);
  const stay = data.accommodations.find((item) => item.tripId === trip.id);
  const expenses = data.expenses.filter((item) => item.tripId === trip.id);
  return (
    <div className="info-view page-container">
      <PageHeading
        kicker="여행 세부 정보"
        title="여행 정보"
        copy="이동 중 필요한 정보만 모았어요."
      />
      <section className="info-block">
        <div className="info-label">
          <Plane />항공
        </div>
        {flights.map((flight) => (
          <div className="info-row" key={flight.id}>
            <strong>{flight.route}</strong>
            <span>{flight.number}</span>
            <p>
              {flight.departure} — {flight.arrival}
            </p>
          </div>
        ))}
      </section>
      <section className="info-block">
        <div className="info-label">
          <Hotel />숙소
        </div>
        <div className="info-row">
          <strong>{stay?.name ?? "숙소 미정"}</strong>
          <p>{stay?.address}</p>
        </div>
      </section>
      <section className="info-block">
        <div className="info-label">
          <ReceiptText />예상 비용
        </div>
        {expenses.map((expense) => (
          <div className="expense-row" key={expense.id}>
            <span>{expense.category}</span>
            <strong>{expense.amount.toLocaleString()}원</strong>
          </div>
        ))}
      </section>
    </div>
  );
}

function EmptyDay({ day, onAdd }: { day: number; onAdd: () => void }) {
  return (
    <div className="empty-day">
      <span>
        <Compass />
      </span>
      <h2>아직 DAY {day} 일정이 없어요</h2>
      <p>
        가고 싶은 장소를 추가해서
        <br />이날의 여행을 만들어보세요.
      </p>
      <button className="primary-cta compact" onClick={onAdd}>
        <Plus />장소 추가
      </button>
    </div>
  );
}

function Sheet({
  children,
  onClose,
  className = "",
}: {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}) {
  return (
    <div
      className="sheet-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className={`bottom-sheet ${className}`} role="dialog" aria-modal="true">
        <div className="sheet-handle" />
        <button className="sheet-close" onClick={onClose} aria-label="닫기">
          <X />
        </button>
        {children}
      </section>
    </div>
  );
}

function PlaceSearch({
  places,
  onClose,
  onSave,
  onAdd,
}: {
  places: Place[];
  onClose: () => void;
  onSave: (id: string) => void;
  onAdd: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(
    () =>
      places.filter((place) =>
        `${place.name} ${place.category} ${place.address}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [places, query],
  );
  return (
    <Sheet onClose={onClose} className="search-sheet">
      <header>
        <p>장소 추가</p>
        <h2>어디에 가고 싶나요?</h2>
      </header>
      <label className="search-input">
        <Search />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="장소나 지역 검색"
        />
      </label>
      <div className="search-list">
        {results.slice(0, 7).map((place) => (
          <article key={place.id}>
            <span>
              <MapPin />
            </span>
            <div>
              <small>{place.category}</small>
              <h3>{place.name}</h3>
              <p>{place.address}</p>
            </div>
            <button
              className="bookmark-action"
              onClick={() => onSave(place.id)}
              aria-label={`${place.name} 가고 싶은 곳에 저장`}
            >
              <Bookmark />
            </button>
            <button className="add-search-result" onClick={() => onAdd(place.id)}>
              일정에 추가
            </button>
          </article>
        ))}
      </div>
    </Sheet>
  );
}

function ContextBottomSheet({
  item,
  place,
  days,
  onClose,
  onUpdate,
  onMove,
  onDelete,
}: {
  item: ScheduleItem;
  place: Place;
  days: TripDay[];
  onClose: () => void;
  onUpdate: (id: string, patch: { time?: string; duration?: number; note?: string }) => void;
  onMove: (id: string) => void;
  onDelete: () => void;
}) {
  const [time, setTime] = useState(item.time);
  const [duration, setDuration] = useState(item.duration);
  const [note, setNote] = useState(item.note);
  return (
    <Sheet onClose={onClose} className="action-sheet">
      <header>
        <span>{place.category}</span>
        <h2>{place.name}</h2>
        <p>필요한 내용만 수정할 수 있어요.</p>
      </header>
      <div className="compact-edit-grid">
        <label>
          시간
          <input value={time} onChange={(event) => setTime(event.target.value)} />
        </label>
        <label>
          머무는 시간
          <div>
            <input
              type="number"
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
            />
            <span>분</span>
          </div>
        </label>
      </div>
      <label className="note-field">
        메모
        <textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <button
        className="save-inline"
        onClick={() => {
          onUpdate(item.id, { time, duration, note });
          onClose();
        }}
      >
        <Check />변경사항 저장
      </button>
      <div className="secondary-actions">
        <label>
          <CalendarDays />다른 날짜로 이동
          <select value="" onChange={(event) => event.target.value && onMove(event.target.value)}>
            <option value="">날짜 선택</option>
            {days
              .filter((day) => day.id !== item.tripDayId)
              .map((day) => (
                <option key={day.id} value={day.id}>
                  DAY {day.day}
                </option>
              ))}
          </select>
        </label>
        <button className="delete-action" onClick={onDelete}>
          <Trash2 />일정에서 삭제
        </button>
      </div>
    </Sheet>
  );
}

function CreateTripSheet({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (trip: Omit<Trip, "id">) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    country: "",
    city: "",
    startDate: "",
    endDate: "",
  });
  const valid = Object.values(form).every(Boolean);
  return (
    <Sheet onClose={onClose} className="create-sheet">
      <header>
        <p>새 여행</p>
        <h2>새 여행 만들기</h2>
        <span>필수 정보만 먼저 입력하세요.</span>
      </header>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) onCreate(form);
        }}
      >
        <label>
          여행 이름
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="상하이 3박 4일"
          />
        </label>
        <div>
          <label>
            국가
            <input
              value={form.country}
              onChange={(event) => setForm({ ...form, country: event.target.value })}
            />
          </label>
          <label>
            도시
            <input
              value={form.city}
              onChange={(event) => setForm({ ...form, city: event.target.value })}
            />
          </label>
        </div>
        <div>
          <label>
            시작일
            <input
              type="date"
              value={form.startDate}
              onChange={(event) => setForm({ ...form, startDate: event.target.value })}
            />
          </label>
          <label>
            종료일
            <input
              type="date"
              min={form.startDate}
              value={form.endDate}
              onChange={(event) => setForm({ ...form, endDate: event.target.value })}
            />
          </label>
        </div>
        <button className="primary-cta" disabled={!valid}>
          여행 만들기
        </button>
      </form>
    </Sheet>
  );
}

function EditTripSheet({
  trip,
  onClose,
  onSave,
}: {
  trip: Trip;
  onClose: () => void;
  onSave: (patch: Partial<Omit<Trip, "id">>) => void;
}) {
  const [form, setForm] = useState({
    name: trip.name,
    country: trip.country,
    city: trip.city,
    startDate: trip.startDate,
    endDate: trip.endDate,
    flight: trip.flight ?? "",
    accommodation: trip.accommodation ?? "",
  });
  const valid = [form.name, form.country, form.city, form.startDate, form.endDate].every(Boolean);
  return (
    <Sheet onClose={onClose} className="create-sheet edit-trip-sheet">
      <header>
        <p>여행 정보 수정</p>
        <h2>{trip.name}</h2>
        <span>목록과 여행 홈에 바로 반영돼요.</span>
      </header>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) onSave(form);
        }}
      >
        <label>
          여행 이름
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <div>
          <label>
            국가
            <input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
          </label>
          <label>
            도시
            <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
          </label>
        </div>
        <div>
          <label>
            시작일
            <input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
          </label>
          <label>
            종료일
            <input type="date" min={form.startDate} value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
          </label>
        </div>
        <label>
          항공
          <input value={form.flight} onChange={(event) => setForm({ ...form, flight: event.target.value })} placeholder="항공편 또는 출발·도착 정보" />
        </label>
        <label>
          숙소
          <input value={form.accommodation} onChange={(event) => setForm({ ...form, accommodation: event.target.value })} placeholder="숙소 이름" />
        </label>
        <button className="primary-cta" disabled={!valid}>
          변경사항 저장
        </button>
      </form>
    </Sheet>
  );
}
