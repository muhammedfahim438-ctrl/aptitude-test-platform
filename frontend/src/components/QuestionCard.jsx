// src/components/QuestionCard.jsx  ── US-V03
// Renders a single exam question — text-only or with an image.
// Mobile responsive: options stack to 1 column on small screens.

export default function QuestionCard({ id, text, options, image_url, selected, onSelect }) {
  return (
    <div style={styles.card}>

      {/* Image — only rendered when image_url is not null */}
      {image_url && (
        <div style={styles.imageWrapper}>
          <img
            src={image_url}
            alt={`Question ${id} diagram`}
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
            style={styles.image}
          />
        </div>
      )}

      {/* Question text */}
      <p style={styles.questionText}>
        <span style={styles.questionNum}>Q{id}.</span>
        {text}
      </p>

      {/* Options A–D */}
      <div
        className="options-grid-mobile"
        style={styles.optionsGrid}
      >
        {Object.entries(options).map(([key, val]) => {
          const isSelected = selected === key
          return (
            <button
              key={key}
              onClick={() => onSelect(id, key)}
              style={{
                ...styles.optionCard,
                border: isSelected ? '2px solid #ff6b00' : '1.5px solid #d2c5b6',
                background: isSelected ? '#ffe8d6' : '#f4f4f2',
              }}
            >
              <span style={{
                ...styles.optionBadge,
                background: isSelected ? '#ff6b00' : '#eaeae8',
                color:      isSelected ? '#fff'    : '#4e473e',
              }}>
                {key}
              </span>
              <span style={styles.optionText}>{val}</span>
            </button>
          )
        })}
      </div>

    </div>
  )
}

const styles = {
  card: {
    background: '#fff',
    border: '1px solid #d2c5b6',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: '16 / 9',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 14,
    background: '#ffe8d6',
  },
  image: {
    width: '100%', height: '100%',
    objectFit: 'cover', display: 'block',
  },
  questionText: {
    fontSize: 15, lineHeight: '22px',
    color: '#1c1c1b', marginBottom: 16,
  },
  questionNum: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 11, fontWeight: 600,
    color: '#ff6b00', marginRight: 8,
    letterSpacing: '0.05em',
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  optionCard: {
    display: 'flex', alignItems: 'flex-start',
    gap: 10, padding: '10px 14px',
    borderRadius: 8, cursor: 'pointer',
    textAlign: 'left', transition: 'all 0.12s ease',
    fontFamily: 'Geist, sans-serif',
    width: '100%',
  },
  optionBadge: {
    flexShrink: 0,
    width: 22, height: 22,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 600,
    fontFamily: 'JetBrains Mono, monospace',
  },
  optionText: {
    fontSize: 13, lineHeight: '18px', color: '#1c1c1b',
  },
}