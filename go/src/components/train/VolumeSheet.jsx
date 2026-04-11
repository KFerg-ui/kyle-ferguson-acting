import Sheet from '../shared/Sheet'
import { MUSCLES, getVolZone, ZONE_LABEL } from '../../lib/training-data'

const ZONE_COLOR = {
  below: 'var(--muted)',
  mev:   'var(--accent2)',
  mav:   'var(--accent)',
  mrv:   'var(--red)',
}

export default function VolumeSheet({ open, onClose, vols, onAdjust }) {
  return (
    <Sheet open={open} onClose={onClose} title="Weekly Volume">
      <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px', lineHeight: 1.6 }}>
        Sets per muscle per week. Yellow = MEV start. Aim for MAV (sweet spot). Back off if approaching MRV.
      </p>

      {MUSCLES.map(m => {
        const sets = vols[m.name] ?? m.mev
        const zone = getVolZone(m.name, sets)
        const color = ZONE_COLOR[zone]
        const pct = Math.min(sets / m.mrv, 1)

        return (
          <div key={m.name} style={s.row}>
            <div style={s.nameCol}>
              <span style={s.name}>{m.name}</span>
              <span style={{ ...s.zoneLabel, color }}>{ZONE_LABEL[zone]}</span>
            </div>

            <div style={s.barCol}>
              <div style={s.barTrack}>
                {/* MEV marker */}
                <div style={{ ...s.marker, left: `${(m.mev / m.mrv) * 100}%` }} title="MEV" />
                {/* MAV zone */}
                <div style={{
                  ...s.mavZone,
                  left: `${(m.mav[0] / m.mrv) * 100}%`,
                  width: `${((m.mav[1] - m.mav[0]) / m.mrv) * 100}%`,
                }} />
                {/* Progress fill */}
                <div style={{ ...s.fill, width: `${pct * 100}%`, background: color }} />
              </div>
              <div style={s.barLabels}>
                <span>{m.mev} MEV</span>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{sets}</span>
                <span>{m.mrv} MRV</span>
              </div>
            </div>

            <div style={s.controls}>
              <button style={s.adj} onClick={() => onAdjust(m.name, -1)}>−</button>
              <button style={s.adj} onClick={() => onAdjust(m.name, +1)}>+</button>
            </div>
          </div>
        )
      })}
    </Sheet>
  )
}

const s = {
  row: {
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '1px solid var(--border)',
  },
  nameCol: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '8px',
  },
  name: {
    fontSize: '14px',
    fontWeight: 700,
  },
  zoneLabel: {
    fontSize: '11px',
    fontWeight: 700,
  },
  barCol: {
    marginBottom: '8px',
  },
  barTrack: {
    height: '10px',
    background: 'var(--border)',
    borderRadius: '99px',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: '4px',
  },
  fill: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    borderRadius: '99px',
    transition: 'width 0.25s ease',
  },
  mavZone: {
    position: 'absolute',
    top: 0, bottom: 0,
    background: 'rgba(232,255,71,0.15)',
  },
  marker: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: '2px',
    background: 'rgba(255,255,255,0.2)',
  },
  barLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: 'var(--muted)',
  },
  controls: {
    display: 'flex',
    gap: '8px',
  },
  adj: {
    flex: 1,
    padding: '10px',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text)',
    fontSize: '18px',
    fontWeight: 700,
    cursor: 'pointer',
    minHeight: '44px',
  },
}
