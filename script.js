function startCalculation() {
  const name1 = document.getElementById("name1").value.trim();
  const name2 = document.getElementById("name2").value.trim();
  const loader = document.getElementById("loader");
  const certificate = document.getElementById("certificate");

  if (name1 === "" || name2 === "") {
    certificate.innerHTML = "<strong>Please enter both names!</strong>";
    certificate.classList.remove("hidden");
    return;
  }

  certificate.classList.add("hidden");
  loader.classList.remove("hidden");

  setTimeout(() => {
    loader.classList.add("hidden");
    showCertificate(name1, name2);
  }, 2000); // Simulate 2 seconds of "calculating"
}

function showCertificate(name1, name2) {
  const loveScore = Math.floor(Math.random() * 101);
  let message = "";

  if (loveScore > 80) {
    message = "💍 A match made in heaven!";
  } else if (loveScore > 50) {
    message = "😊 There's definitely chemistry!";
  } else {
    message = "🤔 Might need some work!";
  }

  const certificate = document.getElementById("certificate");
  certificate.innerHTML = `
    <h2>Certificate of Love</h2>
    <p>This certifies that <strong>${name1}</strong> and <strong>${name2}</strong></p>
    <p>have a love compatibility of <strong>${loveScore}%</strong></p>
    <p>${message}</p>
    <p>Issued on ${new Date().toLocaleDateString()}</p>
    <div class="cert-actions">
      <button id="downloadCert">Download Image</button>
      <button id="openCert">Open Image</button>
    </div>
  `;
  certificate.classList.remove("hidden");

  // wire up download/open buttons
  document.getElementById('downloadCert').addEventListener('click', () => {
  exportCertificateImage(certificate, safeFileName(`${name1}_${name2}_love.png`));
  });
  document.getElementById('openCert').addEventListener('click', () => {
  exportCertificateImage(certificate, null, true);
  });
}

// export a DOM node as PNG by serializing into an SVG foreignObject then drawing to canvas
// export a DOM node as PNG by serializing into an SVG foreignObject then drawing to canvas
function exportCertificateImage(node, filename = 'certificate.png', openInNewTab = false) {
  console.log('exportCertificateImage start', { filename, openInNewTab });
  try {
    const source = document.getElementById('certificate');
    if (!source) return console.error('Source certificate element not found');

    const clone = source.cloneNode(true);

    // Remove interactive controls from clone (we don't want buttons in the image)
    const actions = clone.querySelector('.cert-actions');
    if (actions) actions.remove();

    // Copy computed styles from source -> clone recursively
    function copyComputedStyles(srcEl, dstEl) {
      const cs = window.getComputedStyle(srcEl);
      let cssText = '';
      for (let i = 0; i < cs.length; i++) {
        const prop = cs[i];
        cssText += `${prop}:${cs.getPropertyValue(prop)};`;
      }
      dstEl.setAttribute('style', cssText);
      const srcChildren = srcEl.children || [];
      const dstChildren = dstEl.children || [];
      for (let i = 0; i < srcChildren.length; i++) {
        if (dstChildren[i]) copyComputedStyles(srcChildren[i], dstChildren[i]);
      }
    }

    copyComputedStyles(source, clone);

    // Measure clone by appending offscreen
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.opacity = '0';
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    const width = clone.offsetWidth || clone.scrollWidth || 600;
    const height = clone.offsetHeight || clone.scrollHeight || 200;

    document.body.removeChild(wrapper);

    // Serialize clone inside an XHTML wrapper for foreignObject
    const serialized = new XMLSerializer().serializeToString(clone);
    const xhtml = `<div xmlns='http://www.w3.org/1999/xhtml'>${serialized}</div>`;
    const svg = `<?xml version="1.0" encoding="utf-8"?>\n<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'>\n  <foreignObject width='100%' height='100%'>${xhtml}</foreignObject>\n</svg>`;

    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = function () {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.floor(width * devicePixelRatio));
        canvas.height = Math.max(1, Math.floor(height * devicePixelRatio));
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        const ctx = canvas.getContext('2d');
        ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        // white background to avoid transparency
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        // Prefer toBlob but fallback to dataURL if necessary
        if (canvas.toBlob) {
          canvas.toBlob((blob) => {
            if (!blob) {
              console.warn('toBlob returned null, falling back to toDataURL');
              tryDataUrlFallback(canvas, filename, openInNewTab);
              return;
            }
            const blobUrl = URL.createObjectURL(blob);
            if (openInNewTab) {
              window.open(blobUrl, '_blank');
            } else if (filename) {
              const a = document.createElement('a');
              a.href = blobUrl;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              a.remove();
            }
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
          }, 'image/png');
        } else {
          tryDataUrlFallback(canvas, filename, openInNewTab);
        }
      } catch (err) {
        console.error('Canvas draw error', err);
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = function (e) {
      console.error('Image load error exporting certificate', e);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  } catch (err) {
    console.error('exportCertificateImage error', err);
  }
}

function tryDataUrlFallback(canvas, filename, openInNewTab) {
  try {
    const dataUrl = canvas.toDataURL('image/png');
    if (openInNewTab) {
      const w = window.open();
      if (w) w.document.write(`<img src="${dataUrl}" alt="certificate">`);
    } else if (filename) {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  } catch (err) {
    console.error('DataURL fallback failed', err);
    alert('Export failed in this browser. Try a different browser or enable downloads.');
  }
}

function safeFileName(name) {
  return name.replace(/[^a-z0-9_.-]/gi, '_');
}