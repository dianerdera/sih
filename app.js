// SmartPaper AR Audit Trail - Shared JS State & Logic (Panchayat Edition - English)

const DEFAULT_STATE = {
  // Current document configurations
  docId: "GP-KHATA-88092-B",
  docTitle: "LAND MUTATION REGISTER",
  docDate: "2026-08-28",
  docAuthor: "Panchayat Secretary Sector-04",
  docOriginalText: "Allotted Area: 1.20 Hectares to Rajesh Kumar",
  docTamperedText: "Allotted Area: 7.20 Hectares to Rajesh Kumar",
  
  // Progress states
  scanCompleted: false,
  hashGenerated: null,
  ocrCoordinates: [
    { text: "MUTATION REGISTER", x: 45, y: 35, w: 120, h: 10 },
    { text: "GP-KHATA-88092-B", x: 230, y: 35, w: 70, h: 8 },
    { text: "Allotted Area: 1.20 Hectares...", x: 45, y: 140, w: 200, h: 18 }
  ],
  qrPrinted: false,
  printerStatus: "Ready",
  
  // Active test selection for verification
  inspectorDocType: "clean" // "clean" or "tampered"
};

// Initialize or get state
function getSystemState() {
  const saved = localStorage.getItem("smartpaper_state");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse state, resetting", e);
    }
  }
  // Store default
  localStorage.setItem("smartpaper_state", JSON.stringify(DEFAULT_STATE));
  return { ...DEFAULT_STATE };
}

function updateSystemState(newData) {
  const current = getSystemState();
  const updated = { ...current, ...newData };
  localStorage.setItem("smartpaper_state", JSON.stringify(updated));
  return updated;
}

function resetSystemState() {
  localStorage.setItem("smartpaper_state", JSON.stringify(DEFAULT_STATE));
  return { ...DEFAULT_STATE };
}

// Simple logging system for visual terminals
function writeToTerminal(elementId, text, type = "info") {
  const term = document.getElementById(elementId);
  if (!term) return;
  
  const line = document.createElement("div");
  line.className = "hash-terminal-line";
  
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${(now.getMilliseconds()/10).toFixed(0).padStart(2, '0')}`;
  
  let typeClass = "";
  let icon = ">";
  if (type === "success") {
    typeClass = "hash-terminal-success";
    icon = "[OK]";
  } else if (type === "error") {
    typeClass = "hash-terminal-error";
    icon = "[WARN]";
  } else if (type === "warning") {
    typeClass = "text-amber";
    icon = "[INFO]";
  }
  
  line.innerHTML = `
    <span class="hash-terminal-time">${timeStr}</span>
    <span class="${typeClass}">${icon} ${text}</span>
  `;
  term.appendChild(line);
  term.scrollTop = term.scrollHeight;
}

// Generate a pseudo-SHA256 hash for demonstration purposes
function calculateMockHash(docId, text) {
  const rawInput = `${docId}|${text}|2026-08-28|Secretary04`;
  let hashVal = 0;
  for (let i = 0; i < rawInput.length; i++) {
    hashVal = (hashVal << 5) - hashVal + rawInput.charCodeAt(i);
    hashVal |= 0;
  }
  const hex = Math.abs(hashVal).toString(16).padStart(8, '0') + 
              "e47ac5f6d63428d09ca081df32c918bb619ca24838634120ec2c2f6d45bbdc9a".substring(8);
  return hex;
}

// Render dynamic SVGs (Official Signature Seal & QR codes)
const SVG_TEMPLATES = {
  signature: `
    <svg viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="15" r="13" fill="none" stroke="rgba(26,35,126,0.5)" stroke-width="1"/>
      <text x="50" y="14" font-family="'Inter', sans-serif" font-size="3" font-weight="700" fill="rgba(26,35,126,0.6)" text-anchor="middle">SECRETARY OFFICE</text>
      <text x="50" y="19" font-family="'Inter', sans-serif" font-size="2.5" fill="rgba(26,35,126,0.6)" text-anchor="middle">GRAM PANCHAYAT</text>
      <path d="M 20 18 Q 40 8, 55 18 T 80 12" fill="none" stroke="#1a237e" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `,
  qrCode: (hash) => {
    const dotsCount = 13;
    let dotsSvg = "";
    let seed = hash ? hash.charCodeAt(0) + hash.charCodeAt(5) : 42;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
    
    const drawCorner = (cx, cy) => {
      return `
        <rect x="${cx}" y="${cy}" width="3" height="3" fill="#1b120f"/>
        <rect x="${cx+1}" y="${cy+1}" width="1" height="1" fill="#fff"/>
      `;
    };
    
    dotsSvg += drawCorner(0, 0);
    dotsSvg += drawCorner(10, 0);
    dotsSvg += drawCorner(0, 10);
    
    for (let r = 0; r < dotsCount; r++) {
      for (let c = 0; c < dotsCount; c++) {
        if ((r < 4 && c < 4) || (r < 4 && c > 8) || (r > 8 && c < 4)) continue;
        if (random() > 0.4) {
          dotsSvg += `<rect x="${c}" y="${r}" width="1" height="1" fill="#1b120f"/>`;
        }
      }
    }
    
    // Warm terracotta tinted QR border
    return `
      <svg viewBox="-1 -1 15 15" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
        <rect x="-1" y="-1" width="15" height="15" fill="#f4efe2"/>
        ${dotsSvg}
        <rect x="10" y="10" width="3" height="3" fill="#b05a3e" opacity="0.4"/>
      </svg>
    `;
  }
};
