import { useState } from 'react'

type DateProps = {
  dateHandler: (date: Date) => void
}

const weekdays = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]



//need to convert weekday and time to date for date handler
export function getNextScheduledDate(day: string, time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  const now = new Date()
  const target = new Date()
  const targetDay = weekdays.indexOf(day)
  let daysAhead = targetDay - now.getDay()
  if (daysAhead < 0) daysAhead += 7

  target.setDate(now.getDate() + daysAhead)
  target.setHours(hours, minutes, 0, 0)

  if (target <= now) {
    target.setDate(target.getDate() + 7)
  }

  return target
}


export default function SchedulePicker({ dateHandler }: DateProps) {
  const [selectedWeekday, setSelectedWeekday] = useState('Friday')
  const [selectedTime, setSelectedTime] = useState('14:30')

  return (
    <div className="flex items-center gap-2">
      <span className="font-medium dark:text-white whitespace-nowrap">Every</span>
      <select
        value={selectedWeekday}
        onChange={(e) => {
          setSelectedWeekday(e.target.value)
          dateHandler(getNextScheduledDate(e.target.value, selectedTime))
        }}
        className="px-3 py-2 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
      >
        {weekdays.map((weekday) => (
          <option key={weekday} value={weekday}>
            {weekday}
          </option>
        ))}
      </select>
      <span className="font-medium dark:text-white whitespace-nowrap">at</span>
      <input
        type="time"
        step={900}
        value={selectedTime}
        onChange={(e) => {
          setSelectedTime(e.target.value)
          dateHandler(getNextScheduledDate(selectedWeekday, e.target.value))
        }}
        className="px-3 py-2 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
      />
    </div>
  )
}
