import { useEffect, useRef, useState } from 'react'

type Props = {
  images: string[]; // List of base64 image strings
  interval: number; // Interval in milliseconds
}

const ImageSlideshow = ({ interval, images }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const img = new Image();
    img.src = images[currentIndex];
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);
    };

    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => clearInterval(intervalId);
  }, [currentIndex, images, interval]);

  return <canvas ref={canvasRef} />;
}

export default ImageSlideshow