/**
 * AuthBackground — Pure CSS animated background for auth pages.
 * Theme: Digital Twin / Smart Building — node graphs, scanning grids, floating data blips.
 */

export default function AuthBackground() {
  return (
    <div className="auth-bg" aria-hidden="true">
      {/* Deep gradient base */}
      <div className="auth-bg__base" />

      {/* Animated grid */}
      <div className="auth-bg__grid" />

      {/* Radial spotlight that slowly rotates */}
      <div className="auth-bg__spotlight" />

      {/* Floating building wireframe nodes */}
      <svg className="auth-bg__svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        {/* Connection lines */}
        <g className="auth-bg__lines" stroke="#6366f1" strokeWidth="0.5" strokeOpacity="0.25">
          <line x1="120" y1="200" x2="400" y2="350" />
          <line x1="400" y1="350" x2="700" y2="180" />
          <line x1="700" y1="180" x2="1050" y2="320" />
          <line x1="1050" y1="320" x2="900" y2="600" />
          <line x1="900" y1="600" x2="580" y2="680" />
          <line x1="580" y1="680" x2="200" y2="620" />
          <line x1="200" y1="620" x2="120" y2="200" />
          <line x1="400" y1="350" x2="580" y2="680" />
          <line x1="700" y1="180" x2="900" y2="600" />
          <line x1="120" y1="200" x2="700" y2="180" />
          <line x1="200" y1="620" x2="580" y2="680" />
          <line x1="1050" y1="320" x2="700" y2="180" />
        </g>

        {/* Animated pulse rings on nodes */}
        {[
          { cx: 120, cy: 200, delay: "0s" },
          { cx: 400, cy: 350, delay: "0.8s" },
          { cx: 700, cy: 180, delay: "1.6s" },
          { cx: 1050, cy: 320, delay: "0.4s" },
          { cx: 900, cy: 600, delay: "1.2s" },
          { cx: 580, cy: 680, delay: "2s" },
          { cx: 200, cy: 620, delay: "0.6s" },
        ].map(({ cx, cy, delay }, i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="4" fill="#6366f1" fillOpacity="0.9" />
            <circle cx={cx} cy={cy} r="4" fill="none" stroke="#6366f1" strokeWidth="1"
              className="auth-bg__pulse" style={{ animationDelay: delay }} />
          </g>
        ))}

        {/* Travelling data blip on line 1 */}
        <circle r="3" fill="#a5b4fc" fillOpacity="0.9" className="auth-bg__blip auth-bg__blip--1">
          <animateMotion dur="4s" repeatCount="indefinite" begin="0s">
            <mpath href="#path1" />
          </animateMotion>
        </circle>
        <circle r="2.5" fill="#38bdf8" fillOpacity="0.8" className="auth-bg__blip">
          <animateMotion dur="6s" repeatCount="indefinite" begin="1.5s">
            <mpath href="#path2" />
          </animateMotion>
        </circle>
        <circle r="2" fill="#34d399" fillOpacity="0.8">
          <animateMotion dur="5s" repeatCount="indefinite" begin="3s">
            <mpath href="#path3" />
          </animateMotion>
        </circle>

        {/* Hidden motion paths */}
        <defs>
          <path id="path1" d="M120,200 L400,350 L700,180 L1050,320 L900,600 L580,680 L200,620 Z" />
          <path id="path2" d="M700,180 L1050,320 L900,600 L580,680 L400,350 Z" />
          <path id="path3" d="M200,620 L120,200 L700,180 L900,600 Z" />
        </defs>
      </svg>

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="auth-bg__particle"
          style={{
            left: `${5 + (i * 4.7) % 90}%`,
            top: `${10 + (i * 7.3) % 80}%`,
            animationDelay: `${(i * 0.41) % 5}s`,
            animationDuration: `${4 + (i * 0.37) % 4}s`,
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
          }}
        />
      ))}

      {/* Scan line */}
      <div className="auth-bg__scanline" />

      {/* Corner data readouts */}
      <div className="auth-bg__readout auth-bg__readout--tl">
        <span className="auth-bg__readout-label">SYS_STATUS</span>
        <span className="auth-bg__readout-value blink-slow">ONLINE</span>
      </div>
      <div className="auth-bg__readout auth-bg__readout--tr">
        <span className="auth-bg__readout-label">NODES</span>
        <span className="auth-bg__readout-value">7 / 7</span>
      </div>
      <div className="auth-bg__readout auth-bg__readout--bl">
        <span className="auth-bg__readout-label">UPTIME</span>
        <span className="auth-bg__readout-value">99.98%</span>
      </div>
      <div className="auth-bg__readout auth-bg__readout--br">
        <span className="auth-bg__readout-label">DIGITAL TWIN</span>
        <span className="auth-bg__readout-value text-[#34d399]">ACTIVE</span>
      </div>
    </div>
  );
}
