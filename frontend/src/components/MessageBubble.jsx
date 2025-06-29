import "./MessageBubble.css"

// Function to parse basic Markdown
const parseMarkdown = (text) => {
  if (!text) return text

  // Split the text into lines to process lists
  const lines = text.split("\n")
  const parsedLines = lines.map((line, index) => {
    // Process numbered lists
    const listMatch = line.match(/^(\d+)\.\s\*\*(.*?)\*\*\s*:\s*(.*)$/)
    if (listMatch) {
      const [, number, title, description] = listMatch
      return (
        <div key={index} className="list-item">
          <span className="list-number">{number}.</span>
          <span className="list-title">{title}</span>
          <span className="list-separator">:</span>
          <span className="list-description">{description}</span>
        </div>
      )
    }

    // Process dashed lists
    const dashListMatch = line.match(/^-\s\*\*(.*?)\*\*\s*:\s*(.*)$/)
    if (dashListMatch) {
      const [, title, description] = dashListMatch
      return (
        <div key={index} className="list-item">
          <span className="list-bullet">•</span>
          <span className="list-title">{title}</span>
          <span className="list-separator">:</span>
          <span className="list-description">{description}</span>
        </div>
      )
    }

    // Process normal text with formatting
    const processInlineFormatting = (text) => {
      const parts = []
      let currentIndex = 0

      // Regex to find bold text **text**
      const boldRegex = /\*\*(.*?)\*\*/g
      let match

      while ((match = boldRegex.exec(text)) !== null) {
        // Add the text before the bold text
        if (match.index > currentIndex) {
          parts.push(text.slice(currentIndex, match.index))
        }

        // Add the bold text
        parts.push(<strong key={`bold-${match.index}`}>{match[1]}</strong>)

        currentIndex = match.index + match[0].length
      }

      // Add the rest of the text
      if (currentIndex < text.length) {
        parts.push(text.slice(currentIndex))
      }

      return parts.length > 0 ? parts : text
    }

    // If the line is not empty, process inline formatting
    if (line.trim()) {
      return (
        <div key={index} className="text-line">
          {processInlineFormatting(line)}
        </div>
      )
    }

    // Empty line
    return <br key={index} />
  })

  return parsedLines
}

const MessageBubble = ({ message, sender }) => {
  return (
    <div className={`message-bubble ${sender}`}>
      <div className="message-content">{parseMarkdown(message)}</div>
    </div>
  )
}

export default MessageBubble
