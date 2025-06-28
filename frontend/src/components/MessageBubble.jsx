import "./MessageBubble.css"

// Fonction pour parser le Markdown de base
const parseMarkdown = (text) => {
  if (!text) return text

  // Diviser le texte en lignes pour traiter les listes
  const lines = text.split("\n")
  const parsedLines = lines.map((line, index) => {
    // Traiter les listes numérotées
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

    // Traiter les listes avec tirets
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

    // Traiter le texte normal avec formatage
    const processInlineFormatting = (text) => {
      const parts = []
      let currentIndex = 0

      // Regex pour trouver le texte en gras **texte**
      const boldRegex = /\*\*(.*?)\*\*/g
      let match

      while ((match = boldRegex.exec(text)) !== null) {
        // Ajouter le texte avant le gras
        if (match.index > currentIndex) {
          parts.push(text.slice(currentIndex, match.index))
        }

        // Ajouter le texte en gras
        parts.push(<strong key={`bold-${match.index}`}>{match[1]}</strong>)

        currentIndex = match.index + match[0].length
      }

      // Ajouter le reste du texte
      if (currentIndex < text.length) {
        parts.push(text.slice(currentIndex))
      }

      return parts.length > 0 ? parts : text
    }

    // Si la ligne n'est pas vide, traiter le formatage inline
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
