import { useState } from 'react'
import scheduleData from './data/scheduleLeagueV2.filtered.json'

type GameSelectorProps = {
  onSelectGame: (date: Date, label: string) => void
}
type Team = {

  teamName: string | null
  teamTricode: string | null
}

type ScheduleGame = {
  gameId: string
  gameStatus: number
  gameDateTimeEst: string
  gameStatusText: string
  homeTeam?: Team
  awayTeam?: Team
}

type Game = {
  id: string
  tipoff: string
  tipoffLabel: string
  label: string
  gameStatusText: string
}

type ScheduleData = {
  leagueSchedule: {
    gameDates: {
      games: ScheduleGame[]
    }[]
  }
}
function formatGameDate(dateTime: string) {
  return new Date(dateTime).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

const typedSchedule = scheduleData as ScheduleData
const upcomingGames = typedSchedule.leagueSchedule.gameDates
      .flatMap((gameDate) => gameDate.games)
      .filter(
        (game) =>
          game.gameStatus === 1 &&
          game.gameStatusText !== 'TBD' &&
          game.homeTeam?.teamName &&
          game.awayTeam?.teamName &&
          game.homeTeam?.teamTricode &&
          game.awayTeam?.teamTricode,
      )
      .map((game) => ({
        id: game.gameId,
        tipoff: game.gameDateTimeEst,
        tipoffLabel: formatGameDate(game.gameDateTimeEst),
        label: `${game.awayTeam!.teamTricode} @ ${game.homeTeam!.teamTricode}`,
        gameStatusText: game.gameStatusText,
      }))

export default function GameSelector({onSelectGame}: GameSelectorProps) {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)


  function handleSelectGame(game: Game) {
    setSelectedGameId(game.id)
    onSelectGame(new Date(game.tipoff), game.label)
  }

  return (
    <div className="mx-auto w-full max-w-4xl rounded-xl bg-white/50 backdrop-blur-sm dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 p-8 mt-6 shadow-lg">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="text-left">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Pick a game
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Scroll to browse the playoff slate.
          </p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {upcomingGames.map((game) => (
          <button
            key={game.id}
            className={` flex-shrink-0 rounded-xl border p-4 text-left transition sm:min-w-[18rem] shadow-sm ${
              selectedGameId === game.id
                ? 'border-indigo-500 bg-indigo-50/80 dark:border-indigo-400 dark:bg-indigo-950/30 shadow-md'
                : 'border-gray-200/50 hover:border-gray-300/50 dark:border-gray-700/50 dark:hover:border-gray-500/50 bg-white/30 dark:bg-gray-800/30'
            }`}
            onClick={() => handleSelectGame(game)}
            type='button'
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">{game.tipoffLabel}</p>
            <p className="mt-1 font-semibold text-gray-900 dark:text-white">
              {game.label}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {game.gameStatusText}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
