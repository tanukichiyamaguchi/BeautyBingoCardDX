import { useState, useCallback, useEffect } from 'react'
import confetti from 'canvas-confetti'
import './App.css'

interface BingoCell {
  id: number
  title: string
  description: string
  completed: boolean
}

interface Prize {
  title: string
  description: string
  level: number
}

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

const bingoLines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

const prizes: { [key: number]: Prize } = {
  1: { title: '1 BINGO', description: '次回施術 500円OFF', level: 1 },
  2: { title: '2 BINGO', description: '眉スタイリング無料 または まつ毛トリートメント無料', level: 2 },
  3: { title: 'PERFECT', description: '次回施術 1,000円OFF + オリジナルノベルティ', level: 3 },
}

function App() {
  const [showIntro, setShowIntro] = useState(true)
  const [introStep, setIntroStep] = useState(0)
  const [cells, setCells] = useState<BingoCell[]>(initialCells)
  const [completedLines, setCompletedLines] = useState<number[][]>([])
  const [showPrizeScreen, setShowPrizeScreen] = useState(false)
  const [previousBingoCount, setPreviousBingoCount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [newlyCompletedCellId, setNewlyCompletedCellId] = useState<number | null>(null)

  // イントロアニメーション
  useEffect(() => {
    if (showIntro) {
      const timer1 = setTimeout(() => setIntroStep(1), 300)
      const timer2 = setTimeout(() => setIntroStep(2), 800)
      const timer3 = setTimeout(() => setIntroStep(3), 1300)
      const timer4 = setTimeout(() => setIntroStep(4), 1800)
      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
        clearTimeout(timer4)
      }
    }
  }, [showIntro])

  // イントロ終了時の紙吹雪
  const fireIntroConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#C9A962', '#E8D5A3', '#FFFFFF', '#FFF8E7'],
      zIndex: 10000,
    })
  }, [])

  const handleStartClick = () => {
    fireIntroConfetti()
    setTimeout(() => setShowIntro(false), 500)
  }

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
      if (timeLeft <= 0) return clearInterval(interval)
      const particleCount = 50 * (timeLeft / duration)
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#C9A962', '#E8D5A3', '#FFFFFF'] })
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#C9A962', '#E8D5A3', '#FFFFFF'] })
    }, 250)
  }, [])

  const firePerfectConfetti = useCallback(() => {
    const count = 200
    const defaults = { origin: { y: 0.7 }, zIndex: 10000 }
    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio), colors: ['#C9A962', '#E8D5A3', '#FFFFFF', '#FFD700'] })
    }
    fire(0.25, { spread: 26, startVelocity: 55 })
    fire(0.2, { spread: 60 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
    fire(0.1, { spread: 120, startVelocity: 45 })
  }, [])

  const handleCellClick = (id: number) => {
    if (isAnimating) return
    const cellIndex = cells.findIndex((c) => c.id === id)
    if (cellIndex === -1 || cells[cellIndex].completed) return

    setIsAnimating(true)
    setNewlyCompletedCellId(id)

    setTimeout(() => {
      const newCells = cells.map((cell) => cell.id === id ? { ...cell, completed: true } : cell)
      setCells(newCells)
      setNewlyCompletedCellId(null)

      const { count: newCount, completed } = countBingos(newCells)
      setCompletedLines(completed)

      // ビンゴ達成時はエフェクトのみ（モーダルは表示しない）
      if (newCount > previousBingoCount) {
        const allCompleted = newCells.every((cell) => cell.completed)
        if (allCompleted) {
          firePerfectConfetti()
        } else {
          fireConfetti()
        }
        setPreviousBingoCount(newCount)
      }
      setIsAnimating(false)
    }, 600)
  }

  // 完了ボタンを押したときの処理
  const handleComplete = () => {
    if (completedLines.length > 0) {
      // 景品画面を表示する前にエフェクト
      const allCompleted = cells.every((cell) => cell.completed)
      if (allCompleted) {
        firePerfectConfetti()
      } else {
        fireConfetti()
      }
      setShowPrizeScreen(true)
    }
  }

  useEffect(() => {
    const { count, completed } = countBingos(cells)
    setCompletedLines(completed)
    setPreviousBingoCount(count)
  }, [])

  const isCellInCompletedLine = (index: number) => completedLines.some((line) => line.includes(index))

  // おすすめのマスを計算
  const getRecommendedCell = useCallback((): number | null => {
    // まだ完了していないセルのインデックスを取得
    const incompleteCellIndices = cells
      .map((cell, index) => ({ cell, index }))
      .filter(({ cell }) => !cell.completed)
      .map(({ index }) => index)

    if (incompleteCellIndices.length === 0) return null

    // 各未完了セルについて、ビンゴ達成にどれだけ近いかをスコアリング
    const cellScores: { index: number; score: number; canComplete: boolean }[] = incompleteCellIndices.map(cellIndex => {
      let score = 0
      let canComplete = false

      bingoLines.forEach(line => {
        if (!line.includes(cellIndex)) return

        const completedInLine = line.filter(i => cells[i].completed).length

        // このセルを完了すればビンゴ達成（2つ完了済み）
        if (completedInLine === 2) {
          canComplete = true
          score += 100
        }
        // 1つ完了済みのライン
        else if (completedInLine === 1) {
          score += 10
        }
        // 0個完了のライン
        else {
          score += 1
        }
      })

      return { index: cellIndex, score, canComplete }
    })

    // スコアが高い順にソート（ビンゴ達成可能なセルを優先）
    cellScores.sort((a, b) => b.score - a.score)

    return cellScores[0]?.index ?? null
  }, [cells])

  const recommendedCellIndex = getRecommendedCell()

  const handleReset = () => {
    setCells(initialCells)
    setCompletedLines([])
    setPreviousBingoCount(0)
    setShowPrizeScreen(false)
  }

  // 現在の最高景品を取得
  const getCurrentPrize = (): Prize | null => {
    const allCompleted = cells.every((cell) => cell.completed)
    if (allCompleted) return prizes[3]
    if (completedLines.length >= 2) return prizes[2]
    if (completedLines.length >= 1) return prizes[1]
    return null
  }

  // イントロ画面
  if (showIntro) {
    return (
      <div className="intro-screen">
        <div className="intro-bg-pattern"></div>
        <div className="intro-glow"></div>

        <div className="intro-content">
          <div className={`intro-line-top ${introStep >= 1 ? 'visible' : ''}`}></div>

          <div className={`intro-badge ${introStep >= 1 ? 'visible' : ''}`}>
            <span>PREMIUM</span>
          </div>

          <h1 className={`intro-title ${introStep >= 2 ? 'visible' : ''}`}>
            <span className="intro-title-beauty">Beauty</span>
            <span className="intro-title-bingo">Bingo Card</span>
            <span className="intro-title-dx">DX</span>
          </h1>

          <p className={`intro-subtitle ${introStep >= 3 ? 'visible' : ''}`}>
            特別なご来店特典プログラム
          </p>

          <div className={`intro-features ${introStep >= 3 ? 'visible' : ''}`}>
            <div className="intro-feature">
              <div className="feature-number">01</div>
              <div className="feature-text">ビンゴを揃えて豪華特典GET</div>
            </div>
            <div className="intro-feature">
              <div className="feature-number">02</div>
              <div className="feature-text">最大1,000円OFF + ノベルティ</div>
            </div>
            <div className="intro-feature">
              <div className="feature-number">03</div>
              <div className="feature-text">簡単アクションで達成</div>
            </div>
          </div>

          <button
            className={`intro-start-btn ${introStep >= 4 ? 'visible' : ''}`}
            onClick={handleStartClick}
          >
            <span>START</span>
            <div className="btn-shine"></div>
          </button>

          <div className={`intro-line-bottom ${introStep >= 1 ? 'visible' : ''}`}></div>
        </div>
      </div>
    )
  }

  // メイン画面
  return (
    <div className="app">
      <div className="background-pattern"></div>

      <header className="header-compact">
        <div className="header-inner">
          <span className="header-title">Beauty Bingo Card</span>
          <span className="header-dx">DX</span>
        </div>
        <div className="header-status">
          <div className="status-progress">
            <span className="sp-label">PROGRESS</span>
            <div className="sp-bar"><div className="sp-fill" style={{ width: `${(cells.filter((c) => c.completed).length / 9) * 100}%` }}></div></div>
            <span className="sp-value">{cells.filter((c) => c.completed).length}/9</span>
          </div>
          <div className="status-bingo">
            <span className="sb-label">BINGO</span>
            <span className="sb-value">{completedLines.length}</span>
          </div>
        </div>
      </header>

      <main className="main-compact">
        <div className="bingo-card-compact">
          <div className="bingo-grid-compact">
            {cells.map((cell, index) => (
              <button
                key={cell.id}
                className={`cell ${cell.completed ? 'completed' : ''} ${isCellInCompletedLine(index) ? 'in-line' : ''} ${newlyCompletedCellId === cell.id ? 'animating' : ''} ${cell.id === 5 ? 'free' : ''} ${recommendedCellIndex === index ? 'recommended' : ''}`}
                onClick={() => handleCellClick(cell.id)}
                disabled={cell.completed || isAnimating}
              >
                {recommendedCellIndex === index && !cell.completed && (
                  <div className="recommend-badge">おすすめ</div>
                )}
                <div className="cell-inner">
                  <span className="cell-t">{cell.title}</span>
                  <span className="cell-d">{cell.description}</span>
                  {cell.completed && <div className="cell-stamp">CLEAR</div>}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rewards-compact">
          <div className="rewards-header">
            <span className="rh-line"></span>
            <span className="rh-title">REWARDS</span>
            <span className="rh-line"></span>
          </div>
          <div className="rewards-grid">
            <div className={`reward ${completedLines.length >= 1 ? 'achieved' : ''}`}>
              <span className="r-badge">1 BINGO</span>
              <span className="r-text">500円OFF</span>
            </div>
            <div className={`reward ${completedLines.length >= 2 ? 'achieved' : ''}`}>
              <span className="r-badge">2 BINGO</span>
              <span className="r-text">施術無料</span>
            </div>
            <div className={`reward perfect ${cells.every((c) => c.completed) ? 'achieved' : ''}`}>
              <span className="r-badge">PERFECT</span>
              <span className="r-text">1,000円OFF+特典</span>
            </div>
          </div>
        </div>

        <button
          className={`complete-btn ${completedLines.length > 0 ? 'active' : ''}`}
          onClick={handleComplete}
          disabled={completedLines.length === 0}
        >
          {completedLines.length > 0 ? '景品を確認する' : 'ビンゴを揃えてください'}
        </button>
      </main>

      {showPrizeScreen && (
        <div className="prize-screen">
          <div className="prize-content">
            <div className="prize-header">
              <span className="prize-line"></span>
              <span className="prize-congrats">CONGRATULATIONS</span>
              <span className="prize-line"></span>
            </div>

            <h2 className="prize-main-title">
              {cells.every((c) => c.completed) ? 'PERFECT!' : `${completedLines.length} BINGO!`}
            </h2>

            <div className="prize-card">
              <div className="prize-label">YOUR REWARD</div>
              <div className="prize-value">{getCurrentPrize()?.description}</div>
            </div>

            <div className="prize-all-rewards">
              <div className="prize-rewards-title">獲得した特典</div>
              <div className="prize-rewards-list">
                {completedLines.length >= 1 && (
                  <div className="prize-reward-item achieved">
                    <span className="pri-check">✓</span>
                    <span className="pri-text">500円OFF</span>
                  </div>
                )}
                {completedLines.length >= 2 && (
                  <div className="prize-reward-item achieved">
                    <span className="pri-check">✓</span>
                    <span className="pri-text">施術無料</span>
                  </div>
                )}
                {cells.every((c) => c.completed) && (
                  <div className="prize-reward-item achieved perfect">
                    <span className="pri-check">✓</span>
                    <span className="pri-text">1,000円OFF + ノベルティ</span>
                  </div>
                )}
              </div>
            </div>

            <p className="prize-instruction">この画面をスタッフにお見せください</p>

            <div className="prize-buttons">
              <button className="prize-close-btn" onClick={() => setShowPrizeScreen(false)}>戻る</button>
              <button className="prize-reset-btn" onClick={handleReset}>リセット</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
