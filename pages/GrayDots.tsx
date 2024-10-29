import { useEffect, useRef } from 'react';

const GrayDots = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const canvasCtx = canvas?.getContext('2d');

    if (!canvas || !canvasCtx) return;

    const dotColor = '#C5C5C9'; // Gray color for dots
    const dotRadius = 2; // Radius for each dot
    const dotSpacing = 10; // Spacing between dots
    let x = dotRadius;

    // Clear the canvas
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw dots across the canvas width
    for (let i = 0; i < canvas.width / dotSpacing; i++) {
      canvasCtx.fillStyle = dotColor;
      canvasCtx.beginPath();
      canvasCtx.arc(x, canvas.height / 2, dotRadius, 0, 2 * Math.PI); // Draw a circle (dot)
      canvasCtx.fill();
      x += dotSpacing; // Move to next position
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      height={100}
      width={300}
      style={{ height: '50px', width: '100%' }}
    />
  );
};
export default GrayDots;
