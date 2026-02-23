(() => {
    const canvas = document.getElementById("histoCanvas");
    if (!canvas) return;
  
    const ctx = canvas.getContext("2d", { alpha: true });
  
    // Use CSS-pixel coords. Canvas is scaled to device pixels internally.
    let W = 0, H = 0, dpr = 1;
  
    const rand = (a, b) => a + Math.random() * (b - a);
  
    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
  
      // internal pixel buffer
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  
      // draw in CSS pixels
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  
      W = rect.width;
      H = rect.height;
    }
  
    // ---------- sprite loader ----------
    function loadImage(url) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load: " + url));
        img.src = url;
      });
    }
  
    const sprites = {};
  
    async function loadSprites() {
      // robust base path
      const base = new URL("/assets/sprites/", window.location.origin);
  
      const urls = {
        cancer: new URL("cancer_cluster.svg", base).href,
        fiber: new URL("fiber_strand.svg", base).href,
        fibro1: new URL("fibroblast1.svg", base).href,
        fibro2: new URL("fibroblast2.svg", base).href,
        tcell: new URL("t_cell.svg", base).href,
        macrophage: new URL("macrophage.svg", base).href,
        purpleCells: new URL("purple_cells.svg", base).href,
        vessels: new URL("vessels_corner.svg", base).href,
        anthracosis: new URL("anthracosis.svg", base).href,
      };
  
      console.log("[histoCanvas] Loading sprites:", urls);
  
      const [
        cancer,
        fiber,
        fibro1,
        fibro2,
        tcell,
        macrophage,
        purpleCells,
        vessels,
        anthracosis,
      ] = await Promise.all([
        loadImage(urls.cancer),
        loadImage(urls.fiber),
        loadImage(urls.fibro1),
        loadImage(urls.fibro2),
        loadImage(urls.tcell),
        loadImage(urls.macrophage),
        loadImage(urls.purpleCells),
        loadImage(urls.vessels),
        loadImage(urls.anthracosis),
      ]);
  
      sprites.cancer = cancer;
      sprites.fiber = fiber;
      sprites.fibro1 = fibro1;
      sprites.fibro2 = fibro2;
      sprites.tcell = tcell;
      sprites.macrophage = macrophage;
      sprites.purpleCells = purpleCells;
      sprites.vessels = vessels;
      sprites.anthracosis = anthracosis;
  
      console.log("[histoCanvas] Sprites loaded OK");
    }
  
    // draw helpers (CSS pixels)
    function drawSprite(img, x, y, size, rot = 0, alpha = 1) {
      if (!img) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  
    // fiber_strand is ribbon-like: wide & short
    function drawRibbon(img, x, y, w, h, rot = 0, alpha = 1) {
      if (!img) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
  
    // draw with optional flip (for corner vessels mirroring)
    function drawSpriteFlip(img, x, y, size, rot = 0, alpha = 1, flipX = false, flipY = false) {
      if (!img) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  
    // ---------- scene ----------
    const fibers = [];
    const fibros = [];
    const tcells = [];
    const fibroHive = [];
    const floaters = []; // macrophage + purple cells (subtle)
    const overlays = {
      anth: [], // anthracosis patches
    };
    const scene = { cancer: null };
  
    function initScene() {
      fibers.length = 0;
      fibros.length = 0;
      tcells.length = 0;
      floaters.length = 0;
      overlays.anth.length = 0;
  
      const cx = W / 2;
      const cy = H / 2;
  
      const R_fiber = Math.min(W, H) * 0.46;
      const R_fibro = Math.min(W, H) * 0.35;
      const R_t_outer = Math.min(W, H) * 0.46;

      fibroHive.length = 0;

      // tamaño y separación tipo colmena
      const cellSize = rand(26, 44);                 // tamaño fibroblasto (CSS px)
      const spacing = cellSize * 1.25;               // separación base
      const hexH = spacing;                           // distancia vertical entre centros
      const hexW = spacing * 1.15;                    // distancia horizontal entre centros
      const rowOffset = hexW * 0.5;                   // offset para filas pares/impares

        // área donde quieres la colmena (ej: banda alrededor del centro)
      const innerR = Math.min(W, H) * 0.24;          // hueco central (no dibujar)
      const outerR = Math.min(W, H) * 0.48;          // hasta dónde llega

        // genera grid suficiente para cubrir el canvas
      const rows = Math.ceil(H / (hexH * 0.86)) + 2;
      const cols = Math.ceil(W / hexW) + 2;

      for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
          const x0 = c * hexW + ((r % 2) ? rowOffset : 0);
          const y0 = r * (hexH * 0.86);

            // centrado a mitad del canvas
          const x = x0 - (cols * hexW) / 2 + W / 2;
          const y = y0 - (rows * (hexH * 0.86)) / 2 + H / 2;

            // máscara anular para que sea “banda colmena”
          const dx = x - W / 2;
          const dy = y - H / 2;
          const dist = Math.hypot(dx, dy);
          //if (dist < innerR || dist > outerR) continue;

          fibroHive.push({
          kind: (r + c) % 2 === 0 ? "fibro1" : "fibro2",
          x,
          y,
          size: rand(22, 44),
          rot: rand(-0.6, 0.6),
          a: rand(0.10, 0.1),
            // jitter vivo
          jx: rand(0, Math.PI * 2),
          jy: rand(0, Math.PI * 2),
          js: rand(0.6, 1.4),
          });
      }
      }

        // movimiento global tipo “desplazamiento”
      scene.hive = {
      vx: rand(-0.8, 0.8), // px/seg (muy suave)
      vy: rand(-0.6, 0.6),
      px: 0,
      py: 0,
      wrapX: hexW,
      wrapY: hexH * 0.86,
      };
  
      // fiber strands in ring
      const N_FIBERS = 162;
      for (let i = 0; i < N_FIBERS; i++) {
        const a = (i / N_FIBERS) * Math.PI * 2 + rand(-0.06, 0.06);
        const r = R_fiber + rand(-34, 34);
        fibers.push({
          a,
          r,
          w: rand(180, 320),
          h: rand(10, 28),
          alpha: rand(0.10, 0.22),
          spin: rand(-0.02, 0.02),
          wob: rand(0.6, 1.6),
        });
      }
  
      // fibroblasts around cancer
      const N_FIBROS = 58;
      for (let i = 0; i < N_FIBROS; i++) {
        const kind = i % 2 === 0 ? "fibro1" : "fibro2";
        fibros.push({
          kind,
          a: (i / N_FIBROS) * Math.PI * 2 + rand(-0.18, 0.18),
          r: R_fibro + rand(-8, 8),
          size: rand(20, 60),
          alpha: rand(0.70, 0.95),
          speed: rand(0.010, 0.05) * (Math.random() < 0.5 ? -1 : 1),
        });
      }
  
      // t-cells: some outside + one inside
      const N_T_OUT = 8;
      for (let i = 0; i < N_T_OUT; i++) {
        tcells.push({
          kind: "tcell",
          inside: false,
          a: rand(0, Math.PI * 2),
          r: R_t_outer + rand(-10, 18),
          size: rand(42, 60),
          alpha: rand(0.75, 0.95),
          speed: rand(0.06, 0.14) * (Math.random() < 0.5 ? -1 : 1),
        });
      }
      tcells.push({
        kind: "tcell",
        inside: true,
        a: rand(0, Math.PI * 2),
        r: Math.min(W, H) * 0.10 + rand(-6, 10),
        size: rand(36, 50),
        alpha: 0.95,
        speed: rand(0.10, 0.18) * (Math.random() < 0.5 ? -1 : 1),
      });
  
      // macrophage: 1 outside (slow orbit)
      floaters.push({
        kind: "macrophage",
        a: rand(0, Math.PI * 2),
        r: Math.min(W, H) * 0.54 + rand(-10, 18),
        size: rand(78, 110),
        alpha: 0.70,
        speed: rand(0.020, 0.045) * (Math.random() < 0.5 ? -1 : 1),
        spin: rand(-0.6, 0.6),
      });
      // macrophage: 1 outside (slow orbit)
      floaters.push({
        kind: "macrophage",
        a: rand(0, Math.PI * 2),
        r: Math.min(W, H) * 0.44 + rand(-10, 18),
        size: rand(78, 110),
        alpha: 0.70,
        speed: rand(0.090, 0.045) * (Math.random() < 0.5 ? -1 : 1),
        spin: rand(-0.6, 0.6),
      });
      // macrophage: 1 outside (slow orbit)
      floaters.push({
        kind: "macrophage",
        a: rand(0, Math.PI * 2),
        r: Math.min(W, H) * 0.54 + rand(-10, 18),
        size: rand(78, 110),
        alpha: 0.70,
        speed: rand(0.020, 0.045) * (Math.random() < 0.5 ? -1 : 1),
        spin: rand(-0.6, 0.6),
      });
      // macrophage: 1 outside (slow orbit)
      floaters.push({
        kind: "macrophage",
        a: rand(0, Math.PI * 2),
        r: Math.min(W, H) * 0.44 + rand(-10, 18),
        size: rand(78, 110),
        alpha: 0.95,
        speed: rand(0.090, 0.045) * (Math.random() < 0.5 ? -1 : 1),
        spin: rand(-0.6, 0.6),
      });
  
      // purple cells: subtle clusters in periphery (2–3)
      const N_PURP = 3;
      for (let i = 0; i < N_PURP; i++) {
        floaters.push({
          kind: "purpleCells",
          a: rand(0, Math.PI * 2),
          r: Math.min(W, H) * 0.60 + rand(-30, 30),
          size: rand(70, 120),
          alpha: rand(0.55, 0.85),
          speed: rand(0.003, 0.008) * (Math.random() < 0.5 ? -1 : 1),
          spin: rand(-0.5, 0.5),
        });
      }
  
      // anthracosis: 2 subtle overlays, fixed-ish
      const N_ANTH = 30;
      for (let i = 0; i < N_ANTH; i++) {
      floaters.push({
          kind: "anthracosis",
          a: rand(0, Math.PI * 2),
          r: Math.min(W, H) * rand(0.52, 0.72),
          size: rand(Math.min(W, H) * 0.28, Math.min(W, H) * 0.35),
          alpha: rand(0.99, 0.99), // visible but not totally opaque
          speed: rand(0.0015, 0.004) * (Math.random() < 0.5 ? -1 : 1), // very slow
          spin: rand(-0.25, 0.25),
        });
        }

      scene.cancer = {
      x: cx,
      y: cy,
      size: Math.min(W, H) * 0.88,
      rot: 0,
      alpha: 0.95,
      };
    }
  
    let last = performance.now();
  
    function fallbackDebug() {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, Math.min(W, H) * 0.25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  
    function step(now) {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
  
      ctx.clearRect(0, 0, W, H);
  
      if (!sprites.cancer || !sprites.fiber) {
        fallbackDebug();
        requestAnimationFrame(step);
        return;
      }
  
      const cx = W / 2;
      const cy = H / 2;
  
      // 0) Corner vessels (fixed, subtle; mirrored)
      if (sprites.vessels) {
        const s = Math.min(W, H) * 0.90;
        // bottom-left
        drawSpriteFlip(sprites.vessels, W * 0.18, H * 0.82, s, 0.15, 0.40, false, false);
        // top-right (mirrored)
        drawSpriteFlip(sprites.vessels, W * 0.86, H * 0.22, s, -2.85, 0.45, true, false);
      }
  
      // 1) fiber ring background
      const ringRot = now * 0.00005;
      for (const f of fibers) {
        f.a += f.spin * dt;
        const a = f.a + ringRot * f.wob;
        const x = cx + Math.cos(a) * f.r;
        const y = cy + Math.sin(a) * f.r;
        const rot = a + Math.PI / 2;
        drawRibbon(sprites.fiber, x, y, f.w, f.h, rot, f.alpha);
      }
      // 3) fibroblasts honeycomb band
      if (scene.hive) {
          scene.hive.px += scene.hive.vx * dt;
          scene.hive.py += scene.hive.vy * dt;
      
          // wrap para que parezca infinito
          const wx = scene.hive.wrapX;
          const wy = scene.hive.wrapY;
          const ox = ((scene.hive.px % wx) + wx) % wx;
          const oy = ((scene.hive.py % wy) + wy) % wy;
      
          for (const f of fibroHive) {
            // jitter suave por fibro
          const jx = Math.sin(now * 0.001 + f.jx) * 2.2 * f.js;
          const jy = Math.cos(now * 0.0011 + f.jy) * 2.0 * f.js;
        
          const x = f.x + jx + ox - wx * 0.5;
          const y = f.y + jy + oy - wy * 0.5;
        
            // rotación muy leve
          const rot = f.rot + Math.sin(now * 0.0008 + f.jx) * 0.08;
        
          drawSprite(sprites[f.kind], x, y, f.size, rot, f.a);
          }
      }
  
      // 2) anthracosis overlay (under cells, above fibers)
      if (sprites.anthracosis) {
        for (const p of overlays.anth) {
          // tiny breathing so it doesn't look pasted
          const a = p.alpha * (1 + Math.sin(now * 0.001 + p.rot) * 0.06);
          drawSprite(sprites.anthracosis, p.x, p.y, p.size, p.rot, a);
        }
      }
  
      // 3) cancer center (subtle pulse) - 2 clusters
      const pulse = 1 + Math.sin(now * 0.0012) * 0.01;
      scene.cancer.rot += dt * 0.08;
      const baseSize = scene.cancer.size * pulse;
  
      drawSprite(sprites.cancer, cx, cy, baseSize, scene.cancer.rot, 0.92);
  
      drawSprite(
        sprites.cancer,
        cx + Math.min(W, H) * 0.03,
        cy - Math.min(W, H) * 0.02,
        baseSize * 0.92,
        -scene.cancer.rot * 1.3,
        0.80
      );
  
      // 4) fibroblasts ring
      for (const fb of fibros) {
        fb.a += fb.speed * dt;
        const x = cx + Math.cos(fb.a) * fb.r;
        const y = cy + Math.sin(fb.a) * fb.r;
        const rot = fb.a + Math.PI / 2;
        drawSprite(sprites[fb.kind], x, y, fb.size, rot, fb.alpha);
      }
  
      // 5) T-cells
      for (const tc of tcells) {
        tc.a += tc.speed * dt;
        const x = cx + Math.cos(tc.a) * tc.r;
        const y = cy + Math.sin(tc.a) * tc.r;
        drawSprite(sprites.tcell, x, y, tc.size, tc.a, tc.alpha);
      }
  
      // 6) Floaters: macrophage + purple cell clusters (outer microenvironment)
      for (const o of floaters) {
        if (!sprites[o.kind]) continue;
        o.a += o.speed * dt;
        const x = cx + Math.cos(o.a) * o.r;
        const y = cy + Math.sin(o.a) * o.r;
        const rot = o.a + (o.spin || 0) * 0.01 * now * 0.001;
        drawSprite(sprites[o.kind], x, y, o.size, rot, o.alpha);
      }
  
      requestAnimationFrame(step);
    }
  
    // boot
    (async () => {
      try {
        resize();
        await loadSprites();
        initScene();
        requestAnimationFrame(step);
      } catch (e) {
        console.error("[histoCanvas] ERROR:", e);
        resize();
        requestAnimationFrame(step);
      }
    })();
  
    window.addEventListener("resize", () => {
      resize();
      initScene();
    });
  })();


  
  