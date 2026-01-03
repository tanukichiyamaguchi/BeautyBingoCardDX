import { useState, useCallback, useEffect } from 'react'
import confetti from 'canvas-confetti'
import './App.css'

// ビンゴマスの定義
interface BingoCell {
  id: number
  title: string
  description: string
  completed: boolean
}

// 特典の定義
interface Prize {
  title: string
  description: string
  level: number
}

// 初期ビンゴマスデータ
const initialCells: BingoCell[] = [
  { id: 1, title: 'Instagram', description: 'フォロー', completed: false },
  { id: 2, title: 'LINE', description: 'トーク送信', completed: false },
  { id: 3, title: 'Google', description: 'クチコミ', completed: false },
  { id: 4, title: 'Story', description: 'メンション', completed: false },
  { id: 5, title: 'FREE', description: '来店', completed: true },
  { id: 6, title: 'Friend', description: '紹介', completed: false },
  { id: 7, title: 'Like', description: '5回', completed: false },
  { id: 8, title: 'TikTok', description: 'フォロー', completed: false },
  { id: 9, title: 'Survey', description: '回答', completed: false },
]

// ビンゴライン（縦・横・斜め）
const bingoLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

// 特典設定
const prizes: { [key: number]: Prize } = {
  1: {
    title: '1 BINGO',
    description: '次回施術 500円OFF',
    level: 1,
  },
  2: {
    title: '2 BINGO',
    description: '眉スタイリング無料 または まつ毛トリートメント無料',
    level: 2,
  },
  3: {
    title: 'PERFECT',
    description: '次回施術 1,000円OFF + オリジナルノベルティ',
    level: 3,
  },
}

function App() {
  const [cells, setCells] = useState<BingoCell[]>(initialCells)
  const [completedLines, setCompletedLines] = useState<number[][]>([])
  const [showModal, setShowModal] = useState(false)
  const [currentPrize, setCurrentPrize] = useState<Prize | null>(null)
  const [previousBingoCount, setPreviousBingoCount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [newlyCompletedCellId, setNewlyCompletedCellId] = useState<number | null>(null)

  const countBingos = useCallback((cellsToCheck: BingoCell[]) => {
    let count = 0
    const completed: number[][] = []
    bingoLines.forEach((line) => {
      if (line.every((index) => cellsToCheck[index].completed)) {
        count++
        completed.push(line)
      }
    })
    return { count, completed }
  }, [])

  const fireConfetti = useCallback(() => {
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 }

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#D4AF37', '#FFD700', '#FFFFFF', '#FFF8E7', '#E8D5B7'],
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#D4AF37', '#FFD700', '#FFFFFF', '#FFF8E7', '#E8D5B7'],
      })
    }, 250)
  }, [])

  const firePerfectConfetti = useCallback(() => {
    const count = 200
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 10000,
    }

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
        colors: ['#D4AF37', '#FFD700', '#FFFFFF', '#FFF8E7', '#E8D5B7'],
      })
    }

    fire(0.25, { spread: 26, startVelocity: 55 })
    fire(0.2, { spread: 60 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
    fire(0.1, { spread: 120, startVelocity: 45 })

    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 180,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#FFD700', '#FFFFFF'],
        zIndex: 10000,
      })
    }, 500)

    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#D4AF37', '#FFD700', '#FFFFFF', '#FFF8E7'],
        zIndex: 10000,
      })
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#D4AF37', '#FFD700', '#FFFFFF', '#FFF8E7'],
        zIndex: 10000,
      })
    }, 1000)
  }, [])

  const handleCellClick = (id: number) => {
    if (isAnimating) return

    const cellIndex = cells.findIndex((c) => c.id === id)
    if (cellIndex === -1 || cells[cellIndex].completed) return

    setIsAnimating(true)
    setNewlyCompletedCellId(id)

    setTimeout(() => {
      const newCells = cells.map((cell) =>
        cell.id === id ? { ...cell, completed: true } : cell
      )
      setCells(newCells)
      setNewlyCompletedCellId(null)

      const { count: newCount, completed } = countBingos(newCells)
      setCompletedLines(completed)

      if (newCount > previousBingoCount) {
        const allCompleted = newCells.every((cell) => cell.completed)
        if (allCompleted) {
          setCurrentPrize(prizes[3])
          firePerfectConfetti()
        } else {
          setCurrentPrize(prizes[Math.min(newCount, 2)])
          fireConfetti()
        }
        setShowModal(true)
        setPreviousBingoCount(newCount)
      }

      setIsAnimating(false)
    }, 600)
  }

  useEffect(() => {
    const { count, completed } = countBingos(cells)
    setCompletedLines(completed)
    setPreviousBingoCount(count)
  }, [])

  const isCellInCompletedLine = (index: number) => {
    return completedLines.some((line) => line.includes(index))
  }

  const handleReset = () => {
    setCells(initialCells)
    setCompletedLines([])
    setPreviousBingoCount(0)
    setShowModal(false)
  }

  return (
    <div className="app">
      <div className="background-pattern"></div>

      <header className="header">
        <div className="header-line"></div>
        <h1 className="title">
          <span className="title-main">Beauty Bingo Card</span>
          <span className="title-dx">DX</span>
        </h1>
        <p className="subtitle">PREMIUM REWARD PROGRAM</p>
        <div className="header-line"></div>
      </header>

      <main className="main">
        <div className="bingo-card">
          <div className="card-frame">
            <div className="bingo-grid">
              {cells.map((cell, index) => (
                <button
                  key={cell.id}
                  className={`bingo-cell ${cell.completed ? 'completed' : ''} ${
                    isCellInCompletedLine(index) ? 'in-bingo-line' : ''
                  } ${newlyCompletedCellId === cell.id ? 'animating' : ''} ${
                    cell.id === 5 ? 'free-cell' : ''
                  }`}
                  onClick={() => handleCellClick(cell.id)}
                  disabled={cell.completed || isAnimating}
                >
                  <div className="cell-inner">
                    <div className="cell-content">
                      <span className="cell-title">{cell.title}</span>
                      <span className="cell-divider"></span>
                      <span className="cell-description">{cell.description}</span>
                    </div>
                    {cell.completed && (
                      <div className="completed-stamp">
                        <span className="stamp-text">CLEAR</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="status-section">
          <div className="status-item">
            <span className="status-label">PROGRESS</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${(cells.filter((c) => c.completed).length / 9) * 100}%`,
                }}
              ></div>
            </div>
            <span className="status-value">
              {cells.filter((c) => c.completed).length} / 9
            </span>
          </div>
          <div className="status-item bingo-status">
            <span className="status-label">BINGO</span>
            <span className="bingo-count">{completedLines.length}</span>
            <span className="status-unit">LINE</span>
          </div>
        </div>

        <section className="rewards-section">
          <h2 className="rewards-title">
            <span className="rewards-line"></span>
            <span>REWARDS</span>
            <span className="rewards-line"></span>
          </h2>
          <div className="rewards-list">
            <div className={`reward-item ${completedLines.length >= 1 ? 'achieved' : ''}`}>
              <div className="reward-level">1 BINGO</div>
              <div className="reward-text">次回施術 500円OFF</div>
            </div>
            <div className={`reward-item ${completedLines.length >= 2 ? 'achieved' : ''}`}>
              <div className="reward-level">2 BINGO</div>
              <div className="reward-text">眉スタイリング無料 or まつ毛トリートメント無料</div>
            </div>
            <div className={`reward-item perfect ${cells.every((c) => c.completed) ? 'achieved' : ''}`}>
              <div className="reward-level">PERFECT</div>
              <div className="reward-text">1,000円OFF + 限定ノベルティ</div>
            </div>
          </div>
        </section>

        <button className="reset-button" onClick={handleReset}>
          RESET
        </button>
      </main>

      {showModal && currentPrize && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-line"></span>
              <span className="modal-congrats">CONGRATULATIONS</span>
              <span className="modal-line"></span>
            </div>
            <div className="modal-content">
              <h2 className="modal-title">{currentPrize.title}</h2>
              <div className="modal-prize-box">
                <p className="modal-description">{currentPrize.description}</p>
              </div>
              <p className="modal-note">
                スタッフにこの画面をお見せください
              </p>
              <button className="modal-button" onClick={() => setShowModal(false)}>
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
