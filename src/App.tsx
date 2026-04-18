import { useEffect, useState } from 'react'
import Location from './Location'
import SchedulePicker from './SchedulePicker'
import WeatherChart from './WeatherChart'
import GameSelector from './GameSelector'

type WeatherHour = {
  datetime: string
  temp: number
  humidity: number
  conditions: string
  precipprob: number
}

type WeatherDay = {
  datetime: string
  hours: WeatherHour[]
}

type WeatherResponse = {
  resolvedAddress: string
  days: WeatherDay[]
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function formatForVisualCrossing(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}:00`
}

function formatChartDate(date: Date | null) {
  if (!date) {
    return ''
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function App() {
  const apiKey = import.meta.env.VITE_VISUAL_CROSSING_API_KEY
  const [location, setLocation] = useState('New York, NY')
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [nextWeekDate, setNextWeekDate] = useState<Date | null>(() =>
    addDays(new Date(), 7),
  )
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null)
  const [nextWeekWeatherData, setNextWeekWeatherData] = useState<WeatherResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [gameMode, setGameMode] = useState<boolean>(false)
  const [selectedGameLabel, setSelectedGameLabel] = useState('')

  const locationHandler = (nextLocation: string) => {
    setLocation(nextLocation)
  }

  const dateHandler = (newDate: Date) => {
    setSelectedDate(newDate)
    setNextWeekDate(addDays(newDate, 7))
  }

  const gameDateHandler = (newDate: Date, gameLabel: string) => {
    setSelectedGameLabel(gameLabel)
    dateHandler(newDate)
  }

  useEffect(() => {
    if (!selectedDate) {
      return
    }

    const currentSelectedDate = selectedDate

    async function fetchWeather() {
      const formattedDate = formatForVisualCrossing(currentSelectedDate)
      const url =
        'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/' +
        `${encodeURIComponent(location)}/${formattedDate}` +
        `?unitGroup=us&include=current,hours&key=${apiKey}&contentType=json`

      try {
        setErrorMessage('')
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`Weather request failed: ${response.status}`)
        }

        const data: WeatherResponse = await response.json()

        setWeatherData(data)

        if (!gameMode && nextWeekDate) {
          const currentNextWeekDate = nextWeekDate
          const formattedNextWeekDate = formatForVisualCrossing(currentNextWeekDate)
          const nextWeekUrl =
            'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/' +
            `${encodeURIComponent(location)}/${formattedNextWeekDate}` +
            `?unitGroup=us&include=current,hours&key=${apiKey}&contentType=json`

          const nextWeekResponse = await fetch(nextWeekUrl)

          if (!nextWeekResponse.ok) {
            throw new Error(`Next week weather request failed: ${nextWeekResponse.status}`)
          }

          const nextWeekData: WeatherResponse = await nextWeekResponse.json()
          setNextWeekWeatherData(nextWeekData)
        } else {
          setNextWeekWeatherData(null)
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error)
        setWeatherData(null)
        setNextWeekWeatherData(null)
        setErrorMessage('Unable to load weather data right now.')
      }
    }

    fetchWeather()
  }, [apiKey, gameMode, location, selectedDate, nextWeekDate])

  const currentChartTitle = gameMode
    ? selectedGameLabel
      ? `${selectedGameLabel} • ${formatChartDate(selectedDate)}`
      : 'Select a playoff game to load the forecast'
    : selectedDate
      ? `This Event • ${formatChartDate(selectedDate)}`
      : 'Pick an event time to load the forecast'

  const nextChartTitle = nextWeekDate
    ? `Next Event • ${formatChartDate(nextWeekDate)}`
    : 'Next Event Forecast'

  const getWeatherAtHour = (data: WeatherResponse, hour: number): WeatherHour | undefined => {
    const day = data.days[0]
    return day.hours.find(h => parseInt(h.datetime.split(':')[0], 10) === hour)
  }

  const scoreWeather = (weather: WeatherHour): number => {
    let score = 0

    const temp = weather.temp
    if (temp < 60) score += Math.abs(60 - temp) * 0.5
    else if (temp > 75) score += (temp - 75) * 0.3

    score += weather.precipprob * 0.5

    const badConditions = ['rain', 'snow', 'storm', 'overcast']
    if (badConditions.some(condition =>
      weather.conditions.toLowerCase().includes(condition)
    )) {
      score += 20
    }

    return score
  }

  const getWeatherVerdict = () => {
    if (!weatherData || !nextWeekWeatherData || !selectedDate) {
      return null
    }

    const selectedHour = selectedDate.getHours()
    const currentWeather = getWeatherAtHour(weatherData, selectedHour)
    const nextWeekWeather = getWeatherAtHour(nextWeekWeatherData, selectedHour)

    if (!currentWeather || !nextWeekWeather) {
      return null
    }

    const currentScore = scoreWeather(currentWeather)
    const nextWeekScore = scoreWeather(nextWeekWeather)

    const currentDateStr = formatChartDate(selectedDate)
    const nextDateStr = formatChartDate(nextWeekDate)

    if (currentScore < nextWeekScore) {
      return {
        recommendation: currentDateStr,
        reason: `Better weather this week (${Math.round(currentWeather.temp)}°F, ${currentWeather.precipprob}% rain) vs next week (${Math.round(nextWeekWeather.temp)}°F, ${nextWeekWeather.precipprob}% rain)`
      }
    } else if (nextWeekScore < currentScore) {
      return {
        recommendation: nextDateStr,
        reason: `Better weather next week (${Math.round(nextWeekWeather.temp)}°F, ${nextWeekWeather.precipprob}% rain) vs this week (${Math.round(currentWeather.temp)}°F, ${currentWeather.precipprob}% rain)`
      }
    } else {
      return {
        recommendation: 'Either week',
        reason: `Similar weather conditions for both weeks`
      }
    }
  }

  const getGameVerdict = () => {
    if (!weatherData || !selectedDate) {
      return null
    }

    const selectedHour = selectedDate.getHours()
    const currentWeather = getWeatherAtHour(weatherData, selectedHour)

    if (!currentWeather) {
      return null
    }

    const score = scoreWeather(currentWeather)
    const temp = Math.round(currentWeather.temp)
    const precip = currentWeather.precipprob

    if (score < 10) {
      return {
        assessment: 'Great weather! Definitely a safe bet to put your TV outside.',
        details: `${temp}°F with ${precip}% chance of rain`
      }
    } else if (score < 30) {
      return {
        assessment: 'Decent weather. Maybe use your backup TV outside.',
        details: `${temp}°F with ${precip}% chance of rain`
      }
    } else {
      return {
        assessment: 'Poor weather - not the best day to have a watch party outside.',
        details: `${temp}°F with ${precip}% chance of rain - consider indoor viewing`
      }
    }
  }

  const verdict = getWeatherVerdict()

  const gameVerdict = getGameVerdict()
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/20 px-8 py-10">
      <h1 className="text-center text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent dark:from-indigo-400 dark:to-indigo-600 md:text-5xl">
        Planner
      </h1>
      <div className="mt-8 w-full max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-8 justify-center">
          <div className="w-full md:w-auto">
            <Location locationHandler={locationHandler} value={location} />
          </div>
          <div className="w-full md:w-auto">
            {gameMode ? null : <SchedulePicker dateHandler={dateHandler} />}
          </div>
        </div>
        {gameMode ? <GameSelector onSelectGame={gameDateHandler}/> : null} 
      </div>

      <div className="mt-8 w-full max-w-6xl space-y-6 mx-auto">
        {errorMessage ? (
          <p className="text-center text-sm text-red-600 bg-red-50/80 dark:bg-red-950/30 rounded-lg p-4 border border-red-200/50 dark:border-red-800/50">{errorMessage}</p>
        ) : (
          <>
            {((!gameMode && verdict) || (gameMode && gameVerdict)) && (
              <div className="mx-auto max-w-2xl rounded-xl bg-emerald-50/80 backdrop-blur-sm p-6 shadow-lg border border-emerald-200/50 dark:bg-emerald-950/30 dark:border-emerald-800/50">
                {gameMode ? (
                  <>
                    <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                      {gameVerdict!.assessment}
                    </h3>
                    <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
                      {gameVerdict!.details}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                      Recommendation: {verdict!.recommendation}
                    </h3>
                    <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
                      {verdict!.reason}
                    </p>
                  </>
                )}
              </div>
            )}
            <div className={gameMode ? 'mx-auto max-w-4xl px-4' : 'grid gap-6 overflow-hidden pb-2 md:grid-cols-2 md:gap-6'}>
              <div className="w-full">
                <WeatherChart
                  weatherData={weatherData}
                  selectedDate={selectedDate}
                  title={currentChartTitle}
                />
              </div>
              {!gameMode ? (
                <div className="w-full">
                  <WeatherChart
                    weatherData={nextWeekWeatherData}
                    selectedDate={nextWeekDate}
                    title={nextChartTitle}
                  />
                </div>
              ) : null}
            </div>
          </>
        )}
        <div className="mx-auto w-full max-w-md">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setGameMode(!gameMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                gameMode ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  gameMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              Playoff Mode
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
