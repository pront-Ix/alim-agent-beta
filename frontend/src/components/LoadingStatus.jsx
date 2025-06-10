import "./LoadingStatus.css"

const LoadingStatus = ({ text = "Un instant" }) => {
  return (
    <div className="loading-status">
      <div className="status-bubble">
        <div className="alim-icon">🌙</div>
        <div className="loading-content">
          <span className="loading-text">{text}</span>
          <div className="loading-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
        <div className="loading-glow"></div>
      </div>
    </div>
  )
}

export default LoadingStatus
