export const FloatingShapes = () => {
  const getShapeGradient = (index: number) => {
    const gradients = [
      'from-purple-200/20 to-pink-300/30',
      'from-blue-200/20 to-cyan-300/30', 
      'from-green-200/20 to-emerald-300/30',
      'from-yellow-200/20 to-orange-300/30'
    ];
    return gradients[index % 4];
  };

  const generateShapeStyle = (index: number) => ({
    width: `${20 + (index * 8)}px`,
    height: `${20 + (index * 8)}px`,
    left: `${(index * 8 + 10) % 90}%`,
    top: `${(index * 15 + 20) % 80}%`,
    animationDelay: `${index * 0.5}s`,
    animationDuration: `${3 + (index % 3)}s`
  });

  return (
    <>
      {/* Floating Organic Shapes */}
      {[...Array(12)].map((_, i) => (
        <div
          key={`floating-shape-${i}`}
          className={`absolute rounded-full bg-gradient-to-br ${getShapeGradient(i)} animate-bounce`}
          style={generateShapeStyle(i)}
        />
      ))}
    </>
  );
}; 