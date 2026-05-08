/* ===============================================
   LOGO 3D — extruded NEMO cube, Three.js
   Fixed-position rotating cube acting as background.
   Each section has a different camera/cube orientation.
   =============================================== */

const { useEffect, useRef } = React;

function Logo3D({ enabled = true }) {
  const mountRef = useRef(null);
  const stateRef = useRef({
    scrollY: 0,
    targetScrollY: 0,
    sectionT: 0,        // smoothed section progress 0..N
    targetSectionT: 0,
  });

  useEffect(() => {
    if (!enabled) return;
    if (!mountRef.current) return;
    let cancelled = false;

    const init = async () => {
      // Load three.js once
      if (!window.THREE) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://unpkg.com/three@0.160.0/build/three.min.js";
          s.onload = res;
          s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      if (cancelled) return;
      const THREE = window.THREE;
      const mount = mountRef.current;
      if (!mount) return;

      /* ---------- Scene ---------- */
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / mount.clientHeight, 0.1, 100);
      camera.position.set(0, 0, 18);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);

      /* ---------- Lights ---------- */
      const amb = new THREE.AmbientLight(0xffffff, 0.55);
      scene.add(amb);
      const key = new THREE.DirectionalLight(0xffffff, 1.4);
      key.position.set(4, 6, 6);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xc1876b, 0.9); // sandstone rim
      rim.position.set(-6, 2, -3);
      scene.add(rim);
      const fill = new THREE.DirectionalLight(0x3f486e, 0.7); // accent fill
      fill.position.set(0, -5, 4);
      scene.add(fill);

      /* ---------- Cube with logo & placeholder textures ---------- */
      const loader = new THREE.TextureLoader();

      // Generate placeholder face textures programmatically with logo + label
      const logoImg = await new Promise((res) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => res(img);
        img.onerror = () => res(null);
        img.src = "assets/logo-nemo-white.png";
      });

      const FACES = [
        { bg: "#1a1a1a", fg: "#f1ede5", label: "NEMO HUB",   sub: "01 / Brand" },
        { bg: "#3f486e", fg: "#f1ede5", label: "BACKSTAGE",  sub: "02 / Stage" },
        { bg: "#c1876b", fg: "#1a1a1a", label: "SANREMO",    sub: "03 / Roots" },
        { bg: "#1a1a1a", fg: "#c1876b", label: "BOUTIQUE",   sub: "04 / Format" },
        { bg: "#e9e3d6", fg: "#1a1a1a", label: "WARNER ED.", sub: "05 / Cases" },
        { bg: "#1a1a1a", fg: "#f1ede5", label: "PLAY",       sub: "06 / Tour" },
      ];

      function makeFaceTexture(spec) {
        const SZ = 1024;
        const c = document.createElement("canvas");
        c.width = SZ; c.height = SZ;
        const g = c.getContext("2d");

        // Background
        g.fillStyle = spec.bg;
        g.fillRect(0, 0, SZ, SZ);

        // Subtle grain / vignette
        const grad = g.createRadialGradient(SZ * 0.3, SZ * 0.25, 80, SZ / 2, SZ / 2, SZ * 0.9);
        grad.addColorStop(0, "rgba(255,255,255,0.10)");
        grad.addColorStop(1, "rgba(0,0,0,0.35)");
        g.fillStyle = grad;
        g.fillRect(0, 0, SZ, SZ);

        // Outer frame
        g.strokeStyle = spec.fg;
        g.globalAlpha = 0.35;
        g.lineWidth = 6;
        g.strokeRect(40, 40, SZ - 80, SZ - 80);
        g.globalAlpha = 1;

        // Top corners labels
        g.fillStyle = spec.fg;
        g.font = "500 28px 'Space Grotesk', Helvetica, sans-serif";
        g.textBaseline = "top";
        g.fillText("NEMO HUB · 2026", 80, 80);
        g.textAlign = "right";
        g.fillText(spec.sub, SZ - 80, 80);
        g.textAlign = "left";

        // Center logo
        if (logoImg) {
          const lw = 600;
          const lh = (logoImg.height / logoImg.width) * lw;
          g.save();
          // tint white logo to fg color via offscreen
          const off = document.createElement("canvas");
          off.width = lw; off.height = lh;
          const og = off.getContext("2d");
          og.drawImage(logoImg, 0, 0, lw, lh);
          og.globalCompositeOperation = "source-in";
          og.fillStyle = spec.fg;
          og.fillRect(0, 0, lw, lh);
          g.drawImage(off, (SZ - lw) / 2, (SZ - lh) / 2 - 60);
          g.restore();
        }

        // Bottom label
        g.fillStyle = spec.fg;
        g.font = "500 96px 'Space Grotesk', Helvetica, sans-serif";
        g.textAlign = "center";
        g.fillText(spec.label, SZ / 2, SZ - 220);

        // Bottom meta
        g.font = "400 24px 'Inter', Helvetica, sans-serif";
        g.globalAlpha = 0.7;
        g.fillText("UN SOLO TEAM, TU, VIVI L'EVENTO", SZ / 2, SZ - 130);
        g.globalAlpha = 1;

        const tex = new THREE.CanvasTexture(c);
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
      }

      const materials = FACES.map((f) => new THREE.MeshStandardMaterial({
        map: makeFaceTexture(f),
        roughness: 0.35,
        metalness: 0.55,
      }));

      const SIZE = 8.0;
      const geom = new THREE.BoxGeometry(SIZE, SIZE, SIZE, 1, 1, 1);
      // bevel via separate edges
      const cube = new THREE.Mesh(geom, materials);
      scene.add(cube);

      // Soft edges: add wireframe highlight
      const edges = new THREE.EdgesGeometry(geom);
      const edgeLine = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0xc1876b, transparent: true, opacity: 0.35 })
      );
      cube.add(edgeLine);

      /* ---------- Resize ---------- */
      const onResize = () => {
        if (!mount) return;
        const w = mount.clientWidth, h = mount.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);

      /* ---------- Scroll & section tracking ---------- */
      const getSectionProgress = () => {
        // Find section data-screen-label elements; compute fractional index
        const secs = Array.from(document.querySelectorAll("[data-screen-label]"));
        if (!secs.length) return 0;
        const vh = window.innerHeight;
        const focus = window.scrollY + vh * 0.4;
        let prog = 0;
        for (let i = 0; i < secs.length; i++) {
          const r = secs[i].getBoundingClientRect();
          const top = r.top + window.scrollY;
          const bot = top + r.height;
          if (focus >= top && focus < bot) {
            prog = i + (focus - top) / (bot - top);
            return prog;
          }
          if (focus < top) return Math.max(0, i - 1 + 0.999);
        }
        return secs.length - 1;
      };

      const onScroll = () => {
        stateRef.current.targetScrollY = window.scrollY;
        stateRef.current.targetSectionT = getSectionProgress();
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });

      /* ---------- Animate ---------- */
      let raf;
      const animate = () => {
        if (cancelled) return;
        const st = stateRef.current;
        st.scrollY += (st.targetScrollY - st.scrollY) * 0.08;
        st.sectionT += (st.targetSectionT - st.sectionT) * 0.06;

        const t = performance.now() * 0.001;
        // Continuous slow tumble
        const idleX = Math.sin(t * 0.18) * 0.18;
        const idleY = t * 0.10;
        const idleZ = Math.cos(t * 0.15) * 0.08;

        // Per-section "lock" rotations — each section snaps to a different face dominantly
        const faceRots = [
          [ 0.10,  0.20,  0.00],     // 01 hero
          [-0.30,  Math.PI * 0.55,  0.10], // 02 about
          [ 0.40,  Math.PI * 1.05, -0.10], // 03 services
          [-0.20,  Math.PI * 1.55,  0.20], // 04 cases
          [ 0.30,  Math.PI * 0.30, -0.15], // 05 team
          [-0.40,  Math.PI * 0.85,  0.10], // 06 territory
          [ 0.20,  Math.PI * 1.30, -0.20], // 07 clients
          [ 0.00,  Math.PI * 1.85,  0.00], // 08 contact
        ];

        const i = Math.floor(st.sectionT);
        const f = st.sectionT - i;
        const a = faceRots[Math.max(0, Math.min(faceRots.length - 1, i))];
        const b = faceRots[Math.max(0, Math.min(faceRots.length - 1, i + 1))];
        const lerp = (x, y, k) => x + (y - x) * k;
        const ease = (k) => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const ef = ease(f);

        cube.rotation.x = lerp(a[0], b[0], ef) + idleX;
        cube.rotation.y = lerp(a[1], b[1], ef) + idleY;
        cube.rotation.z = lerp(a[2], b[2], ef) + idleZ;

        // Camera position drifts subtly with section so cube feels parallax
        camera.position.x = Math.sin(st.sectionT * 0.7) * 0.6;
        camera.position.y = Math.cos(st.sectionT * 0.5) * 0.4;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);

      // Cleanup
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("scroll", onScroll);
        renderer.dispose();
        if (mount && renderer.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
        materials.forEach(m => { m.map?.dispose(); m.dispose(); });
        geom.dispose();
        edges.dispose();
      };
    };

    let cleanup;
    init().then((c) => { cleanup = c; });
    return () => { cancelled = true; cleanup && cleanup(); };
  }, [enabled]);

  if (!enabled) return null;
  return <div ref={mountRef} className="cube-stage" />;
}

window.Logo3D = Logo3D;
