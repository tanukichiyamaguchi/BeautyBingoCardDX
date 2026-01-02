import { useState, useCallback, useEffect } from 'react'
import confetti from 'canvas-confetti'
import './App.css'

// ビンゴマスの定義
interface BingoCell {
  id: number
  title: string
  description: string
  icon: string
  completed: boolean
}

// 特典の定義
interface Prize {
  title: string
  description: string
  icon: string
}

// 初期ビンゴマスデータ
const initialCells: BingoCell[] = [
  { id: 1, title: 'Instagram', description: 'フォロー', icon: '📸', completed: false },
  { id: 2, title: 'LINE', description: 'トーク送信', icon: '💬', completed: false },
  { id: 3, title: 'Google', description: 'クチコミ', icon: '⭐', completed: false },
  { id: 4, title: 'ストーリー', description: 'メンション', icon: '📱', completed: false },
  { id: 5, title: 'FREE', description: '(来店)', icon: '✨', completed: true }, // 初回来店で自動解放
  { id: 6, title: '友達', description: '紹介', icon: '👯', completed: false },
  { id: 7, title: '投稿に', description: 'いいね5回', icon: '❤️', completed: false },
  { id: 8, title: 'TikTok', description: 'フォロー', icon: '🎵', completed: false },
  { id: 9, title: 'アンケート', description: '回答', icon: '📝', completed: false },
]

// ビンゴライン（縦・横・斜め）
const bingoLines = [
  [0, 1, 2], // 横1
  [3, 4, 5], // 横2
  [6, 7, 8], // 横3
  [0, 3, 6], // 縦1
  [1, 4, 7], // 縦2
  [2, 5, 8], // 縦3
  [0, 4, 8], // 斜め1
  [2, 4, 6], // 斜め2
]

// 特典設定
const prizes: { [key: number]: Prize } = {
  1: {
    title: '1ビンゴ達成！',
    description: '次回施術 500円OFF',
    icon: '🎉',
  },
  2: {
    title: '2ビンゴ達成！',
    description: '眉スタイリング無料 or まつ毛トリートメント無料',
    icon: '🎊',
  },
  3: {
    title: 'パーフェクト達成！',
    description: '次回施術1,000円OFF + オリジナルノベルティ',
    icon: '👑',
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

  // ビンゴ達成数をカウント
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

  // 紙吹雪エフェクト
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

      // ゴールド系の紙吹雪
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#D4AF37', '#FFD700', '#FFC107', '#F8E8C8', '#FFFFFF'],
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#D4AF37', '#FFD700', '#FFC107', '#F8E8C8', '#FFFFFF'],
      })
    }, 250)
  }, [])

  // パーフェクト達成時の特別エフェクト
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
        colors: ['#D4AF37', '#FFD700', '#FFC107', '#F8E8C8', '#FFFFFF', '#E5D4C0'],
      })
    }

    fire(0.25, { spread: 26, startVelocity: 55 })
    fire(0.2, { spread: 60 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
    fire(0.1, { spread: 120, startVelocity: 45 })

    // 連続花火エフェクト
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 180,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#FFD700', '#FFC107'],
        zIndex: 10000,
      })
    }, 500)

    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#D4AF37', '#FFD700', '#FFC107', '#F8E8C8'],
        zIndex: 10000,
      })
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#D4AF37', '#FFD700', '#FFC107', '#F8E8C8'],
        zIndex: 10000,
      })
    }, 1000)
  }, [])

  // マスをクリックした時の処理
  const handleCellClick = (id: number) => {
    if (isAnimating) return

    const cellIndex = cells.findIndex((c) => c.id === id)
    if (cellIndex === -1 || cells[cellIndex].completed) return

    setIsAnimating(true)
    setNewlyCompletedCellId(id)

    // マス完了アニメーション後に状態更新
    setTimeout(() => {
      const newCells = cells.map((cell) =>
        cell.id === id ? { ...cell, completed: true } : cell
      )
      setCells(newCells)
      setNewlyCompletedCellId(null)

      // ビンゴチェック
      const { count: newCount, completed } = countBingos(newCells)
      setCompletedLines(completed)

      // 新しいビンゴが達成された場合
      if (newCount > previousBingoCount) {
        // 全マス達成（パーフェクト）
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

  // 初回レンダリング時のビンゴチェック（FREEマスで既にビンゴの可能性）
  useEffect(() => {
    const { count, completed } = countBingos(cells)
    setCompletedLines(completed)
    setPreviousBingoCount(count)
  }, [])

  // マスがビンゴラインに含まれるかチェック
  const isCellInCompletedLine = (index: number) => {
    return completedLines.some((line) => line.includes(index))
  }

  // リセット機能
  const handleReset = () => {
    setCells(initialCells)
    setCompletedLines([])
    setPreviousBingoCount(0)
    setShowModal(false)
  }

  return (
    <div className="app">
      <div className="background-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <div className="decoration-circle circle-3"></div>
      </div>

      <header className="header">
        <div className="logo-accent"></div>
        <h1 className="title">
          <span className="title-main">Beauty Bingo Card</span>
          <span className="title-sub">DX</span>
        </h1>
        <p className="subtitle">ビューティビンゴカード</p>
      </header>

      <main className="main">
        <div className="bingo-card">
          <div className="card-inner">
            <div className="bingo-grid">
              {cells.map((cell, index) => (
                <button
                  key={cell.id}
                  className={`bingo-cell ${cell.completed ? 'completed' : ''} ${
                    isCellInCompletedLine(index) ? 'in-bingo-line' : ''
                  } ${newlyCompletedCellId === cell.id ? 'animating' : ''}`}
                  onClick={() => handleCellClick(cell.id)}
                  disabled={cell.completed || isAnimating}
                >
                  <div className="cell-content">
                    <span className="cell-icon">{cell.icon}</span>
                    <span className="cell-title">{cell.title}</span>
                    <span className="cell-description">{cell.description}</span>
                    {cell.completed && (
                      <div className="completed-overlay">
                        <span className="check-mark">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="cell-shine"></div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="progress-section">
          <div className="progress-info">
            <span className="progress-label">達成マス</span>
            <span className="progress-value">
              {cells.filter((c) => c.completed).length} / 9
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${(cells.filter((c) => c.completed).length / 9) * 100}%`,
              }}
            ></div>
          </div>
          <div className="bingo-count">
            <span className="bingo-label">ビンゴ</span>
            <span className="bingo-value">{completedLines.length}</span>
            <span className="bingo-unit">ライン</span>
          </div>
        </div>

        <section className="prizes-section">
          <h2 className="prizes-title">特典一覧</h2>
          <div className="prizes-list">
            <div className={`prize-item ${completedLines.length >= 1 ? 'achieved' : ''}`}>
              <div className="prize-badge">1ビンゴ</div>
              <div className="prize-content">
                <span className="prize-icon">🎁</span>
                <span className="prize-text">次回施術 500円OFF</span>
              </div>
            </div>
            <div className={`prize-item ${completedLines.length >= 2 ? 'achieved' : ''}`}>
              <div className="prize-badge">2ビンゴ</div>
              <div className="prize-content">
                <span className="prize-icon">💎</span>
                <span className="prize-text">眉スタイリング無料 or まつ毛トリートメント無料</span>
              </div>
            </div>
            <div className={`prize-item ${cells.every((c) => c.completed) ? 'achieved' : ''}`}>
              <div className="prize-badge perfect">PERFECT</div>
              <div className="prize-content">
                <span className="prize-icon">👑</span>
                <span className="prize-text">1,000円OFF + 限定ノベルティ</span>
              </div>
            </div>
          </div>
        </section>

        <button className="reset-button" onClick={handleReset}>
          リセット
        </button>
      </main>

      {/* 特典モーダル */}
      {showModal && currentPrize && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-decoration">
              <div className="modal-sparkle sparkle-1">✦</div>
              <div className="modal-sparkle sparkle-2">✦</div>
              <div className="modal-sparkle sparkle-3">✦</div>
              <div className="modal-sparkle sparkle-4">✦</div>
            </div>
            <div className="modal-content">
              <div className="modal-icon">{currentPrize.icon}</div>
              <h2 className="modal-title">{currentPrize.title}</h2>
              <p className="modal-description">{currentPrize.description}</p>
              <div className="modal-note">
                ※スタッフにこの画面をお見せください
              </div>
              <button className="modal-button" onClick={() => setShowModal(false)}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
