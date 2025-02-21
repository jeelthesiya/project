/* File: public/script.js */
// This script handles the interactive simulation of the network stack with extended metadata,
// scrollable tooltips (that can be made persistent by clicking), and a sun/moon theme toggle.
// The metadata reflects a rose‑pine–inspired description for each layer and header field.

let currentStep = 0;
let packet = {};
let userInputMessage = "";
let tooltipPersistent = false; // Determines if tooltip stays visible on click

/* Layer Details: Extended metadata text */
const layerDetails = {
  Application: `<strong>Application Layer</strong><br>
    <em>Purpose & Functions:</em><br>
    - Enables user interaction and defines communication rules.<br>
    - Protocols like HTTP, FTP, and DNS manage data exchange.<br>
    <br>
    <em>HTTP Header Fields:</em><br>
    • Host: Specifies the server.<br>
    • User-Agent: Identifies the client.<br>
    • Content-Type: Defines the data format.`,

  Transport: `<strong>Transport Layer</strong><br>
    <em>Purpose & Functions:</em><br>
    - Handles end-to-end communication.<br>
    - Provides reliability (TCP) or speed (UDP).<br>
    <br>
    <em>TCP Header Fields:</em><br>
    • Source Port: Identifies the sending application.<br>
    • Destination Port: Identifies the receiving application.<br>
    • Sequence Number: Ensures correct order.<br>
    • Acknowledgment Number: Confirms receipt.<br>
    • Flags: Controls connection (SYN, ACK, FIN).<br>
    • Window Size: Manages flow control.`,

  Network: `<strong>Internet Layer (Network Layer)</strong><br>
    <em>Purpose & Functions:</em><br>
    - Manages logical addressing and routing via IP addresses.<br>
    - Handles packet fragmentation and reassembly.<br>
    <br>
    <em>IPv4 Header Fields:</em><br>
    • Version: IPv4 = 4.<br>
    • IHL: Header length (usually 20 bytes).<br>
    • TOS: Quality of Service.<br>
    • Total Length: Packet size (max 65535 bytes).<br>
    • Identification: Unique fragment ID.<br>
    • Flags: DF/MF control fragmentation.<br>
    • Fragment Offset: Position of fragment.<br>
    • TTL: Limits packet lifespan.<br>
    • Protocol: e.g., TCP (6), UDP (17).<br>
    • Header Checksum: Validates header integrity.<br>
    • Source/Destination IP: Sender and receiver addresses.`,

  "Data Link": `<strong>Link Layer (Network Interface Layer)</strong><br>
    <em>Purpose & Functions:</em><br>
    - Handles physical data transmission and error detection.<br>
    - Uses MAC addresses instead of IP addresses.<br>
    <br>
    <em>Ethernet Frame Header Fields:</em><br>
    • Preamble: 7 bytes to synchronize.<br>
    • SFD: 1 byte signaling frame start.<br>
    • Destination MAC: Target device (e.g., 00:1A:2B:3C:4D:5E).<br>
    • Source MAC: Sender's device.<br>
    • EtherType/Length: Protocol type (e.g., 0x0800 for IPv4).<br>
    • Payload: 46-1500 bytes of data.<br>
    • FCS: 4 bytes CRC for error detection.`,

  Physical: `<strong>Physical Layer</strong><br>
    <em>Purpose & Functions:</em><br>
    - Converts packet data into electrical, optical, or radio signals.<br>
    - Involves modulation, encoding, and transmission techniques.`,
};

/* Tooltip Details: Extended metadata for header fields */
const tooltipDetails = {
  payload: `Payload: The actual user data.<br>
              <strong>Size:</strong> Varies with input.<br>
              <em>Metadata:</em> May be encoded as UTF-8, JSON, etc.`,

  srcPort: `Source Port (2 bytes): Identifies the sending application.<br>
              <strong>Range:</strong> Typically 1024-65535.`,
  destPort: `Destination Port (2 bytes): Identifies the receiving application (e.g., 80 for HTTP).`,
  sequenceNumber: `Sequence Number (4 bytes): Orders TCP stream data.<br>
                     <em>Derived from:</em> Byte count of transmitted data.`,
  ackNumber: `Acknowledgment Number (4 bytes): Confirms receipt of data.`,
  dataOffset: `Data Offset (4 bits): Indicates header length in 32-bit words.<br>
                 <strong>Minimum:</strong> 5 (20 bytes).`,
  flags: `Flags (6 bits): Controls connection behavior (SYN, ACK, FIN, etc.).`,
  windowSize: `Window Size (2 bytes): Controls data flow to prevent congestion.<br>
                 <em>Metadata:</em> Adjusts based on network conditions.`,
  transportChecksum: `Checksum (2 bytes): Validates header and data integrity (mod 256 demo).`,
  urgentPointer: `Urgent Pointer (2 bytes): Points to urgent data (usually 0).`,
  options: `Options: Optional fields (e.g., SACK).<br>
              <em>Metadata:</em> Variable length.`,

  version: `Version (4 bits): IP version, 4 for IPv4.`,
  ihl: `Header Length (IHL) (4 bits): IP header length in 32-bit words.<br>
          <strong>Minimum:</strong> 5 (20 bytes).`,
  tos: `Type of Service (1 byte): Defines QoS and traffic prioritization.`,
  totalLength: `Total Length (2 bytes): Size of the entire IP packet (header + data).`,
  identification: `Identification (2 bytes): Unique ID for packet fragmentation/reassembly.`,
  ipFlags: `Flags (3 bits): Controls fragmentation (DF/MF).`,
  fragmentOffset: `Fragment Offset (13 bits): Position of fragment within original packet.`,
  ttl: `TTL (1 byte): Time To Live; decrements each hop.`,
  protocol: `Protocol (1 byte): Indicates next-layer protocol (e.g., TCP=6).`,
  ipChecksum: `Header Checksum (2 bytes): Verifies IP header integrity (mod 256 demo).`,
  ipOptions: `Options: Optional IP header fields (security, timestamps).`,

  preamble: `Preamble (7 bytes): 10101010 bits for synchronization.`,
  sfd: `Start Frame Delimiter (1 byte): Signals frame start.`,
  etherType: `EtherType/Length (2 bytes): Indicates payload protocol (e.g., 0x0800 for IPv4).`,
  payloadEthernet: `Payload: Contains data (46-1500 bytes).`,
  fcs: `Frame Check Sequence (4 bytes): CRC for error detection.`,
  srcMAC: `Source MAC: Unique 48-bit hardware address of the sender.<br>
             <em>Format:</em> e.g., 00:1B:44:11:3A:B7.`,
  destMAC: `Destination MAC: Target device's MAC address (via ARP).`,
};

/* Render a card with list items */
function renderCard(title, items) {
  let listItems = items.map((item) => `<li>${item}</li>`).join("");
  return `<div class="card">
    <h3>${title}</h3>
    <ul>${listItems}</ul>
  </div>`;
}

/* Layer definitions: Each layer's process builds a simulated header */
const layers = [
  {
    name: "Application",
    description: "Creates the payload from your message.",
    process: function () {
      packet = { data: userInputMessage };
      return renderCard("Application Layer", [
        `<span class="info" data-key="payload">Payload:</span> "${userInputMessage}"`,
        "No additional header processing.",
      ]);
    },
  },
  {
    name: "Transport",
    description: "Adds a simulated TCP header with detailed fields.",
    process: function () {
      const seq = 1,
        ack = 0,
        dataOffset = 5,
        flags = "SYN",
        windowSize = 5840;
      const checksum = computeChecksum(userInputMessage, seq);
      const urgentPointer = 0,
        options = "None";
      const header = {
        srcPort: 5000,
        destPort: 80,
        seq,
        ack,
        dataOffset,
        flags,
        windowSize,
        checksum,
        urgentPointer,
        options,
      };
      packet = { ...packet, Transport_Layer_header: header };
      return renderCard("Transport Layer", [
        `<span class="info" data-key="srcPort">Source Port:</span> 5000`,
        `<span class="info" data-key="destPort">Destination Port:</span> 80`,
        `<span class="info" data-key="sequenceNumber">Sequence Number:</span> ${seq}`,
        `<span class="info" data-key="ackNumber">Acknowledgment Number:</span> ${ack}`,
        `<span class="info" data-key="dataOffset">Data Offset:</span> ${dataOffset} (20 bytes)`,
        `<span class="info" data-key="flags">Flags:</span> ${flags}`,
        `<span class="info" data-key="windowSize">Window Size:</span> ${windowSize}`,
        `<span class="info" data-key="transportChecksum">Checksum:</span> ${checksum} (mod 256)`,
        `<span class="info" data-key="urgentPointer">Urgent Pointer:</span> ${urgentPointer}`,
        `<span class="info" data-key="options">Options:</span> ${options}`,
      ]);
    },
  },
  {
    name: "Network",
    description: "Adds a simulated IPv4 header with detailed fields.",
    process: function () {
      const version = 4,
        ihl = 5,
        tos = 0;
      const totalLength = 20 + userInputMessage.length;
      const identification = 54321,
        ipFlags = "DF",
        fragmentOffset = 0;
      const ttl = 64,
        protocol = 6;
      const ipChecksum =
        (version + ihl + tos + totalLength + identification + ttl + protocol) %
        256;
      const ipHeader = {
        version,
        ihl,
        tos,
        totalLength,
        identification,
        flags: ipFlags,
        fragmentOffset,
        ttl,
        protocol,
        checksum: ipChecksum,
        sourceIP: "192.168.1.2",
        destinationIP: "93.184.216.34",
      };
      packet = { ...packet, Network_Layer_header: ipHeader };
      return renderCard("Network Layer", [
        `<span class="info" data-key="version">Version:</span> ${version}`,
        `<span class="info" data-key="ihl">IHL:</span> ${ihl} (words)`,
        `<span class="info" data-key="tos">TOS:</span> ${tos}`,
        `<span class="info" data-key="totalLength">Total Length:</span> ${totalLength} bytes`,
        `<span class="info" data-key="identification">Identification:</span> ${identification}`,
        `<span class="info" data-key="ipFlags">Flags:</span> ${ipFlags}`,
        `<span class="info" data-key="fragmentOffset">Fragment Offset:</span> ${fragmentOffset}`,
        `<span class="info" data-key="ttl">TTL:</span> ${ttl}`,
        `<span class="info" data-key="protocol">Protocol:</span> ${protocol}`,
        `<span class="info" data-key="ipChecksum">Header Checksum:</span> ${ipChecksum} (mod 256)`,
        `<span class="info" data-key="sourceIP">Source IP:</span> 192.168.1.2`,
        `<span class="info" data-key="destinationIP">Destination IP:</span> 93.184.216.34`,
      ]);
    },
  },
  {
    name: "Data Link",
    description: "Adds a simulated Ethernet frame header with detailed fields.",
    process: function () {
      const preamble = "7 bytes (AA AA AA AA AA AA AA)";
      const sfd = "1 byte (AB)";
      const destMAC = simulateARP("93.184.216.34");
      const srcMAC = "00:1B:44:11:3A:B7";
      const etherType = "0x0800 (IPv4)";
      const payloadSize = "46-1500 bytes";
      const fcs = "4 bytes (CRC)";
      const header = {
        preamble,
        sfd,
        destMAC,
        srcMAC,
        etherType,
        payloadSize,
        fcs,
      };
      packet = { ...packet, Data_Link_Layer_header: header };
      return renderCard("Link Layer", [
        `<span class="info" data-key="preamble">Preamble:</span> ${preamble}`,
        `<span class="info" data-key="sfd">SFD:</span> ${sfd}`,
        `<span class="info" data-key="destMAC">Destination MAC:</span> ${destMAC}`,
        `<span class="info" data-key="srcMAC">Source MAC:</span> ${srcMAC}`,
        `<span class="info" data-key="etherType">EtherType/Length:</span> ${etherType}`,
        `<span class="info" data-key="payloadEthernet">Payload:</span> ${payloadSize}`,
        `<span class="info" data-key="fcs">FCS:</span> ${fcs}`,
      ]);
    },
  },
  {
    name: "Physical",
    description:
      "Encodes the complete packet into a physical signal representation.",
    process: function () {
      const encodedSignal = Buffer.from(JSON.stringify(packet)).toString("hex");
      return renderCard("Physical Layer", [
        `Encoded Signal (Hex): ${encodedSignal}`,
        "Simulates conversion into electrical/optical signals.",
      ]);
    },
  },
];

/* Utility Functions */
function computeChecksum(message, seq) {
  let sum = seq;
  for (let i = 0; i < message.length; i++) {
    sum += message.charCodeAt(i);
  }
  return sum % 256;
}

function simulateARP(ip) {
  return "00:1B:44:11:3A:B8";
}

/* Event Listeners for Simulation Navigation */
document
  .getElementById("startSimulationBtn")
  .addEventListener("click", function () {
    userInputMessage = document.getElementById("userMessage").value.trim();
    if (!userInputMessage) {
      alert("Please enter a message to simulate.");
      return;
    }
    document.getElementById("inputSection").style.display = "none";
    document.getElementById("simulationSection").style.display = "block";
    currentStep = 0;
    updateTabs();
    updateLayerContent();
  });

document.getElementById("nextStepBtn").addEventListener("click", function () {
  if (currentStep < layers.length - 1) {
    currentStep++;
    updateTabs();
    updateLayerContent();
  }
  updateNavButtons();
});

document.getElementById("prevStepBtn").addEventListener("click", function () {
  if (currentStep > 0) {
    currentStep--;
    updateTabs();
    updateLayerContent();
  }
  updateNavButtons();
});

function updateTabs() {
  document.querySelectorAll("#tabs .tab").forEach((tab) => {
    tab.classList.remove("active");
    if (parseInt(tab.getAttribute("data-step")) === currentStep) {
      tab.classList.add("active");
    }
  });
}

function updateLayerContent() {
  const layer = layers[currentStep];
  const contentDiv = document.getElementById("layerContent");
  contentDiv.innerHTML = `<h2>${layer.name} Layer</h2>
    <p>${layer.description}</p>
    ${layer.process()}`;
  updateNavButtons();
}

function updateNavButtons() {
  document.getElementById("prevStepBtn").disabled = currentStep === 0;
  document.getElementById("nextStepBtn").disabled =
    currentStep === layers.length - 1;
}

/* Tooltip Implementation: Click to persist tooltip */
const tooltip = document.getElementById("tooltip");

function showTooltip(text, x, y) {
  tooltip.innerHTML = text;
  tooltip.style.left = x + 15 + "px";
  tooltip.style.top = y + 15 + "px";
  tooltip.style.display = "block";
}

function hideTooltip() {
  tooltip.style.display = "none";
  tooltipPersistent = false;
}

/* Mouseover and click events for tooltip triggers */
document.addEventListener("mouseover", function (e) {
  const target = e.target;
  // Only show tooltip on hover if not persistent
  if (!tooltipPersistent) {
    if (target.classList.contains("info") && target.dataset.key) {
      const key = target.dataset.key;
      if (tooltipDetails[key]) {
        showTooltip(tooltipDetails[key], e.pageX, e.pageY);
      }
    }
    if (target.classList.contains("tab") && target.dataset.layer) {
      const layerName = target.dataset.layer;
      if (layerDetails[layerName]) {
        showTooltip(layerDetails[layerName], e.pageX, e.pageY);
      }
    }
  }
});

document.addEventListener("click", function (e) {
  const target = e.target;
  // If user clicks on an info element or tab, make tooltip persistent
  if (
    (target.classList.contains("info") && target.dataset.key) ||
    (target.classList.contains("tab") && target.dataset.layer)
  ) {
    tooltipPersistent = true;
    // Force tooltip to remain at current position (do not hide on mouseout)
    showTooltip(tooltip.innerHTML, e.pageX, e.pageY);
  } else if (!tooltip.contains(e.target)) {
    // If click outside tooltip and triggers, hide tooltip
    hideTooltip();
  }
});

document.addEventListener("mousemove", function (e) {
  if (!tooltipPersistent && tooltip.style.display === "block") {
    tooltip.style.left = e.pageX + 15 + "px";
    tooltip.style.top = e.pageY + 15 + "px";
  }
});

document.addEventListener("mouseout", function (e) {
  if (
    !tooltipPersistent &&
    (e.target.classList.contains("info") || e.target.classList.contains("tab"))
  ) {
    hideTooltip();
  }
});

/* Theme Toggle Implementation: Sun/Moon Switch */
const themeToggleBtn = document.getElementById("themeToggle");
themeToggleBtn.addEventListener("click", function () {
  document.body.classList.toggle("dark-mode");
  if (document.body.classList.contains("dark-mode")) {
    themeToggleBtn.textContent = "🌞";
  } else {
    themeToggleBtn.textContent = "🌜";
  }
});
