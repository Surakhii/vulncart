export default function AnimatedBg() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Main blobs */}
      <div className="blob blob-1" style={{ top: '-10%', left: '-5%' }} />
      <div className="blob blob-2" style={{ top: '40%', right: '-10%' }} />
      <div className="blob blob-3" style={{ bottom: '10%', left: '30%' }} />
      <div className="blob blob-4" style={{ top: '20%', left: '50%' }} />

      {/* Floating orbs */}
      <Orb size={12} top="15%" left="20%" delay={0} duration={6} />
      <Orb size={8} top="60%" left="75%" delay={2} duration={8} />
      <Orb size={16} top="80%" left="10%" delay={1} duration={7} />
      <Orb size={6} top="35%" left="85%" delay={3} duration={5} />
      <Orb size={10} top="50%" left="45%" delay={1.5} duration={9} />
      <Orb size={14} top="10%" left="65%" delay={0.5} duration={6.5} />
      <Orb size={7} top="70%" left="55%" delay={4} duration={7.5} />
      <Orb size={20} top="25%" left="5%" delay={2.5} duration={10} />

      {/* Grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(9,9,15,0.8) 100%)'
        }}
      />
    </div>
  )
}

function Orb({ size, top, left, delay, duration }) {
  return (
    <div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        top,
        left,
        background: 'rgba(99, 102, 241, 0.6)',
        boxShadow: `0 0 ${size * 2}px rgba(99, 102, 241, 0.4)`,
        animation: `blob-float ${duration}s ease-in-out ${delay}s infinite, pulse-glow ${duration * 0.7}s ease-in-out ${delay}s infinite`,
      }}
    />
  )
}
