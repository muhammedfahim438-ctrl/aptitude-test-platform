export default function QuestionCard({ id, text, option_a, option_b, option_c, option_d, image_url, selected, onSelect }) {
  const options = [
    { label: 'A', value: option_a },
    { label: 'B', value: option_b },
    { label: 'C', value: option_c },
    { label: 'D', value: option_d },
  ].filter(o => o.value)

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #ece9e2',
      borderRadius: 14,
      padding: 16,
    }}>
      {image_url && (
        <div style={{
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 12,
          background: '#f5f5f2',
        }}>
          <img
            src={image_url}
            alt={`Question ${id} diagram`}
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none' }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px', color: '#2a2a28' }}>
        <strong>Q{id}.</strong> {text}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(options).map(([key, opt]) => {
          const isSelected = selected === opt.label
          return (
            <div
              key={opt.label}
              onClick={() => onSelect(id, opt.label)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 8,
                border: isSelected ? '2px solid #465aa3' : '1px solid #e5e3dd',
                background: isSelected ? '#EAEFFD50' : '#fff',
                cursor: 'pointer',
                fontSize: 14,
                color: '#2a2a28',
              }}
            >
              <span style={{
                fontWeight: 700,
                color: isSelected ? '#465aa3' : '#8a8a86',
                minWidth: 18,
              }}>
                {opt.label}.
              </span>
              {opt.value}
            </div>
          )
        })}
      </div>
    </div>
  )
}
