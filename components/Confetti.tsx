import React from 'react';

const Confetti: React.FC = () => {
    // Generate styles for multiple fireworks at random positions
    const fireworks = Array.from({ length: 3 + Math.floor(Math.random() * 3) }).map((_, i) => ({
        id: i,
        top: `${20 + Math.random() * 60}%`,
        left: `${10 + Math.random() * 80}%`,
        animationDelay: `${Math.random() * 0.5}s`,
    }));

    // Generate particles for one firework burst
    const particles = Array.from({ length: 30 }).map((_, j) => {
        const angle = (j / 30) * 360;
        // Add some randomness to the angle and distance for a more natural look
        const randomAngle = angle + (Math.random() - 0.5) * 10;
        const distance = 80 + Math.random() * 50;
        const x = Math.cos(randomAngle * Math.PI / 180) * distance;
        const y = Math.sin(randomAngle * Math.PI / 180) * distance;
        
        return {
            key: j,
            background: `hsl(${Math.random() * 360}, 100%, 65%)`,
            // @ts-ignore - a way to pass CSS custom properties
            '--transform-end': `translate(${x}px, ${y}px)`
        };
    });

    return (
        <>
            <style>{`
                .firework-container {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    z-index: 9999;
                    overflow: hidden;
                }
                .firework {
                    /* This is the base div for the firework effect */
                    position: absolute;
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                }

                .particle {
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 4px;
                  height: 4px;
                  border-radius: 50%;
                  opacity: 0;
                  /* Animation lasts 1.5s total, starting after the firework's delay */
                  animation: particle-move 1.5s cubic-bezier(0.25, 0.5, 0.5, 1) forwards;
                }

                @keyframes particle-move {
                  0% {
                    transform: translate(0, 0);
                    opacity: 1;
                  }
                  100% {
                    transform: var(--transform-end);
                    opacity: 0;
                  }
                }
            `}</style>
            <div className="firework-container">
                {fireworks.map(({ id, top, left, animationDelay }) => (
                    <div key={id} className="firework" style={{ top, left }}>
                        {/* Render the particles for each firework */}
                        {particles.map(({key, ...style}) => (
                            <div
                                key={key}
                                className="particle"
                                style={{
                                    ...style,
                                    animationDelay, // Particles start animating when the firework appears
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </>
    );
};

export default Confetti;
