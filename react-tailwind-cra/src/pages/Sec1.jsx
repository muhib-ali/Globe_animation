import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { EXRLoader } from 'three-stdlib'
import { motion, AnimatePresence } from 'framer-motion' // ⬅️ added

const Sec1 = () => {
  const THRESHOLD = 200
  const SHOW_MS = 4000
  const FADE_MS = 300
  const PROCESS_MS = 4000

  const [isScrolled, setIsScrolled] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const isPlayingRef = useRef(false)

  const mountRef = useRef(null)
  const modelRef = useRef(null)
  const mouseRef = useRef(new THREE.Vector2())
  const isHoveringRef = useRef(false)
  const isGlowVisibleRef = useRef(false)

  const [isLoaded, setIsLoaded] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [fade, setFade] = useState(true)
  const [isWaiting, setIsWaiting] = useState(false)
  const isWaitingRef = useRef(false)

  // ✅ keep this hook at top-level (NOT inside useEffect)
  const wasAboveRef = useRef(false)

  // keep timer ids for clean cancellation
  const timersRef = useRef({})

  const texts = [
    [
      { heading: 'Genome findings:', subheading: [''], desc: ['Homozygous MTHFR C677T (TT) → impaired methyl-folate recycling; SLC6A4 5-HTTLPR S/S → poor SSRI response'], type: 'slideInAndFade', otype: 'Variant' },
      { heading: 'Molecular findings:', subheading: [''], desc: ['Plasma homocysteine 17 µmol/L (↑); RBC folate 350 ng/mL (low-normal); CSF 5-HIAA below age norms'], type: 'slideInAndFade', otype: 'Variant' },
      { heading: 'Microbiome findings: ', subheading: [''], desc: ['Low Bifidobacterium and Akkermansia abundance; high gut-derived LPS gene counts indicating systemic inflammation'], type: 'slideInAndFade', otype: 'Variant' },
      { heading: 'Clinical diagnosis:', subheading: [''], desc: ['Major depressive disorder, SSRI-resistant subtype'], type: 'emit', otype: 'Recommendation' },
      { heading: 'Clinical recommendation:', subheading: [''], desc: ['L-methylfolate 15 mg qd (± SAMe); switch from SSRI to vortioxetine; introduce high-CFU B. longum 1714 psychobiotic; anti-inflammatory, high-prebiotic diet'], type: 'emit', otype: 'Recommendation' },
    ],
  ]

  const createSequentialArray = () => {
    const sequentialTexts = []

    const pushItems = (arr = []) => {
      arr.forEach((item) => {
        const subsArr = Array.isArray(item.subheading) ? item.subheading : [item.subheading]
        const descArr = Array.isArray(item.desc) ? item.desc : [item.desc]
        const cleanSubs = subsArr.filter((s) => s && String(s).trim() !== '')
        const cleanDescs = descArr.filter((d) => d && String(d).trim() !== '')

        if (cleanSubs.length) {
          cleanSubs.forEach((sub) => {
            sequentialTexts.push({ heading: item.heading, subheading: sub, desc: null, otype: item.otype, type: item.type })
          })
        } else if (cleanDescs.length) {
          cleanDescs.forEach((d) => {
            sequentialTexts.push({ heading: item.heading, subheading: null, desc: d, otype: item.otype, type: item.type })
          })
        } else {
          sequentialTexts.push({ heading: item.heading, subheading: null, desc: null, otype: item.otype, type: item.type })
        }
      })
    }

    texts.forEach((section) => {
      const summaries       = section.filter((i) => i.otype === 'Summary')
      const variants        = section.filter((i) => i.otype === 'Variant')
      const recommendations = section.filter((i) => i.otype === 'Recommendation')
      const diagnoses       = section.filter((i) => i.otype === 'Diagnosis')

      pushItems(summaries)
      pushItems(variants)

      if (recommendations.length) {
        const bundleItems = recommendations.map((item) => {
          const subsArr = Array.isArray(item.subheading) ? item.subheading : [item.subheading]
          const descArr = Array.isArray(item.desc) ? item.desc : [item.desc]
          const cleanSubs = subsArr.filter((s) => s && String(s).trim() !== '')
          const cleanDescs = descArr.filter((d) => d && String(d).trim() !== '')
          const text = cleanSubs[0] ?? cleanDescs[0] ?? ''
          return { heading: item.heading, text }
        })

        sequentialTexts.push({
          heading: 'Recommendations',
          otype: 'Recommendation',
          type: 'emit',
          bundle: bundleItems,
        })
      }

      pushItems(diagnoses)
    })

    return sequentialTexts
  }

  const flatTexts = createSequentialArray()

  const clearAllTimers = () => {
    if (timersRef.current.show) clearTimeout(timersRef.current.show)
    if (timersRef.current.fade) clearTimeout(timersRef.current.fade)
    if (timersRef.current.process) clearTimeout(timersRef.current.process)
    timersRef.current = {}
  }

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  const scheduleNextStep = (idx) => {
    timersRef.current.show = setTimeout(() => {
      setFade(false)
      timersRef.current.fade = setTimeout(() => {
        const nextIndex = (idx + 1) % flatTexts.length
        const currentType = flatTexts[idx]?.otype
        const nextType = flatTexts[nextIndex]?.otype
        const needsProcessingPause = currentType === 'Variant' && (nextType === 'Diagnosis' || nextType === 'Recommendation')

        if (needsProcessingPause) {
          setIsWaiting(true)
          isWaitingRef.current = true
        }

        timersRef.current.process = setTimeout(() => {
          if (!isPlayingRef.current) return
          setIsWaiting(false)
          isWaitingRef.current = false
          setCurrentIndex(nextIndex)
          setFade(true)
          scheduleNextStep(nextIndex)
        }, needsProcessingPause ? PROCESS_MS : 0)
      }, FADE_MS)
    }, SHOW_MS)
  }

  const startSequence = () => {
    clearAllTimers()
    setIsPlaying(true)
    isPlayingRef.current = true
    setIsWaiting(false)
    isWaitingRef.current = false
    setCurrentIndex(0)
    setFade(true)
    scheduleNextStep(0)
  }

  const resetSequence = () => {
    clearAllTimers()
    setIsPlaying(false)
    isPlayingRef.current = false
    setIsWaiting(false)
    isWaitingRef.current = false
    setCurrentIndex(0)
    setFade(true)
  }

  // scroll handler — start when crossing > THRESHOLD, reset when back <= THRESHOLD
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setIsScrolled(y > 100)
      isGlowVisibleRef.current = y > THRESHOLD

      const above = y > THRESHOLD
      if (above && !wasAboveRef.current) {
        wasAboveRef.current = true
        startSequence()
      } else if (!above && wasAboveRef.current) {
        wasAboveRef.current = false
        resetSequence()
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      clearAllTimers()
    }
  }, []) // run once

  // === THREE.js scene
  useEffect(() => {
    if (!mountRef.current) return

    const width = mountRef.current.clientWidth
    const height = mountRef.current.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
    camera.position.z = 3

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setPixelRatio(window.devicePixelRatio)
    mountRef.current.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    new EXRLoader().load('/hdr/studio_small_08_1k.exr', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping
      scene.environment = texture
    })

    const handleMouseMove = (event) => {
      if (!mountRef.current) return
      const bounds = mountRef.current.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1
      isHoveringRef.current = true
    }

    const handleMouseLeave = () => {
      const scrollY = window.scrollY
      isGlowVisibleRef.current = scrollY > THRESHOLD
      setIsScrolled(scrollY > 100)
      isHoveringRef.current = false
    }

    mountRef.current.addEventListener('mousemove', handleMouseMove)
    mountRef.current.addEventListener('mouseleave', handleMouseLeave)

    const loader = new GLTFLoader()
    loader.load('/models/sample2.glb', (gltf) => {
      const model = gltf.scene
      model.scale.set(4, 4, 4)
      const box = new THREE.Box3().setFromObject(model)
      const center = new THREE.Vector3()
      box.getCenter(center)
      model.position.sub(center)
      model.position.y = -1.5

      model.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.color = new THREE.Color('#0077FF')
          child.material.metalness = 0.9
          child.material.roughness = 0.5
          child.material.envMapIntensity = 0.2
          child.material.needsUpdate = true
        }
      })

      scene.add(model)
      modelRef.current = model
      setIsLoaded(true)

      const animate = () => {
        requestAnimationFrame(animate)

        if (modelRef.current) {
          const scrollY = window.scrollY
          const baseY = -1.5 + scrollY * 0.0025
          const baseX = -Math.min(scrollY / 800, 1) * 1.5

          modelRef.current.position.x = baseX
          modelRef.current.position.y = baseY
          modelRef.current.position.z = 0

          const scale = 3 - Math.min(scrollY / 800, 1)
          const pulseScale =
            isWaitingRef.current && scrollY > THRESHOLD
              ? scale + Math.sin(Date.now() * 0.005) * 0.1
              : scale

          modelRef.current.scale.set(pulseScale, pulseScale, pulseScale)
          modelRef.current.rotation.y += 0.003

          const baseTilt = Math.min(scrollY / 600, 0.6)

          if (isHoveringRef.current && scrollY > THRESHOLD) {
            const mouseInfluenceX = mouseRef.current.y * 0.15
            const mouseInfluenceZ = mouseRef.current.x * 0.08

            modelRef.current.rotation.x = THREE.MathUtils.lerp(
              modelRef.current.rotation.x,
              baseTilt + mouseInfluenceX,
              0.05
            )
            modelRef.current.rotation.z = THREE.MathUtils.lerp(
              modelRef.current.rotation.z,
              mouseInfluenceZ,
              0.05
            )

            modelRef.current.traverse((child) => {
              if (child.isMesh && child.material) {
                child.material.envMapIntensity = THREE.MathUtils.lerp(child.material.envMapIntensity, 0.5, 0.02)
                child.material.metalness = THREE.MathUtils.lerp(child.material.metalness, 0.95, 0.02)
              }
            })
          } else {
            modelRef.current.rotation.x = THREE.MathUtils.lerp(modelRef.current.rotation.x, baseTilt, 0.03)
            modelRef.current.rotation.z = THREE.MathUtils.lerp(modelRef.current.rotation.z, 0, 0.03)

            modelRef.current.traverse((child) => {
              if (child.isMesh && child.material) {
                child.material.envMapIntensity = THREE.MathUtils.lerp(child.material.envMapIntensity, 0.2, 0.02)
                child.material.metalness = THREE.MathUtils.lerp(child.material.metalness, 0.9, 0.02)
              }
            })
          }
        }

        renderer.render(scene, camera)
      }

      animate()
    })

    return () => {
      if (mountRef.current) {
        mountRef.current.removeEventListener('mousemove', handleMouseMove)
        mountRef.current.removeEventListener('mouseleave', handleMouseLeave)
      }
      if (renderer && mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  const currentText = flatTexts[currentIndex]

  const getAnimationClass = () => {
    setTimeout(() => {
      
    }, 3000);
    if (!isPlaying) return ''
    const currentType = currentText?.otype
    if (isWaiting) return 'opacity-0'
    if (currentType === 'Summary' || currentType === 'Variant') return 'animate-slideInAndFade'
    if (currentType === 'Diagnosis' || currentType === 'Recommendation') return 'animate-emitFromGlobe'
    return 'opacity-100'
  }

  const showVariantHeading = isScrolled && !isWaiting && currentText?.otype === 'Variant'

  return (
    <>
      {/* BG + stars */}
      <div className="bg pointer-events-none" />
      <div className="star-field pointer-events-none">
        <div className="layer" />
        <div className="layer" />
        <div className="layer" />
      </div>

      {/* Content */}
      <section className="relative w-full min-h-[200vh] overflow-x-hidden">
        <div className="flex items-center justify-between px-6 py-4 z-20 sticky top-0 bg-transparent">
          <div className="text-white font-bold text-xl leading-tight tracking-tight">
            <div>Bioscope.AI</div>
            {/* <div>YARD</div> */}
          </div>
          {/* <div className="w-9 h-9 border rounded-md flex flex-col justify-center items-center gap-[3px] cursor-pointer">
            <span className="w-5 h-[2px] bg-white"></span>
            <span className="w-5 h-[2px] bg-white"></span>
            <span className="w-5 h-[2px] bg-white"></span>
          </div> */}
        </div>

        <h1 className="text-center font-thin text-[28px] md:text-[40px] text-white mt-[10vh]">
          Will it be Utopia, or Oblivion?
        </h1>

        {/* Globe mount */}
        <div
          ref={mountRef}
          className={`w-full h-[500px] fixed ${isScrolled ? 'bottom-3 mb-7' : 'bottom-0'} left-0 z-10 cursor-pointer`}
        />

        {!isLoaded && (
          <div className="absolute bottom-[150px] w-full text-center text-lg text-black font-medium z-10">
            Loading...
          </div>
        )}
      </section>

      <div
        aria-hidden
        className="pointer-events-none fixed bottom-0 left-1/2 -translate-x-1/2 h-[500px] z-[6]"
        style={{ width: 'var(--mid-gap)' }}
      />

      {/* ⬇️ Heading with Framer Motion fade on appear */}
      <AnimatePresence>
        {showVariantHeading && (
          <motion.h2
            // key={`heading-${isScrolled}-${currentIndex}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            // exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="variant-heading fixed text-center top-[30px] text-white text-[30px] w-full font-semibold tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] z-[40] pointer-events-none"
          >
            {scrollY>200?" Young Adult With Treatment-Resistant Depression":""}
           
          </motion.h2>
        )}
      </AnimatePresence>

      {isPlaying && (
        <div
          key={currentIndex}
          id="globe"
          className={`overflow-x-hidden absolute top-[132%] translate-y-[-50%]
            z-[5] bg-gradient-to-r from-[#A7C7E7] to-[#95cdf0] py-9 rounded-lg
            w-full max-w-[420px] text-black px-6 ${getAnimationClass()} shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300`}
          style={{ opacity: fade && !isWaiting ? 1 : 0, right: 'calc(2rem + var(--mid-gap))' }}
        >
          {!currentText?.bundle && (
            <p className="text-sm tracking-widest leading-loose text-gray-700 text-[26.66px] font-bold uppercase mb-4">
              {currentText?.heading}
            </p>
          )}

          {currentText?.bundle ? (
            <div className="space-y-1">
              {currentText.bundle.map((b, i) => (
                <div key={i}>
                  <p className="text-sm tracking-widest text-black/80 uppercase mb-1">{b.heading}</p>
                  <p className="text-[19px] leading-relaxed">{b.text}</p>
                </div>
              ))}
            </div>
          ) : currentText?.subheading && String(currentText.subheading).trim() !== '' ? (
            <h2 className="text-[22.6px] font-medium leading-relaxed">{currentText.subheading}</h2>
          ) : (
            <p className="text-[19px] font-normal leading-relaxed">{currentText?.desc}</p>
          )}
        </div>
      )}

      {isWaiting && isPlaying && (
        <div
          className="absolute top-[150%] translate-y-[-50%] z-10 w-[420px] text-black px-6 opacity-50"
          style={{ right: 'calc(2rem + var(--mid-gap))' }}
        >
          <p className="text-sm tracking-widest text-white uppercase mb-4">Processing...</p>
        </div>
      )}

      <style>{`
        :root { --mid-gap: 5vw; }

        @keyframes slideInAndFade {
          0% { transform: translateX(200%) scale(1); opacity: 0; }
          25%,35%,40% { transform: translateX(0%) scale(1); opacity: 1; }
          50% { transform: translateX(-20%) translateY(-70%) scale(0.8); opacity: 1; }
          100% { transform: translateX(-100%) translateY(-40%) scale(0.2); opacity: 1; }
        }
        @keyframes fadeInFromGlobeAndExitLikeSummary {
          0% { transform: translateX(-90%) translateY(-40%) scale(0.2); opacity: 0; }
          25% { transform: translateX(0%) scale(1); opacity: 1; }
          50%,70%,100% { transform: translateX(0%) scale(1); opacity: 1; }
        }
        .animate-slideInAndFade { animation: slideInAndFade 5s linear forwards; }
        .animate-emitFromGlobe { animation: fadeInFromGlobeAndExitLikeSummary 5s linear forwards; }

        .bg {
          background: url(https://i.ibb.co/87GbbFP/2799006.jpg) no-repeat;
          background-size: cover;
          height: 100%;
          width: 100%;
          position: fixed; top: 0; left: 0; z-index: -3;
        }
        .bg:before { content: ''; width: 100%; height: 100%; background: #000; position: fixed; z-index: -1; top: 0; left: 0; opacity: 0.3; }

        @keyframes sf-fly-by-1 { from { transform: translateZ(-600px); opacity: .5; } to { transform: translateZ(0); opacity: .5; } }
        @keyframes sf-fly-by-2 { from { transform: translateZ(-1200px); opacity: .5; } to { transform: translateZ(-600px); opacity: .5; } }
        @keyframes sf-fly-by-3 { from { transform: translateZ(-1800px); opacity: .5; } to { transform: translateZ(-1200px); opacity: .5; } }

        .star-field { position: fixed; top: 0; left: 0; width: 100%; height: 100%; perspective: 600px; -webkit-perspective: 600px; z-index: -1; }
        .star-field .layer {
          box-shadow: -411px -476px #ccc, 777px -407px #d4d4d4, -387px -477px #fcfcfc, -91px -235px #d4d4d4,
          491px -460px #f7f7f7, 892px -128px #f7f7f7, 758px -277px #ededed, 596px 378px #ccc, 647px 423px whitesmoke,
          183px 389px #c7c7c7, 524px -237px #f0f0f0, 679px -535px #e3e3e3, 158px 399px #ededed, 157px 249px #ededed,
          81px -450px #ebebeb, 719px -360px #c2c2c2, -499px 473px #e8e8e8, -158px -349px #d4d4d4, 870px -134px #cfcfcf,
          446px 404px #c2c2c2, 440px 490px #d4d4d4, 414px 507px #e6e6e6, -12px 246px #fcfcfc, -384px 369px #e3e3e3,
          641px -413px #fcfcfc, 822px 516px #dbdbdb, 449px 132px #c2c2c2, 727px 146px #f7f7f7, -315px -488px #e6e6e6,
          952px -70px #e3e3e3, -869px -29px #dbdbdb, 502px 80px #dedede, 764px 342px #e0e0e0, -150px -380px #dbdbdb,
          654px -426px #e3e3e3, -325px -263px #c2c2c2, 755px -447px #c7c7c7, 729px -177px #c2c2c2, -682px -391px #e6e6e6,
          554px -176px #ededed, -85px -428px #d9d9d9, 714px 55px #e8e8e8, 359px -285px #cfcfcf, -362px -508px #dedede,
          468px -265px #fcfcfc, 74px -500px #c7c7c7, -514px 383px #dbdbdb, 730px -92px #cfcfcf, -112px 287px #c9c9c9,
          -853px 79px #d6d6d6, 828px 475px #d6d6d6, -681px 13px #fafafa, -176px 209px #f0f0f0, 758px 457px #fafafa,
          -383px -454px #ededed, 813px 179px #d1d1d1, 608px 98px whitesmoke, -860px -65px #c4c4c4, -572px 272px #f7f7f7,
          459px 533px #fcfcfc, 624px -481px #e6e6e6, 790px 477px #dedede, 731px -403px #ededed, 70px -534px #ccc,
          -23px 510px #cfcfcf, -652px -237px whitesmoke, -690px 367px #d1d1d1, 810px 536px #d1d1d1, 774px 293px #c9c9c9,
          -362px 97px #c2c2c2, 563px 47px #dedede, 313px 475px #e0e0e0, 839px -491px #e3e3e3, -217px 377px #d4d4d4,
          -581px 239px #c2c2c2, -857px 72px #ccc, -23px 340px #dedede, -837px 246px white, 170px -502px #cfcfcf,
          822px -443px #e0e0e0, 795px 497px #e0e0e0, -814px -337px #cfcfcf, 206px -339px #f2f2f2, -779px 108px #e6e6e6,
          808px 2px #d4d4d4, 665px 41px #d4d4d4, -564px 64px #ccc, -380px 74px #cfcfcf, -369px -60px #f7f7f7,
          47px -495px #e3e3e3, -383px 368px #f7f7f7, 419px 288px #d1d1d1, -598px -50px #c2c2c2, -833px 187px #c4c4c4,
          378px 325px whitesmoke, -703px 375px #d6d6d6, 392px 520px #d9d9d9, -492px -60px #c4c4c4, 759px 288px #ebebeb,
          98px -412px #c4c4c4, -911px -277px #c9c9c9;
          transform-style: preserve-3d;
          position: absolute; top: 50%; left: 50%; height: 4px; width: 4px; border-radius: 2px;
        }
        .star-field .layer:nth-child(1) { animation: sf-fly-by-1 5s linear infinite; }
        .star-field .layer:nth-child(2) { animation: sf-fly-by-2 5s linear infinite; }
        .star-field .layer:nth-child(3) { animation: sf-fly-by-3 5s linear infinite; }
      `}</style>
    </>
  )
}

export default Sec1
