interface MorphingBlobsProps {
  scrollY: number;
}

export const MorphingBlobs = ({ scrollY }: MorphingBlobsProps) => {
  return (
    <>
      {/* Large Morphing Blob 1 - Pink/Rose */}
      <div 
        className="absolute w-96 h-96 bg-gradient-to-br from-pink-300/30 to-rose-400/40 rounded-full blur-3xl animate-pulse"
        style={{
          transform: `translateX(${scrollY * 0.1}px) translateY(${scrollY * 0.05}px) scale(${1 + Math.sin(scrollY * 0.01) * 0.2})`,
          top: '10%',
          left: '70%'
        }}
      />
      
      {/* Large Morphing Blob 2 - Blue/Indigo */}
      <div 
        className="absolute w-80 h-80 bg-gradient-to-br from-blue-300/30 to-indigo-400/40 rounded-full blur-3xl animate-pulse"
        style={{
          transform: `translateX(${-scrollY * 0.08}px) translateY(${scrollY * 0.03}px) scale(${1 + Math.cos(scrollY * 0.01) * 0.3})`,
          top: '60%',
          left: '10%',
          animationDelay: '1s'
        }}
      />
      
      {/* Large Morphing Blob 3 - Green/Emerald */}
      <div 
        className="absolute w-72 h-72 bg-gradient-to-br from-green-300/30 to-emerald-400/40 rounded-full blur-3xl animate-pulse"
        style={{
          transform: `translateX(${scrollY * 0.12}px) translateY(${-scrollY * 0.04}px) scale(${1 + Math.sin(scrollY * 0.015) * 0.25})`,
          top: '30%',
          left: '40%',
          animationDelay: '2s'
        }}
      />
    </>
  );
}; 