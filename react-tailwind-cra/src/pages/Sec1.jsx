import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EXRLoader } from 'three-stdlib';

const Sec1 = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const mountRef = useRef(null);
  const modelRef = useRef(null);
  const mouseRef = useRef(new THREE.Vector2());
  const isHoveringRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [isWaiting, setIsWaiting] = useState(false);
  const glowRef = useRef(null);
  const isGlowVisibleRef = useRef(false);
  const isWaitingRef = useRef(false);

  const texts = [
    [
      {
        heading: 'Summary 1',
        subheading: ['A Quick Overview of Your Report'],
        type: 'slideInAndFade',
        otype: 'Summary',
      },
      {
        heading: 'Variants 1',
        subheading: [
          'a) BRCA1 variant found — may increase breast cancer risk',
        ],
        type: 'slideInAndFade',
        otype: 'Variant',
      },
      {
        heading: 'Recommendations 1',
        subheading: [
          'a) Helpful Steps You Can Take',
          'b) Understanding Your Results and What Comes Next',
        ],
        type: 'emit',
        otype: 'Recommendation',
      },
    ],
  ];

  const createSequentialArray = () => {
    const sequentialTexts = [];

    texts.forEach((section) => {
      const summary = section.find((item) => item.otype === 'Summary');
      const variant = section.find((item) => item.otype === 'Variant');
      const recommendation = section.find(
        (item) => item.otype === 'Recommendation'
      );
      const diagnosis = section.find((item) => item.otype === 'Diagnosis');

      if (summary) {
        summary.subheading.forEach((sub) => {
          sequentialTexts.push({
            heading: summary.heading,
            subheading: sub,
            otype: summary.otype,
            type: summary.type,
          });
        });
      }

      if (variant) {
        variant.subheading.forEach((sub) => {
          sequentialTexts.push({
            heading: variant.heading,
            subheading: sub,
            otype: variant.otype,
            type: variant.type,
          });
        });
      }

      if (recommendation) {
        recommendation.subheading.forEach((sub) => {
          sequentialTexts.push({
            heading: recommendation.heading,
            subheading: sub,
            otype: recommendation.otype,
            type: recommendation.type,
          });
        });
      }

      if (diagnosis) {
        diagnosis.subheading.forEach((sub) => {
          sequentialTexts.push({
            heading: diagnosis.heading,
            subheading: sub,
            otype: diagnosis.otype,
            type: diagnosis.type,
          });
        });
      }
    });

    return sequentialTexts;
  };

  const flatTexts = createSequentialArray();

  const getAnimationClass = () => {
    const currentType = flatTexts[currentIndex]?.otype;
    if (isWaiting) return 'opacity-0';
    if (currentType === 'Summary' || currentType === 'Variant')
      return 'animate-slideInAndFade';
    if (currentType === 'Diagnosis' || currentType === 'Recommendation')
      return 'animate-emitFromGlobe';
    return 'opacity-100';
  };

  useEffect(() => {
    let timeout;

    const prev = currentIndex;
    const next = (prev + 1) % flatTexts.length;
    const current = flatTexts[next]?.otype;
    const prevType = flatTexts[prev]?.otype;

    const delayBeforeFadeOut = 4000;
    const fadeOutDuration = 300;
    const processingDelay = 3000;

    const delay =
      prevType === 'Variant' &&
      (current === 'Diagnosis' || current === 'Recommendation')
        ? processingDelay
        : 0;

    const runTransition = () => {
      setTimeout(() => {
        setFade(false);

        timeout = setTimeout(() => {
          if (delay > 0) {
            setIsWaiting(true);
            isWaitingRef.current = true;
          }

          setTimeout(() => {
            if (delay > 0) {
              setIsWaiting(false);
              isWaitingRef.current = false;
            }
            setCurrentIndex(next);
            setFade(true);
          }, delay);
        }, fadeOutDuration);
      }, delayBeforeFadeOut);
    };

    runTransition();

    const interval = setInterval(
      runTransition,
      delayBeforeFadeOut + fadeOutDuration + delay + 100
    );

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [currentIndex, flatTexts.length]);

  useEffect(() => {
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    new EXRLoader().load('/hdr/studio_small_08_1k.exr', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
    });

    const handleMouseMove = (event) => {
      const bounds = mountRef.current.getBoundingClientRect();
      mouseRef.current.x =
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      mouseRef.current.y =
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      isHoveringRef.current = true;
    };

    const handleMouseLeave = () => {
      const scrollY = window.scrollY;
      isGlowVisibleRef.current = scrollY > 200;
      setIsScrolled(scrollY > 100);
      isHoveringRef.current = false;
    };

    mountRef.current.addEventListener('mousemove', handleMouseMove);
    mountRef.current.addEventListener('mouseleave', handleMouseLeave);

    const loader = new GLTFLoader();
    loader.load('/models/sample2.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.set(4, 4, 4);
      const box = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      box.getCenter(center);
      model.position.sub(center);
      model.position.y = -1.5;

      model.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.color = new THREE.Color('#a9c9ff');
          child.material.metalness = 0.9;
          child.material.roughness = 0.4;
          child.material.envMapIntensity = 0.2;
          child.material.needsUpdate = true;
        }
      });

      scene.add(model);
      modelRef.current = model;
      setIsLoaded(true);

      let animationFrameId;
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        if (modelRef.current) {
          const scrollY = window.scrollY;
          const baseY = -1.5 + scrollY * 0.0025;
          const baseX = -Math.min(scrollY / 800, 1) * 1.2;
          const scale = 3 - Math.min(scrollY / 800, 1);

          const pulseScale =
            isWaitingRef.current && scrollY > 200
              ? scale + Math.sin(Date.now() * 0.005) * 0.1
              : scale;

          modelRef.current.position.x = baseX;
          modelRef.current.position.y = baseY;
          modelRef.current.position.z = 0;

          modelRef.current.scale.set(pulseScale, pulseScale, pulseScale);
          modelRef.current.rotation.y += 0.003;

          const baseTilt = Math.min(scrollY / 600, 0.6);

          if (isHoveringRef.current && scrollY > 200) {
            const mouseInfluenceX = mouseRef.current.y * 0.15;
            const mouseInfluenceZ = mouseRef.current.x * 0.08;

            modelRef.current.rotation.x = THREE.MathUtils.lerp(
              modelRef.current.rotation.x,
              baseTilt + mouseInfluenceX,
              0.05
            );

            modelRef.current.rotation.z = THREE.MathUtils.lerp(
              modelRef.current.rotation.z,
              mouseInfluenceZ,
              0.05
            );

            modelRef.current.traverse((child) => {
              if (child.isMesh && child.material) {
                child.material.envMapIntensity = THREE.MathUtils.lerp(
                  child.material.envMapIntensity,
                  0.5,
                  0.02
                );
                child.material.metalness = THREE.MathUtils.lerp(
                  child.material.metalness,
                  0.95,
                  0.02
                );
              }
            });
          } else {
            modelRef.current.rotation.x = THREE.MathUtils.lerp(
              modelRef.current.rotation.x,
              baseTilt,
              0.03
            );

            modelRef.current.rotation.z = THREE.MathUtils.lerp(
              modelRef.current.rotation.z,
              0,
              0.03
            );

            modelRef.current.traverse((child) => {
              if (child.isMesh && child.material) {
                child.material.envMapIntensity = THREE.MathUtils.lerp(
                  child.material.envMapIntensity,
                  0.2,
                  0.02
                );
                child.material.metalness = THREE.MathUtils.lerp(
                  child.material.metalness,
                  0.9,
                  0.02
                );
              }
            });
          }
        }

        renderer.render(scene, camera);
      };

      animate();
    });

    return () => {
      if (mountRef.current) {
        mountRef.current.removeEventListener('mousemove', handleMouseMove);
        mountRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (renderer && mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  const currentText = flatTexts[currentIndex];

  return (
    <>
      <section className="relative w-full min-h-[200vh] overflow-x-hidden bg-gradient-to-r from-[#3D5EB8] via-[#9BCEFF] to-[#F8FCFF]">
        <div className="flex items-center justify-between px-6 py-4 z-20 sticky top-0 bg-transparent">
          <div className="text-black font-bold text-xl leading-tight tracking-tight">
            <div>BLUE</div>
            <div>YARD</div>
          </div>
          <div className="w-9 h-9 border rounded-md flex flex-col justify-center items-center gap-[3px] cursor-pointer">
            <span className="w-5 h-[2px] bg-black"></span>
            <span className="w-5 h-[2px] bg-black"></span>
            <span className="w-5 h-[2px] bg-black"></span>
          </div>
        </div>

        <h1 className="text-center font-thin text-[28px] md:text-[40px] text-black mt-[10vh]">
          Will it be Utopia, or Oblivion?
        </h1>

        <div
          ref={mountRef}
          className={`w-full h-[500px] fixed ${
            isScrolled ? 'bottom-3 mb-7' : 'bottom-0'
          } left-0 z-10 cursor-pointer`}
        />
        {!isLoaded && (
          <div className="absolute bottom-[150px] w-full text-center text-lg text-black font-medium z-10">
            Loading...
          </div>
        )}
      </section>

      <div
        key={currentIndex}
        className={`overflow-x-hidden absolute top-[144%] translate-y-[-50%] right-10 z-[5] bg-gradient-to-r from-[#A7C7E7] to-[#95cdf0] py-9 rounded-lg w-[40%] text-black px-6 ${getAnimationClass()} shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300`}
        style={{ opacity: fade && !isWaiting ? 1 : 0 }}
      >
        <p className="text-sm tracking-widest text-gray-700 uppercase mb-4">
          {currentText?.heading}
        </p>
        {Array.isArray(currentText?.subheading) ? (
          <ul className="list-disc pl-5 space-y-1 text-[15px] font-medium leading-relaxed">
            {currentText.subheading.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : (
          <h2 className="text-[18px] font-medium leading-relaxed">
            {currentText?.subheading}
          </h2>
        )}
      </div>

      {isWaiting && (
        <div className="absolute top-[150%] translate-y-[-50%] right-10 z-10 w-[40%] text-black px-6 opacity-50">
          <p className="text-sm tracking-widest text-gray-700 uppercase mb-4">
            Processing...
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInAndFade {
          0% {
            transform: translateX(100%) scale(1);
            opacity: 0;
          }
          25% {
            transform: translateX(0%) scale(1);
            opacity: 1;
          }
          50%  {
            transform: translateX(-20%) translateY(-100%)  scale(0.8);
            opacity: 1;
          }
           
             
          100% {
            transform: translateX(-90%) translateY(-40%)   scale(0.2);
            opacity: 1;
          }
        }

        @keyframes fadeInFromGlobeAndExitLikeSummary {
          0% {
            transform: translateX(-50%) scale(0.2);
            opacity: 0;
          }
          25% {
            transform: translateX(0%) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateX(0%) scale(1);
            opacity: 1;
          }
          70% {
            transform: translateX(-20%) translateY(-100%) scale(0.9);
            opacity: 1;
          }
          100% {
            transform: translateX(-90%) translateY(-100%) scale(0.2);
            opacity: 1;
          }
        }

        .animate-slideInAndFade {
          animation: slideInAndFade 3s linear forwards;
        }

        .animate-emitFromGlobe {
          animation: fadeInFromGlobeAndExitLikeSummary 3s linear forwards;
        }
      `}</style>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f5ff;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(
            to bottom,
            #3d5eb8,
            #9bceff,
            #f8fcff
          );
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            to bottom,
            #2c4aad,
            #86b8e4,
            #e3f3ff
          );
        }

        body {
          scrollbar-width: thin;
          scrollbar-color: #9bceff #f1f5ff;
        }
      `}</style>
    </>
  );
};

export default Sec1;
