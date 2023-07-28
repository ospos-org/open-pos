import interactionPlugin from "@fullcalendar/interaction"
import timeGridPlugin from "@fullcalendar/timegrid"
import { EventInput } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid"
import FullCalendar from "@fullcalendar/react"

let eventGuid = 0;
const TODAY_STR = new Date().toISOString().replace(/T.*$/, ''); // YYYY-MM-DD of today

export function createEventId() {
    return String(eventGuid++);
}

export const INITIAL_EVENTS: EventInput[] = [
    {
      id: createEventId(),
      title: 'All-day event',
      start: TODAY_STR
    },
    {
      id: createEventId(),
      title: 'Timed event',
      start: TODAY_STR + 'T00:00:00',
      end: TODAY_STR + 'T03:00:00'
    },
    {
      id: createEventId(),
      title: 'Timed event',
      start: TODAY_STR + 'T12:00:00',
      end: TODAY_STR + 'T15:00:00'
    }
  ];

export default function Job() {
    return (
        <>
            <div className="flex flex-col gap-4 md:p-4 p-12 w-full">
                <FullCalendar
                    plugins={[ dayGridPlugin, interactionPlugin, timeGridPlugin ]}
                    initialView='dayGridMonth'
                    editable={true}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    height="100%"
                    initialEvents={INITIAL_EVENTS}
                />
            </div>

            <div>
                {/* Order Information */}
            </div>
        </>
    )
}