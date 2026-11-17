const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'deliveries.json');

app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Load existing records or start empty
function readRecords() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveRecords(records) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
}

// Get all POD submissions for Office Dashboard
app.get('/api/records', (req, res) => {
  res.json(readRecords());
});

// Receive new POD submission from Driver/Courier mobile
app.post('/api/submit', (req, res) => {
  const records = readRecords();
  const newEntry = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    ...req.body
  };
  records.unshift(newEntry);
  saveRecords(records);
  res.json({ success: true, entry: newEntry });
});

// Update TMS Sync status
app.post('/api/sync/:id', (req, res) => {
  const records = readRecords();
  const idx = records.findIndex(r => r.id === req.params.id);
  if (idx !== -1) {
    records[idx].tmsSynced = true;
    saveRecords(records);
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`TCL POD Portal running on port ${PORT}`);
});