import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

type WeatherHour = {
  datetime: string
  temp: number,
  humidity: number,
  conditions: string,
  precipprob: number
}

type WeatherDay = {
  hours: WeatherHour[]
}

type WeatherResponse = {
  resolvedAddress: string
  days: WeatherDay[]
}

type WeatherChartProps = {
  weatherData: WeatherResponse | null,
  selectedDate: Date | null
  title?: string
  emptyMessage?: string
}

//creating summary based on window of hours areound selected time
function textForChartHours(hours: WeatherHour[]): string | null {
  if (hours.length === 0) return null
  //get all temps from weather by hour
  const temps = hours.map((h) => h.temp)
  const minT = Math.round(Math.min(...temps)) //get low
  const maxT = Math.round(Math.max(...temps)) //get high
  const maxP = Math.round(Math.max(...hours.map((h) => h.precipprob))) //precipitation
  const sky = [...new Set(hours.map((h) => h.conditions.trim()))].join(', ') //set will remove duplicates, and create single string for all sky conditions

  const temp =
    minT >= 60 ? `Likely warm enough to be outside ${minT}°F-${maxT}` : minT >= 40 ? `Chilly, but not unreasonable to be outside ${minT}°F–${maxT}°F` : 'Probably too cold!'
  const rain =
    maxP >= 40 ? `Rain is quite possible (up to ${maxP}%).`
      : maxP >= 15 ? `Some rain is possible (up to ${maxP}%).`
      : 'Rain looks unlikely.'

  return `${temp} ${rain}${sky ? ` Sky: ${sky}.` : ''}`
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
)

function formatHourLabel(time: string) {
  const [hours, minutes] = time.split(':')
  const numericHour = Number(hours)
  const suffix = numericHour >= 12 ? 'PM' : 'AM'
  const displayHour = numericHour % 12 || 12

  return `${displayHour}:${minutes} ${suffix}`
}

export default function WeatherChart({
  weatherData,
  selectedDate,
  title,
  
}: WeatherChartProps) {
  const hourlyWeather = weatherData?.days[0]?.hours ?? [];
  const selectedHour = selectedDate?.getHours() ?? 12
  const window = hourlyWeather.filter((hour) => {
    const hourNumber = Number(hour.datetime.split(':')[0])
    return hourNumber >= selectedHour - 3 && hourNumber <= selectedHour + 3
  })

  if (hourlyWeather.length === 0) {
    return (
      <div className="h-full w-full rounded-xl bg-white/50 backdrop-blur-sm p-8 shadow-lg border border-white/20 dark:bg-gray-900/50 dark:border-gray-700/50">
        {title ? <h2 className="mb-4 text-left text-xl font-semibold text-gray-800 dark:text-gray-200">{title}</h2> : null}
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <p>No weather data available</p>
        </div>
      </div>
    )
  }

  const summary = textForChartHours(window)

  const data = {
    labels: window.map((hour) => formatHourLabel(hour.datetime)),
    datasets: [
      {
        label: 'Temperature (°F)',
        data: window.map((hour) => hour.temp),
        borderColor: 'rgb(99, 102, 241)', // Modern indigo
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Humidity (%)',
        data: window.map((hour) => hour.humidity),
        borderColor: 'rgb(16, 185, 129)', // Modern emerald
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Precipitation (%)',
        data: window.map((hour) => hour.precipprob),
        borderColor: 'rgb(245, 101, 101)', // Modern red
        backgroundColor: 'rgba(245, 101, 101, 0.08)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(245, 101, 101)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: '600',
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          padding: 10,
          font: {
            size: 11,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          padding: 10,
          font: {
            size: 11,
          },
        },
      },
    },
    elements: {
      point: {
        hoverBorderWidth: 3,
      },
    },
  }

  return (
    <div className="h-full w-full rounded-xl bg-white/50 backdrop-blur-sm p-8 shadow-lg border border-white/20 dark:bg-gray-900/50 dark:border-gray-700/50">
      <div className="h-80">
        <Line options={options} data={data} />
      </div>
      {summary ? (
        <div className="mt-6 rounded-lg bg-gray-50/80 p-4 dark:bg-gray-800/50">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {summary}
          </p>
        </div>
      ) : null}
    </div>
  )
}
