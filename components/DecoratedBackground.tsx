import Image from "next/image";
import fondoTop from "@/src/assets/backgrounds/fondo_sjl_top.png";
import fondoBottom from "@/src/assets/backgrounds/fondo_sjl_bottom.png";

interface DecoratedBackgroundProps {
  opacity?: number;
}

export default function DecoratedBackground({ opacity = 1 }: DecoratedBackgroundProps) {
  return (
    <div 
      className="fixed inset-0 z-0 pointer-events-none bg-white" 
      style={{ opacity }}
    >
      <div className="absolute top-0 left-0 w-[60%] max-w-[400px]">
        <Image
          src={fondoTop}
          alt="Decoración superior"
          priority
          className="w-full h-auto object-contain"
        />
      </div>
      <div className="absolute bottom-0 right-0 w-[60%] max-w-[400px]">
        <Image
          src={fondoBottom}
          alt="Decoración inferior"
          priority
          className="w-full h-auto object-contain"
        />
      </div>
    </div>
  );
}
