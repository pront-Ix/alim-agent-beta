import "./LoadingStatus.css"

const LoadingStatus = ({ text = "Alim is reflecting", type = "default" }) => {
  const getLoadingText = () => {
    const texts = [
      "Alim is reflecting",
      "Seeking divine wisdom",
      "Consulting the sources",
      "Preparing your answer"
    ];
    return text || texts[Math.floor(Math.random() * texts.length)];
  };

  return (
    <div className="loading-status">
      <div className={`status-bubble ${type}`}>
        <div className="alim-icon">🌙</div>
        <div className="loading-content">
          <span className="loading-text">{getLoadingText()}</span>
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